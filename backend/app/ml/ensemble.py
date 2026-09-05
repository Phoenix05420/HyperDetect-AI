import numpy as np
from .rx_detector import RXDetector
from .isolation_forest_detector import IsolationForestDetector
from .autoencoder_detector import AutoencoderDetector

class HybridEnsemble:
    """
    Hybrid Ensemble Anomaly Detector.
    Fuses anomaly score maps from RX, Isolation Forest, and Deep Autoencoder detectors
    using weighted score combination.
    """
    def __init__(self, weights: dict = None):
        self.weights = weights or {"rx": 0.4, "isolation_forest": 0.3, "autoencoder": 0.3}
        self.rx = RXDetector()
        self.iforest = IsolationForestDetector()
        self.autoencoder = AutoencoderDetector(epochs=3)
        self._shared_ae = None  # reuse a single trained AE across ensemble calls

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        score_maps = []
        total_weight = 0.0

        if self.weights.get("rx", 0) > 0:
            w = self.weights["rx"]
            rx_map = self.rx.detect(cube)
            score_maps.append((rx_map, w))
            total_weight += w

        if self.weights.get("isolation_forest", 0) > 0:
            w = self.weights["isolation_forest"]
            if_map = self.iforest.detect(cube)
            score_maps.append((if_map, w))
            total_weight += w

        if self.weights.get("autoencoder", 0) > 0:
            w = self.weights["autoencoder"]
            # Train once and reuse the same model for the ensemble.
            if self._shared_ae is None:
                self._shared_ae = AutoencoderDetector(epochs=3)
            ae_map = self._shared_ae.detect(cube)
            score_maps.append((ae_map, w))
            total_weight += w

        if not score_maps:
            return np.zeros((H, W), dtype=np.float32)

        fused_map = np.zeros((H, W), dtype=np.float32)
        for score_map, weight in score_maps:
            fused_map += score_map * (weight / total_weight)

        min_val, max_val = np.min(fused_map), np.max(fused_map)
        if max_val > min_val:
            fused_map = (fused_map - min_val) / (max_val - min_val)

        return fused_map
