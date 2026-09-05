import uuid
import numpy as np
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional

from ..services.storage import datastore
from ..services.visualization import heatmap_to_png_base64, cube_to_rgb_preview
from ..ml.rx_detector import RXDetector
from ..ml.local_rx import LocalRXDetector
from ..ml.isolation_forest_detector import IsolationForestDetector
from ..ml.autoencoder_detector import AutoencoderDetector
from ..ml.ensemble import HybridEnsemble
from ..ml.thresholding import Thresholding
from ..ml.postprocessing import PostProcessor
from ..ml.localization import TargetLocalizer

router = APIRouter()

class ProcessRequest(BaseModel):
    dataset_id: str
    algorithm: str = "rx"  # rx, local_rx, isolation_forest, autoencoder, ensemble
    normalization: str = "global_minmax"
    pca_enabled: bool = False
    pca_components: int = 10
    threshold_method: str = "otsu"  # manual, otsu, percentile, statistical
    threshold_value: float = 0.5
    percentile_value: float = 95.0
    min_target_area: int = 9
    algorithm_weights: Optional[Dict[str, float]] = None


def run_detection_pipeline(job_id: str, request: ProcessRequest):
    try:
        datastore.update_job(job_id, {"status": "processing", "progress": 10, "stage": "Loading dataset"})
        cube = datastore.get_cube(request.dataset_id)
        dataset_meta = datastore.get_dataset(request.dataset_id)

        if cube is None:
            datastore.update_job(job_id, {"status": "failed", "error_message": "Dataset cube not found"})
            return

        H, W, B = cube.shape
        data_cube = cube.copy().astype(np.float32)

        # Stage 1: Normalization
        datastore.update_job(job_id, {"progress": 25, "stage": "Applying spectral normalization"})
        if request.normalization == "global_minmax":
            c_min, c_max = np.min(data_cube), np.max(data_cube)
            if c_max > c_min:
                data_cube = (data_cube - c_min) / (c_max - c_min)
        elif request.normalization == "std_scaling":
            mean = np.mean(data_cube, axis=(0, 1), keepdims=True)
            std = np.std(data_cube, axis=(0, 1), keepdims=True) + 1e-6
            data_cube = (data_cube - mean) / std

        # Stage 2: PCA Dimensionality Reduction
        if request.pca_enabled and B > request.pca_components:
            datastore.update_job(job_id, {"progress": 40, "stage": f"Running PCA ({request.pca_components} components)"})
            X = data_cube.reshape(-1, B)
            from sklearn.decomposition import PCA
            pca = PCA(n_components=request.pca_components)
            X_pca = pca.fit_transform(X)
            data_cube = X_pca.reshape(H, W, request.pca_components)

        # Stage 3: Anomaly Detection ML Algorithm
        datastore.update_job(job_id, {"progress": 60, "stage": f"Executing {request.algorithm.upper()} anomaly detector"})
        algo_name = request.algorithm.lower()
        if algo_name == "rx":
            detector = RXDetector()
            raw_scores = detector.detect(data_cube)
        elif algo_name == "local_rx":
            detector = LocalRXDetector()
            raw_scores = detector.detect(data_cube)
        elif algo_name == "isolation_forest":
            detector = IsolationForestDetector()
            raw_scores = detector.detect(data_cube)
        elif algo_name == "autoencoder":
            detector = AutoencoderDetector()
            raw_scores = detector.detect(data_cube)
        elif algo_name == "ensemble":
            weights = request.algorithm_weights
            detector = HybridEnsemble(weights=weights)
            raw_scores = detector.detect(data_cube)
        else:
            raise ValueError(f"Unknown algorithm: {request.algorithm}")

        # Stage 4: Thresholding
        datastore.update_job(job_id, {"progress": 80, "stage": f"Applying {request.threshold_method} thresholding"})
        method = request.threshold_method.lower()
        if method == "manual":
            binary_mask = Thresholding.manual(raw_scores, request.threshold_value)
        elif method == "otsu":
            binary_mask = Thresholding.otsu(raw_scores)
        elif method == "percentile":
            binary_mask = Thresholding.percentile(raw_scores, request.percentile_value)
        elif method == "statistical":
            binary_mask = Thresholding.statistical(raw_scores, k=3)
        else:
            binary_mask = Thresholding.otsu(raw_scores)

        # Stage 5: Morphological Cleaning
        datastore.update_job(job_id, {"progress": 90, "stage": "Morphological post-processing"})
        cleaned_mask = PostProcessor.process(binary_mask, min_area=request.min_target_area)

        # Stage 6: Target Localization
        datastore.update_job(job_id, {"progress": 95, "stage": "Localizing anomaly targets"})
        targets = TargetLocalizer.localize(raw_scores, cleaned_mask)

        # Stage 7: Visualization Generation
        heatmap_b64 = heatmap_to_png_base64(raw_scores, cmap_name='jet')
        mask_b64 = heatmap_to_png_base64(cleaned_mask, cmap_name='gray')
        rgb_img = cube_to_rgb_preview(cube, np.array(dataset_meta.get("wavelengths")) if dataset_meta and dataset_meta.get("wavelengths") else None)
        rgb_b64 = heatmap_to_png_base64(rgb_img[:, :, 0] / 255.0, cmap_name='gray')

        # Score distribution histogram
        hist_counts, hist_bins = np.histogram(raw_scores, bins=20, range=(0, 1))
        hist_data = [
            {"bin": f"{hist_bins[i]:.2f}-{hist_bins[i+1]:.2f}", "count": int(hist_counts[i])}
            for i in range(len(hist_counts))
        ]

        result_data = {
            "job_id": job_id,
            "dataset_id": request.dataset_id,
            "algorithm": request.algorithm,
            "score_map": raw_scores.tolist(),
            "binary_mask": cleaned_mask.tolist(),
            "heatmap_b64": heatmap_b64,
            "mask_b64": mask_b64,
            "rgb_b64": rgb_b64,
            "targets": targets,
            "target_count": len(targets),
            "histogram": hist_data,
            "converted_from_rgb": dataset_meta.get("converted_from_rgb", False) if dataset_meta else False,
            "note": dataset_meta.get("note") if dataset_meta else None,
            "completed_at": datetime.now().isoformat(),
        }

        datastore.save_result(job_id, result_data)
        datastore.update_job(job_id, {
            "status": "completed",
            "progress": 100,
            "stage": "Finished",
            "completed_at": datetime.now().isoformat(),
        })

    except Exception as e:
        datastore.update_job(job_id, {"status": "failed", "error_message": str(e)})


@router.post("/")
async def create_process_job(request: ProcessRequest, background_tasks: BackgroundTasks):
    dataset = datastore.get_dataset(request.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    job_id = str(uuid.uuid4())[:8]
    job_info = {
        "id": job_id,
        "dataset_id": request.dataset_id,
        "status": "queued",
        "algorithm": request.algorithm,
        "config": request.dict(),
        "progress": 0,
        "stage": "Queued",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "error_message": None,
    }
    datastore.create_job(job_id, job_info)

    background_tasks.add_task(run_detection_pipeline, job_id, request)

    return {
        "success": True,
        "job_id": job_id,
        "status": "queued",
    }


@router.get("/{job_id}/status")
async def get_job_status(job_id: str):
    job = datastore.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
