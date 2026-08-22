from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import db_client
from app.routes import users, health

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    logger.info(f"Starting Sextant API in {settings.ENVIRONMENT} mode")
    try:
        # Initialize database connection
        db_client.db
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Sextant API")
    db_client.close()


# Create FastAPI application
app = FastAPI(
    title="Sextant API",
    description="Secure API with OIDC authentication using Keycloak",
    version="1.0.0",
    lifespan=lifespan,
)

# Add middleware
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost"]
)

# Include routers
app.include_router(health.router)
app.include_router(users.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Sextant API",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


@app.get("/version")
async def version():
    """Get API version."""
    return {
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
