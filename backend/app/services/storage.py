import os
import json
import uuid
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional

from app.database import SessionLocal, engine
from app.database import Base
from app.models.postgres_models import DatasetModel, JobModel, ResultModel


# Create all tables on import (silently skip if DB offline — tables will be
# created on first successful connection instead).
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass  # DB may not be reachable at import time; retry on first use.


class DataStore:
    """
    PostgreSQL-backed storage for datasets, jobs, and results.
    Falls back to in-memory dict for numpy cubes (too large for Postgres).
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            try:
                cls._instance._init()
            except Exception:
                pass  # DB may be unavailable; in-memory fallback active
        return cls._instance

    def _init(self):
        self.datasets_meta: Dict[str, dict] = {}
        self.cubes: Dict[str, np.ndarray] = {}
        self.jobs: Dict[str, dict] = {}
        self.results: Dict[str, dict] = {}
        try:
            self._load_all()
        except Exception:
            pass  # DB may be unavailable at startup; data saved in-memory until DB is reachable

    # ── Load from DB on startup ──────────────────────────────────────────

    def _load_all(self):
        db = SessionLocal()
        try:
            for row in db.query(DatasetModel).all():
                meta = {
                    "id": row.id,
                    "filename": row.filename,
                    "original_path": row.original_path,
                    "file_size": row.file_size,
                    "format": row.format,
                    "width": row.width,
                    "height": row.height,
                    "bands": row.bands,
                    "data_type": row.data_type,
                    "wavelengths": row.wavelengths or [],
                    "rgb_preview_path": row.rgb_preview_path,
                    "uploaded_at": row.uploaded_at.isoformat() if row.uploaded_at else None,
                    "status": row.status,
                }
                self.datasets_meta[row.id] = meta
            for row in db.query(JobModel).all():
                self.jobs[row.id] = {
                    "id": row.id,
                    "dataset_id": row.dataset_id,
                    "status": row.status,
                    "algorithm": row.algorithm,
                    "config": row.config or {},
                    "progress": row.progress,
                    "stage": row.stage,
                    "started_at": row.started_at.isoformat() if row.started_at else None,
                    "completed_at": row.completed_at.isoformat() if row.completed_at else None,
                    "error_message": row.error_message,
                }
            for row in db.query(ResultModel).all():
                self.results[row.job_id] = {
                    "id": row.id,
                    "job_id": row.job_id,
                    "dataset_id": row.dataset_id,
                    "algorithm": row.algorithm,
                    "score_map": row.score_map or [],
                    "binary_mask": row.binary_mask or [],
                    "heatmap_b64": row.heatmap_b64,
                    "mask_b64": row.mask_b64,
                    "rgb_b64": row.rgb_b64,
                    "targets": row.targets or [],
                    "target_count": row.target_count or 0,
                    "histogram": row.histogram or [],
                    "converted_from_rgb": row.converted_from_rgb,
                    "note": row.note,
                    "completed_at": row.completed_at.isoformat() if row.completed_at else None,
                }
        finally:
            db.close()

    # ── Dataset CRUD ─────────────────────────────────────────────────────

    def register_dataset(self, dataset_id: str, metadata: dict, cube: np.ndarray):
        self.datasets_meta[dataset_id] = metadata
        self.cubes[dataset_id] = cube
        db = SessionLocal()
        try:
            db.add(DatasetModel(
                id=dataset_id,
                filename=metadata.get("filename", ""),
                original_path=metadata.get("original_path", ""),
                file_size=metadata.get("file_size", 0),
                format=metadata.get("format", ""),
                width=metadata.get("width", 0),
                height=metadata.get("height", 0),
                bands=metadata.get("bands", 0),
                data_type=metadata.get("data_type", ""),
                wavelengths=metadata.get("wavelengths"),
                rgb_preview_path=metadata.get("rgb_preview_path", ""),
                status=metadata.get("status", "uploaded"),
            ))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def get_dataset(self, dataset_id: str) -> Optional[dict]:
        return self.datasets_meta.get(dataset_id)

    def get_cube(self, dataset_id: str) -> Optional[np.ndarray]:
        return self.cubes.get(dataset_id)

    def list_datasets(self) -> list:
        return list(self.datasets_meta.values())

    # ── Job CRUD ─────────────────────────────────────────────────────────

    def create_job(self, job_id: str, job_info: dict):
        self.jobs[job_id] = job_info
        db = SessionLocal()
        try:
            db.add(JobModel(
                id=job_id,
                dataset_id=job_info.get("dataset_id", ""),
                status=job_info.get("status", "queued"),
                algorithm=job_info.get("algorithm", "rx"),
                config=job_info.get("config"),
                progress=job_info.get("progress", 0),
                stage=job_info.get("stage", "Queued"),
                started_at=datetime.fromisoformat(job_info["started_at"]) if job_info.get("started_at") else None,
            ))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def update_job(self, job_id: str, updates: dict):
        if job_id in self.jobs:
            self.jobs[job_id].update(updates)
        db = SessionLocal()
        try:
            row = db.query(JobModel).filter(JobModel.id == job_id).first()
            if row:
                for k, v in updates.items():
                    if k == "started_at" and isinstance(v, str):
                        v = datetime.fromisoformat(v)
                    elif k == "completed_at" and isinstance(v, str):
                        v = datetime.fromisoformat(v) if v else None
                    setattr(row, k, v)
                db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def get_job(self, job_id: str) -> Optional[dict]:
        return self.jobs.get(job_id)

    # ── Result CRUD ──────────────────────────────────────────────────────

    def save_result(self, job_id: str, result_data: dict):
        self.results[job_id] = result_data
        db = SessionLocal()
        try:
            existing = db.query(ResultModel).filter(ResultModel.job_id == job_id).first()
            data = {
                "job_id": job_id,
                "dataset_id": result_data.get("dataset_id", ""),
                "algorithm": result_data.get("algorithm", ""),
                "score_map": result_data.get("score_map"),
                "binary_mask": result_data.get("binary_mask"),
                "heatmap_b64": result_data.get("heatmap_b64", ""),
                "mask_b64": result_data.get("mask_b64", ""),
                "rgb_b64": result_data.get("rgb_b64", ""),
                "targets": result_data.get("targets"),
                "target_count": result_data.get("target_count", 0),
                "histogram": result_data.get("histogram"),
                "converted_from_rgb": result_data.get("converted_from_rgb", False),
                "note": result_data.get("note"),
                "completed_at": datetime.fromisoformat(result_data["completed_at"]) if result_data.get("completed_at") else None,
            }
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
            else:
                db.add(ResultModel(**data))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def get_result(self, job_id: str) -> Optional[dict]:
        return self.results.get(job_id)


datastore = DataStore()
