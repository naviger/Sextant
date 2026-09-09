# Repository Inventory

This document inventories the repository as it exists in code and configuration. It covers the major projects, packages, namespaces, services, and public APIs, with responsibility, dependencies, ownership, and related components.

## Ownership status

Ownership is not explicitly declared in source code, repository metadata, or deployment configuration for most components. Where no owner is discoverable, this document records `Unknown / not declared in repository`.

---

## 1. Repository-level projects and workspaces

### 1.1 Sextant application root

- Type: Project / monorepo root
- Responsibility: Top-level orchestration and integration point for the full platform. Coordinates frontend, backend, infrastructure, docs, scripts, and deployment.
- Dependencies: Docker Compose, GitHub Actions, docs, app, api, infra, scripts
- Owners: Unknown / not declared in repository
- Related components:
  - [docker-compose.yml](../../docker-compose.yml)
  - [docker-compose.prod.yml](../../docker-compose.prod.yml)
  - [app](../../app)
  - [api](../../api)
  - [infra](../../infra)
  - [docs](../)
  - [scripts](../../scripts)

### 1.2 Frontend application

- Type: Project / package
- Responsibility: Browser-based user experience for authentication, protected pages, and strategic dashboard views.
- Path: [app](../../app)
- Dependencies:
  - React 18
  - Vite
  - React Router
  - Keycloak JS
  - Axios
  - TanStack Query
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/App.tsx](../../app/src/App.tsx)
  - [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
  - [app/src/pages](../../app/src/pages)
  - [app/src/services](../../app/src/services)

### 1.3 Backend API

- Type: Project / package
- Responsibility: FastAPI service for API exposure, auth validation, route handling, health checks, and database access.
- Path: [api](../../api)
- Dependencies:
  - FastAPI
  - Pydantic / Pydantic settings
  - Python-Jose
  - Python Arango
  - Keycloak and OIDC configuration
  - ArangoDB
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/main.py](../../api/app/main.py)
  - [api/app/routes](../../api/app/routes)
  - [api/app/core](../../api/app/core)
  - [api/app/services](../../api/app/services)

### 1.4 Infrastructure layer

- Type: Deployment / runtime platform
- Responsibility: Infrastructure provisioning and local service topology for identity, database, API, frontend, email, and AI services.
- Path: [infra](../../infra)
- Dependencies: Docker Compose, custom Dockerfiles, realm configuration, nginx config
- Owners: Unknown / not declared in repository
- Related components:
  - [docker-compose.yml](../../docker-compose.yml)
  - [infra/keycloak](../../infra/keycloak)
  - [infra/arangodb](../../infra/arangodb)
  - [infra/nginx](../../infra/nginx)

---

## 2. Runtime services

### 2.1 Keycloak identity provider

- Type: Service
- Responsibility: OIDC/OAuth2 identity provider for user login, token issuance, realm configuration, and role claims.
- Runtime: Docker service in [docker-compose.yml](../../docker-compose.yml)
- Dependencies:
  - PostgreSQL for persistence
  - Keycloak realm configuration file
  - Browser clients using PKCE
- Owners: Unknown / not declared in repository
- Related components:
  - [infra/keycloak/realm-config.json](../../infra/keycloak/realm-config.json)
  - [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
  - [api/app/core/security.py](../../api/app/core/security.py)

### 2.2 PostgreSQL for Keycloak

- Type: Service / datastore
- Responsibility: Stores Keycloak realm data and identity metadata.
- Runtime: `postgres` in [docker-compose.yml](../../docker-compose.yml)
- Dependencies: Keycloak service
- Owners: Unknown / not declared in repository
- Related components:
  - [docker-compose.yml](../../docker-compose.yml)
  - [infra/keycloak/realm-config.json](../../infra/keycloak/realm-config.json)

### 2.3 ArangoDB

- Type: Service / datastore
- Responsibility: Main application database for persisted business and user information, graph-oriented storage, and future strategy-domain entities.
- Runtime: `arangodb` in [docker-compose.yml](../../docker-compose.yml)
- Dependencies:
  - Python Arango client in backend
  - Application database bootstrap logic
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/core/database.py](../../api/app/core/database.py)
  - [api/app/routes/users.py](../../api/app/routes/users.py)
  - [api/app/routes/health.py](../../api/app/routes/health.py)

