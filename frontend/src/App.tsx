import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import ConfigPage from './pages/ConfigPage';
import ProcessingPage from './pages/ProcessingPage';
import ResultsPage from './pages/ResultsPage';
import ClassifyPage from './pages/ClassifyPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import UnmixingPage from './pages/UnmixingPage';
import IndicesPage from './pages/IndicesPage';
import ComparePage from './pages/ComparePage';
import TargetsPage from './pages/TargetsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="targets" element={<TargetsPage />} />
          <Route path="indices" element={<IndicesPage />} />
          <Route path="unmixing" element={<UnmixingPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="classify" element={<ClassifyPage />} />
          <Route path="config/:datasetId" element={<ConfigPage />} />
          <Route path="processing/:jobId" element={<ProcessingPage />} />
          <Route path="results/:jobId" element={<ResultsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
