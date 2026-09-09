# ADR-0004: FastAPI REST API with Pydantic contracts

- Status: Accepted

## Context

The backend is a Python service and needs a clear API boundary with validation, typed responses, and interactive documentation. The codebase defines route handlers, request/response models, and OpenAPI-enabled application metadata in a single framework choice.

## Decision

We will build the backend as a FastAPI service and use Pydantic models to define API contracts and validation rules.

## Consequences

- REST endpoints are easy to expose and document through OpenAPI.
- Request and response validation happens close to the boundary.
- API clients receive strongly typed payloads and consistent error contracts.
- The codebase is tightly coupled to FastAPI and Pydantic conventions for its API behavior.

## Evidence from code

- [api/app/main.py](../../api/app/main.py) creates a `FastAPI` instance with `title`, `description`, `version`, and `lifespan` configuration.
- [api/app/routes/users.py](../../api/app/routes/users.py) exposes route handlers under the `/api/v1/users` prefix and uses `response_model=UserResponse`.
- [api/app/schemas.py](../../api/app/schemas.py) defines `UserResponse`, `HealthResponse`, `ErrorResponse`, `TokenResponse`, and related models using Pydantic.
- [api/app/main.py](../../api/app/main.py) adds `CORSMiddleware` and `TrustedHostMiddleware`, showing an explicit HTTP boundary design.
- The API docs and schema endpoints are exposed through `/docs` and `/openapi.json` in the root endpoint in [api/app/main.py](../../api/app/main.py).
