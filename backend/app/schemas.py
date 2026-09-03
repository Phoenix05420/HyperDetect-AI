from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Dataset(BaseModel):
    id: str
    filename: str
    original_path: str
    file_size: int
    format: str
    width: int
    height: int
    bands: int
    data_type: str
    wavelengths: Optional[List[float]]
    rgb_preview_path: str
    uploaded_at: datetime
    status: str

class Target(BaseModel):
    target_id: int
    bbox: List[int]
    centroid: List[int]
    area: int
    max_score: float
    avg_score: float
    confidence: str

class JobConfig(BaseModel):
    normalization: str = "global_minmax"
    pca_enabled: bool = False
    pca_components: int = 10
    denoising: bool = False
    threshold_method: str = "manual"
    threshold_value: float = 0.5
    algorithm_params: Dict[str, Any] = {}

class Job(BaseModel):
    id: str
    dataset_id: str
    status: str
    algorithm: str
    config: JobConfig
    progress: int
    stage: str
    started_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]
