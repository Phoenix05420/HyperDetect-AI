import numpy as np
import cv2

class Thresholding:
    @staticmethod
    def manual(scores: np.ndarray, threshold: float) -> np.ndarray:
        return (scores > threshold).astype(np.uint8)

    @staticmethod
    def percentile(scores: np.ndarray, p: float = 95.0) -> np.ndarray:
        threshold = np.percentile(scores, p)
        return (scores > threshold).astype(np.uint8)

    @staticmethod
    def otsu(scores: np.ndarray) -> np.ndarray:
        """
        Otsu automatic binary thresholding using OpenCV and NumPy histogram analysis.
        """
        norm = np.clip(scores, 0, 1)
        img_uint8 = (norm * 255).astype(np.uint8)
        _, binary = cv2.threshold(img_uint8, 0, 1, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary.astype(np.uint8)

    @staticmethod
    def statistical(scores: np.ndarray, k: float = 3.0) -> np.ndarray:
        threshold = np.mean(scores) + k * np.std(scores)
        return (scores > threshold).astype(np.uint8)
