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
    def __init__(self, epochs=5, batch_size=256, lr=1e-3):
        self.epochs = epochs
        self.batch_size = batch_size
        self.lr = lr
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B).astype(np.float32)
        model = Autoencoder(B).to(self.device)
        optimizer = optim.Adam(model.parameters(), lr=self.lr)
        criterion = nn.MSELoss()

        dataset = TensorDataset(torch.tensor(X))
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        
        model.train()
        for epoch in range(self.epochs):
            for batch in loader:
                data = batch[0].to(self.device)
                optimizer.zero_grad()
                output = model(data)
                loss = criterion(output, data)
                loss.backward()
                optimizer.step()
                
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
