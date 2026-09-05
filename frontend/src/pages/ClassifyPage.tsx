import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, TreePine, Loader2, CheckCircle2, AlertCircle, BarChart3, Sparkles, Activity, Image as ImageIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getClassifierStatus, classifyFile, classifyDemo, convertToSpectralProfile } from '../services/api';

interface Distribution {
  [species: string]: { count: number; percentage: number };
}

interface ClassifyResult {
  success: boolean;
  filename: string;
  distribution: Distribution;
  species_list: string[];
  dimensions: { height: number; width: number; bands: number };
  note?: string;
  converted_from_rgb?: boolean;
}

interface SpectralData {
  success: boolean;
  filename: string;
  cube_shape: number[];
  conversion: {
    method: string;
    wavelength_range_nm: number[];
    n_bands: number;
    original_size: number[];
  };
  average_spectrum: {
    wavelengths_nm: number[];
    reflectance: number[];
  };
  sample_profiles: Array<{
    pixel: [number, number];
    wavelengths_nm: number[];
    reflectance: number[];
    n_bands: number;
  }>;
}

interface ModelStatus {
  available: boolean;
  species?: string[];
  n_bands?: number;
  accuracy?: number;
  n_classes?: number;
  message?: string;
  supported_formats?: string[];
}

const SPECIES_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
];

const LINE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
];

