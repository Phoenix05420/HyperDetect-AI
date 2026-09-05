import numpy as np

class SpectralIndexCalculator:
    """
    Calculates standard remote sensing spectral indices (NDVI, NDWI, SAVI, EVI)
    from a hyperspectral cube based on target wavelength bands.
    """
    def __init__(self, cube: np.ndarray, wavelengths: list = None):
        self.cube = cube
        H, W, B = cube.shape
        self.wavelengths = np.array(wavelengths if wavelengths and len(wavelengths) == B else np.linspace(400, 1000, B))

        # Band Index Resolution
        self.b_idx = np.argmin(np.abs(self.wavelengths - 470.0))
        self.g_idx = np.argmin(np.abs(self.wavelengths - 550.0))
        self.r_idx = np.argmin(np.abs(self.wavelengths - 660.0))
        self.nir_idx = np.argmin(np.abs(self.wavelengths - 800.0))

    def compute_index(self, index_name: str) -> np.ndarray:
        index_name = index_name.lower()
        blue = self.cube[:, :, self.b_idx].astype(np.float32)
        green = self.cube[:, :, self.g_idx].astype(np.float32)
        red = self.cube[:, :, self.r_idx].astype(np.float32)
        nir = self.cube[:, :, self.nir_idx].astype(np.float32)

        if index_name == "ndvi":
            # Normalized Difference Vegetation Index
            denom = nir + red + 1e-6
            index_map = (nir - red) / denom

        elif index_name == "ndwi":
            # Normalized Difference Water Index
            denom = green + nir + 1e-6
            index_map = (green - nir) / denom

        elif index_name == "savi":
            # Soil Adjusted Vegetation Index
            denom = nir + red + 0.5
            index_map = 1.5 * (nir - red) / denom

        elif index_name == "evi":
            # Enhanced Vegetation Index
            denom = nir + 6.0 * red - 7.5 * blue + 1.0
            denom = np.where(np.abs(denom) > 1e-6, denom, 1e-6)
            index_map = 2.5 * (nir - red) / denom

        else:
            denom = nir + red + 1e-6
            index_map = (nir - red) / denom

        # Clip index values to [-1, 1] range
        index_map = np.clip(index_map, -1.0, 1.0)
        return index_map
