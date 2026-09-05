import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.storage import datastore
from ..services.indices import SpectralIndexCalculator
from ..services.visualization import heatmap_to_png_base64

router = APIRouter()

class IndexRequest(BaseModel):
    dataset_id: str
    index_type: str = "ndvi"  # ndvi, ndwi, savi, evi

@router.post("/compute")
async def compute_spectral_index(request: IndexRequest):
    """Calculate remote sensing spectral index (NDVI, NDWI, SAVI, EVI)."""
    dataset = datastore.get_dataset(request.dataset_id)
    cube = datastore.get_cube(request.dataset_id)
    if not dataset or cube is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    calc = SpectralIndexCalculator(cube, wavelengths=dataset.get("wavelengths"))
    index_map = calc.compute_index(request.index_type)

    # Choose appropriate colormap
    idx_name = request.index_type.lower()
    if idx_name == "ndvi" or idx_name == "savi" or idx_name == "evi":
        cmap = "RdYlGn"  # Red to Yellow to Green
    elif idx_name == "ndwi":
        cmap = "Blues"   # Blue gradient
    else:
        cmap = "viridis"

    # Scale index map from [-1, 1] to [0, 1] for heatmap generator
    norm_map = (index_map + 1.0) / 2.0
    heatmap_b64 = heatmap_to_png_base64(norm_map, cmap_name=cmap)

    return {
        "success": True,
        "dataset_id": request.dataset_id,
        "index_type": request.index_type.upper(),
        "heatmap_b64": heatmap_b64,
        "stats": {
            "min_val": float(np.min(index_map)),
            "max_val": float(np.max(index_map)),
            "mean_val": float(np.mean(index_map)),
            "std_val": float(np.std(index_map)),
        },
    }
