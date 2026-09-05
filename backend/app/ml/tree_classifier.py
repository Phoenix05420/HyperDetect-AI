"""
Tree Species Classifier — uses a pre-trained Random Forest model
to classify hyperspectral pixels into tree species.
"""

import os
import numpy as np
import joblib
from typing import Dict, List, Tuple

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "tree_species_rf.joblib",
)


class TreeClassifier:
    """Classify hyperspectral pixels into tree species."""

    def __init__(self):
        self._model_data = None

    def _load(self):
        if self._model_data is None:
            if not os.path.exists(MODEL_PATH):
                raise FileNotFoundError(
                    f"Tree classifier model not found at {MODEL_PATH}. "
                    "Run scripts/train_tree_model.py first."
                )
            self._model_data = joblib.load(MODEL_PATH)
        return self._model_data

    @property
    def label_map(self) -> Dict[int, str]:
        return self._load()["label_map"]

    @property
    def n_bands(self) -> int:
        return self._load()["n_bands"]

    @property
    def accuracy(self) -> float:
        return self._load()["accuracy"]

    @property
    def species_list(self) -> List[str]:
        lm = self.label_map
        return [lm[k] for k in sorted(lm.keys())]

    def is_available(self) -> bool:
        return os.path.exists(MODEL_PATH)

    def classify_cube(self, cube: np.ndarray) -> Dict:
        """
        Classify a full hyperspectral cube.

        Args:
            cube: numpy array of shape (H, W, B)

        Returns:
            dict with classification_map, species_distribution, per_pixel_confidence
        """
        data = self._load()
        model = data["model"]
        label_map = data["label_map"]

        H, W, B = cube.shape
        pixels = cube.reshape(-1, B).astype(np.float32)

        # Handle band mismatch by truncating or padding
        expected_bands = data["n_bands"]
        if B > expected_bands:
            pixels = pixels[:, :expected_bands]
        elif B < expected_bands:
            pad = np.zeros((pixels.shape[0], expected_bands - B), dtype=np.float32)
            pixels = np.concatenate([pixels, pad], axis=1)

        # Predict classes and probabilities
        predictions = model.predict(pixels)
        probabilities = model.predict_proba(pixels)

        # Build classification map
        classification_map = predictions.reshape(H, W)

        # Confidence map (max probability per pixel)
        confidence_map = np.max(probabilities, axis=1).reshape(H, W)

        # Species distribution (percentage of pixels per species)
        unique, counts = np.unique(predictions, return_counts=True)
        total = predictions.shape[0]
        distribution = {}
        for cls_id, count in zip(unique, counts):
            species_name = label_map.get(int(cls_id), f"Unknown-{cls_id}")
            distribution[species_name] = {
                "count": int(count),
                "percentage": round(float(count / total * 100), 2),
            }

        return {
            "classification_map": classification_map.tolist(),
            "confidence_map": confidence_map.tolist(),
            "distribution": distribution,
            "species_list": [label_map[k] for k in sorted(label_map.keys())],
            "dimensions": {"height": H, "width": W, "bands": B},
        }

    def classify_pixels(self, pixels: np.ndarray) -> Dict:
        """
        Classify individual pixel spectra.

        Args:
            pixels: numpy array of shape (N, B) — N pixel spectra

        Returns:
            dict with predictions and probabilities
        """
        data = self._load()
        model = data["model"]
        label_map = data["label_map"]

        pixels = pixels.astype(np.float32)
        expected_bands = data["n_bands"]
        if pixels.shape[1] > expected_bands:
            pixels = pixels[:, :expected_bands]
        elif pixels.shape[1] < expected_bands:
            pad = np.zeros(
                (pixels.shape[0], expected_bands - pixels.shape[1]), dtype=np.float32
            )
            pixels = np.concatenate([pixels, pad], axis=1)

        predictions = model.predict(pixels)
        probabilities = model.predict_proba(pixels)

        results = []
        for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
            species = label_map.get(int(pred), f"Unknown-{pred}")
            confidence = float(np.max(probs))
            results.append(
                {
                    "pixel_index": i,
                    "species": species,
                    "confidence": round(confidence, 4),
                    "all_probabilities": {
                        label_map.get(int(cls), f"Unknown-{cls}"): round(float(p), 4)
                        for cls, p in zip(model.classes_, probs)
                    },
                }
            )

        return {"predictions": results}
