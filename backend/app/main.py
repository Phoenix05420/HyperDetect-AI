from fastapi import FastAPI
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
