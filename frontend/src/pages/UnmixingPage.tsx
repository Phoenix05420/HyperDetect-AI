import { useState, useEffect } from 'react';
import { Layers, Activity, Loader2, AlertCircle, Play } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { listDatasets, decomposeSpectralUnmixing } from '../services/api';
import type { DatasetMeta, UnmixingResult } from '../types/api';

const LINE_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function UnmixingPage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [nEndmembers, setNEndmembers] = useState<number>(3);

  const [loading, setLoading] = useState(false);
  const [unmixingResult, setUnmixingResult] = useState<UnmixingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDatasets()
      .then((data) => setDatasets(data))
      .catch((err) => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDecompose = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    setError(null);
    setUnmixingResult(null);

    try {
      const res = await decomposeSpectralUnmixing({
        dataset_id: selectedDatasetId,
        n_endmembers: nEndmembers,
      });
      if (res.success) {
        setUnmixingResult(res);
      } else {
        setError('Unmixing failed');
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Decomposition failed');
    } finally {
      setLoading(false);
    }
  };

  // Format endmember chart data
  const chartData = unmixingResult ? unmixingResult.wavelengths.map((wl: number, i: number) => {
    const row: Record<string, number> = { wavelength: Math.round(wl) };
    unmixingResult.abundance_results.forEach((ab, idx: number) => {
      row[`Endmember #${idx + 1}`] = Number(ab.spectrum[i].toFixed(4));
    });
    return row;
  }) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="text-emerald-400" size={26} /> Linear Spectral Unmixing Workbench
          </h2>
          <p className="text-slate-400 text-sm">
            Extract pure spectral endmembers & calculate fractional abundance maps via Non-Negative Least Squares.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-red-300 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Control Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm items-end">
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Target Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
            >
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.filename} ({ds.width}x{ds.height} px, {ds.bands} bands)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Endmembers Count (M)</label>
            <select
              value={nEndmembers}
              onChange={(e) => setNEndmembers(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={2}>2 Endmembers (Binary Decomposition)</option>
              <option value={3}>3 Endmembers (Veg, Soil, Water/Target)</option>
              <option value={4}>4 Endmembers (Multi-Target Decomposition)</option>
              <option value={5}>5 Endmembers (High Resolution Features)</option>
            </select>
          </div>

          <button
            onClick={handleDecompose}
            disabled={loading || !selectedDatasetId}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            Decompose Endmembers
          </button>
        </div>
      </div>

      {/* Results View */}
      {unmixingResult && (
        <div className="space-y-6">
          {/* Endmember Spectral Profiles Chart */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-lg font-bold text-white border-b border-slate-700 pb-3">
              <Activity className="text-emerald-400" size={22} /> Extracted Endmember Spectral Signatures
            </div>

            <div className="h-64 w-full bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="wavelength" stroke="#94a3b8" tick={{ fontSize: 11 }} unit="nm" />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 1.1]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#38bdf8' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  {unmixingResult.abundance_results.map((ab, idx: number) => (
                    <Line
                      key={idx}
                      type="monotone"
                      dataKey={`Endmember #${idx + 1}`}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Abundance Heatmaps Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="text-cyan-400" size={20} /> Fractional Abundance Spatial Maps
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {unmixingResult.abundance_results.map((ab, idx: number) => (
                <div key={idx} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }} />
                      {ab.name}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">Avg: {(ab.mean_abundance * 100).toFixed(1)}%</span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center min-h-[220px]">
                    <img src={ab.heatmap_b64} alt={ab.name} className="object-contain max-h-[260px] w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
