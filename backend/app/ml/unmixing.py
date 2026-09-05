import numpy as np
from scipy.optimize import nnls
from sklearn.cluster import KMeans

class LinearSpectralUnmixer:
    """
    Linear Spectral Unmixing Engine (FCLS / NNLS).
    Extracts pure spectral endmembers from a hyperspectral cube and calculates
    fractional abundance spatial maps for each endmember.
    """
    def __init__(self, n_endmembers: int = 3):
        self.n_endmembers = n_endmembers

    def extract_endmembers(self, cube: np.ndarray) -> np.ndarray:
        """
        Extract endmember spectra (n_endmembers, B) using K-Means centroid initialization.
        """
        H, W, B = cube.shape
        X = cube.reshape(-1, B)
        kmeans = KMeans(n_clusters=self.n_endmembers, random_state=42, n_init=5)
        kmeans.fit(X)
        endmembers = kmeans.cluster_centers_  # (M, B)
        return endmembers

    def decompose(self, cube: np.ndarray, custom_endmembers: np.ndarray = None) -> tuple:
        """
        Perform Non-Negative Least Squares (NNLS) abundance estimation.
        Returns:
            abundance_maps: (H, W, n_endmembers)
            endmembers: (n_endmembers, B)
        """
        H, W, B = cube.shape
        X = cube.reshape(-1, B).astype(np.float64)

        if custom_endmembers is not None:
            endmembers = np.array(custom_endmembers, dtype=np.float64)
            M = len(endmembers)
        else:
            endmembers = self.extract_endmembers(cube)
            M = self.n_endmembers

        E_matrix = endmembers.T  # (B, M)
        N = H * W
        abundances = np.zeros((N, M), dtype=np.float32)

        # Solve NNLS per pixel
        for i in range(N):
            a, _ = nnls(E_matrix, X[i])
            s = np.sum(a)
            if s > 0:
                a /= s
            abundances[i] = a

        abundance_maps = abundances.reshape(H, W, M)
        return abundance_maps, endmembers
