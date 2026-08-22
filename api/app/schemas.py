from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    """User creation schema."""
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    roles: List[str] = []
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Authentication response."""
    access_token: str
    token_type: str
    user: UserResponse


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    database: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str
    status_code: int
    timestamp: datetime


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RoleCreate(BaseModel):
    """Role creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class RoleResponse(BaseModel):
    """Role response schema."""
    id: str
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None


class PermissionCreate(BaseModel):
    """Permission creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    resource: str


class PermissionResponse(BaseModel):
    """Permission response schema."""
    id: str
    name: str
    description: Optional[str] = None
    resource: str
    created_at: Optional[datetime] = None
