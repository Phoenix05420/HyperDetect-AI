import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, FileCode, ArrowRight, Loader2, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { listDatasets } from '../services/api';
import type { DatasetMeta } from '../types/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    setError(null);
    listDatasets()
      .then((data) => setDatasets(data))
      .catch((err) => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="text-emerald-400" size={26} /> Dataset History
          </h2>
          <p className="text-slate-400 text-sm">Uploaded hyperspectral datasets and their processing history</p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors border border-slate-700"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-xl p-4 text-red-300 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin text-emerald-400" size={40} />
          <p className="text-slate-400">Loading dataset history...</p>
        </div>
      ) : datasets.length === 0 ? (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-12 text-center shadow-xl">
          <FileCode className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-white font-bold text-lg mb-2">No datasets yet</h3>
          <p className="text-slate-400 text-sm mb-4">Upload a hyperspectral file to get started</p>
          <Link
            to="/upload"
            className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
          >
            Upload Dataset
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                    <FileCode className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{ds.filename}</h3>
                    <p className="text-slate-400 text-sm font-mono">{ds.format}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ds.status === 'ready'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {ds.status}
                  </span>
                  <Link
                    to={`/config/${ds.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    Analyze
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-slate-400 text-xs block mb-1">Dimensions</span>
                  <span className="text-white font-mono text-sm">{ds.width} x {ds.height}</span>
                </div>
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-slate-400 text-xs block mb-1">Bands</span>
                  <span className="text-emerald-400 font-mono text-sm">{ds.bands}</span>
                </div>
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-slate-400 text-xs block mb-1">Data Type</span>
                  <span className="text-slate-300 font-mono text-sm">{ds.data_type}</span>
                </div>
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-slate-400 text-xs block mb-1">File Size</span>
                  <span className="text-slate-300 font-mono text-sm">
                    {(ds.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>

              {ds.converted_from_rgb && (
                <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs">
                  <ShieldAlert size={14} />
                  <span>Simulated hyperspectral cube from RGB conversion</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
