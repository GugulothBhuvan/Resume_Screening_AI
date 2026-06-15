from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KGP-ScholarScreen AI"
    BACKEND_CORS_ORIGINS: List[str] = ["*"] # Allow all for MVP testing
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "mock-key")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kgp.db")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "sqla+sqlite:///celery_broker.sqlite")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "db+sqlite:///celery_results.sqlite")
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./chroma_db")

    class Config:
        case_sensitive = True

settings = Settings()
