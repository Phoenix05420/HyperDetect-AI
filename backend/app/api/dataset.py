import uuid
import numpy as np
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from ..services.storage import datastore
from ..services.rgb_to_spectral import build_wavelength_grid
from ..services.visualization import cube_to_rgb_preview, heatmap_to_png_base64

router = APIRouter()

@router.get("/")
async def list_datasets():
    """List all available hyperspectral datasets."""
    datasets = datastore.list_datasets()
    return {"datasets": datasets}

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get metadata for a specific dataset."""
    dataset = datastore.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.get("/{dataset_id}/spectrum")
async def get_pixel_spectrum(dataset_id: str, x: int = Query(...), y: int = Query(...)):
    """Extract spectral reflectance profile for pixel coordinate (x, y)."""
    dataset = datastore.get_dataset(dataset_id)
    cube = datastore.get_cube(dataset_id)
    if not dataset or cube is None:
        raise HTTPException(status_code=404, detail="Dataset or cube data not found")

    H, W, B = cube.shape
    if x < 0 or x >= W or y < 0 or y >= H:
        raise HTTPException(status_code=400, detail=f"Coordinates ({x}, {y}) out of bounds for image ({W}x{H})")

    reflectance = cube[y, x, :].tolist()
    wavelengths = dataset.get("wavelengths") or list(range(400, 400 + B))

    return {
        "dataset_id": dataset_id,
        "pixel": [x, y],
        "wavelengths": wavelengths,
        "reflectance": reflectance,
        "bands": B,
    }


class SyntheticGenerateRequest(BaseModel):
    width: int = 100
    height: int = 100
    bands: int = 420

@router.post("/generate_synthetic")
async def generate_synthetic_dataset(req: SyntheticGenerateRequest = SyntheticGenerateRequest()):
    """Generate a synthetic 3D hyperspectral cube with embedded anomaly targets."""
    dataset_id = f"syn_{str(uuid.uuid4())[:6]}"
    H, W, B = req.height, req.width, req.bands

    # Background Gaussian noise cube
    np.random.seed(42)
    cube = np.random.normal(loc=0.3, scale=0.05, size=(H, W, B)).astype(np.float32)
    cube = np.clip(cube, 0.05, 0.95)

    wl = build_wavelength_grid(B)

    # Embed Target 1: Vehicle anomaly square at (20:26, 20:26)
    target1_sig = 0.7 * np.exp(-0.5 * ((wl - 680) / 20) ** 2) + 0.1
    cube[20:26, 20:26, :] += target1_sig[np.newaxis, np.newaxis, :]

    # Embed Target 2: Diseased crop anomaly square at (55:62, 70:77)
    target2_sig = 0.8 * (1.0 / (1.0 + np.exp(-0.03 * (wl - 740))))
    cube[55:62, 70:77, :] += target2_sig[np.newaxis, np.newaxis, :]

    # Embed Target 3: Solar array anomaly square at (75:82, 35:42)
    target3_sig = 0.6 * np.exp(-0.5 * ((wl - 520) / 30) ** 2)
    cube[75:82, 35:42, :] += target3_sig[np.newaxis, np.newaxis, :]

    cube = np.clip(cube, 0.0, 1.0)

    rgb_preview = cube_to_rgb_preview(cube, wl)
    preview_b64 = heatmap_to_png_base64(rgb_preview[:, :, 0] / 255.0, cmap_name='gray')

    dataset_meta = {
        "id": dataset_id,
        "filename": f"synthetic_demo_cube_{H}x{W}.npy",
        "format": "NPY (Synthetic)",
        "width": W,
        "height": H,
        "bands": B,
        "data_type": str(cube.dtype),
        "wavelengths": wl.tolist(),
        "converted_from_rgb": False,
        "note": "Synthetic hyperspectral dataset generated with 3 embedded anomaly targets for algorithm benchmark testing.",
        "preview_b64": preview_b64,
        "uploaded_at": datetime.now().isoformat(),
        "status": "ready",
    }

    datastore.register_dataset(dataset_id, dataset_meta, cube)

    return {
        "success": True,
        "dataset_id": dataset_id,
        "metadata": dataset_meta,
    }
