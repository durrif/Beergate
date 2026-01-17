from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Sistema de gestión de inventario cervecero",
    version="0.1.0",
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
