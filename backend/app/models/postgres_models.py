from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, Text
from sqlalchemy.sql import func
from app.database import Base
import uuid


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    original_path = Column(String)
    file_size = Column(Integer)
    format = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    bands = Column(Integer)
    data_type = Column(String)
    wavelengths = Column(JSON)
    rgb_preview_path = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="uploaded")


class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, nullable=False)
    status = Column(String, default="queued")
    algorithm = Column(String, default="rx")
    config = Column(JSON)
    progress = Column(Integer, default=0)
    stage = Column(String, default="Queued")
    started_at = Column(DateTime(timezone=True), default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)


class ResultModel(Base):
    __tablename__ = "results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, nullable=False, unique=True)
    dataset_id = Column(String, nullable=False)
    algorithm = Column(String)
    score_map = Column(JSON)
    binary_mask = Column(JSON)
    heatmap_b64 = Column(Text)
    mask_b64 = Column(Text)
    rgb_b64 = Column(Text)
    targets = Column(JSON)
    target_count = Column(Integer, default=0)
    histogram = Column(JSON)
    converted_from_rgb = Column(Boolean, default=False)
    note = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
