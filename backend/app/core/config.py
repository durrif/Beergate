from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Beergate"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    DATABASE_SYNC_URL: str
    
    # Redis
    REDIS_URL: str
    
    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    
    # ML Models
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    SIMILARITY_THRESHOLD: float = 0.75
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
