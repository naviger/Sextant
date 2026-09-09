# FastAPI Application

## Purpose

The FastAPI app is the backend entry point. It configures middleware, lifecycle hooks, API routing, root metadata, and startup/shutdown behavior.

## Public API

- Root route: `/`
- Version route: `/version`
- OpenAPI endpoints: `/docs`, `/openapi.json`
- Included routers:
  - `health.router`
  - `users.router`

## Dependencies

- FastAPI
- `CORSMiddleware`
- `TrustedHostMiddleware`
- `db_client` from the database layer
- App configuration settings from `app.core.config`

## Consumers

- Browser clients via HTTP requests
- Health and user route modules
- Monitoring and runtime platform checks

## Integration Points

- Starts a database connection during application lifecycle
- Exposes CORS and trusted-host restrictions
- Registers route modules for health and user endpoints
- Uses environment-configured runtime values

## Source Code Evidence

- [api/app/main.py](../../api/app/main.py)
- [api/app/core/config.py](../../api/app/core/config.py)
- [api/app/core/database.py](../../api/app/core/database.py)
