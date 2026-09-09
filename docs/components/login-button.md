# LoginButton

## Purpose

`LoginButton` is the primary login/logout UI control. It renders the current authentication state and exposes a simple entry point for sign-in and sign-out.

## Public API

- `LoginButton` component

## Dependencies

- `useAuth()`
- React styling classes defined in the app CSS system

## Consumers

- Used in `StrategyDashboard`, `Profile`, and `Home`
- Acts as a global header-level auth control

## Integration Points

- Calls `login()` or `logout()` from the auth context
- Reflects `isLoading`, `isAuthenticated`, and `user` state
- Displays user identity and email when authenticated

## Source Code Evidence

- [app/src/components/LoginButton.tsx](../../app/src/components/LoginButton.tsx)
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx)
- [app/src/pages/Profile.tsx](../../app/src/pages/Profile.tsx)
- [app/src/pages/Home.tsx](../../app/src/pages/Home.tsx)
