import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
