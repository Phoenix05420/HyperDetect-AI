from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from ..database import Base
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
    wavelengths = Column(JSON) # Store list of floats as JSON
    rgb_preview_path = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="uploaded")