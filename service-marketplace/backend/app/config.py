"""Application settings (env-overridable)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Service Marketplace API"
    database_url: str = "sqlite:///./marketplace.db"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # CORS (the Next.js dev server)
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Seeded admin
    admin_email: str = "admin@market.com"
    admin_password: str = "admin1234"


settings = Settings()
