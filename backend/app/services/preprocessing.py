import numpy as np

class HyperspectralPreprocessor:
    def __init__(self, cube):
        if len(cube.shape) != 3:
            raise ValueError("Invalid hyperspectral cube")
        self.cube = cube

    def process(self):
        # clean, normalize, PCA...
        return self.cube
