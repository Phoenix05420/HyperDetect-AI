import numpy as np

class RXDetector:
    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B)
        mu = np.mean(X, axis=0)
        X_centered = X - mu
        cov = np.cov(X, rowvar=False) + np.eye(B) * 1e-6
        inv_cov = np.linalg.inv(cov)
        scores = np.einsum('ij,ji->i', X_centered.dot(inv_cov), X_centered.T)
        anomaly_map = scores.reshape(H, W)
        min_val, max_val = np.min(anomaly_map), np.max(anomaly_map)
        if max_val > min_val:
            anomaly_map = (anomaly_map - min_val) / (max_val - min_val)
        return anomaly_map
