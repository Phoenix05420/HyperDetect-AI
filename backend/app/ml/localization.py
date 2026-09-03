import cv2
import numpy as np

class TargetLocalizer:
    @staticmethod
    def localize(score_map: np.ndarray, binary_mask: np.ndarray):
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
        targets = []
        for i in range(1, num_labels):
            x, y, w, h, area = stats[i]
            cx, cy = centroids[i]
            target_mask = (labels == i)
            target_scores = score_map[target_mask]
            
            max_score = float(np.max(target_scores))
            avg_score = float(np.mean(target_scores))
            confidence = "High" if max_score > 0.7 else "Moderate" if max_score > 0.4 else "Low"
            
            targets.append({
                "target_id": i,
                "bbox": [int(x), int(y), int(w), int(h)],
                "centroid": [float(cx), float(cy)],
                "area": int(area),
                "max_score": max_score,
                "avg_score": avg_score,
                "confidence": confidence
            })
        return targets
