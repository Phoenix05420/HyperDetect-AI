import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/hyperdetect")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    results_dir: str = os.getenv("RESULTS_DIR", "./results")
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", 524288000))
    
    class Config:
        env_file = "../.env"

settings = Settings()
