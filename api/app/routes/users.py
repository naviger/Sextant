from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime
from app.core.security import User, get_current_active_user
from app.schemas import (
    UserAccountProfileResponse,
    UserAccountProfileUpdate,
    UserActivityEventCreate,
    UserActivityEventResponse,
    UserActivitySearchResponse,
    UserResponse,
)
from app.core.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def _utc_now_iso() -> str:
    return datetime.utcnow().isoformat()


def _get_or_create_collection(db, name: str):
    # python-arango returns a collection handle even when the collection does not exist.
    # Check existence explicitly so first-use requests can create missing collections.
    if hasattr(db, "has_collection") and not db.has_collection(name):
        if hasattr(db, "create_collection"):
            db.create_collection(name)
        else:
            raise RuntimeError(f"Database cannot create missing collection: {name}")
    return db.collection(name)


def _to_account_response(current_user: User, user_doc: dict) -> UserAccountProfileResponse:
    return UserAccountProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        first_name=user_doc.get("first_name") or current_user.first_name,
        last_name=user_doc.get("last_name") or current_user.last_name,
        display_name=user_doc.get("display_name"),
        job_title=user_doc.get("job_title"),
        department=user_doc.get("department"),
        timezone=user_doc.get("timezone"),
        phone=user_doc.get("phone"),
        bio=user_doc.get("bio"),
        avatar_data_url=user_doc.get("avatar_data_url"),
        roles=current_user.roles,
        keycloak_subject=current_user.id,
        keycloak_issuer=f"{settings.KEYCLOAK_PUBLIC_URL}/realms/{settings.KEYCLOAK_REALM}",
        keycloak_account_url=f"{settings.KEYCLOAK_PUBLIC_URL}/realms/{settings.KEYCLOAK_REALM}/account",
        created_at=user_doc.get("created_at"),
        updated_at=user_doc.get("updated_at"),
    )


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
            detail=str(e),
        )


@router.get("/me/account", response_model=UserAccountProfileResponse)
async def get_account_profile(
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserAccountProfileResponse:
    """Get merged account settings (Keycloak read-only identity + local editable profile)."""
    try:
        users_collection = _get_or_create_collection(db, "users")
        user_id = current_user.id

        if not users_collection.has(user_id):
            users_collection.insert(
                {
                    "_key": user_id,
                    "username": current_user.username,
                    "email": current_user.email,
                    "first_name": current_user.first_name,
                    "last_name": current_user.last_name,
                    "roles": current_user.roles,
                    "is_active": True,
                    "created_at": _utc_now_iso(),
                    "updated_at": _utc_now_iso(),
                }
            )

        user_doc = users_collection.get(user_id)
        return _to_account_response(current_user, user_doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.put("/me/account", response_model=UserAccountProfileResponse)
async def update_account_profile(
    updates: UserAccountProfileUpdate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserAccountProfileResponse:
    """Update user-editable account settings in Sextant profile storage."""
    try:
        users_collection = _get_or_create_collection(db, "users")
        user_id = current_user.id

        if not users_collection.has(user_id):
            users_collection.insert(
                {
                    "_key": user_id,
                    "username": current_user.username,
                    "email": current_user.email,
                    "first_name": current_user.first_name,
                    "last_name": current_user.last_name,
                    "roles": current_user.roles,
                    "is_active": True,
                    "created_at": _utc_now_iso(),
                    "updated_at": _utc_now_iso(),
                }
            )

        payload = updates.model_dump(exclude_unset=True)
        if "avatar_data_url" in payload and payload["avatar_data_url"] is not None:
            avatar_data_url = payload["avatar_data_url"]
            if len(avatar_data_url) > 600_000:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Avatar payload is too large. Please upload a smaller image.",
                )

        payload["updated_at"] = _utc_now_iso()
        users_collection.update({"_key": user_id, **payload})
        updated_doc = users_collection.get(user_id)
        return _to_account_response(current_user, updated_doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/me/events", response_model=UserActivityEventResponse)
async def create_user_event(
    event: UserActivityEventCreate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserActivityEventResponse:
    """Record explicit client-side user action events."""
    try:
        activity_collection = _get_or_create_collection(db, "user_activity")
        created_at = datetime.utcnow()
        event_key = f"{current_user.id}-{int(created_at.timestamp() * 1000)}"
        event_doc = {
            "_key": event_key,
            "user_id": current_user.id,
            "username": current_user.username,
            "action": event.action,
            "target": event.target,
            "source": "client",
            "metadata": event.metadata or {},
            "created_at": created_at.isoformat(),
        }
        activity_collection.insert(event_doc)

        return UserActivityEventResponse(
            id=event_doc["_key"],
            user_id=event_doc["user_id"],
            username=event_doc.get("username"),
            action=event_doc["action"],
            target=event_doc.get("target"),
            source=event_doc["source"],
            metadata=event_doc.get("metadata", {}),
            created_at=created_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/me/history", response_model=UserActivitySearchResponse)
async def get_user_history(
    q: str = Query(default="", max_length=120),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UserActivitySearchResponse:
    """Search user activity history by action, path, method, target, or metadata text."""
    try:
        activity_collection = _get_or_create_collection(db, "user_activity")
        query_text = q.strip().lower()

        def matches(doc: dict) -> bool:
            if doc.get("user_id") != current_user.id:
                return False
            if not query_text:
                return True

            haystack = " ".join(
                [
                    str(doc.get("action", "")),
                    str(doc.get("path", "")),
                    str(doc.get("method", "")),
                    str(doc.get("target", "")),
                    str(doc.get("status_code", "")),
                    str(doc.get("metadata", "")),
                ]
            ).lower()
            return query_text in haystack

        all_docs = list(activity_collection.all())
        matched = [doc for doc in all_docs if matches(doc)]
        matched.sort(key=lambda item: item.get("created_at", ""), reverse=True)

        page = matched[offset : offset + limit]
        items = [
            UserActivityEventResponse(
                id=doc.get("_key", ""),
                user_id=doc.get("user_id", ""),
                username=doc.get("username"),
                action=doc.get("action", "unknown"),
                target=doc.get("target"),
                method=doc.get("method"),
                path=doc.get("path"),
                status_code=doc.get("status_code"),
                duration_ms=doc.get("duration_ms"),
                ip_address=doc.get("ip_address"),
                user_agent=doc.get("user_agent"),
                source=doc.get("source", "server"),
                metadata=doc.get("metadata", {}),
                created_at=datetime.fromisoformat(doc.get("created_at")),
            )
            for doc in page
            if doc.get("created_at")
        ]

        return UserActivitySearchResponse(total=len(matched), items=items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
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
