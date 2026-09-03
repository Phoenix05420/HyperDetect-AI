import { Link } from 'react-router-dom';
import { Upload, Home, History, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-800 flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-slate-700">HyperDetect AI</div>
      <nav className="flex-1 p-2 space-y-2">
        <Link to="/" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded"><Home size={20}/> Dashboard</Link>
        <Link to="/upload" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded"><Upload size={20}/> Upload</Link>
        <Link to="/history" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded"><History size={20}/> History</Link>
        <Link to="/settings" className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded"><Settings size={20}/> Settings</Link>
      </nav>
    </div>
  );
}
