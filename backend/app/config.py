from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 40

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS - Allow all in development
    cors_origins: str = (
        "http://localhost:3011,http://localhost:3000,http://127.0.0.1:3011"
    )
    backend_url: str = "http://localhost:8011"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Environment
    environment: str = "development"
    debug: bool = True

    # URLs
    frontend_url: str = "http://localhost:3011"

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        # Also add the backend URL itself for testing
        origins.append(self.backend_url)
        return origins

    @property
    def async_database_url(self) -> str:
        # Convert postgresql:// to postgresql+asyncpg://
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",  # Allow extra fields
    )


settings = Settings()
