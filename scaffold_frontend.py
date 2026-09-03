import os

files = {
    "frontend/package.json": """{
  "name": "hyperdetect-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.300.0",
    "plotly.js": "^2.27.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "react-plotly.js": "^2.6.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.3",
    "sonner": "^1.3.1",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
""",
    "frontend/vite.config.ts": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
""",
    "frontend/tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
""",
    "frontend/postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""",
    "frontend/index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HyperDetect AI</title>
  </head>
  <body class="bg-slate-900 text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""",
    "frontend/src/main.tsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
""",
    "frontend/src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;
""",
    "frontend/src/App.tsx": """import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import ConfigPage from './pages/ConfigPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="config/:datasetId" element={<ConfigPage />} />
          <Route path="processing/:jobId" element={<ProcessingPage />} />
          <Route path="results/:jobId" element={<ResultsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
""",
    "frontend/src/components/Layout.tsx": """import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
""",
    "frontend/src/components/Sidebar.tsx": """import { Link } from 'react-router-dom';
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
""",
    "frontend/src/components/TopBar.tsx": """export default function TopBar() {
  return (
    <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-4 justify-between">
      <div>Project Workspace</div>
      <div>Profile</div>
    </div>
  );
}
""",
    "frontend/src/pages/LandingPage.tsx": """import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold mb-4">HyperDetect AI</h1>
      <p className="text-xl mb-8">Detecting the Unknown Through Spectral Intelligence.</p>
      <Link to="/upload" className="bg-blue-600 px-6 py-3 rounded-lg text-white hover:bg-blue-700">
        Start Detection
      </Link>
    </div>
  );
}
""",
    "frontend/src/pages/UploadPage.tsx": """export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload Dataset</h2>
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center">
        <p>Drag and drop your hyperspectral files here</p>
        <p className="text-sm text-slate-400 mt-2">Supported: .hdr, .npy, .mat</p>
      </div>
    </div>
  );
}
""",
    "frontend/src/pages/ConfigPage.tsx": """export default function ConfigPage() {
  return <div>Configuration Page</div>;
}
""",
    "frontend/src/pages/ProcessingPage.tsx": """export default function ProcessingPage() {
  return <div>Processing...</div>;
}
""",
    "frontend/src/pages/ResultsPage.tsx": """export default function ResultsPage() {
  return <div>Results Dashboard</div>;
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
print("Frontend scaffolding complete.")
