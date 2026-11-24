from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):

    # Application
    APP_NAME: str = "Data Copilot"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "development-only-change-this-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = (
    "postgresql+psycopg://postgres:lemon11@localhost:5432/data_copilot"
)

    # Frontend
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # File Storage
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()