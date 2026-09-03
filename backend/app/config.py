import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "password")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    results_dir: str = os.getenv("RESULTS_DIR", "./results")
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", 524288000))
    
    class Config:
        env_file = "../.env"

settings = Settings()
