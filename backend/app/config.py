import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/hyperdetect")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    results_dir: str = os.getenv("RESULTS_DIR", "./results")
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", 524288000))
    
    class Config:
        env_file = "../.env"

settings = Settings()
