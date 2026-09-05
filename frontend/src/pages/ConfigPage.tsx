import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sliders, Cpu, Activity, Play, Layers, AlertCircle, Loader2 } from 'lucide-react';
import type { DatasetMeta } from '../types/api';
import { getDataset, createProcessJob } from '../services/api';

export default function ConfigPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Parameters
  const [algorithm, setAlgorithm] = useState('rx');
  const [normalization, setNormalization] = useState('global_minmax');
  const [pcaEnabled, setPcaEnabled] = useState(false);
  const [pcaComponents, setPcaComponents] = useState(10);
  const [thresholdMethod, setThresholdMethod] = useState('otsu');
  const [thresholdValue, setThresholdValue] = useState(0.5);
  const [percentileValue, setPercentileValue] = useState(95.0);
  const [minTargetArea, setMinTargetArea] = useState(9);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    getDataset(datasetId)
      .then((data) => setDataset(data))
      .catch((err: unknown) => setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to load dataset'))
      .finally(() => setLoading(false));
  }, [datasetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createProcessJob({
        dataset_id: datasetId,
        algorithm: algorithm as 'rx' | 'local_rx' | 'isolation_forest' | 'autoencoder' | 'ensemble',
        normalization: normalization as 'global_minmax' | 'std_scaling',
        pca_enabled: pcaEnabled,
        pca_components: pcaComponents,
        threshold_method: thresholdMethod as 'manual' | 'otsu' | 'percentile' | 'statistical',
        threshold_value: thresholdValue,
        percentile_value: percentileValue,
        min_target_area: minTargetArea,
      });

      if (res.success && res.job_id) {
        navigate(`/processing/${res.job_id}`);
      } else {
        setError('Failed to launch pipeline job');
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Job submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="animate-spin text-emerald-400" size={40} />
        <p>Loading Dataset Configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sliders className="text-emerald-400" size={26} /> Pipeline Configuration
          </h2>
          <p className="text-slate-400 text-sm">
            Tune preprocessing, detection algorithms, and post-processing thresholds.
          </p>
        </div>
        {dataset && (
          <div className="text-right">
            <span className="text-sm font-semibold text-white block">{dataset.filename}</span>
            <span className="text-xs text-emerald-400 font-mono">
              {dataset.width}x{dataset.height} px | {dataset.bands} bands
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-red-300 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Algorithm Selection */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Cpu className="text-emerald-400" size={20} /> Detection Algorithm
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'rx', name: 'RX Detector', desc: 'Global Reed-Xoli Mahalanobis distance metric' },
              { id: 'local_rx', name: 'Local RX', desc: 'Sliding dual-window background estimation' },
              { id: 'isolation_forest', name: 'Isolation Forest', desc: 'Tree-based sub-sampling anomaly isolation' },
              { id: 'autoencoder', name: 'Autoencoder (PyTorch)', desc: 'Deep reconstruction error anomaly map' },
              { id: 'ensemble', name: 'Hybrid Ensemble', desc: 'Weighted fusion of RX, iForest & Autoencoder' },
            ].map((item) => (
              <label
                key={item.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  algorithm === item.id
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-md'
                    : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="algorithm"
                    value={item.id}
                    checked={algorithm === item.id}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-white text-sm">{item.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Preprocessing Settings */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Activity className="text-cyan-400" size={20} /> Preprocessing & PCA
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Spectral Normalization</label>
              <select
                value={normalization}
                onChange={(e) => setNormalization(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="global_minmax">Global Min-Max Normalization [0, 1]</option>
                <option value="std_scaling">Standard Mean-Variance Scaling</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">PCA Dimensionality Reduction</label>
                <input
                  type="checkbox"
                  checked={pcaEnabled}
                  onChange={(e) => setPcaEnabled(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
              </div>
              {pcaEnabled && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>PCA Components:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{pcaComponents}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={Math.min(50, dataset?.bands || 50)}
                    value={pcaComponents}
                    onChange={(e) => setPcaComponents(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thresholding & Postprocessing */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Layers className="text-violet-400" size={20} /> Thresholding & Segmentation
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Threshold Method</label>
              <select
                value={thresholdMethod}
                onChange={(e) => setThresholdMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="otsu">Otsu Automatic Binarization</option>
                <option value="percentile">Percentile Cutoff</option>
                <option value="statistical">Statistical ($\mu + 3\sigma$)</option>
                <option value="manual">Manual Slider</option>
              </select>
            </div>

            {thresholdMethod === 'manual' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Threshold Value:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{thresholdValue}</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.99}
                  step={0.01}
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            {thresholdMethod === 'percentile' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Percentile Cutoff:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{percentileValue}%</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={99.9}
                  step={0.5}
                  value={percentileValue}
                  onChange={(e) => setPercentileValue(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Min Target Area (px)</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={minTargetArea}
                onChange={(e) => setMinTargetArea(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-emerald-900/40 transition-all hover:scale-105"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Launching Pipeline...
              </>
            ) : (
              <>
                <Play size={20} /> Execute Anomaly Detection
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
