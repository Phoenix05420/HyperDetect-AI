import { useState, useEffect } from 'react';
import { Activity, Loader2, AlertCircle, Play, BarChart3, TreePine, Droplets, Sun, Sparkles } from 'lucide-react';
import type { DatasetMeta, IndexResult } from '../types/api';
import { listDatasets, computeSpectralIndex } from '../services/api';

export default function IndicesPage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [indexType, setIndexType] = useState<string>('ndvi');

  const [loading, setLoading] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDatasets()
      .then((data: DatasetMeta[]) => setDatasets(data))
      .catch((err) => setError(err?.response?.data?.detail || err.message));
  }, []);

  const handleCompute = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    setError(null);
    setIndexResult(null);

    try {
      const res = await computeSpectralIndex({
        dataset_id: selectedDatasetId,
        index_type: indexType,
      });
      if (res.success) {
        setIndexResult(res);
      } else {
        setError('Failed to compute spectral index');
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Index computation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-emerald-400" size={26} /> Remote Sensing Spectral Index Workbench
          </h2>
          <p className="text-slate-400 text-sm">
            Calculate vegetation vigor (NDVI, SAVI, EVI) and water surface boundaries (NDWI) across bands.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-red-300 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Control Workbench */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm items-end">
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold block">Select Dataset</label>
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
            <label className="text-slate-300 font-semibold block">Remote Sensing Index Formula</label>
            <select
              value={indexType}
              onChange={(e) => setIndexType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="ndvi">NDVI - Normalized Difference Vegetation Index</option>
              <option value="ndwi">NDWI - Normalized Difference Water Index</option>
              <option value="savi">SAVI - Soil Adjusted Vegetation Index</option>
              <option value="evi">EVI - Enhanced Vegetation Index</option>
            </select>
          </div>

          <button
            onClick={handleCompute}
            disabled={loading || !selectedDatasetId}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            Calculate Index Map
          </button>
        </div>
      </div>

      {/* Results View */}
      {indexResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Index Spatial Heatmap */}
          <div className="lg:col-span-2 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="font-bold text-white text-lg flex items-center gap-2">
                <BarChart3 className="text-emerald-400" size={22} /> {indexResult.index_type} Spatial Map
              </span>
              <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
                Range: [-1.0, +1.0]
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center min-h-[300px]">
              <img src={indexResult.heatmap_b64} alt={indexResult.index_type} className="object-contain max-h-[420px] w-full" />
            </div>
          </div>

          {/* Index Statistics Summary */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="font-bold text-white text-lg border-b border-slate-700 pb-3 flex items-center gap-2">
              <Sparkles className="text-cyan-400" size={20} /> Index Summary Stats
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase font-semibold">Mean Index Value</span>
                <span className="font-mono text-emerald-400 font-bold text-base">{indexResult.stats.mean_val.toFixed(4)}</span>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase font-semibold">Max Peak</span>
                <span className="font-mono text-white font-semibold text-base">{indexResult.stats.max_val.toFixed(4)}</span>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase font-semibold">Min Value</span>
                <span className="font-mono text-slate-300 text-base">{indexResult.stats.min_val.toFixed(4)}</span>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase font-semibold">Std Deviation</span>
                <span className="font-mono text-cyan-400 text-base">{indexResult.stats.std_val.toFixed(4)}</span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/40 text-xs text-slate-400 space-y-1.5">
              <span className="font-semibold text-slate-300 block">Interpretation Guide:</span>
              {indexType === 'ndvi' && (
                <p>Values &gt; 0.5 indicate dense healthy chlorophyll vegetation; 0.1–0.3 indicates sparse crops/grass.</p>
              )}
              {indexType === 'ndwi' && (
                <p>Values &gt; 0.2 indicate surface water bodies or high moisture content; negative values indicate dry land.</p>
              )}
              {indexType === 'savi' && (
                <p>Soil-adjusted index minimizes canopy background noise in low vegetation cover areas.</p>
              )}
              {indexType === 'evi' && (
                <p>Enhanced index corrects for atmospheric canopy background signals in high biomass regions.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
