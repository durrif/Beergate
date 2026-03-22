# backend/app/main.py
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import engine
from app.core.redis import close_redis_pool
from app.models.base import Base
from app.api.v1 import auth as auth_router
from app.api.v1 import inventory as inventory_router
from app.api.v1 import purchases as purchases_router
from app.api.v1 import ai as ai_router
from app.api.v1 import voice as voice_router
from app.api.v1 import recipes as recipes_router
from app.api.v1 import brewing as brewing_router
from app.api.v1 import fermentation as fermentation_router
from app.api.v1 import prices as prices_router
from app.api.v1 import water as water_router

logger = logging.getLogger(__name__)

# ─── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ─── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting Beergate v2 API — %s", settings.ENVIRONMENT)
    # Create tables if they don't exist (Alembic handles production migrations)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Development: tables synced via SQLAlchemy")
    yield
    await close_redis_pool()
    await engine.dispose()
    logger.info("Beergate v2 API shut down")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Beergate API",
    version=settings.APP_VERSION,
    description="Craft Brewery Management System — v2",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ─── CORS ─────────────────────────────────────────────────────────────────────
# NEVER wildcard in production — origins come from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Accept-Language"],
)


# ─── Request logging middleware ───────────────────────────────────────────────
import time
from starlette.middleware.base import BaseHTTPMiddleware

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        # Skip health/docs endpoints to reduce noise
        path = request.url.path
        if not path.startswith(("/api/health", "/api/docs", "/api/redoc", "/openapi.json")):
            logger.info(
                "%s %s → %d (%.0fms)",
                request.method,
                path,
                response.status_code,
                duration_ms,
            )
        return response

app.add_middleware(RequestLoggingMiddleware)


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(inventory_router.router, prefix="/api/v1")
app.include_router(purchases_router.router, prefix="/api/v1")
app.include_router(ai_router.router, prefix="/api/v1")
app.include_router(voice_router.router, prefix="/api/v1")
app.include_router(recipes_router.router, prefix="/api/v1")
app.include_router(brewing_router.router, prefix="/api/v1")
app.include_router(fermentation_router.router, prefix="/api/v1")
app.include_router(prices_router.router, prefix="/api/v1")
app.include_router(water_router.router, prefix="/api/v1")


# ─── Health & Version endpoints ───────────────────────────────────────────────
@app.get("/api/health", tags=["system"])
async def health_check() -> dict:
    return {"status": "ok", "service": "beergate-api", "version": settings.APP_VERSION}


@app.get("/api/version", tags=["system"])
async def version() -> dict:
    return {
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# ─── 404 handler ─────────────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Endpoint not found"},
    )


# ─── Unhandled exception handler (prevents stack trace leaks) ─────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
