# HyperDetect AI

**HyperDetect AI** is a complete full-stack web application designed as a Hyperspectral Target & Anomaly Detection System. This scientific AI platform enables users to upload hyperspectral images, run various anomaly detection algorithms, and visualize spectral anomalies to detect unknown targets such as vehicles, diseased crops, pollution, and foreign objects without predefined object classes.

## Features

- **Upload Hyperspectral Datasets:** Supports standard hyperspectral formats like `.npy`.
- **Advanced Anomaly Detection Algorithms:** Includes actual algorithmic implementations:
  - RX Detector
  - Local RX Detector
  - Isolation Forest
  - Autoencoder (PyTorch)
  - Hybrid Ensembles
- **Thresholding & Post-processing:** Statistical, Otsu, Percentile, and Manual thresholding, paired with morphological cleaning.
- **Target Localization:** Bounding box calculations and area analysis using connected components.
- **Interactive UI:** Vite + React frontend for real-time processing visualization, metadata viewing, and heatmaps.

## Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS
- React Router
- Charts: Plotly.js & Recharts
- Icons: Lucide React

### Backend
- FastAPI (Python) & Uvicorn
- Data Processing: NumPy, Pandas, Scikit-learn
- Deep Learning: PyTorch
- Hyperspectral & Imaging: Spectral Python (SPy), OpenCV, Pillow, Matplotlib
- Database: MongoDB (Motor for Async operations)

## Directory Structure

```
hyperdetect-ai/
├── frontend/             # Vite + React Frontend
├── backend/              # FastAPI Backend + ML algorithms
├── docker-compose.yml    # MongoDB database definition
├── .env.example          # Environment variables
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.9+)
- Docker (for MongoDB)

### 1. Database Setup
Start the MongoDB instance using Docker:
```bash
docker-compose up -d
```

### 2. Backend Setup
Navigate into the backend directory, install the required packages, and start the FastAPI server:
```bash
cd backend
python -m venv venv
# On Windows: venv\\Scripts\\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend API will run at `http://localhost:8000`.

### 3. Frontend Setup
Navigate into the frontend directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
Access the web UI at `http://localhost:5173`.

## Demo Data

To test the application without a physical hyperspectral camera, you can generate synthetic test data:
```bash
cd backend/scripts
python generate_demo_data.py
```
This will create a `demo_cube.npy` file in the `uploads/` directory which you can upload via the web interface.

## License
MIT License