### 2.4 FastAPI backend service

- Type: Service / API
- Responsibility: Hosts the HTTP API, configures middleware, manages startup/shutdown lifecycle, and wires routes and dependencies.
- Runtime: `api` in [docker-compose.yml](../../docker-compose.yml)
- Dependencies:
  - ArangoDB
  - Keycloak
  - Python app configuration
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/main.py](../../api/app/main.py)
  - [api/app/core/config.py](../../api/app/core/config.py)
  - [api/app/routes](../../api/app/routes)

### 2.5 React frontend service

- Type: Service / web app
- Responsibility: Serves the SPA and provides identity-aware access to the API.
- Runtime: `app` in [docker-compose.yml](../../docker-compose.yml)
- Dependencies:
  - API service
  - Keycloak identity provider
  - Browser router and auth context
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/App.tsx](../../app/src/App.tsx)
  - [app/src/pages](../../app/src/pages)
  - [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)

### 2.6 MailHog

- Type: Service / development utility
- Responsibility: Captures outbound email for development and testing flows.
- Runtime: `mailhog` in [docker-compose.yml](../../docker-compose.yml)
- Dependencies: None beyond Docker network and mail configuration
- Owners: Unknown / not declared in repository
- Related components:
  - [docker-compose.yml](../../docker-compose.yml)

### 2.7 Ollama AI service

- Type: Service / external AI provider
- Responsibility: Provides local LLM inference and model registry functionality.
- Runtime: `ollama` in [docker-compose.yml](../../docker-compose.yml)
- Dependencies:
  - HTTP API to `localhost:11434`
  - Backend client layer
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py)
  - [api/app/routes/llm_endpoints.py](../../api/app/routes/llm_endpoints.py)

---

## 3. Backend modules and packages

### 3.1 `app.core`

- Type: Namespace / Python package
- Responsibility: Shared application configuration, database abstraction, and auth/security operations.
- Path: [api/app/core](../../api/app/core)
- Dependencies:
  - Pydantic settings
  - Python Arango
  - FastAPI security primitives
  - Keycloak JWKS and JWT validation
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/core/config.py](../../api/app/core/config.py)
  - [api/app/core/database.py](../../api/app/core/database.py)
  - [api/app/core/security.py](../../api/app/core/security.py)

### 3.2 `app.routes`

- Type: Namespace / Python package
- Responsibility: Declares HTTP route modules and their handlers.
- Path: [api/app/routes](../../api/app/routes)
- Dependencies:
  - FastAPI routers
  - Dependency injection from core utilities
  - Database and auth modules
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/routes/health.py](../../api/app/routes/health.py)
  - [api/app/routes/users.py](../../api/app/routes/users.py)
  - [api/app/routes/llm_endpoints.py](../../api/app/routes/llm_endpoints.py)

### 3.3 `app.services`

- Type: Namespace / Python package
- Responsibility: Integration service clients and reusable business-facing adapters.
- Path: [api/app/services](../../api/app/services)
- Dependencies:
  - Requests and aiohttp for HTTP integration
  - Environment configuration
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py)

### 3.4 `app.schemas`

- Type: Module
- Responsibility: Request and response schemas for API data validation and serialization.
- Path: [api/app/schemas.py](../../api/app/schemas.py)
- Dependencies:
  - Pydantic BaseModel
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/routes/users.py](../../api/app/routes/users.py)
  - [api/app/routes/health.py](../../api/app/routes/health.py)

### 3.5 `app.main`

- Type: Module / application bootstrap
- Responsibility: Initializes the FastAPI app, middleware, router registration, and startup/shutdown hooks.
- Path: [api/app/main.py](../../api/app/main.py)
- Dependencies:
  - `app.core.config`
  - `app.core.database`
  - `app.routes.users`
  - `app.routes.health`
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/core](../../api/app/core)
  - [api/app/routes](../../api/app/routes)

---

## 4. Frontend modules and namespaces

### 4.1 `App` root

