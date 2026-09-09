# Security Layer

## Purpose

The security layer is the backend authorization boundary. It validates JWT tokens, extracts claims, maps them to `User` objects, and enforces role checks when handlers require restricted access.

## Public API

- `TokenData`
- `User`
- `get_jwks()`
- `decode_token(token)`
- `get_current_user()`
- `get_current_active_user()`
- `check_permission(required_role)`
- `create_access_token(data, expires_delta?)`

## Dependencies

- `jose.jwt` and `JWTError`
- FastAPI `Depends`, `HTTPException`, `status`
- `HTTPBearer` authentication scheme
- `httpx` for Keycloak JWKS fetch
- `app.core.config.settings`

## Consumers

- User API routes call `get_current_active_user` and permission checks
- Any future protected endpoint can call the same dependency chain

## Integration Points

- Validates bearer tokens from the frontend
- Fetches JWKS from the configured Keycloak realm
- Extracts roles and identity fields including `preferred_username`, `email`, and `sub`
- Enforces RBAC via role checks

## Source Code Evidence

- [api/app/core/security.py](../../api/app/core/security.py)
- [api/app/routes/users.py](../../api/app/routes/users.py)
