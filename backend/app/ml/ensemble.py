import numpy as np

class HybridEnsemble:
    def __init__(self, weights={"rx": 0.4, "isolation_forest": 0.3, "autoencoder": 0.3}):
        self.weights = weights

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        return np.random.rand(H, W)
