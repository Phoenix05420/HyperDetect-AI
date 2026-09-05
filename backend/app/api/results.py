from fastapi import APIRouter, HTTPException
from ..services.storage import datastore

router = APIRouter()

@router.get("/{job_id}")
async def get_job_results(job_id: str):
    """Retrieve full anomaly detection result dataset for a job."""
    result = datastore.get_result(job_id)
    if not result:
        job = datastore.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job["status"] != "completed":
            return {"status": job["status"], "progress": job.get("progress", 0), "stage": job.get("stage", "Processing")}
        raise HTTPException(status_code=404, detail="Results not ready or found")
    return result
