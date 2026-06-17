from typing import Set

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenAPI docs
    OPENAPI_URL: str = "/openapi.json"

    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None
    EXPIRE_ON_COMMIT: bool = False

    # User
    ACCESS_SECRET_KEY: str
    RESET_PASSWORD_SECRET_KEY: str
    VERIFICATION_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 3600

    # Email
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None
    MAIL_FROM: str | None = None
    MAIL_SERVER: str | None = None
    MAIL_PORT: int | None = None
    MAIL_FROM_NAME: str = "FastAPI template"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    TEMPLATE_DIR: str = "email_templates"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    CORS_ORIGINS: Set[str]

    # Auth / security tunables
    PREAUTH_SECRET_KEY: str = "change-me-preauth-secret"
    PREAUTH_TOKEN_EXPIRE_SECONDS: int = 300  # 5 min window to complete 2FA
    EMAIL_CODE_EXPIRE_SECONDS: int = 600  # 10 min for the 6-digit email code
    TOTP_ISSUER: str = "FlashBook"
    AUTH_RATE_LIMIT: str = "10/minute"  # slowapi limit on sensitive auth endpoints

    # Clerk (identity provider). The issuer/JWKS is derived from the publishable key.
    CLERK_PUBLISHABLE_KEY: str | None = None
    CLERK_SECRET_KEY: str | None = None
    CLERK_JWT_ISSUER: str | None = None  # optional explicit override

    # Stripe (test mode in Phase 1: card-on-file + deposit)
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    # Twilio (SMS)
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None
    TWILIO_MESSAGING_SERVICE_SID: str | None = None

    # Object storage (Cloudflare R2 / S3-compatible)
    STORAGE_ENDPOINT_URL: str | None = None
    STORAGE_REGION: str = "auto"
    STORAGE_ACCESS_KEY_ID: str | None = None
    STORAGE_SECRET_ACCESS_KEY: str | None = None
    STORAGE_BUCKET: str | None = None
    STORAGE_PUBLIC_BASE_URL: str | None = None  # CDN/public bucket base for image URLs

    # Local-filesystem media (dev fallback when object storage isn't configured)
    MEDIA_BASE_URL: str = "http://localhost:8000/media"
    MEDIA_DIR: str = "shared-data/uploads"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
