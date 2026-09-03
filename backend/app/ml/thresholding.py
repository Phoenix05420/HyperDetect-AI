import numpy as np
from skimage.filters import threshold_otsu

class Thresholding:
    @staticmethod
    def manual(scores, threshold):
        return (scores > threshold).astype(np.uint8)

    @staticmethod
    def percentile(scores, p=95):
        threshold = np.percentile(scores, p)
        return (scores > threshold).astype(np.uint8)

    @staticmethod
    def otsu(scores):
        threshold = threshold_otsu(scores)
        return (scores > threshold).astype(np.uint8)

    @staticmethod
    def statistical(scores, k=3):
        threshold = np.mean(scores) + k * np.std(scores)
        return (scores > threshold).astype(np.uint8)
