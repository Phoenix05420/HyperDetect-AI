import numpy as np
import os
import spectral.io.envi as envi
from scipy.io import loadmat

class HyperspectralReader:
    @staticmethod
    def read(file_path, format="npy"):
        if format == "npy":
            return np.load(file_path)
        # Add envi, mat etc.
        return np.load(file_path)
