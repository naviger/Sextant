# Keycloak Service

## Purpose

The Keycloak service is the browser-side identity client. It encapsulates OIDC setup, login/logout, token refresh, token retrieval, and user claim parsing.

## Public API

- `getKeycloakInstance()`
- `initKeycloak()`
- `login()`
- `logout()`
- `getToken()`
- `isTokenExpired()`
- `refreshToken()`
- `getUserInfo()`
- `hasRole()`
- `hasRealmRole()`
- `isAuthenticated()`

## Dependencies

- `keycloak-js` package
- Browser environment and `window.location`

## Consumers

- `AuthContext` consumes it for session initialization and user state
- `api.ts` depends on `getToken` and `refreshToken`

## Integration Points

- Connects to Keycloak realm configured via `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, and `VITE_KEYCLOAK_CLIENT_ID`
- Uses PKCE flow with `pkceMethod: 'S256'`
- Uses silent SSO redirect logic and a check-sso initialization flow
- Synchronizes bearer token state with API requests

## Source Code Evidence

- [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
- [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
- [app/src/services/api.ts](../../app/src/services/api.ts)
