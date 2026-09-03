import numpy as np
from sklearn.ensemble import IsolationForest

class IsolationForestDetector:
    def __init__(self, n_estimators=100, contamination=0.05, random_state=42):
        self.model = IsolationForest(n_estimators=n_estimators, contamination=contamination, random_state=random_state)

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B)
        self.model.fit(X)
        scores = self.model.decision_function(X) * -1
        anomaly_map = scores.reshape(H, W)
        min_val, max_val = np.min(anomaly_map), np.max(anomaly_map)
        if max_val > min_val:
            anomaly_map = (anomaly_map - min_val) / (max_val - min_val)
        return anomaly_map
