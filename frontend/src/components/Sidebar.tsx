import { NavLink } from 'react-router-dom';
import { Upload, Home, History, Settings, TreePine, Sparkles, Layers, Activity, BarChart3, Target } from 'lucide-react';

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
      isActive
        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-md font-semibold'
        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-slate-800/95 border-r border-slate-700/80 flex flex-col justify-between">
      <div>
        <div className="p-5 border-b border-slate-700/80 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg">
            H
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">HyperDetect AI</h1>
            <span className="text-[10px] text-emerald-400 font-mono">HYPERSPECTRAL ENGINE</span>
          </div>
        </div>

        <nav className="p-3 space-y-1.5">
          <NavLink to="/" end className={linkClass}>
            <Home size={18} /> Dashboard
          </NavLink>
          <NavLink to="/upload" className={linkClass}>
            <Upload size={18} /> Upload Dataset
          </NavLink>
          <NavLink to="/targets" className={linkClass}>
            <Target size={18} /> Target Library
          </NavLink>
          <NavLink to="/indices" className={linkClass}>
            <Activity size={18} /> Spectral Indices
          </NavLink>
          <NavLink to="/unmixing" className={linkClass}>
            <Layers size={18} /> Spectral Unmixing
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            <BarChart3 size={18} /> Compare Matrix
          </NavLink>
          <NavLink to="/classify" className={linkClass}>
            <TreePine size={18} /> Classify Species
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            <History size={18} /> History
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            <Settings size={18} /> Settings
          </NavLink>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700/80">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1 text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Sparkles size={14} /> VNIR Active
          </div>
          <p>420 Spectral Bands (400-1000 nm)</p>
        </div>
      </div>
    </div>
  );
}
