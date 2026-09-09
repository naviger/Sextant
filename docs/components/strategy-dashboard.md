# StrategyDashboard

## Purpose

`StrategyDashboard` is the main strategic view presented after successful authentication. It surfaces executive-oriented summaries like confidence, drift alerts, priority signals, and alignment maps.

## Public API

- `StrategyDashboard` component

## Dependencies

- `useAuth()`
- `LoginButton`

## Consumers

- Routed by `App.tsx` at `/dashboard`

## Integration Points

- Reads the authenticated user from context to personalize the screen
- Presents strategic state rendered as executive summary panels
- Uses the design language semantics such as “Current Fix”, “North Star”, and “Drift Alert”

## Source Code Evidence

- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx)
- [app/src/App.tsx](../../app/src/App.tsx)