- Type: Module / React composition root
- Responsibility: Declares top-level routing and wraps the app in auth context.
- Path: [app/src/App.tsx](../../app/src/App.tsx)
- Dependencies:
  - `react-router-dom`
  - `AuthProvider`
  - `ProtectedRoute`
  - Page modules
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
  - [app/src/components/ProtectedRoute.tsx](../../app/src/components/ProtectedRoute.tsx)

### 4.2 `context.AuthContext`

- Type: Namespace / React context module
- Responsibility: Centralizes auth state and exposes login/logout and token access to the application.
- Path: [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
- Dependencies:
  - Keycloak service functions
  - React context API
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
  - [app/src/components/ProtectedRoute.tsx](../../app/src/components/ProtectedRoute.tsx)

### 4.3 `components`

- Type: Namespace / package
- Responsibility: Reusable UI components used to control auth flows and protect routes.
- Path: [app/src/components](../../app/src/components)
- Dependencies:
  - React
  - Auth context
  - react-router-dom
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/components/LoginButton.tsx](../../app/src/components/LoginButton.tsx)
  - [app/src/components/ProtectedRoute.tsx](../../app/src/components/ProtectedRoute.tsx)

### 4.4 `pages`

- Type: Namespace / package
- Responsibility: Screen-level application views.
- Path: [app/src/pages](../../app/src/pages)
- Dependencies:
  - Auth context and route integration
  - Shared component libraries and page state
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/pages/Home.tsx](../../app/src/pages/Home.tsx)
  - [app/src/pages/Login.tsx](../../app/src/pages/Login.tsx)
  - [app/src/pages/Profile.tsx](../../app/src/pages/Profile.tsx)
  - [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx)

### 4.5 `services.api`

- Type: Module / API client namespace
- Responsibility: Abstracts backend HTTP communication and injects bearer tokens.
- Path: [app/src/services/api.ts](../../app/src/services/api.ts)
- Dependencies:
  - Axios
  - Keycloak token accessors
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
  - [api/app/routes/users.py](../../api/app/routes/users.py)

### 4.6 `services.keycloak`

- Type: Module / identity client namespace
- Responsibility: Initializes and manages the Keycloak browser client, login, logout, refresh, and user claim extraction.
- Path: [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
- Dependencies:
  - `keycloak-js`
  - Browser environment variables
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
  - [app/src/services/api.ts](../../app/src/services/api.ts)

### 4.7 `types`

- Type: Module / type namespace
- Responsibility: Shared TypeScript interfaces for user identity and auth context.
- Path: [app/src/types/index.ts](../../app/src/types/index.ts)
- Dependencies: None beyond TypeScript
- Owners: Unknown / not declared in repository
- Related components:
  - [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)

---

## 5. Public APIs in the repository

### 5.1 Frontend-to-backend API boundary

- Type: API contract
- Responsibility: Backend request surface consumed by the browser app.
- Public endpoints:
  - `GET /health`
  - `GET /health/ready`
  - `GET /health/live`
  - `GET /api/v1/users/me`
  - `GET /api/v1/users/{user_id}`
  - `PUT /api/v1/users/{user_id}`
- Dependencies:
  - [app/src/services/api.ts](../../app/src/services/api.ts)
  - [api/app/routes](../../api/app/routes)
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/main.py](../../api/app/main.py)
  - [app/src/services/api.ts](../../app/src/services/api.ts)

### 5.2 Health API

- Type: API
- Responsibility: Readiness, liveness, and database status checks.
- Path: [api/app/routes/health.py](../../api/app/routes/health.py)
- Endpoints:
  - `GET /health`
  - `GET /health/ready`
  - `GET /health/live`
- Dependencies:
  - `get_db()`
  - `HealthResponse`
- Owners: Unknown / not declared in repository
- Related components:
  - [docker-compose.yml](../../docker-compose.yml)

### 5.3 User API

- Type: API
- Responsibility: Reads the current user, fetches user details, and updates user profile fields in a constrained manner.
- Path: [api/app/routes/users.py](../../api/app/routes/users.py)
- Endpoints:
  - `GET /api/v1/users/me`
  - `GET /api/v1/users/{user_id}`
  - `PUT /api/v1/users/{user_id}`
