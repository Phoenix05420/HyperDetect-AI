// Shared API response types for HyperDetect AI frontend
// Replaces ad-hoc `any` usage across API service calls.

export interface DatasetMeta {
  id: string;
  filename: string;
  format: string;
  width: number;
  height: number;
  bands: number;
  data_type: string;
  wavelengths: number[] | null;
  converted_from_rgb: boolean;
  note: string | null;
  preview_b64: string;
  uploaded_at: string;
  status: string;
  file_size?: number;
}

export interface UploadResponse {
  success: boolean;
  dataset_id: string;
  metadata: DatasetMeta;
}

export interface JobConfig {
  normalization: string;
  pca_enabled: boolean;
  pca_components: number;
  denoising: boolean;
  threshold_method: string;
  threshold_value: number;
  algorithm_params: Record<string, unknown>;
}

export interface Job {
  id: string;
  dataset_id: string;
  status: string;
  algorithm: string;
  config: JobConfig;
  progress: number;
  stage: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface TargetInfo {
  target_id: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
  area: number;
  max_score: number;
  avg_score: number;
  confidence: string;
}

export interface HistogramBin {
  bin: string;
  count: number;
}

export interface IndexResult {
  success: boolean;
  index_type: string;
  heatmap_b64: string;
  stats: {
    mean_val: number;
    max_val: number;
    min_val: number;
    std_val: number;
  };
}

// What the client SENDS to create a job
export interface ProcessRequest {
  dataset_id: string;
  algorithm?: 'rx' | 'local_rx' | 'isolation_forest' | 'autoencoder' | 'ensemble';
  normalization?: 'global_minmax' | 'std_scaling';
  pca_enabled?: boolean;
  pca_components?: number;
  threshold_method?: 'manual' | 'otsu' | 'percentile' | 'statistical';
  threshold_value?: number;
  percentile_value?: number;
  min_target_area?: number;
  algorithm_weights?: Record<string, number>;
}

// What the client GETS back from a completed job
export interface ProcessResult {
  job_id: string;
  dataset_id: string;
  algorithm: string;
  score_map: number[][];
  binary_mask: number[][];
  heatmap_b64: string;
  mask_b64: string;
  rgb_b64: string;
  targets: TargetInfo[];
  target_count: number;
  histogram: HistogramBin[];
  converted_from_rgb: boolean;
  note: string | null;
  completed_at: string;
}

export interface JobStatusResponse {
  success: boolean;
  job_id: string;
  status: string;
}

export interface UnmixingResult {
  success: boolean;
  wavelengths: number[];
  abundance_results: Array<{
    name: string;
    mean_abundance: number;
    heatmap_b64: string;
    spectrum: number[];
  }>;
}

export interface FeedbackItem {
  job_id?: string;
  rating?: number;
  comment?: string;
  [key: string]: unknown;
}
