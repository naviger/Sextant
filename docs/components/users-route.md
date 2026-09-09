# Users Route

## Purpose

`users` is the application’s primary user-management API module. It supports reading the current user profile and reading/updating user records by ID with authentication and role checks.

## Public API

- `GET /api/v1/users/me`
- `GET /api/v1/users/{user_id}`
- `PUT /api/v1/users/{user_id}`

## Dependencies

- `get_current_active_user`
- `get_db()`
- `UserResponse` schema
- FastAPI `HTTPException` and `status`

## Consumers

- Frontend profile and auth flows via the API client
- Authorized users require the service to access user data

## Integration Points

- Pulls the current identity from the security layer
- Retrieves and updates document records from ArangoDB `users` collection
- Enforces access checks to prevent non-admin edits of other users

## Source Code Evidence

- [api/app/routes/users.py](../../api/app/routes/users.py)
- [api/app/schemas.py](../../api/app/schemas.py)
- [api/app/core/security.py](../../api/app/core/security.py)
