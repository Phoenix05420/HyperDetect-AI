import os
import io
import uuid
import numpy as np
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
import spectral
import spectral.io.envi as envi
from scipy.io import loadmat

from ..services.rgb_to_spectral import load_image_to_cube, build_wavelength_grid
from ..services.visualization import cube_to_rgb_preview, heatmap_to_png_base64
from ..services.storage import datastore
from ..config import settings

router = APIRouter()
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}

@router.post("/")
async def upload_dataset_file(file: UploadFile = File(...)):
    """
    Upload a hyperspectral file (.npy, .hdr, .mat) or standard image (.png, .jpg, etc.).
    Standard images are converted to simulated 420-band VNIR cubes using Gaussian basis spectral modelling.
    """
    filename = file.filename or "uploaded_dataset"
    ext = os.path.splitext(filename)[1].lower()

    # Enforce max upload size (configurable via MAX_FILE_SIZE env, default 500MB)
    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {len(content)} bytes exceeds limit of {settings.max_file_size} bytes",
        )
    dataset_id = str(uuid.uuid4())[:8]

    converted_from_rgb = False
    note = None
    wavelengths = None

    try:
        if ext == ".npy":
            cube = np.load(io.BytesIO(content))
            if cube.ndim == 3:
                H, W, B = cube.shape
            elif cube.ndim == 2:
                cube = cube[:, :, np.newaxis]
                H, W, B = cube.shape
            else:
                raise ValueError("Invalid npy array shape")
            wavelengths = build_wavelength_grid(B).tolist()

        elif ext == ".hdr":
            # Temporary file write for ENVI reader
            temp_hdr = f"/tmp/{dataset_id}.hdr"
            os.makedirs("/tmp", exist_ok=True)
            with open(temp_hdr, "wb") as f:
                f.write(content)
            img = envi.open(temp_hdr)
            cube = np.array(img.load())
            H, W, B = cube.shape
            wavelengths = build_wavelength_grid(B).tolist()

        elif ext == ".mat":
            mat = loadmat(io.BytesIO(content))
            # Find first 3D array in mat
            cube = None
            for key, val in mat.items():
                if isinstance(val, np.ndarray) and val.ndim == 3:
                    cube = val
                    break
            if cube is None:
                raise ValueError("No 3D hyperspectral cube matrix found in .mat file")
            H, W, B = cube.shape
            wavelengths = build_wavelength_grid(B).tolist()

        elif ext in IMAGE_EXTENSIONS:
            cube, wl_arr, metadata = load_image_to_cube(content, n_bands=420)
            H, W, B = cube.shape
            wavelengths = wl_arr.tolist()
            converted_from_rgb = True
            note = (
                "This image was converted from RGB to a simulated hyperspectral cube "
                "using Gaussian basis spectral modelling. Classification results are "
                "approximate since real spectral data is unavailable."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Supported: .npy, .hdr, .mat, .png, .jpg, .tiff",
            )

        # Generate RGB preview
        rgb_preview = cube_to_rgb_preview(cube, np.array(wavelengths) if wavelengths else None)
        preview_b64 = heatmap_to_png_base64(rgb_preview[:, :, 0] / 255.0, cmap_name='gray')

        dataset_meta = {
            "id": dataset_id,
            "filename": filename,
            "format": ext.upper().replace(".", ""),
            "width": int(W),
            "height": int(H),
            "bands": int(B),
            "data_type": str(cube.dtype),
            "wavelengths": wavelengths,
            "converted_from_rgb": converted_from_rgb,
            "note": note,
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse uploaded file: {str(e)}")
