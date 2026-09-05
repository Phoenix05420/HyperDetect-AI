from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from ..services.storage import datastore

router = APIRouter()

FEEDBACK_STORE: Dict[str, List[Dict[str, Any]]] = {}

class FeedbackItem(BaseModel):
    job_id: str
    target_id: int
    feedback_type: str  # verified_anomaly, false_positive
    notes: str = ""

@router.post("/")
async def submit_feedback(item: FeedbackItem):
    """Submit user target verification feedback."""
    job = datastore.get_job(item.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if item.job_id not in FEEDBACK_STORE:
        FEEDBACK_STORE[item.job_id] = []

    feedback_record = {
        "job_id": item.job_id,
        "target_id": item.target_id,
        "feedback_type": item.feedback_type,
        "notes": item.notes,
    }
    FEEDBACK_STORE[item.job_id].append(feedback_record)

    return {
        "success": True,
        "job_id": item.job_id,
        "target_id": item.target_id,
        "message": f"Recorded feedback '{item.feedback_type}' for Target #{item.target_id}",
    }

@router.get("/{job_id}")
async def get_job_feedback(job_id: str):
    """Retrieve user feedback history for a job."""
    feedback_list = FEEDBACK_STORE.get(job_id, [])
    return {"job_id": job_id, "feedback": feedback_list}
