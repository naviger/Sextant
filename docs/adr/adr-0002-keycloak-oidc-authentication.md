# ADR-0002: Keycloak OIDC authentication and JWT validation

- Status: Accepted

## Context

The platform needs enterprise-grade identity management and user roles. The repository already assumes a centralized identity provider in front of the application. The frontend uses Keycloak JavaScript integration and the backend validates bearer tokens using Keycloak-issued claims.

The repository also includes explicit OIDC configuration and realm import settings in the Docker runtime and config files.

## Decision

We will treat Keycloak as the sole identity provider, using OIDC/OAuth2 with PKCE in the frontend and JWT verification in the backend.

## Consequences

- Authentication is centralized and externalized from the application code.
- Role-based access can be enforced using claims in the token.
- The frontend and backend both rely on a shared identity contract defined by the Keycloak realm.
- The application depends on the availability and configuration of the identity provider during runtime.

## Evidence from code

- [docker-compose.yml](../../docker-compose.yml) defines a `keycloak` service and imports a realm configuration file from [infra/keycloak/realm-config.json](../../infra/keycloak/realm-config.json).
- [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts) creates a Keycloak client with `pkceMethod: 'S256'` and uses `onLoad: 'check-sso'`.
- [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx) wraps the app in an `AuthProvider` and initializes the Keycloak session.
- [api/app/core/security.py](../../api/app/core/security.py) defines `get_current_user` and `check_permission`, validating bearer tokens and mapping roles.
- [api/app/core/config.py](../../api/app/core/config.py) defines `KEYCLOAK_URL`, `KEYCLOAK_REALM`, and `KEYCLOAK_CLIENT_ID` as environment-driven configuration.
