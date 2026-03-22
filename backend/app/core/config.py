# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, EmailStr, field_validator
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "Beergate v2"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"  # development | production

    # Database
    DATABASE_URL: str  # postgresql+asyncpg://user:pass@host:5432/beergate

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth — JWT
    SECRET_KEY: str  # openssl rand -hex 32
    REFRESH_SECRET_KEY: str  # openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # AI providers
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    TOGETHER_API_KEY: str = ""
    TOGETHER_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    AI_PROVIDER_CHAIN: str = "together,claude,ollama"  # fallback order

    # External APIs
    BREWERS_FRIEND_API_KEY: str = ""
    ISPINDEL_WEBHOOK_SECRET: str = ""

    # Email (for invitation links)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@beergate.es"
    EMAILS_FROM_NAME: str = "Beergate"

    # Rate limiting (requests per minute per user on AI endpoints)
    AI_RATE_LIMIT: str = "20/minute"

    # Invitation token TTL (hours)
    INVITATION_EXPIRE_HOURS: int = 48

    # Cache TTL (seconds) for price scraping results
    PRICE_CACHE_TTL: int = 3600 * 3  # 3 hours

    # Default pagination limits
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 200
    FERMENTATION_DATA_LIMIT: int = 500


settings = Settings()
