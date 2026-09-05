import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileCode, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { uploadDatasetFile, generateSyntheticDataset } from '../services/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState<any | null>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadDatasetFile(file);
      if (res.success) {
        setUploadedDataset(res.metadata);
      } else {
        setError('Failed to process upload response');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="text-emerald-400" size={26} /> Upload Dataset
        </h2>
        <p className="text-slate-400 text-sm">
          Select or drop hyperspectral cubes (`.npy`, `.hdr`, `.mat`) or standard images (`.png`, `.jpg`, `.bmp`, `.tiff`).
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer bg-slate-800/60 ${
          dragOver ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]' : 'border-slate-700 hover:border-slate-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('dataset-input')?.click()}
      >
        <input
          id="dataset-input"
          type="file"
          className="hidden"
          accept=".npy,.hdr,.mat,.png,.jpg,.jpeg,.bmp,.tiff,.tif,.webp"
          onChange={handleFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="animate-spin text-emerald-400" size={44} />
            <p className="text-lg font-semibold text-white">Reading & Parsing Spectral Array...</p>
            <p className="text-sm text-slate-400">Extracting bands and generating preview</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full bg-slate-700/60 flex items-center justify-center text-emerald-400 mb-2">
              <FileCode size={36} />
            </div>
            <p className="text-lg font-semibold text-white">Drag & drop your hyperspectral file here</p>
            <p className="text-sm text-slate-400 max-w-md">
              Supports native arrays (<span className="text-emerald-400 font-mono">.npy, .hdr, .mat</span>) or standard image formats (<span className="text-cyan-400 font-mono">.png, .jpg, .tiff</span>)
            </p>
          </div>
        )}
      </div>

      {/* Synthetic Quick-Start Generator */}
      <div className="text-center">
        <button
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await generateSyntheticDataset();
              if (res.success) setUploadedDataset(res.metadata);
            } catch (err: any) {
              setError('Failed to generate synthetic cube');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all hover:scale-105"
        >
          <Sparkles size={16} className="text-amber-400" /> Generate Synthetic Test Cube (100x100x420)
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-4 text-red-300 flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Uploaded Dataset Metadata Card */}
      {uploadedDataset && (
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400" size={24} />
              <div>
                <h3 className="font-bold text-white text-lg">{uploadedDataset.filename}</h3>
                <span className="text-xs text-slate-400 font-mono">ID: {uploadedDataset.id}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/config/${uploadedDataset.id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all hover:scale-105"
            >
              Configure Pipeline <ArrowRight size={16} />
            </button>
          </div>

          {/* Simulation Disclaimer Callout if RGB Image */}
          {uploadedDataset.converted_from_rgb && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-amber-300">
              <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <span className="font-bold text-amber-400 text-sm">Spectral Simulation Active</span>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {uploadedDataset.note}
                </p>
              </div>
            </div>
          )}

          {/* Grid Metadata Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-500 uppercase block">Width</span>
              <span className="font-mono text-white text-base">{uploadedDataset.width} px</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-500 uppercase block">Height</span>
              <span className="font-mono text-white text-base">{uploadedDataset.height} px</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-500 uppercase block">Bands</span>
              <span className="font-mono text-emerald-400 font-semibold text-base">{uploadedDataset.bands} Channels</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-500 uppercase block">Format</span>
              <span className="font-mono text-cyan-400 text-base">{uploadedDataset.format}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
