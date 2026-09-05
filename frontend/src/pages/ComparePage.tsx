import { useState, useEffect } from 'react';
import { Layers, Activity, Loader2, AlertCircle, Play, BarChart3, CheckCircle2 } from 'lucide-react';
import type { DatasetMeta } from '../types/api';
import { listDatasets, createProcessJob, getJobStatus, getJobResults } from '../services/api';

// Local type for comparison items (extends ProcessResult with display name)
interface ComparisonItem {
  algoName: string;
  jobId: string;
  heatmap_b64: string;
  mask_b64: string;
  targetCount: number;
}

export default function ComparePage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [stageMessage, setStageMessage] = useState('');
  const [comparisonResults, setComparisonResults] = useState<ComparisonItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDatasets()
      .then((data) => {
        setDatasets(data);
        if (data.length > 0) setSelectedDatasetId(data[0].id);
      })
      .catch((err) => setError(err?.response?.data?.detail || err.message));
  }, []);

  const handleRunComparison = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    setError(null);
    setComparisonResults([]);

    const algos = [
      {id: 'rx' as const, name: 'Global RX Detector'},
      {id: 'local_rx' as const, name: 'Local RX Detector'},
      {id: 'isolation_forest' as const, name: 'Isolation Forest'},
      {id: 'autoencoder' as const, name: 'Deep Autoencoder'},
    ];

    try {
      const resultsList = [];
      for (const algo of algos) {
        setStageMessage(`Executing ${algo.name}...`);
        const jobRes = await createProcessJob({
          dataset_id: selectedDatasetId,
          algorithm: algo.id,
          normalization: 'global_minmax',
          threshold_method: 'otsu',
        });

        const jobId = jobRes.job_id;
        // Poll job until completed
        let isDone = false;
        let attempts = 0;
        while (!isDone && attempts < 30) {
          await new Promise((r) => setTimeout(r, 1000));
          const statusRes = await getJobStatus(jobId);
          if (statusRes.status === 'completed') {
            isDone = true;
            const resData = await getJobResults(jobId);
            resultsList.push({
              algoName: algo.name,
              jobId: jobId,
              heatmap_b64: resData.heatmap_b64,
              mask_b64: resData.mask_b64,
              targetCount: resData.target_count,
            });
          } else if (statusRes.status === 'failed') {
            break;
          }
          attempts++;
        }
      }

      setComparisonResults(resultsList);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Comparison failed');
    } finally {
      setLoading(false);
      setStageMessage('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-emerald-400" size={26} /> Multi-Algorithm Comparison Matrix
          </h2>
          <p className="text-slate-400 text-sm">
            Execute Global RX, Local RX, Isolation Forest, and Deep Autoencoder on the same dataset in parallel.
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
          <div className="sm:col-span-2 space-y-2">
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

          <button
            onClick={handleRunComparison}
            disabled={loading || !selectedDatasetId}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            Run 4-Way Comparison
          </button>
        </div>

        {loading && (
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-emerald-400 font-mono">
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} /> {stageMessage}
            </span>
            <span>Running matrix pipelines...</span>
          </div>
        )}
      </div>

      {/* 2x2 Comparison Grid */}
      {comparisonResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={20} /> 2x2 Anomaly Detection Heatmap Matrix
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonResults.map((item, idx) => (
              <div key={idx} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <span className="font-bold text-white text-base">{item.algoName}</span>
                  <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                    {item.targetCount} Targets Found
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center min-h-[220px]">
                  <img src={item.heatmap_b64} alt={item.algoName} className="object-contain max-h-[260px] w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
