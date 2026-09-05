import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
});

import type {
  UploadResponse, DatasetMeta, Job, ProcessResult, ProcessRequest,
  JobStatusResponse, TargetInfo, UnmixingResult, IndexResult, FeedbackItem
} from '../types/api';

export async function uploadDatasetFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<UploadResponse>('/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function listDatasets(): Promise<DatasetMeta[]> {
  const res = await api.get<{ datasets: DatasetMeta[] }>('/datasets/');
  return res.data.datasets || [];
}

export async function getDataset(datasetId: string): Promise<DatasetMeta> {
  const res = await api.get<DatasetMeta>(`/datasets/${datasetId}`);
  return res.data;
}

export async function getPixelSpectrum(datasetId: string, x: number, y: number) {
  const res = await api.get(`/datasets/${datasetId}/spectrum?x=${x}&y=${y}`);
  return res.data;
}

export async function createProcessJob(config: ProcessRequest): Promise<JobStatusResponse> {
  const res = await api.post<JobStatusResponse>('/process/', config);
  return res.data;
}

export async function getJobStatus(jobId: string): Promise<Job> {
  const res = await api.get<Job>(`/process/${jobId}/status`);
  return res.data;
}

export async function getJobResults(jobId: string): Promise<ProcessResult> {
  const res = await api.get<ProcessResult>(`/results/${jobId}`);
  return res.data;
}

export async function getDiagnosticReport(jobId: string) {
  const res = await api.get(`/report/${jobId}`);
  return res.data;
}

export async function getClassifierStatus() {
  const res = await api.get('/classify/status');
  return res.data;
}

export async function classifyFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/classify/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function classifyDemo() {
  const res = await api.post('/classify/demo');
  return res.data;
}

export async function convertToSpectralProfile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/classify/convert', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getPresetTargets(): Promise<TargetInfo[]> {
  const res = await api.get<{ targets: TargetInfo[] }>('/targets/presets');
  return res.data.targets || [];
}

export async function matchTargetSignature(data: Record<string, unknown>) {
  const res = await api.post('/targets/match', data);
  return res.data;
}

export async function submitFeedback(item: FeedbackItem) {
  const res = await api.post<{ success: boolean }>('/feedback/', item);
  return res.data;
}

export async function getJobFeedback(jobId: string) {
  const res = await api.get(`/feedback/${jobId}`);
  return res.data;
}

export async function decomposeSpectralUnmixing(data: Record<string, unknown>): Promise<UnmixingResult> {
  const res = await api.post<UnmixingResult>('/unmixing/decompose', data);
  return res.data;
}

export async function computeSpectralIndex(data: Record<string, unknown>): Promise<IndexResult> {
  const res = await api.post<IndexResult>('/indices/compute', data);
  return res.data;
}

export async function generateSyntheticDataset(params: Record<string, unknown> = {}) {
  const res = await api.post('/datasets/generate_synthetic', params);
  return res.data;
}
