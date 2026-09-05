"""
RGB to Pseudo-Hyperspectral Converter

Converts a standard RGB image (PNG, JPG, BMP, TIFF) into a simulated
hyperspectral cube by modelling each pixel's spectral reflectance curve
across the VNIR range (400–1000 nm).

Approach:
  1. Map R, G, B channels to their CIE spectral response peaks
     (B≈460nm, G≈530nm, R≈620nm).
  2. For each pixel, fit a smooth spectral curve through these three
     anchor points using Gaussian basis functions, then extrapolate
     across all target wavelengths.
  3. Output is a 3D numpy array (H, W, N_bands) that can be fed
     directly into the anomaly detectors and classifiers.
"""

import numpy as np
from PIL import Image
from typing import Tuple, Optional
import io


# Default VNIR wavelength grid (matches the tree-species training data)
DEFAULT_N_BANDS = 420
DEFAULT_WL_START = 400.0   # nm
DEFAULT_WL_END = 1000.0    # nm

# CIE approximate peak wavelengths for sRGB primaries
BLUE_PEAK = 460.0
GREEN_PEAK = 530.0
RED_PEAK = 620.0

# Gaussian widths (sigma) — controls how broad each channel's
# contribution is across the spectrum
BLUE_SIGMA = 30.0
GREEN_SIGMA = 40.0
RED_SIGMA = 50.0


def _gaussian(wl: np.ndarray, mu: float, sigma: float) -> np.ndarray:
    """Normalised Gaussian centred at mu."""
    return np.exp(-0.5 * ((wl - mu) / sigma) ** 2)


def build_wavelength_grid(
    n_bands: int = DEFAULT_N_BANDS,
    wl_start: float = DEFAULT_WL_START,
    wl_end: float = DEFAULT_WL_END,
) -> np.ndarray:
    """Return an evenly-spaced wavelength vector (nm)."""
    return np.linspace(wl_start, wl_end, n_bands)


def rgb_to_spectral_cube(
    image: np.ndarray,
    n_bands: int = DEFAULT_N_BANDS,
    wl_start: float = DEFAULT_WL_START,
    wl_end: float = DEFAULT_WL_END,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Convert an (H, W, 3) uint8 RGB image to an (H, W, n_bands) float32
    pseudo-hyperspectral cube.

    Returns:
        cube: np.ndarray of shape (H, W, n_bands), values in [0, 1]
        wavelengths: np.ndarray of shape (n_bands,), in nm
    """
    if image.ndim == 2:
        # Grayscale → replicate to 3 channels
        image = np.stack([image, image, image], axis=-1)

    if image.shape[2] == 4:
        # RGBA → drop alpha
        image = image[:, :, :3]

    H, W, _ = image.shape
    wl = build_wavelength_grid(n_bands, wl_start, wl_end)

    # Build the 3 spectral basis functions (n_bands,)
    b_basis = _gaussian(wl, BLUE_PEAK, BLUE_SIGMA)
    g_basis = _gaussian(wl, GREEN_PEAK, GREEN_SIGMA)
    r_basis = _gaussian(wl, RED_PEAK, RED_SIGMA)

    # Add a gentle NIR tail (vegetation-like reflectance rise beyond 700nm)
    nir_basis = 1.0 / (1.0 + np.exp(-0.02 * (wl - 720)))  # sigmoid ramp
    nir_basis *= 0.3  # scale down

    # Stack basis functions: (3, n_bands)
    basis = np.stack([r_basis, g_basis, b_basis], axis=0)  # (3, n_bands)

    # Normalise RGB to [0, 1]
    rgb = image.astype(np.float32) / 255.0  # (H, W, 3)

    # Flatten spatial dims
    pixels = rgb.reshape(-1, 3)  # (N, 3)

    # Matrix multiply: each pixel's spectrum = weighted sum of basis funcs
    # pixels (N, 3) @ basis (3, n_bands) → spectra (N, n_bands)
    spectra = pixels @ basis

    # Add NIR component proportional to green channel (vegetation proxy)
    green_channel = pixels[:, 1:2]  # (N, 1)
    spectra += green_channel * nir_basis[np.newaxis, :]

    # Normalise to [0, 1] per-pixel
    spec_max = spectra.max(axis=1, keepdims=True)
    spec_max = np.where(spec_max > 0, spec_max, 1.0)
    spectra = spectra / spec_max

    cube = spectra.reshape(H, W, n_bands)
    return cube, wl


def load_image_to_cube(
    file_bytes: bytes,
    n_bands: int = DEFAULT_N_BANDS,
) -> Tuple[np.ndarray, np.ndarray, dict]:
    """
    Load image bytes (PNG/JPG/BMP/TIFF) and convert to a spectral cube.

    Returns:
        cube: (H, W, n_bands)
        wavelengths: (n_bands,)
        metadata: dict with image info
    """
    img = Image.open(io.BytesIO(file_bytes))
    img_rgb = img.convert("RGB")
    rgb_array = np.array(img_rgb)

    cube, wavelengths = rgb_to_spectral_cube(rgb_array, n_bands=n_bands)

    metadata = {
        "original_size": list(img.size),  # (W, H)
        "original_mode": img.mode,
        "converted_shape": list(cube.shape),
        "n_bands": n_bands,
        "wavelength_range_nm": [float(wavelengths[0]), float(wavelengths[-1])],
        "method": "Gaussian basis RGB->VNIR simulation",
    }

    return cube, wavelengths, metadata


def extract_spectral_profile(
    cube: np.ndarray,
    wavelengths: np.ndarray,
    x: int,
    y: int,
) -> dict:
    """
    Extract the spectral profile of a single pixel.

    Args:
        cube: (H, W, B)
        wavelengths: (B,)
        x, y: pixel coordinates

    Returns:
        dict with wavelengths and reflectance values
    """
    H, W, B = cube.shape
    if y < 0 or y >= H or x < 0 or x >= W:
        raise ValueError(f"Pixel ({x}, {y}) out of bounds for image ({W}x{H})")

    spectrum = cube[y, x, :].tolist()
    return {
        "pixel": [x, y],
        "wavelengths_nm": wavelengths.tolist(),
        "reflectance": spectrum,
        "n_bands": B,
    }
