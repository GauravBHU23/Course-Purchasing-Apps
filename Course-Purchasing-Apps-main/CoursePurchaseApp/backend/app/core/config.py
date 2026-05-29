from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    app_name: str = "CoursePurchaseApp API"
    environment: str = "development"
    database_url: str
    jwt_secret: str
    jwt_issuer: str = "course-purchase-app"
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    cookie_domain: str | None = None
    cookie_secure: bool = True
    cors_origins: Annotated[list[AnyHttpUrl | str], NoDecode] = []
    cors_origin_regex: str | None = r"^(https://.*\.vercel\.app|http://localhost:\d+)$"
    admin_email: str = "admin@coursestack.app"
    admin_password: str = "change-this-admin-password"

    # Frontend base URL used to build links inside emails
    frontend_url: str = "http://localhost:3000"

    # Public base URL of this backend (used to build absolute avatar URLs)
    backend_url: str = "http://localhost:8000"

    # Uploads
    upload_dir: str = "uploads"
    max_avatar_bytes: int = 3 * 1024 * 1024  # 3 MB

    # Password reset
    reset_token_minutes: int = 30

    # Email verification
    verify_token_hours: int = 24

    # SMTP / email settings (leave smtp_host empty to use dev console mode)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "CourseStack"
    smtp_use_tls: bool = True

    # Instamojo payment gateway
    instamojo_api_key: str = ""
    instamojo_auth_token: str = ""
    instamojo_salt: str = ""
    instamojo_test_mode: bool = True  # True -> test.instamojo.com, False -> live

    @property
    def instamojo_base_url(self) -> str:
        # Both environments use the v1.1 REST API (X-Api-Key / X-Auth-Token headers).
        return (
            "https://test.instamojo.com/api/1.1"
            if self.instamojo_test_mode
            else "https://www.instamojo.com/api/1.1"
        )

    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