export default function ClassifyPage() {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [spectralData, setSpectralData] = useState<SpectralData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getClassifierStatus();
      setStatus(data);
    } catch {
      setStatus({ available: false, message: 'Cannot connect to backend API.' });
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSpectralData(null);

    const isImage = /\.(png|jpe?g|bmp|webp|tiff?)$/i.test(file.name);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    try {
      if (isImage) {
        // Fetch spectral profile and classification
        const [classifyRes, spectralRes] = await Promise.all([
          classifyFile(file),
          convertToSpectralProfile(file).catch(() => null)
        ]);
        setResult(classifyRes);
        if (spectralRes && spectralRes.success) {
          setSpectralData(spectralRes);
        }
      } else {
        const data = await classifyFile(file);
        setResult(data);
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSpectralData(null);
    setPreviewUrl(null);
    try {
      const data = await classifyDemo();
      setResult(data);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Demo failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Downsample chart data to ~100 points for smooth rendering
  const chartData = useMemo(() => {
    if (!spectralData) return [];
    const wl = spectralData.average_spectrum.wavelengths_nm;
    const avg = spectralData.average_spectrum.reflectance;
    const step = Math.max(1, Math.floor(wl.length / 100));

    const points = [];
    for (let i = 0; i < wl.length; i += step) {
      const row: Record<string, number> = {
        wavelength: Math.round(wl[i]),
        'Average Profile': Number(avg[i].toFixed(4)),
      };
      spectralData.sample_profiles.slice(0, 4).forEach((p, idx) => {
        row[`Sample ${idx + 1}`] = Number(p.reflectance[i].toFixed(4));
      });
      points.push(row);
    }
    return points;
  }, [spectralData]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <TreePine className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">HyperDetect AI</h1>
              <p className="text-slate-400 text-xs font-mono">Hyperspectral Classification Module</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700/60">
              {status?.available ? `${status.n_classes || '?'} species` : 'Model unavailable'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Upload className="text-emerald-400" size={24} />
                <h3 className="text-xl font-bold text-white">Upload Hyperspectral Data</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Upload ENVI .hdr+, .npy, .mat files or RGB images for conversion to 420-band simulated VNIR
              </p>

              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-contain"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-xs text-slate-300 px-2 py-1 rounded-lg border border-slate-700/60 font-mono">
                    Preview
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                }`}
              >
                <input
                  type="file"
                  id="file-input"
                  onChange={handleInputChange}
                  className="hidden"
                  accept=".hdr,.npy,.mat,.png,.jpg,.jpeg,.bmp,.tiff,.tif,.webp"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className={`mx-auto mb-3 ${dragOver ? 'text-emerald-400' : 'text-slate-500'}`} size={36} />
                  <p className="text-slate-300 font-semibold mb-1">
                    {dragOver ? 'Drop file here' : 'Click to browse or drag and drop'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Supports: .hdr, .npy, .mat, .png, .jpg, .tiff
                  </p>
                </label>
              </div>

              <button
                onClick={handleDemo}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles className="text-white" size={16} />}
                Run Demo Classification
              </button>
            </div>

            {/* Status Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <TreePine className="text-emerald-400" size={22} /> Model Status
              </div>
              {status && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {status.available ? (
                      <CheckCircle2 className="text-emerald-400" size={20} />
                    ) : (
                      <AlertCircle className="text-red-400" size={20} />
                    )}
                    <span className="text-white font-semibold">
                      {status.available ? 'Model loaded and ready' : 'Model not available'}
                    </span>
                  </div>
                  {status.available && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                        <span className="text-slate-400 text-xs block mb-1">Supported Species</span>
                        <span className="text-white font-mono">{status.n_classes} classes</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                        <span className="text-slate-400 text-xs block mb-1">Model Accuracy</span>
                        <span className="text-emerald-400 font-mono">{(status.accuracy || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                  )}
                  {status.message && (
                    <p className="text-slate-400 text-sm italic">{status.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Classification Results */}
            {result && result.success && (
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <CheckCircle2 className="text-emerald-400" size={22} /> Classification Results
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                    {result.filename}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60">
                    <span className="text-slate-400 text-xs block mb-1">Dimensions</span>
                    <span className="text-white font-mono text-lg">
                      {result.dimensions.height} x {result.dimensions.width} x {result.dimensions.bands}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60">
                    <span className="text-slate-400 text-xs block mb-1">Species Detected</span>
                    <span className="text-emerald-400 font-mono text-lg">
                      {Object.keys(result.distribution).length}
                    </span>
                  </div>
                </div>

                {/* Distribution Bar Chart */}
                <div className="mt-4">
                  <h4 className="text-white font-semibold text-sm mb-3">Species Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(result.distribution).map(([species, data], idx) => (
                      <div key={species} className="flex items-center gap-3">
                        <span className="text-slate-300 text-sm w-24 truncate font-mono">{species}</span>
                        <div className="flex-1 bg-slate-900/80 rounded-full h-3 overflow-hidden border border-slate-700/60">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${SPECIES_COLORS[idx % SPECIES_COLORS.length]}`}
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-sm font-mono w-16 text-right">{data.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {result.note && (
                  <div className="bg-amber-950/50 border border-amber-800/60 rounded-xl p-3 text-amber-300 text-xs">
                    {result.note}
                  </div>
                )}
              </div>
            )}

            {/* Spectral Analysis */}
            {spectralData && spectralData.success && (
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <Activity className="text-cyan-400" size={22} /> Spectral Profile Analysis
                  </div>
                  <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                    {spectralData.cube_shape[0]}x{spectralData.cube_shape[1]} x {spectralData.cube_shape[2]} bands
                  </span>
                </div>

                <div className="h-64 w-full bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="wavelength" stroke="#94a3b8" tick={{ fontSize: 11 }} unit="nm" />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 1.1]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                        labelStyle={{ color: '#38bdf8' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="Average Profile"
                        stroke={LINE_COLORS[0]}
                        strokeWidth={2}
                        dot={false}
                      />
                      {spectralData.sample_profiles.slice(0, 4).map((_, idx) => (
                        <Line
                          key={idx}
                          type="monotone"
                          dataKey={`Sample ${idx + 1}`}
                          stroke={LINE_COLORS[idx + 1]}
                          strokeWidth={1.5}
                          dot={false}
                          strokeDasharray="4 4"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-xs text-slate-400 text-center">
                  <ImageIcon className="inline mr-1" size={12} />
                  RGB image converted to 420-band VNIR using Gaussian basis spectral modelling.
                  Classification results are approximate.
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-12 text-center shadow-xl">
                <TreePine className="mx-auto text-slate-600 mb-4" size={48} />
                <h3 className="text-white font-bold text-lg mb-2">No Classification Data</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Upload a hyperspectral file or run the demo to see classification results
                </p>
                <Link
                  to="/upload"
                  className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  <Sparkles size={14} /> Run Demo
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
