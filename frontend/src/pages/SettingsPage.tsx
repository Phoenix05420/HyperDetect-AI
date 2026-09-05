import { useState } from 'react';
import { Settings, Save, CheckCircle2, Sliders, Palette, Server } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  // Settings State
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:8000');
  const [defaultBands, setDefaultBands] = useState(420);
  const [bluePeak, setBluePeak] = useState(460);
  const [greenPeak, setGreenPeak] = useState(530);
  const [redPeak, setRedPeak] = useState(620);
  const [defaultColormap, setDefaultColormap] = useState('jet');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-emerald-400" size={26} /> System Settings & Calibration
          </h2>
          <p className="text-slate-400 text-sm">
            Calibrate spectral simulation parameters and visual visualization defaults.
          </p>
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-4 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={20} /> Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Backend Connection */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Server className="text-cyan-400" size={20} /> Backend API Server
          </div>
          <div className="space-y-2 text-sm">
            <label className="text-slate-300 font-semibold block">FastAPI Base Endpoint</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Gaussian Basis Calibration */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Sliders className="text-emerald-400" size={20} /> Gaussian Basis Spectral Simulator
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Target VNIR Bands</label>
              <input
                type="number"
                value={defaultBands}
                onChange={(e) => setDefaultBands(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Blue CIE Peak (nm)</label>
              <input
                type="number"
                value={bluePeak}
                onChange={(e) => setBluePeak(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Green CIE Peak (nm)</label>
              <input
                type="number"
                value={greenPeak}
                onChange={(e) => setGreenPeak(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Red CIE Peak (nm)</label>
              <input
                type="number"
                value={redPeak}
                onChange={(e) => setRedPeak(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Visualization Preferences */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Palette className="text-violet-400" size={20} /> Visualization & Heatmaps
          </div>
          <div className="space-y-2 text-sm">
            <label className="text-slate-300 font-semibold block">Default Anomaly Colormap Palette</label>
            <select
              value={defaultColormap}
              onChange={(e) => setDefaultColormap(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="jet">Jet (Standard Thermal)</option>
              <option value="viridis">Viridis (Perceptually Uniform)</option>
              <option value="plasma">Plasma (High Contrast High Energy)</option>
              <option value="inferno">Inferno (Deep Contrast)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all hover:scale-105"
          >
            <Save size={18} /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
