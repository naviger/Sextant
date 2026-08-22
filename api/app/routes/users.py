from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.core.security import User, get_current_active_user
from app.schemas import UserResponse
from app.core.database import get_db

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get current user profile."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        roles=current_user.roles,
        is_active=current_user.is_active,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get user by ID."""
    try:
        users_collection = db.collection("users")
        
        # Check if document exists
        if not users_collection.has(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_doc = users_collection.get(user_id)
        
        return UserResponse(
            id=user_doc["_key"],
            username=user_doc.get("username"),
            email=user_doc.get("email"),
            first_name=user_doc.get("first_name"),
            last_name=user_doc.get("last_name"),
            roles=user_doc.get("roles", []),
            is_active=user_doc.get("is_active", True),
            created_at=user_doc.get("created_at"),
            updated_at=user_doc.get("updated_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    updates: dict,
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Update user profile."""
    # Users can only update their own profile unless they have admin role
    if current_user.id != user_id and "admin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other users' profiles"
        )
    
    try:
        users_collection = db.collection("users")
        
        if not users_collection.has(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update only allowed fields
        allowed_fields = {"first_name", "last_name"}
        update_data = {k: v for k, v in updates.items() if k in allowed_fields}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        users_collection.update({"_key": user_id, **update_data})
        
        updated_doc = users_collection.get(user_id)
        
        return UserResponse(
            id=updated_doc["_key"],
            username=updated_doc.get("username"),
            email=updated_doc.get("email"),
            first_name=updated_doc.get("first_name"),
            last_name=updated_doc.get("last_name"),
            roles=updated_doc.get("roles", []),
            is_active=updated_doc.get("is_active", True),
            created_at=updated_doc.get("created_at"),
            updated_at=updated_doc.get("updated_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
