import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class Autoencoder(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(),
            nn.Linear(64, 32), nn.ReLU(),
            nn.Linear(32, 16)
        )
        self.decoder = nn.Sequential(
            nn.Linear(16, 32), nn.ReLU(),
            nn.Linear(32, 64), nn.ReLU(),
            nn.Linear(64, input_dim)
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))

class AutoencoderDetector:
    """
    Autoencoder-based hyperspectral anomaly detector.
    Trains an undercomplete autoencoder and uses reconstruction error
    as the anomaly score. Supports optional pre-trained model injection
    for caching/ensemble reuse.
    """
    def __init__(self, epochs=5, batch_size=256, lr=1e-3, model: nn.Module = None):
        self.epochs = epochs
        self.batch_size = batch_size
        self.lr = lr
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = model          # optional pre-trained model
        self._trained_cache: tuple = None  # (input_dim, model) cache

    def _ensure_model(self, input_dim: int) -> nn.Module:
        """Return a ready model: injected > cached > fresh."""
        if self.model is not None:
            return self.model
        if self._trained_cache is not None and self._trained_cache[0] == input_dim:
            return self._trained_cache[1]
        model = Autoencoder(input_dim).to(self.device)
        self._trained_cache = (input_dim, model)
        return model

    def _train(self, model: nn.Module, X: np.ndarray):
        optimizer = optim.Adam(model.parameters(), lr=self.lr)
        criterion = nn.MSELoss()
        tensor_x = torch.tensor(X)
        dataset = TensorDataset(tensor_x)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        model.train()
        for _ in range(self.epochs):
            for batch in loader:
                data = batch[0].to(self.device)
                optimizer.zero_grad()
                output = model(data)
                loss = criterion(output, data)
                loss.backward()
                optimizer.step()

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B).astype(np.float32)
        model = self._ensure_model(B)
        if self.model is None:
            self._train(model, X)
        model.eval()
        with torch.no_grad():
            X_tensor = torch.tensor(X).to(self.device)
            reconstructed = model(X_tensor)
            mse = torch.mean((X_tensor - reconstructed) ** 2, dim=1).cpu().numpy()
        anomaly_map = mse.reshape(H, W)
        min_val, max_val = np.min(anomaly_map), np.max(anomaly_map)
        if max_val > min_val:
            anomaly_map = (anomaly_map - min_val) / (max_val - min_val)
        return anomaly_map