- Dependencies:
  - `get_current_active_user`
  - `get_db()`
  - `UserResponse`
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/core/security.py](../../api/app/core/security.py)
  - [api/app/schemas.py](../../api/app/schemas.py)

### 5.4 LLM API surface (implemented but not yet mounted in main app)

- Type: API
- Responsibility: Demonstrates Ollama-backed generation, model listing, summarization, question answering, and classification.
- Path: [api/app/routes/llm_endpoints.py](../../api/app/routes/llm_endpoints.py)
- Endpoints:
  - `POST /api/v1/llm/generate`
  - `GET /api/v1/llm/models`
  - `GET /api/v1/llm/health`
  - `POST /api/v1/llm/summarize`
  - `POST /api/v1/llm/qa`
  - `POST /api/v1/llm/classify`
- Dependencies:
  - `AsyncOllamaClient`
  - `OllamaModel`
- Owners: Unknown / not declared in repository
- Related components:
  - [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py)
  - [docker-compose.yml](../../docker-compose.yml)

---

## 6. Supporting infrastructure and operational utilities

### 6.1 Documentation project

- Type: Project / knowledge base
- Responsibility: Product requirements, architecture decisions, design language, domain model, and system documentation.
- Path: [docs](../)
- Dependencies: Product intent, code evidence, architecture docs, design docs
- Owners: Unknown / not declared in repository
- Related components:
  - [docs/design-language](../design-language)
  - [docs/architecture](./)
  - [docs/domain](../domain)
  - [docs/adr](../adr)

### 6.2 Scripts

- Type: Utility package
- Responsibility: Start, stop, restart, and inspect the local environment.
- Path: [scripts](../../scripts)
- Dependencies: Docker Compose
- Owners: Unknown / not declared in repository
- Related components:
  - [scripts/start.sh](../../scripts/start.sh)
  - [scripts/restart.sh](../../scripts/restart.sh)
  - [scripts/stop.sh](../../scripts/stop.sh)

---

## 7. Cross-cutting concerns and relationship map

### Identity and access

- Frontend identity entry point: [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
- Auth state holder: [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
- Protected routes: [app/src/components/ProtectedRoute.tsx](../../app/src/components/ProtectedRoute.tsx)
- Backend validation: [api/app/core/security.py](../../api/app/core/security.py)
- API consumption: [app/src/services/api.ts](../../app/src/services/api.ts)

### Persistence and data access

- Data layer bootstrap: [api/app/core/database.py](../../api/app/core/database.py)
- Route access: [api/app/routes/users.py](../../api/app/routes/users.py)
- Health verification: [api/app/routes/health.py](../../api/app/routes/health.py)
- Physical datastore: ArangoDB in [docker-compose.yml](../../docker-compose.yml)

### Intelligence and AI

- AI service runtime: Ollama in [docker-compose.yml](../../docker-compose.yml)
- Integration client: [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py)
- Route layer: [api/app/routes/llm_endpoints.py](../../api/app/routes/llm_endpoints.py)

### Product experience

- App shell: [app/src/App.tsx](../../app/src/App.tsx)
- Strategic dashboard: [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx)
- Auth UI: [app/src/components/LoginButton.tsx](../../app/src/components/LoginButton.tsx)

---

## 8. Inventory summary

The repository is organized into four main layers:

1. Client layer: React + TypeScript frontend in [app](../../app)
2. API layer: FastAPI backend in [api](../../api)
3. Data and identity layer: ArangoDB and Keycloak in [docker-compose.yml](../../docker-compose.yml)
4. Platform and deployment layer: Docker, networking, and scripts under [infra](../../infra) and [scripts](../../scripts)

The most important architectural relationships are:

- Frontend authenticates via Keycloak and obtains JWTs.
- Frontend calls the FastAPI API with bearer tokens.
- FastAPI validates tokens through Keycloak/JWKS-based security logic.
- FastAPI routes read and write to ArangoDB.
- Ollama is integrated as a separate LLM service layer for future AI-assisted features.

This repository is a working platform foundation with a strong product strategy narrative, and the implemented code primarily reflects identity, routing, API exposure, data access, and infrastructure orchestration rather than a complete end-to-end business domain model.
