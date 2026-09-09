# ADR-0006: Dependency injection for database and auth access

- Status: Accepted

## Context

The backend exposes route functions that require access to the database and the current authenticated user. The codebase avoids direct object construction inside handlers and instead relies on dependency injection via FastAPI `Depends`.

This pattern appears both in database access and in access control logic, allowing centralization of common concerns.

## Decision

We will use FastAPI dependency injection patterns for database access, authentication, and role checks.

## Consequences

- Route handlers remain focused on application behavior instead of wiring infrastructure.
- Authentication and authorization logic can be reused across endpoints.
- Dependencies become explicit in the API surface and can be re-tested independently.
- The system depends on FastAPI’s dependency model and its lifecycle semantics.

## Evidence from code

- [api/app/core/database.py](../../api/app/core/database.py) exposes `get_db()`, which returns the shared ArangoDB connection.
- [api/app/routes/users.py](../../api/app/routes/users.py) injects `db = Depends(get_db)` and `current_user: User = Depends(get_current_active_user)` into handlers.
- [api/app/core/security.py](../../api/app/core/security.py) defines `get_current_user`, `get_current_active_user`, and `check_permission`, all designed to be used as dependencies.
- [api/app/routes/health.py](../../api/app/routes/health.py) uses `Depends(get_db)` for the health endpoint to ensure database availability is part of the contract.
