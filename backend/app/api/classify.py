import os
import io
import uuid
import numpy as np
import spectral
import spectral.io.envi as envi
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..ml.tree_classifier import TreeClassifier
from ..services.rgb_to_spectral import load_image_to_cube, extract_spectral_profile, build_wavelength_grid

spectral.settings.envi_support_nonlowercase_params = True

router = APIRouter()
classifier = TreeClassifier()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}


@router.get("/status")
async def classifier_status():
    """Check if the tree classifier model is loaded and ready."""
    if not classifier.is_available():
        return {
            "available": False,
            "message": "Model not trained yet. Run scripts/train_tree_model.py first.",
        }
    return {
        "available": True,
        "species": classifier.species_list,
        "n_bands": classifier.n_bands,
        "accuracy": round(classifier.accuracy * 100, 2),
        "n_classes": len(classifier.species_list),
        "supported_formats": [".npy", ".hdr", ".png", ".jpg", ".jpeg", ".bmp", ".tiff"],
    }


@router.post("/upload")
async def classify_uploaded_file(file: UploadFile = File(...)):
    """
    Upload a hyperspectral file (.npy, .hdr) OR a normal image (.png, .jpg, etc.)
    and classify the tree species in it.

    Normal images are automatically converted to a pseudo-hyperspectral cube
    using Gaussian basis spectral simulation.
    """
    if not classifier.is_available():
        raise HTTPException(status_code=503, detail="Classifier model not available.")

    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    content = await file.read()

    converted_from_rgb = False

    try:
        if ext == ".npy":
            cube = np.load(io.BytesIO(content))

        elif ext == ".hdr":
            file_id = str(uuid.uuid4())[:8]
            hdr_path = os.path.join(UPLOAD_DIR, f"{file_id}.hdr")
            with open(hdr_path, "wb") as f:
                f.write(content)
            raw_path = hdr_path.replace(".hdr", ".raw")
            if os.path.exists(raw_path):
                img = envi.open(hdr_path, raw_path)
            else:
                img = envi.open(hdr_path)
            cube = np.array(img.load())

        elif ext in IMAGE_EXTENSIONS:
            # Convert RGB image → pseudo-hyperspectral cube
            n_bands = classifier.n_bands
            cube, wavelengths, conversion_meta = load_image_to_cube(content, n_bands=n_bands)
            converted_from_rgb = True

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {ext}. Use .npy, .hdr, .png, .jpg, .bmp, .tiff",
            )

        if cube.ndim != 3:
            raise HTTPException(
                status_code=400,
                detail=f"Expected 3D array (H, W, Bands), got shape {cube.shape}",
            )

        result = classifier.classify_cube(cube)

        response = {
            "success": True,
            "filename": filename,
            "converted_from_rgb": converted_from_rgb,
            **result,
        }

        if converted_from_rgb:
            response["conversion_info"] = conversion_meta
            response["note"] = (
                "This image was converted from RGB to a simulated hyperspectral cube "
                "using Gaussian basis spectral modelling. Classification results are "
                "approximate since real spectral data is unavailable."
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@router.post("/convert")
async def convert_image_to_spectral(file: UploadFile = File(...)):
    """
    Upload a normal image (PNG/JPG/BMP/TIFF) and get its spectral profile.
    Returns the pseudo-hyperspectral conversion metadata and sample spectral profiles.
    """
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"This endpoint only accepts images: {', '.join(IMAGE_EXTENSIONS)}",
        )

    content = await file.read()

    try:
        cube, wavelengths, metadata = load_image_to_cube(content, n_bands=420)
        H, W, B = cube.shape

        # Extract spectral profiles at 5 sample points
        sample_points = [
            (W // 4, H // 4),
            (W // 2, H // 2),
            (3 * W // 4, H // 4),
            (W // 4, 3 * H // 4),
            (3 * W // 4, 3 * H // 4),
        ]

        profiles = []
        for x, y in sample_points:
            if 0 <= x < W and 0 <= y < H:
                profile = extract_spectral_profile(cube, wavelengths, x, y)
                profiles.append(profile)

        # Compute average spectral profile across entire image
        mean_spectrum = cube.reshape(-1, B).mean(axis=0).tolist()

        return {
            "success": True,
            "filename": filename,
            "conversion": metadata,
            "average_spectrum": {
                "wavelengths_nm": wavelengths.tolist(),
                "reflectance": mean_spectrum,
            },
            "sample_profiles": profiles,
            "cube_shape": [H, W, B],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.post("/demo")
async def classify_demo():
    """Run classification on a synthetic demo cube for testing."""
    if not classifier.is_available():
        raise HTTPException(status_code=503, detail="Classifier model not available.")

    n_bands = classifier.n_bands
    cube = np.random.rand(50, 50, n_bands).astype(np.float32) * 0.5
    result = classifier.classify_cube(cube)
    return {
        "success": True,
        "filename": "demo_synthetic_cube",
        "converted_from_rgb": False,
        "note": "This is a demo with random data — results are not meaningful.",
        **result,
    }
