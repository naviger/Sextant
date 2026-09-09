# Integration Map

## Overview

This integration map captures the concrete connections and runtime contracts between the platform services in the repository.

## Network topology

```mermaid
flowchart LR
    subgraph Host[Docker Network: sextant-network]
        FE[Frontend\napp:3000]
        API[Backend\napi:8000]
        KC[Keycloak\n8080]
        PG[(PostgreSQL\n5432)]
        ADB[(ArangoDB\n8529)]
        OLM[Ollama\n11434]
        MH[MailHog\n1025/8025]
    end

    Browser[Browser\nlocalhost:3000] --> FE
    FE -->|HTTP REST| API
    FE -->|OIDC redirects / token exchange| KC
    API -->|JWT validation| KC
    API -->|DB operations| ADB
    API -->|LLM API calls| OLM
    KC --> PG
    KC --> MH
```

## Integration relationship matrix

| Source | Destination | Protocol | Purpose |
| --- | --- | --- | --- |
| Browser | Frontend | HTTP | Load app, navigate pages |
| Frontend | Keycloak | OIDC | Login, token issuance, SSO check |
| Frontend | API | HTTP/JSON + Bearer token | API access |
| API | Keycloak | HTTPS/HTTP + JWKS | JWT validation |
| API | ArangoDB | HTTP client | Data reads/writes |
| API | Ollama | HTTP JSON | LLM generation and model metadata |
| Keycloak | PostgreSQL | JDBC | Identity persistence |
| Keycloak | MailHog | SMTP | Local email delivery |

## Authentication and authorization boundaries

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant K as Keycloak
    participant A as FastAPI
    participant D as ArangoDB

    B->>F: Load protected page
    F->>K: initKeycloak() / check-sso
    K-->>F: auth state and token metadata
    F->>A: GET /api/v1/users/me with Bearer token
    A->>K: Fetch JWKS certs
    K-->>A: JWKS JSON
    A->>A: Validate token signature + expiry + roles
    A->>D: fetch user document
    D-->>A: user record
    A-->>F: user payload
    F-->>B: render authorized view
```

## API boundaries

### Frontend-facing UI boundary
The frontend consumes the API through a single Axios client abstraction in [app/src/services/api.ts](../../app/src/services/api.ts). This client:
- adds the current token to every request,
- retries after token refresh when a 401 occurs,
- exposes typed helpers for the route layer.

### Backend application boundary
The API is organized around route modules:
- [api/app/routes/users.py](../../api/app/routes/users.py)
- [api/app/routes/health.py](../../api/app/routes/health.py)

Important route contracts:
- `GET /health` - health and database status
- `GET /health/ready` - readiness
- `GET /health/live` - liveness
- `GET /api/v1/users/me` - current user
- `GET /api/v1/users/{user_id}` - fetch user by id
- `PUT /api/v1/users/{user_id}` - update user profile

### External identity boundary
The Keycloak integration is set up in:
- [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
- [api/app/core/security.py](../../api/app/core/security.py)

This boundary governs:
- login initiation,
- redirect handling,
- PKCE flow,
- JWT verification,
- role extraction from token claims.

### Data boundary
The data boundary is encapsulated in:
- [api/app/core/database.py](../../api/app/core/database.py)

This abstraction centralizes:
- ArangoDB connection creation,
- per-collection access,
- singleton database reuse,
- application-level database access via dependency injection.

## Operational boundaries

```mermaid
mindmap
  root((Sextant platform))
    UI
      React frontend
      Router
      Auth context
    API
      FastAPI routes
      JWT auth
      Dependency injection
    Identity
      Keycloak
      Realm / roles
      JWKS
    Persistence
      ArangoDB
      PostgreSQL
      Docker volumes
    AI
      Ollama
      Model API
    Ops
      Health checks
      Docker Compose
      MailHog
```

## Summary

The system is intentionally layered and service-oriented. Browser traffic is isolated from persistence, identity is centralized in Keycloak, and domain logic stays behind the FastAPI boundary. This creates a clear API surface that is easy to reason about and extend without placing direct database or identity concerns into the frontend.
