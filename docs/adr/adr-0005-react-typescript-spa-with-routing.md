# ADR-0005: React + TypeScript single-page client with routing

- Status: Accepted

## Context

The frontend is implemented as a web app that needs to authenticate users, render protected pages, and manage navigation between a login route and protected dashboard/profile routes. The frontend is built with Vite and React, with TypeScript used to define user and auth models.

## Decision

We will build the user interface as a React single-page application using TypeScript, React Router, and a context-based state model.

## Consequences

- The client can present a fast, app-like experience without full-page reloads.
- Route protection can be enforced at the UI layer using a dedicated `ProtectedRoute` component.
- Shared authentication state is centralized in `AuthContext` rather than spread across components.
- The frontend increasingly depends on client-side state and route conventions rather than server-rendered pages.

## Evidence from code

- [app/package.json](../../app/package.json) includes `react`, `react-dom`, `react-router-dom`, and TypeScript support.
- [app/src/App.tsx](../../app/src/App.tsx) defines routed screens for `/login`, `/dashboard`, `/home`, and `/profile` using `BrowserRouter` and `Routes`.
- [app/src/components/ProtectedRoute.tsx](../../app/src/components/ProtectedRoute.tsx) demonstrates route-level authorization gating.
- [app/src/context/AuthContext.tsx](../../app/src/context/AuthContext.tsx) provides auth state to the tree via `AuthProvider` and `useAuth()`.
- [app/src/types/index.ts](../../app/src/types/index.ts) defines frontend contracts for `User`, `AuthContextType`, and related values.
