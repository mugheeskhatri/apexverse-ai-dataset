from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    SECRET_KEY: str = "CHANGE_ME"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://apexverse:apexverse@postgres:5432/apexverse"

    # Redis
    REDIS_URL: str = "redis://:password@redis:6379/0"

    # JWT
    JWT_SECRET: str = "CHANGE_ME_JWT_SECRET"
    JWT_REFRESH_SECRET: str = "CHANGE_ME_JWT_REFRESH_SECRET"
    JWT_ACCESS_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://api.apexverse.ai/auth/google/callback"

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_PRICE_STARTER_MONTHLY: str = ""
    STRIPE_PRICE_STARTER_ANNUAL: str = ""
    STRIPE_PRICE_GROWTH_MONTHLY: str = ""
    STRIPE_PRICE_GROWTH_ANNUAL: str = ""
    STRIPE_PRICE_PROFESSIONAL_MONTHLY: str = ""
    STRIPE_PRICE_PROFESSIONAL_ANNUAL: str = ""

    # Email
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = "billing@apexverse.ai"
    FROM_NAME: str = "Apexverse"

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "apexverse-files"
    AWS_REGION: str = "us-east-1"

    # Encryption
    ENCRYPTION_KEY: str = "CHANGE_ME_32_BYTE_HEX"

    # Scraper
    SCRAPER_SERVICE_URL: str = "http://scraper:8060"
    SCRAPER_WEBHOOK_SECRET: str = "CHANGE_ME"

    # URLs
    FRONTEND_URL: str = "https://apexverse.ai"
    BACKEND_URL: str = "https://api.apexverse.ai"

    # Plan config
    PLAN_QUOTAS: dict = {
        "starter":      {"pages": 1000,      "projects": 2},
        "growth":       {"pages": 10000,     "projects": 5},
        "professional": {"pages": 50000,     "projects": 20},
        "enterprise":   {"pages": 999999999, "projects": 999999},
    }

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# CORS origins — plain list so FastAPI middleware reads it correctly at startup
ALLOWED_ORIGINS: List[str] = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
