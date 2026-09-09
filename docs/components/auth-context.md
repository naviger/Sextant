# AuthContext

## Purpose

The `AuthContext` is the frontend’s single source of truth for authentication state. It initializes Keycloak, keeps the current user in React state, exposes login/logout behavior, and provides access to the current bearer token.

## Public API

- `AuthProvider`
- `useAuth()`
- Returned context shape:
  - `user`
  - `isAuthenticated`
  - `isLoading`
  - `login()`
  - `logout()`
  - `getToken()`

## Dependencies

- React Context API
- `initKeycloak`, `login`, `logout`, `getToken`, `isAuthenticated`, `getUserInfo` from the Keycloak service
- `User` and `AuthContextType` definitions from the shared types file

## Consumers

- `App.tsx` wraps the app in `AuthProvider`
- `ProtectedRoute` reads the auth state to gate routes
- `LoginButton`, `Profile`, `Home`, and `StrategyDashboard` consume the auth hook

## Integration Points

- Initializes session state on mount with a `useEffect` hook
- Communicates with the external Keycloak OIDC provider
- Provides token access to the Axios API client for authenticated requests

## Source Code Evidence

- [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx)
- [app/src/types/index.ts](../../app/src/types/index.ts)
- [app/src/services/keycloak.ts](../../app/src/services/keycloak.ts)
