import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ravendb_url: str = os.getenv("RAVENDB_URL", "https://a.free.bharani-flow.ravendb.cloud")
    ravendb_database: str = os.getenv("RAVENDB_DATABASE", "HyperDetectAI")
    ravendb_certificate_path: str = os.getenv("RAVENDB_CERTIFICATE_PATH", "")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    results_dir: str = os.getenv("RESULTS_DIR", "./results")
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", 524288000))
    
    class Config:
        env_file = "../.env"

settings = Settings()
