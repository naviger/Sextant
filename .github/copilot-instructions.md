# Product Purpose

Naviger Sextant is an AI-powered enterprise strategy navigation platform.

The platform helps organizations:

- Define enterprise strategy
- Define business-unit strategy
- Assess alignment
- Detect strategic drift
- Surface risks and opportunities
- Generate AI-assisted strategic recommendations

This is a strategic definition and management platform, not a project management system.

Preferred domain vocabulary:

- North Star
- Bearing
- Course
- Drift
- Current
- Signal
- Position Fix
- Fleet

# Design Language

All UI development must follow:

    docs/design-language.md

Key concepts:

- Strategic Navigation
- Nautical Charts
- Celestial Navigation
- Alignment Visualization
- Calm Executive Experience
- Polaris Design System

# UI/React Standards

Use:

- Functional components
- Hooks
- TypeScript strict mode

Prefer:

- Composition over inheritance
- Small components
- Reusable design-system components

Components should have one responsibility.

# Technology Stack

Frontend

- React 
- TypeScript
- Vite
- TanStack Query
- React Router
- Microsoft Fluent UI v9

Backend

- FastAPI
- Python 3.13+
- Pydantic v2
- SQLModel only when required
- Dependency Injection

Database

- ArangoDB
- Native graph model
- AQL queries
- Document and graph collections

Identity

- OpenID Connect (OIDC)
- Microsoft Entra ID
- OAuth2 Authorization Code + PKCE

Infrastructure

- Docker
- Kubernetes
- GitHub Actions

# AI Design Principles

Use AI only when deterministic methods cannot achieve the goal.

Prefer:

1. Rules
2. Search
3. Graph traversal
4. Analytics
5. AI inference

AI outputs must always:

- Be explainable
- Include provenance
- Include confidence
- Include source references

Never make business decisions automatically.

# ArangoDB Standards

Prefer graph relationships over foreign keys.

Use:

- Vertices for strategic entities
- Edges for alignment relationships

Examples:

EnterpriseStrategy
→ aligns_to
BusinessUnitStrategy

Strategy
→ impacts
Objective

Objective
→ supported_by
Initiative

Favor AQL over application-side graph traversal.

# Security

Security is mandatory.

Requirements:

- OIDC authentication
- PKCE flows
- RBAC authorization
- Principle of least privilege
- Input validation everywhere
- Pydantic validation for all models
- No secrets in source control

All APIs require:

- Authentication
- Authorization
- Audit logging

# Testing Requirements

All production code requires automated testing.

Coverage goals:

- 100% coverage for domain logic
- 95%+ overall coverage
- 100% coverage for security-critical code

Required tests:

- Unit tests
- Integration tests
- API tests
- Graph query tests
- Authorization tests

Avoid testing implementation details.

Test business behavior.

# Testing Requirements

All production code requires automated testing.

Coverage goals:

- 100% coverage for domain logic
- 95%+ overall coverage
- 100% coverage for security-critical code

Required tests:

- Unit tests
- Integration tests
- API tests
- Graph query tests
- Authorization tests

Avoid testing implementation details.

Test business behavior.

# Observability

All services must include:

- Structured logging
- Correlation IDs
- Audit events
- Metrics
- Health endpoints

Never use print statements.

Use structured logging.

# Performance

Prefer:

- O(1) lookups
- Graph queries over repeated API calls
- Server-side filtering
- Pagination

Avoid:

- N+1 queries
- Client-side data joins
- Excessive re-renders

# Cost Optimization

Prefer simple solutions.

When generating code:

- Reuse existing components.
- Reuse existing hooks.
- Reuse existing services.
- Avoid introducing new libraries.
- Avoid abstraction until a second use case exists.
- Avoid creating frameworks.
- Avoid speculative extensibility.

Generate the smallest solution that satisfies requirements.

# Documentation

All public APIs require:

- OpenAPI documentation
- Examples
- Error responses

Complex business logic requires:

- Architecture Decision Records
- Inline rationale comments

# Copilot Response Preferences

When implementing features:

1. Check for existing patterns before creating new ones.
2. Follow existing folder structure.
3. Prefer editing existing files over creating new files.
4. Generate complete solutions.
5. Do not introduce dependencies without justification.
6. Explain architectural tradeoffs when proposing alternatives.
7. If requirements are ambiguous, choose the simplest implementation.