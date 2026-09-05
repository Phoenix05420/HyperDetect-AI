import numpy as np

class SAMDetector:
    """
    Spectral Angle Mapper (SAM) & Spectral Matched Filter (SMF) Target Detector.
    Calculates the spectral angle or matched filter response between pixel spectra
    and a target reference spectral signature.
    """
    def __init__(self, mode: str = "sam"):
        self.mode = mode.lower()

    def detect(self, cube: np.ndarray, target_spectrum: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B).astype(np.float32)
        s = np.array(target_spectrum, dtype=np.float32)

        if len(s) != B:
            # Interpolate target spectrum if band count mismatch
            s = np.interp(np.linspace(0, 1, B), np.linspace(0, 1, len(s)), s)

        if self.mode == "sam":
            # Normalize pixel vectors and target vector
            x_norm = np.linalg.norm(X, axis=1, keepdims=True)
            x_norm = np.where(x_norm > 0, x_norm, 1e-6)
            X_normalized = X / x_norm

            s_norm = np.linalg.norm(s)
            s_norm = s_norm if s_norm > 0 else 1e-6
            s_normalized = s / s_norm

            dot_product = np.clip(X_normalized.dot(s_normalized), -1.0, 1.0)
            angles = np.arccos(dot_product)  # Radians [0, pi]
            # Convert angle to similarity score [0, 1] (0 angle -> score 1.0)
            scores = 1.0 - (angles / np.pi)

        elif self.mode == "smf":
            mu = np.mean(X, axis=0)
            X_centered = X - mu
            cov = np.cov(X, rowvar=False) + np.eye(B) * 1e-5
            try:
                inv_cov = np.linalg.inv(cov)
                diff_s = s - mu
                denom = diff_s.dot(inv_cov).dot(diff_s.T)
                w = inv_cov.dot(diff_s.T) / (denom if abs(denom) > 1e-6 else 1e-6)
                scores = X_centered.dot(w)
            except np.linalg.LinAlgError:
                scores = X_centered.dot(s)
        else:
            scores = np.zeros(H * W, dtype=np.float32)

        score_map = scores.reshape(H, W)
        min_val, max_val = np.min(score_map), np.max(score_map)
        if max_val > min_val:
            score_map = (score_map - min_val) / (max_val - min_val)

        return score_map
