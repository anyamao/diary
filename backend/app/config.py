from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os

class Settings(BaseSettings):
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 40
    
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    cors_origins: str = "https://vibenote.ru"
    backend_url: str = "http://localhost:8011"
    
    redis_url: str = "redis://localhost:6379/0"
    
    environment: str = "development"
    debug: bool = True
    
    frontend_url: str = "https://vibenote.ru"
    
    @property
    def cors_origins_list(self) -> List[str]:
        # Split by comma and strip whitespace, then remove duplicates
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        # Remove duplicates while preserving order
        seen = set()
        unique_origins = []
        for origin in origins:
            if origin not in seen:
                seen.add(origin)
                unique_origins.append(origin)
        return unique_origins
    
    @property
    def async_database_url(self) -> str:
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra='allow'
    )

settings = Settings()
