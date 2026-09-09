# API Client

## Purpose

The API client is the frontend abstraction responsible for authenticated HTTP communication with the backend. It centralizes bearer-token injection and automatic refresh behavior for expired tokens.

## Public API

- `getApiInstance()`
- `apiCall(method, url, data?)`
- `get()`, `post()`, `put()`, `patch()`, `del()`
- `checkHealth()`
- `getCurrentUser()`
- `getUserProfile(userId)`
- `updateUserProfile(userId, data)`

## Dependencies

- Axios
- `getToken` and `refreshToken` from the Keycloak service

## Consumers

- Frontend pages and future app logic can import this client
- Current usage patterns are defined around user authentication and profile operations

## Integration Points

- Adds `Authorization: Bearer <token>` to every request
- Refreshes token on 401 responses by invoking Keycloak token refresh
- Communicates with the FastAPI backend at `VITE_API_URL`

## Source Code Evidence

- [app/src/services/api.ts](../../app/src/services/api.ts)
- [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
