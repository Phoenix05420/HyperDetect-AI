import numpy as np

class HyperspectralPreprocessor:
    def __init__(self, cube: np.ndarray):
        if cube.ndim != 3:
            raise ValueError("Invalid hyperspectral cube dimensions")
        self.cube = cube

    def process(self):
        return self.cube

    @staticmethod
    def compute_spectral_derivative(spectrum: list, wavelengths: list = None, order: int = 1) -> list:
        """
        Calculate 1st or 2nd order derivative of a spectral reflectance curve (dR / dlambda).
        """
        spec = np.array(spectrum, dtype=np.float32)
        if wavelengths is not None and len(wavelengths) == len(spec):
            wl = np.array(wavelengths, dtype=np.float32)
            d1 = np.gradient(spec, wl)
        else:
            d1 = np.gradient(spec)

        if order == 2:
            if wavelengths is not None and len(wavelengths) == len(spec):
                d2 = np.gradient(d1, wl)
            else:
                d2 = np.gradient(d1)
            return d2.tolist()

        return d1.tolist()
