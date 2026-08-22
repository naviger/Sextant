from fastapi import APIRouter, Depends
from datetime import datetime
from app.schemas import HealthResponse
from app.core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db = Depends(get_db)) -> HealthResponse:
    """Health check endpoint."""
    try:
        # Try to access database
        db.properties()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return HealthResponse(
        status="ok",
        database=db_status,
        timestamp=datetime.utcnow()
    )


@router.get("/health/ready")
async def readiness_check():
    """Readiness check for Kubernetes."""
    return {"status": "ready"}


@router.get("/health/live")
async def liveness_check():
    """Liveness check for Kubernetes."""
    return {"status": "alive"}
