import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..services.storage import datastore
from ..ml.sam_detector import SAMDetector
from ..services.visualization import heatmap_to_png_base64
from ..ml.thresholding import Thresholding
from ..ml.postprocessing import PostProcessor
from ..ml.localization import TargetLocalizer

router = APIRouter()

PRESET_TARGETS = [
    {
        "id": "veg_healthy",
        "name": "Healthy Vegetation",
        "category": "Environmental",
        "description": "High NIR reflectance ramp with sharp chlorophyll red edge at ~700nm",
        "color": "#10b981",
    },
    {
        "id": "veg_diseased",
        "name": "Diseased Crop / Stress",
        "category": "Agricultural",
        "description": "Degraded red edge and reduced NIR reflectance peak",
        "color": "#f59e0b",
    },
    {
        "id": "vehicle_paint",
        "name": "Vehicle Military Paint",
        "category": "Defense / Object",
        "description": "Flat VNIR absorption curve with specific synthetic dye peaks",
        "color": "#6366f1",
    },
    {
        "id": "solar_panel",
        "name": "Photovoltaic Solar Array",
        "category": "Infrastructure",
        "description": "Low overall reflectance across visible spectrum with anti-reflective coating signature",
        "color": "#38bdf8",
    },
    {
        "id": "water_body",
        "name": "Turbid Water / Oil Slick",
        "category": "Pollution",
        "description": "High blue-green absorption with anomalous surface oil reflectance",
        "color": "#06b6d4",
    },
]

class MatchRequest(BaseModel):
    dataset_id: str
    target_spectrum: List[float]
    mode: str = "sam"  # sam, smf
    threshold_value: float = 0.85

@router.get("/presets")
async def get_preset_targets():
    """List available preset target signatures."""
    return {"targets": PRESET_TARGETS}

@router.post("/match")
async def match_target_signature(request: MatchRequest):
    """Run Spectral Angle Mapper (SAM) or Spectral Matched Filter (SMF) matching."""
    dataset = datastore.get_dataset(request.dataset_id)
    cube = datastore.get_cube(request.dataset_id)
    if not dataset or cube is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    detector = SAMDetector(mode=request.mode)
    score_map = detector.detect(cube, np.array(request.target_spectrum))

    binary_mask = Thresholding.manual(score_map, request.threshold_value)
    cleaned_mask = PostProcessor.process(binary_mask, min_area=5)
    matched_targets = TargetLocalizer.localize(score_map, cleaned_mask)

    heatmap_b64 = heatmap_to_png_base64(score_map, cmap_name='plasma')
    mask_b64 = heatmap_to_png_base64(cleaned_mask, cmap_name='gray')

    return {
        "success": True,
        "dataset_id": request.dataset_id,
        "mode": request.mode.upper(),
        "score_map": score_map.tolist(),
        "heatmap_b64": heatmap_b64,
        "mask_b64": mask_b64,
        "matched_targets": matched_targets,
        "matched_count": len(matched_targets),
    }
