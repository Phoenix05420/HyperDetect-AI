import os

backend_dirs = [
    "backend/app/api",
    "backend/app/services",
    "backend/app/ml",
    "backend/app/models",
    "backend/uploads",
    "backend/results",
    "backend/tests",
    "backend/scripts"
]

frontend_dirs = [
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/hooks",
    "frontend/src/services",
    "frontend/src/types"
]

files = {
    "backend/requirements.txt": """fastapi
uvicorn[standard]
pydantic
motor
pymongo
numpy
pandas
scikit-learn
torch
torchvision
spectral
opencv-python-headless
Pillow
matplotlib
scipy
python-multipart
""",
    "backend/app/__init__.py": "",
    "backend/app/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import upload, process, results, dataset, targets, feedback, report

app = FastAPI(title="HyperDetect AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(process.router, prefix="/process", tags=["process"])
app.include_router(results.router, prefix="/results", tags=["results"])
app.include_router(dataset.router, prefix="/datasets", tags=["datasets"])
app.include_router(targets.router, prefix="/targets", tags=["targets"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
app.include_router(report.router, prefix="/report", tags=["report"])

@app.get("/")
def root():
    return {"message": "Welcome to HyperDetect AI API"}
""",
    "backend/app/config.py": """import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/hyperdetect")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    results_dir: str = os.getenv("RESULTS_DIR", "./results")
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", 524288000))
    
    class Config:
        env_file = "../.env"

settings = Settings()
""",
    "backend/app/database.py": """from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
db = client.get_database()

def get_db():
    return db
""",
    "backend/app/models/mongodb_models.py": """# MongoDB Models (Schemas handled in schemas.py)""",
    "backend/app/schemas.py": """from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Dataset(BaseModel):
    id: str
    filename: str
    original_path: str
    file_size: int
    format: str
    width: int
    height: int
    bands: int
    data_type: str
    wavelengths: Optional[List[float]]
    rgb_preview_path: str
    uploaded_at: datetime
    status: str

class Target(BaseModel):
    target_id: int
    bbox: List[int]
    centroid: List[int]
    area: int
    max_score: float
    avg_score: float
    confidence: str

class JobConfig(BaseModel):
    normalization: str = "global_minmax"
    pca_enabled: bool = False
    pca_components: int = 10
    denoising: bool = False
    threshold_method: str = "manual"
    threshold_value: float = 0.5
    algorithm_params: Dict[str, Any] = {}

class Job(BaseModel):
    id: str
    dataset_id: str
    status: str
    algorithm: str
    config: JobConfig
    progress: int
    stage: str
    started_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]
""",
    "backend/app/api/upload.py": """from fastapi import APIRouter
router = APIRouter()
@router.post("/")
async def upload_file():
    return {"message": "Upload endpoint"}
""",
    "backend/app/api/process.py": """from fastapi import APIRouter
router = APIRouter()
@router.post("/{dataset_id}")
async def process_dataset(dataset_id: str):
    return {"message": f"Processing {dataset_id}"}
""",
    "backend/app/api/results.py": """from fastapi import APIRouter
router = APIRouter()
""",
    "backend/app/api/dataset.py": """from fastapi import APIRouter
router = APIRouter()
""",
    "backend/app/api/targets.py": """from fastapi import APIRouter
router = APIRouter()
""",
    "backend/app/api/feedback.py": """from fastapi import APIRouter
router = APIRouter()
""",
    "backend/app/api/report.py": """from fastapi import APIRouter
router = APIRouter()
""",
    "backend/app/api/__init__.py": "",
    "backend/app/services/__init__.py": "",
    "backend/app/ml/__init__.py": "",
    "backend/app/ml/rx_detector.py": """import numpy as np

class RXDetector:
    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        X = cube.reshape(-1, B)
        mu = np.mean(X, axis=0)
        X_centered = X - mu
        cov = np.cov(X, rowvar=False) + np.eye(B) * 1e-6
        inv_cov = np.linalg.inv(cov)
        scores = np.einsum('ij,ji->i', X_centered.dot(inv_cov), X_centered.T)
        anomaly_map = scores.reshape(H, W)
        min_val, max_val = np.min(anomaly_map), np.max(anomaly_map)
        if max_val > min_val:
            anomaly_map = (anomaly_map - min_val) / (max_val - min_val)
        return anomaly_map
""",
    "backend/app/ml/local_rx.py": """import numpy as np

class LocalRXDetector:
    def __init__(self, window_size=15, guard_window=5):
        self.window_size = window_size
        self.guard_window = guard_window

    def detect(self, cube: np.ndarray) -> np.ndarray:
        # Simplified placeholder for Local RX for performance
        H, W, B = cube.shape
        return np.random.rand(H, W)
""",
    "backend/app/ml/isolation_forest_detector.py": """import numpy as np
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
""",
    "backend/app/ml/autoencoder_detector.py": """import numpy as np
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
""",
    "backend/app/ml/ensemble.py": """import numpy as np

class HybridEnsemble:
    def __init__(self, weights={"rx": 0.4, "isolation_forest": 0.3, "autoencoder": 0.3}):
        self.weights = weights

    def detect(self, cube: np.ndarray) -> np.ndarray:
        H, W, B = cube.shape
        return np.random.rand(H, W)
""",
    "backend/app/ml/thresholding.py": """import numpy as np
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
""",
    "backend/app/ml/postprocessing.py": """import cv2
import numpy as np

class PostProcessor:
    @staticmethod
    def process(mask: np.ndarray, min_area=9) -> np.ndarray:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)
        
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(closed, connectivity=8)
        cleaned = np.zeros_like(closed)
        for i in range(1, num_labels):
            if stats[i, cv2.CC_STAT_AREA] >= min_area:
                cleaned[labels == i] = 1
        return cleaned
""",
    "backend/app/ml/localization.py": """import cv2
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
""",
    "backend/app/services/hyperspectral_reader.py": """import numpy as np
import os
import spectral.io.envi as envi
from scipy.io import loadmat

class HyperspectralReader:
    @staticmethod
    def read(file_path, format="npy"):
        if format == "npy":
            return np.load(file_path)
        # Add envi, mat etc.
        return np.load(file_path)
""",
    "backend/app/services/preprocessing.py": """import numpy as np

class HyperspectralPreprocessor:
    def __init__(self, cube):
        if len(cube.shape) != 3:
            raise ValueError("Invalid hyperspectral cube")
        self.cube = cube

    def process(self):
        # clean, normalize, PCA...
        return self.cube
""",
    "backend/app/services/visualization.py": """# Visualization functions""",
    "backend/app/services/report_service.py": """# Report generation""",
    "backend/scripts/generate_demo_data.py": """import numpy as np
import os

def generate():
    os.makedirs("../uploads", exist_ok=True)
    cube = np.random.randn(128, 128, 50)
    # Add anomalies
    cube[10:15, 10:15, :] += 5
    cube[100:105, 50:55, :] += 5
    np.save("../uploads/demo_cube.npy", cube)
    print("Demo data generated.")

if __name__ == '__main__':
    generate()
"""
}

# Create backend directories and files
for d in backend_dirs + frontend_dirs:
    os.makedirs(d, exist_ok=True)

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
print("Scaffolding complete.")
