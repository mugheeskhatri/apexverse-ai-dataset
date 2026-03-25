from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import auth, billing, projects, dashboard, analytics, team, settings, notifications, public
from app.config import settings as cfg, ALLOWED_ORIGINS
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Apexverse API...")
    logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Apexverse API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if cfg.DEBUG else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/auth",          tags=["Auth"])
app.include_router(billing.router,       prefix="/billing",       tags=["Billing"])
app.include_router(projects.router,      prefix="/projects",      tags=["Projects"])
app.include_router(dashboard.router,     prefix="/dashboard",     tags=["Dashboard"])
app.include_router(analytics.router,     prefix="/analytics",     tags=["Analytics"])
app.include_router(team.router,          prefix="/team",          tags=["Team"])
app.include_router(settings.router,      prefix="/settings",      tags=["Settings"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(public.router,        prefix="/public",        tags=["Public"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "apexverse-api"}
