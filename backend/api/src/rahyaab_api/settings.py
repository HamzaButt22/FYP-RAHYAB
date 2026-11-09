"""Configuration from environment variables (twelve-factor). Secrets never have defaults."""

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Fail closed: if APP_ENV is missing, production rules apply (a strong JWT key is required, docs are off).
    app_env: str = Field(default="production", pattern="^(development|test|staging|production)$")
    debug: bool = False
    database_url: str = ""  # required; there is no built-in default with a password
    # Exact origins only (SECURITY.md §5.1): never "*", never reflected.
    cors_allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )
    access_token_minutes: int = Field(default=15, ge=5, le=60)
    jwt_signing_key: str = ""  # required outside development and test; checked at start-up
    data_key_wrapper_file: str = "/run/secrets/data_key_wrapper"

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, v: object) -> object:
        # CORS_ALLOWED_ORIGINS="https://a.pk,https://b.pk" in the environment
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    def validate_for_runtime(self) -> None:
        if not self.database_url and self.app_env != "test":
            raise ValueError("DATABASE_URL must be set")
        if self.app_env in ("staging", "production"):
            if self.debug:
                raise ValueError("DEBUG must be false in staging and production")
            if len(self.jwt_signing_key) < 32:
                raise ValueError("JWT_SIGNING_KEY must be set (at least 32 characters)")
            if any(o == "*" or not o.startswith("https://") for o in self.cors_allowed_origins):
                raise ValueError("CORS_ALLOWED_ORIGINS must be exact https origins")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_for_runtime()
    return settings
