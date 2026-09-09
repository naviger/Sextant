# ProtectedRoute

## Purpose

`ProtectedRoute` enforces access control at the UI boundary. It ensures that users are authenticated before entering protected screens and optionally blocks access when a user lacks a specific role.

## Public API

- `ProtectedRouteProps`
  - `children: React.ReactNode`
  - `requiredRole?: string`
- `ProtectedRoute` component

## Dependencies

- `useAuth()` from the auth context
- React Router `Navigate`

## Consumers

- `App.tsx` uses it to gate `/dashboard`, `/home`, and `/profile`

## Integration Points

- Reads `isLoading`, `isAuthenticated`, and `user` from auth state
- Redirects unauthenticated users to `/login`
- Displays a denial state for users without the required role

## Source Code Evidence

- [app/src/components/ProtectedRoute.tsx](../../app/src/components/ProtectedRoute.tsx)
- [app/src/App.tsx](../../app/src/App.tsx)
