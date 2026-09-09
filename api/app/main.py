from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import db_client
from app.core.security import decode_token
from app.routes import users, health, administration

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
        if settings.ENVIRONMENT == "production":
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


@app.middleware("http")
async def activity_logging_middleware(request: Request, call_next):
    """Record authenticated API actions for user history and telemetry."""
    started_at = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

    path = request.url.path
    if path.startswith("/health"):
        return response

    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return response

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return response

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        username = payload.get("preferred_username", user_id)
        if not user_id:
            return response

        db = db_client.db
        try:
            activity_collection = db.collection("user_activity")
        except Exception:
            if hasattr(db, "create_collection"):
                db.create_collection("user_activity")
                activity_collection = db.collection("user_activity")
            else:
                return response

        created_at = datetime.utcnow().isoformat()
        event_key = f"{user_id}-{int(time.time() * 1000)}"
        activity_collection.insert(
            {
                "_key": event_key,
                "user_id": user_id,
                "username": username,
                "action": f"{request.method} {path}",
                "method": request.method,
                "path": path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "ip_address": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "source": "server",
                "metadata": {
                    "query": dict(request.query_params),
                },
                "created_at": created_at,
            }
        )
    except Exception as exc:
        logger.debug("User activity logging skipped: %s", exc)

    return response

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
    allowed_hosts=["localhost", "127.0.0.1", "testserver", "*.localhost", "0.0.0.0", "[::1]"]
)

# Include routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(administration.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Sextant API",
        "version": "1.0.0",
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
