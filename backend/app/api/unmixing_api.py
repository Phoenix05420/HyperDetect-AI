from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..services.storage import datastore
from ..ml.unmixing import LinearSpectralUnmixer
from ..services.visualization import heatmap_to_png_base64

router = APIRouter()

class UnmixingRequest(BaseModel):
    dataset_id: str
    n_endmembers: int = 3

@router.post("/decompose")
async def decompose_dataset(request: UnmixingRequest):
    """Run Linear Spectral Unmixing (FCLS / NNLS) on a dataset."""
    dataset = datastore.get_dataset(request.dataset_id)
    cube = datastore.get_cube(request.dataset_id)
    if not dataset or cube is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    unmixer = LinearSpectralUnmixer(n_endmembers=request.n_endmembers)
    abundance_maps, endmembers = unmixer.decompose(cube)

    H, W, M = abundance_maps.shape
    wavelengths = dataset.get("wavelengths") or list(range(400, 400 + cube.shape[2]))

    abundance_results = []
    colormaps = ['viridis', 'plasma', 'inferno', 'magma', 'cividis']

    for m in range(M):
        ab_map = abundance_maps[:, :, m]
        cmap = colormaps[m % len(colormaps)]
        heatmap_b64 = heatmap_to_png_base64(ab_map, cmap_name=cmap)

        abundance_results.append({
            "endmember_index": m + 1,
            "name": f"Endmember Component #{m + 1}",
            "spectrum": endmembers[m].tolist(),
            "heatmap_b64": heatmap_b64,
            "mean_abundance": float(np.mean(ab_map)),
            "max_abundance": float(np.max(ab_map)),
        })

    return {
        "success": True,
        "dataset_id": request.dataset_id,
        "n_endmembers": M,
        "wavelengths": wavelengths,
        "endmembers": endmembers.tolist(),
        "abundance_results": abundance_results,
    }

import numpy as np
