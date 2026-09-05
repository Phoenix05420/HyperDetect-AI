import numpy as np


class RXDetector:
    """
    Reed-Xiaoli (RX) anomaly detector.

    Computes the Mahalanobis distance of each pixel from the background
    mean in spectral space:

        score(x) = (x - mu)^T Sigma^{-1} (x - mu)

    For bands > ~100 the full covariance matrix becomes expensive
    (O(B^3) to invert) and numerically ill-conditioned.  We use
    np.linalg.pinv with an adaptive cutoff instead of explicit
    inversion + 1e-6 ridge — it handles rank-deficient cases more
    gracefully without silently masking a degenerate covariance.
    """

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B)
        mu = np.mean(X, axis=0)
        X_centered = X - mu

        # Use pseudo-inverse when band count is high (more stable).
        # cutoff_pca-style threshold; pinv already drops near-zero singular values.
        cov = np.cov(X, rowvar=False)
        inv_cov = np.linalg.pinv(cov)

        # Mahalanobis distance per pixel: diag(x @ inv @ x.T)
        scores = np.einsum("ij,jk,ik->i", X_centered, inv_cov, X_centered)

        anomaly_map = scores.reshape(H, W)
        min_val, max_val = np.min(anomaly_map), np.max(anomaly_map)
        if max_val > min_val:
            anomaly_map = (anomaly_map - min_val) / (max_val - min_val)
        return anomaly_map
