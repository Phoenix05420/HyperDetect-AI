import { Link } from 'react-router-dom';

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
