import numpy as np
import cv2

class LocalRXDetector:
    """
    Local Reed-Xoli (Local RX) Anomaly Detector.
    Uses a dual sliding window (Outer Background Window & Inner Guard Window)
    to calculate local background statistics (mean and covariance) per pixel.
    """
    def __init__(self, window_size: int = 15, guard_window: int = 5):
        self.window_size = window_size if window_size % 2 == 1 else window_size + 1
        self.guard_window = guard_window if guard_window % 2 == 1 else guard_window + 1

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        anomaly_map = np.zeros((H, W), dtype=np.float32)
        
        half_w = self.window_size // 2
        half_g = self.guard_window // 2

        # Pad spatial boundaries
        padded = np.pad(cube, ((half_w, half_w), (half_w, half_w), (0, 0)), mode='reflect')

        # Fast local mean estimation via box filtering per band
        local_means = np.zeros((H, W, B), dtype=np.float32)
        for b in range(B):
            local_means[:, :, b] = cv2.boxFilter(cube[:, :, b], -1, (self.window_size, self.window_size))

        # Perform local RX distance computation
        for r in range(H):
            pr = r + half_w
            for c in range(W):
                pc = c + half_w
                
                # Extract outer window
                outer_slice = padded[pr - half_w : pr + half_w + 1, pc - half_w : pc + half_w + 1, :]
                
                # Create mask excluding inner guard window
                mask = np.ones((self.window_size, self.window_size), dtype=bool)
                g_start = half_w - half_g
                g_end = half_w + half_g + 1
                mask[g_start:g_end, g_start:g_end] = False
                
                bg_pixels = outer_slice[mask]  # (N_bg, B)
                
                if len(bg_pixels) > B:
                    mu = np.mean(bg_pixels, axis=0)
                    cov = np.cov(bg_pixels, rowvar=False) + np.eye(B) * 1e-5
                    try:
                        inv_cov = np.linalg.inv(cov)
                        diff = cube[r, c, :] - mu
                        score = float(diff.dot(inv_cov).dot(diff.T))
                    except np.linalg.LinAlgError:
                        score = 0.0
                else:
                    diff = cube[r, c, :] - local_means[r, c, :]
                    score = float(np.sum(diff ** 2))
                
                anomaly_map[r, c] = score

        # Min-max normalization
        min_val, max_val = np.min(anomaly_map), np.max(anomaly_map)
        if max_val > min_val:
            anomaly_map = (anomaly_map - min_val) / (max_val - min_val)

        return anomaly_map
