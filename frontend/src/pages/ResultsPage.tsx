import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart3, Activity, ShieldAlert, Download, Layers, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Target as TargetIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getJobResults, getPixelSpectrum, getDiagnosticReport } from '../services/api';
import type { ProcessResult, TargetInfo } from '../types/api';

export default function ResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const [results, setResults] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'heatmap' | 'mask'>('heatmap');
  const [selectedTarget, setSelectedTarget] = useState<TargetInfo | null>(null);

  // Spectral Inspector state
  const [clickedPixel, setClickedPixel] = useState<{ x: number; y: number } | null>(null);
  const [pixelSpectrum, setPixelSpectrum] = useState<Record<string, unknown> | null>(null);
  const [loadingSpectrum, setLoadingSpectrum] = useState(false);
  const [spectrumMode, setSpectrumMode] = useState<'reflectance' | 'derivative'>('reflectance');

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getJobResults(jobId)
      .then((data) => {
        setResults(data);
        if (data.targets && data.targets.length > 0) {
          setSelectedTarget(data.targets[0]);
        }
      })
      .catch((err) => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current || !results) return;
    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale to original dimensions
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    const x = Math.floor(clickX * scaleX);
    const y = Math.floor(clickY * scaleY);

    setClickedPixel({ x, y });
    setLoadingSpectrum(true);
    try {
      const spectrumData = await getPixelSpectrum(results.dataset_id, x, y);
      setPixelSpectrum(spectrumData as Record<string, unknown>);
    } catch (err) {
      console.error('Failed to fetch pixel spectrum:', err);
    } finally {
      setLoadingSpectrum(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!jobId) return;
    try {
      const reportData = await getDiagnosticReport(jobId);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `HyperDetect_Report_${jobId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Failed to generate report');
    }
  };

  const handleExportTargetsCSV = () => {
    if (!results || !results.targets) return;
    let csv = "Target ID,BBox X,BBox Y,BBox W,BBox H,Centroid X,Centroid Y,Area px,Max Score,Avg Score,Confidence\n";
    results.targets.forEach((t: TargetInfo) => {
      csv += `${t.target_id},${t.bbox[0]},${t.bbox[1]},${t.bbox[2]},${t.bbox[3]},${t.centroid[0]},${t.centroid[1]},${t.area},${t.max_score},${t.avg_score},${t.confidence}\n`;
    });

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `HyperDetect_Targets_${jobId}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="animate-spin text-emerald-400" size={44} />
        <p className="text-lg">Fetching Anomaly Detection Heatmaps & Targets...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="text-red-400 mx-auto" size={48} />
        <h3 className="text-xl font-bold text-white">Results Unavailable</h3>
        <p className="text-slate-400 text-sm">{error || 'Could not find processing results'}</p>
        <Link to="/upload" className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm">
          Return to Upload
        </Link>
      </div>
    );
  }

  // Formatting chart points
  const spectrumChartData = (pixelSpectrum && Array.isArray(pixelSpectrum.wavelengths))
    ? pixelSpectrum.wavelengths.map((wl: number, i: number) => {
        let val = (pixelSpectrum.reflectance as number[])?.[i] || 0;
        if (spectrumMode === 'derivative' && i > 0) {
          const dwl = (pixelSpectrum.wavelengths as number[])[i] - (pixelSpectrum.wavelengths as number[])[i - 1];
          val = (((pixelSpectrum.reflectance as number[])?.[i] || 0) - ((pixelSpectrum.reflectance as number[])?.[i - 1] || 0)) / (dwl || 1);
        }
        return {
          wavelength: Math.round(wl),
          value: Number(val.toFixed(4)),
        };
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-emerald-400" size={26} /> Detection Results & Spectral Analytics
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>JOB: {jobId}</span>
            <span>ALGORITHM: {results.algorithm.toUpperCase()}</span>
            <span className="text-emerald-400 font-semibold">{results.target_count} Targets Detected</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold transition-colors"
          >
            <Download size={16} /> Export JSON Report
          </button>
          <button
            onClick={handleExportTargetsCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-sm font-semibold transition-colors"
          >
            <Download size={16} /> Export Targets CSV
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            <RefreshCw size={16} /> New Analysis
          </Link>
        </div>
      </div>

      {/* Spectral Simulation Warning Banner */}
      {results.converted_from_rgb && (
        <div className="bg-amber-950/50 border border-amber-800/60 rounded-2xl p-4 flex items-start gap-3 text-amber-300 shadow-inner">
          <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <span className="font-bold text-amber-400 text-sm">Spectral Simulation Active</span>
            <p className="text-xs text-amber-200/90 leading-relaxed">{results.note}</p>
          </div>
        </div>
      )}

      {/* Dual Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RGB Composite */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <Layers className="text-cyan-400" size={18} /> RGB / False Color Composite
            </span>
            <span className="text-xs text-slate-400 font-mono">Click anywhere to inspect spectrum</span>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center min-h-[280px]">
            {results.rgb_b64 ? (
              <img
                ref={imgRef}
                src={results.rgb_b64}
                alt="RGB Preview"
                onClick={handleImageClick}
                className="object-contain max-h-[380px] w-full cursor-crosshair hover:opacity-95"
              />
            ) : (
              <span className="text-slate-500 text-sm">RGB Preview Unavailable</span>
            )}
          </div>
        </div>

        {/* Anomaly Score Map / Target Mask */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <Activity className="text-emerald-400" size={18} /> Anomaly Score Heatmap
            </span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  viewMode === 'heatmap' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Heatmap
              </button>
              <button
                onClick={() => setViewMode('mask')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  viewMode === 'mask' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Binary Mask
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center min-h-[280px]">
            <img
              src={viewMode === 'heatmap' ? results.heatmap_b64 : results.mask_b64}
              alt="Anomaly Output"
              onClick={handleImageClick}
              className="object-contain max-h-[380px] w-full cursor-crosshair"
            />
          </div>
        </div>
      </div>

      {/* Interactive Pixel Spectral Profile Inspector */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <Activity className="text-emerald-400" size={22} /> Pixel Spectral Profile & Derivative Inspector
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setSpectrumMode('reflectance')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  spectrumMode === 'reflectance' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Reflectance R(λ)
              </button>
              <button
                onClick={() => setSpectrumMode('derivative')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  spectrumMode === 'derivative' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Derivative dR/dλ
              </button>
            </div>
            {clickedPixel && (
              <span className="text-xs font-mono bg-slate-900 border border-slate-700 text-emerald-400 px-3 py-1 rounded-full">
                ({clickedPixel.x}, {clickedPixel.y})
              </span>
            )}
          </div>
        </div>

        {loadingSpectrum ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <p className="text-sm">Fetching reflectance curve across bands...</p>
          </div>
        ) : pixelSpectrum ? (
          <div className="h-56 w-full bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spectrumChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="wavelength" stroke="#94a3b8" tick={{ fontSize: 11 }} unit="nm" />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#38bdf8' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={spectrumMode === 'reflectance' ? '#10b981' : '#38bdf8'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm italic bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
            Click on any pixel location in the image above to plot its VNIR spectral reflectance curve.
          </div>
        )}
      </div>

      {/* Target Localization Table */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-lg font-bold text-white border-b border-slate-700 pb-3">
          <TargetIcon className="text-amber-400" size={22} /> Localized Anomaly Targets ({results.target_count})
        </div>

        {results.targets && results.targets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-3">Target ID</th>
                  <th className="p-3">Bounding Box [X, Y, W, H]</th>
                  <th className="p-3">Centroid (CX, CY)</th>
                  <th className="p-3">Area (px)</th>
                  <th className="p-3">Max Score</th>
                  <th className="p-3">Avg Score</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {results.targets.map((t: TargetInfo) => (
                  <tr
                    key={t.target_id}
                    onClick={() => setSelectedTarget(t)}
                    className={`hover:bg-slate-700/40 cursor-pointer transition-colors ${
                      selectedTarget?.target_id === t.target_id ? 'bg-emerald-950/30' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-emerald-400">#Target-{t.target_id}</td>
                    <td className="p-3 font-mono text-xs">[{t.bbox.join(', ')}]</td>
                    <td className="p-3 font-mono text-xs">({t.centroid[0].toFixed(1)}, {t.centroid[1].toFixed(1)})</td>
                    <td className="p-3 font-mono">{t.area.toLocaleString()} px</td>
                    <td className="p-3 font-mono text-emerald-400">{t.max_score.toFixed(4)}</td>
                    <td className="p-3 font-mono text-slate-400">{t.avg_score.toFixed(4)}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          t.confidence === 'High'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : t.confidence === 'Moderate'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {t.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-sm italic">No anomaly targets passed minimum area & threshold filters.</p>
        )}
      </div>
    </div>
  );
}
