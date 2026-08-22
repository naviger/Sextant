from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from functools import lru_cache

from app.core.config import settings

security = HTTPBearer()


class TokenData(BaseModel):
    """Token data model."""
    sub: str
    username: str
    email: str
    roles: list[str] = []
    exp: datetime


class User(BaseModel):
    """User model."""
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    roles: list[str] = []
    is_active: bool = True


@lru_cache(maxsize=1)
async def get_jwks():
    """Fetch and cache JWKS from Keycloak."""
    try:
        async with httpx.AsyncClient() as client:
            jwks_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
            response = await client.get(jwks_url)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch JWKS from Keycloak"
        )


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT token from Keycloak."""
    try:
        # For development, use HS256. For production with Keycloak, use RS256
        if settings.DEBUG:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"]
            )
        else:
            # In production, fetch and use Keycloak's public key
            # This is a simplified version - in production, use RS256 with JWKS
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Get current authenticated user from token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    username: str = payload.get("preferred_username", payload.get("sub"))
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    email: str = payload.get("email", "")
    first_name: str = payload.get("given_name", "")
    last_name: str = payload.get("family_name", "")
    
    # Extract roles from token
    roles = payload.get("roles", [])
    if "resource_access" in payload and settings.KEYCLOAK_CLIENT_ID in payload["resource_access"]:
        resource_roles = payload["resource_access"][settings.KEYCLOAK_CLIENT_ID].get("roles", [])
        roles.extend(resource_roles)
    
    user = User(
        id=payload.get("sub"),
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        roles=list(set(roles)),
        is_active=True
    )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verify user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def check_permission(required_role: str):
    """Dependency to check if user has required role."""
    async def verify_role(current_user: User = Depends(get_current_active_user)):
        if required_role not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have required role: {required_role}"
            )
        return current_user
    return verify_role


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    
    if settings.DEBUG:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm="HS256"
        )
    else:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
    
    return encoded_jwt
