import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Cpu, CheckCircle2 } from 'lucide-react';
import { getJobStatus } from '../services/api';

import type { Job } from '../types/api';

export default function ProcessingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const data = await getJobStatus(jobId);
        setJob(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/results/${jobId}`);
          }, 800);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError(data.error_message || 'Pipeline processing failed.');
        }
      } catch (err: unknown) {
        clearInterval(interval);
        setError(err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to poll job status');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, navigate]);

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-2xl">
            <Cpu size={48} className="animate-pulse" />
          </div>
          <Loader2 className="animate-spin text-emerald-400 absolute -top-2 -right-2" size={32} />
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white">Processing Hyperspectral Pipeline</h2>
          <p className="text-slate-400 text-sm font-mono">Job ID: {jobId}</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-950/60 border border-red-800 rounded-2xl p-6 text-red-300 space-y-2 text-left">
          <div className="flex items-center gap-2 font-bold text-lg">
            <AlertCircle className="text-red-400" size={22} /> Pipeline Execution Error
          </div>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 space-y-6 shadow-2xl text-left">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} /> Current Stage
              </span>
              <span className="text-emerald-400 font-mono text-base">{job?.progress || 0}%</span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${job?.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Current Stage Label */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Active Operation:</span>
            <span className="text-white font-mono text-sm font-semibold text-emerald-400">
              {job?.stage || 'Initializing pipeline engines...'}
            </span>
          </div>

          <div className="text-xs text-slate-500 text-center">
            Executing matrix transformations across spectral bands. Results will load automatically.
          </div>
        </div>
      )}
    </div>
  );
}
