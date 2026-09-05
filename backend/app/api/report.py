from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..services.storage import datastore

router = APIRouter()

@router.get("/{job_id}")
async def generate_diagnostic_report(job_id: str):
    """Generate a summary diagnostic report for an anomaly detection job."""
    result = datastore.get_result(job_id)
    job = datastore.get_job(job_id)

    if not result or not job:
        raise HTTPException(status_code=404, detail="Job or result not found")

    dataset_id = result["dataset_id"]
    dataset = datastore.get_dataset(dataset_id)

    report = {
        "report_id": f"REP-{job_id.upper()}",
        "generated_at": datetime.now().isoformat(),
        "job_id": job_id,
        "dataset": {
            "filename": dataset.get("filename") if dataset else "Unknown",
            "format": dataset.get("format") if dataset else "Unknown",
            "dimensions": f"{dataset.get('width', 0)} x {dataset.get('height', 0)} x {dataset.get('bands', 0)}",
            "converted_from_rgb": dataset.get("converted_from_rgb", False) if dataset else False,
        },
        "algorithm": {
            "name": result.get("algorithm", "rx").upper(),
            "config": job.get("config", {}),
        },
        "summary": {
            "total_targets_detected": result.get("target_count", 0),
            "high_confidence_targets": sum(1 for t in result.get("targets", []) if t.get("confidence") == "High"),
            "moderate_confidence_targets": sum(1 for t in result.get("targets", []) if t.get("confidence") == "Moderate"),
            "low_confidence_targets": sum(1 for t in result.get("targets", []) if t.get("confidence") == "Low"),
        },
        "targets": result.get("targets", []),
        "disclaimer": result.get("note"),
    }

    return report
