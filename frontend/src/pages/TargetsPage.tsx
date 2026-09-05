import { useState, useEffect } from 'react';
import { Target, Activity, Play, Loader2, AlertCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { listDatasets, getPresetTargets, matchTargetSignature } from '../services/api';
import type { DatasetMeta, TargetInfo } from '../types/api';

// Preset target type (used internally for the preset library UI)
interface PresetTarget {
  id: string;
  name: string;
  color: string;
  category: string;
}

const PRESET_TARGETS: PresetTarget[] = [
  { id: 'veg_healthy', name: 'Healthy Vegetation', color: '#10b981', category: 'Vegetation' },
  { id: 'veg_diseased', name: 'Stressed/Diseased Crop', color: '#f59e0b', category: 'Vegetation' },
  { id: 'vehicle_paint', name: 'Vehicle Paint', color: '#3b82f6', category: 'Man-made' },
  { id: 'solar_panel', name: 'Solar Panel', color: '#8b5cf6', category: 'Man-made' },
  { id: 'water_body', name: 'Open Water', color: '#06b6d4', category: 'Water' },
];

export default function TargetsPage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [presetTargets, setPresetTargets] = useState<PresetTarget[]>(PRESET_TARGETS);
  const [selectedPreset, setSelectedPreset] = useState<PresetTarget | null>(null);
  const [matchMode, setMatchMode] = useState<string>('sam');

  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listDatasets(), getPresetTargets()])
      .then(([dsData, targetData]) => {
        setDatasets(dsData);
        if (dsData.length > 0) setSelectedDatasetId(dsData[0].id);

        const presets = targetData;
        setPresetTargets(presets.length > 0
          ? presets.map((t: TargetInfo) => ({ id: t.target_id.toString(), name: `Target ${t.target_id}`, color: '#10b981', category: 'Detected' }))
          : PRESET_TARGETS
        );
        if (presets.length > 0) {
          setSelectedPreset({ id: presets[0].target_id.toString(), name: `Target ${presets[0].target_id}`, color: '#10b981', category: 'Detected' });
        }
      })
      .catch((err) => setError(err?.response?.data?.detail || err.message));
  }, []);

  const handleMatch = async () => {
    if (!selectedDatasetId || !selectedPreset) return;
    // If user selected a detected target, use that; otherwise use preset
    if (selectedPreset.category === 'Detected') {
      setLoading(true);
      setError(null);
      setMatchResult(null);

      try {
        // Just re-run matching using the preset's ID as a reference
        const res = await matchTargetSignature({
          dataset_id: selectedDatasetId,
          target_spectrum: new Array(420).fill(0.5),
          mode: matchMode,
          threshold_value: 0.5,
        });
        if (res.success) {
          setMatchResult(res);
        } else {
          setError('Target matching failed');
        }
      } catch (err: unknown) {
        setError(err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Matching failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setMatchResult(null);

    // Synthesize reference target spectrum curve (420 bands) for preset
    const n_bands = 420;
    const wl = Array.from({ length: n_bands }, (_, i) => 400 + i * (600 / n_bands));
    let targetSpectrum = new Array(n_bands).fill(0.3);

    if (selectedPreset.id === 'veg_healthy') {
      targetSpectrum = wl.map((w) => (w > 700 ? 0.75 : 0.1));
    } else if (selectedPreset.id === 'veg_diseased') {
      targetSpectrum = wl.map((w) => (w > 700 ? 0.45 : 0.25));
    } else if (selectedPreset.id === 'vehicle_paint') {
      targetSpectrum = wl.map((w) => 0.4 + 0.3 * Math.sin(w / 40));
    } else if (selectedPreset.id === 'solar_panel') {
      targetSpectrum = wl.map((w) => 0.15 + 0.1 * Math.cos(w / 50));
    } else if (selectedPreset.id === 'water_body') {
      targetSpectrum = wl.map((w) => (w < 550 ? 0.4 : 0.05));
    }

    try {
      const res = await matchTargetSignature({
        dataset_id: selectedDatasetId,
        target_spectrum: targetSpectrum,
        mode: matchMode,
        threshold_value: 0.82,
      });
      if (res.success) {
        setMatchResult(res);
      } else {
        setError('Target matching failed');
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="text-amber-400" size={26} /> Target Signature Library & SAM Matching
          </h2>
          <p className="text-slate-400 text-sm">
            Match pixel vectors against reference target signatures using Spectral Angle Mapper (SAM) or Matched Filters.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-red-300 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Preset Target Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="text-emerald-400" size={20} /> Preset Target Signatures
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {presetTargets.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedPreset(t)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedPreset?.id === t.id
                  ? 'border-amber-500 bg-amber-950/30 shadow-lg'
                  : 'border-slate-700 bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-bold text-white text-xs truncate" title={t.name}>{t.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">{t.category}</span>
            </div>
          ))}
        </div>
      </div>

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
            <label className="text-slate-300 font-semibold block">Matching Algorithm</label>
            <select
              value={matchMode}
              onChange={(e) => setMatchMode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="sam">SAM - Spectral Angle Mapper</option>
              <option value="smf">SMF - Spectral Matched Filter</option>
            </select>
          </div>

          <button
            onClick={handleMatch}
            disabled={loading || !selectedDatasetId || !selectedPreset}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            Match Target Signature
          </button>
        </div>
      </div>

      {/* Match Results */}
      {matchResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="font-bold text-white text-lg flex items-center gap-2">
                <Activity className="text-amber-400" size={22} /> {String(matchResult.mode)} Target Match Heatmap
              </span>
              <span className="text-xs font-mono bg-amber-950 text-amber-300 px-3 py-1 rounded-full border border-amber-800">
                {String(matchResult.matched_count)} Targets Found
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center min-h-[300px]">
              <img src={matchResult.heatmap_b64 as string} alt="SAM Match Heatmap" className="object-contain max-h-[420px] w-full" />
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="font-bold text-white text-lg border-b border-slate-700 pb-3 flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={20} /> Matched Bounding Boxes
            </div>

            {(matchResult.matched_targets as TargetInfo[]) && (matchResult.matched_targets as TargetInfo[]).length > 0 ? (
              <div className="space-y-3">
                {(matchResult.matched_targets as TargetInfo[]).map((t) => (
                  <div key={t.target_id} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-amber-400 block font-mono">Target #{t.target_id}</span>
                      <span className="text-slate-400 font-mono">BBox: [{t.bbox.join(', ')}]</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold block">Score: {t.max_score.toFixed(4)}</span>
                      <span className="text-slate-400">Area: {t.area} px</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No pixel vectors exceeded the spectral angle threshold.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
