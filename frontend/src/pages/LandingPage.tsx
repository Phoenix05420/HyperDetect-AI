import { Link } from 'react-router-dom';
import { Upload, TreePine, Cpu, Activity, Target, ShieldCheck, Sparkles, Layers, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-8 md:p-12 border border-slate-700/80 shadow-2xl overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles size={14} /> Scientific Hyperspectral Intelligence Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Detect Unknown Targets & Anomalies Across <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">420 Spectral Bands</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            HyperDetect AI provides algorithmic detection of vehicles, foreign objects, diseased vegetation, and pollutants without requiring predefined target signatures.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
            >
              <Upload size={18} /> Upload Hyperspectral Dataset <ArrowRight size={16} />
            </Link>
            <Link
              to="/classify"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all hover:scale-105"
            >
              <TreePine size={18} className="text-emerald-400" /> Tree Species Profiler
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 space-y-3 hover:border-emerald-500/50 transition-colors shadow-lg">
          <div className="w-12 h-12 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Cpu size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Multi-Algorithm Pipeline</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Execute Global RX, Sliding Dual-Window Local RX, Isolation Forest, Deep Autoencoders, and Hybrid Fusion Ensembles.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 space-y-3 hover:border-cyan-500/50 transition-colors shadow-lg">
          <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Activity size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Gaussian Spectral Simulator</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Upload standard PNG/JPG images to automatically reconstruct 420-band pseudo-hyperspectral VNIR reflectance curves.
          </p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 space-y-3 hover:border-amber-500/50 transition-colors shadow-lg">
          <div className="w-12 h-12 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Target Localization & BBoxes</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Automated connected-component segmentation extracts spatial bounding boxes, centroid coordinates, and confidence metrics.
          </p>
        </div>
      </div>

      {/* Algorithmic Pipeline Overview */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="text-emerald-400" size={24} />
          <h2 className="text-xl font-bold text-white">Detection Workflow</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/60 space-y-2">
            <span className="text-xs font-mono text-emerald-400 font-bold">01. INGESTION</span>
            <p className="text-sm font-semibold text-white">Multi-Format Loader</p>
            <p className="text-xs text-slate-400">Supports `.npy`, `.hdr`, `.mat`, and RGB image conversion.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/60 space-y-2">
            <span className="text-xs font-mono text-cyan-400 font-bold">02. PREPROCESSING</span>
            <p className="text-sm font-semibold text-white">PCA & Normalization</p>
            <p className="text-xs text-slate-400">Dimensionality reduction and spectral min-max scaling.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/60 space-y-2">
            <span className="text-xs font-mono text-violet-400 font-bold">03. ANOMALY ML</span>
            <p className="text-sm font-semibold text-white">Detector Execution</p>
            <p className="text-xs text-slate-400">Calculates Mahalanobis distances and reconstruction errors.</p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/60 space-y-2">
            <span className="text-xs font-mono text-amber-400 font-bold">04. LOCALIZATION</span>
            <p className="text-sm font-semibold text-white">Target Extraction</p>
            <p className="text-xs text-slate-400">Connected component stats & spectral reflectance graphs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
