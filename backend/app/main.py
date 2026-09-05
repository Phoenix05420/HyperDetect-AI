from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import upload, process, results, dataset, targets, feedback, report, classify, unmixing_api, indices_api

app = FastAPI(title="HyperDetect AI")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://hyperdetect.ai",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(process.router, prefix="/process", tags=["process"])
app.include_router(results.router, prefix="/results", tags=["results"])
app.include_router(dataset.router, prefix="/datasets", tags=["datasets"])
app.include_router(targets.router, prefix="/targets", tags=["targets"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
app.include_router(report.router, prefix="/report", tags=["report"])
app.include_router(classify.router, prefix="/classify", tags=["classify"])
app.include_router(unmixing_api.router, prefix="/unmixing", tags=["unmixing"])
app.include_router(indices_api.router, prefix="/indices", tags=["indices"])

@app.get("/")
def root():
    return {"message": "Welcome to HyperDetect AI API"}
