# Product Purpose

Naviger Sextant is an AI-powered enterprise strategy navigation platform.

The platform helps organizations:

- Define enterprise strategy
- Define business-unit strategy
- Assess alignment
- Detect strategic drift
- Surface risks and opportunities
- Generate AI-assisted strategic recommendations

Naviger Sextant is a strategic definition, alignment, and navigation platform.

It is NOT:

- A project management system
- A task management system
- A ticket tracking system
- A work management platform

Preferred domain vocabulary:

- North Star
- Bearing
- Course
- Drift
- Current
- Signal
- Position Fix
- Fleet

Avoid generic business terminology when Naviger terminology exists.

---

# Documentation Sources of Truth

Consult these sources before making architectural or domain assumptions:

- docs/design-language.md
- docs/architecture/**
- docs/domain/**
- docs/adr/**

Documentation takes precedence over inferred behavior.

If implementation and documentation conflict, identify and highlight the discrepancy.

---

# MemoryGraph Usage Strategy

MemoryGraph is intended for:

- Architecture knowledge
- ADRs
- Domain concepts
- Design language
- Organizational knowledge
- Historical decisions
- Entity relationships

Do NOT use MemoryGraph for routine implementation questions that can be answered from source code.

For implementation questions prefer:

1. Existing source code
2. Existing patterns
3. Repository search
4. MemoryGraph

Use targeted retrieval.

Avoid broad searches when a specialized query is available.

Prefer:

- search_architecture
- search_adrs
- search_design_language
- search_domain_concepts
- find_related_entities

before:

- search_memory
- hybrid_search
- semantic_search

Initial retrieval budget:

- Use one specialized query first.
- Perform additional queries only when information is incomplete.
- Stop searching once enough information is retrieved.

Retrieve only information required for the current task.

---

# Memory Retrieval Policy

Before answering questions about:

- Architecture
- ADRs
- Domain concepts
- Design language
- Previous decisions
- Repository structure
- Integrations
- Entity relationships
- Project history

ALWAYS query MemoryGraph first.

Tool selection:

Architecture
→ search_architecture

ADRs
→ search_adrs

Design language
→ search_design_language

Domain concepts
→ search_domain_concepts

Entity relationships
→ find_related_entities

General project knowledge
→ search_memory

Broader retrieval
→ hybrid_search

Semantic discovery
→ semantic_search

Rules:

1. Query targeted memory first.
2. Use retrieved knowledge when available.
3. Reference retrieved knowledge in responses.
4. Do not invent architecture details.
5. If memory is missing but evidence exists in code, propose MemoryGraph updates.
6. If no memory exists, state that explicitly.

---

# Design Language

The authoritative design-language document is:

docs/design-language.md

All UI, UX, visualizations, terminology, component naming,
interaction design, and visual metaphors must follow this document.

When generated output conflicts with the design language,
the design language takes precedence.

Key concepts:

- Strategic Navigation
- Nautical Charts
- Celestial Navigation
- Alignment Visualization
- Calm Executive Experience
- Polaris Design System

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- TanStack Query
- React Router
- Microsoft Fluent UI v9

## Backend

- FastAPI
- Python 3.13+
- Pydantic v2
- Dependency Injection
- SQLModel only when required

## Database

- ArangoDB
- Native graph model
- Document collections
- Edge collections
- AQL queries

## Identity

- OpenID Connect (OIDC)
- Microsoft Entra ID
- OAuth2 Authorization Code + PKCE

## Infrastructure

- Docker
- Kubernetes
- GitHub Actions

---

# UI Standards

Use:

- Functional components
- Hooks
- TypeScript strict mode

Prefer:

- Composition over inheritance
- Small focused components
- Reusable design-system components
- Reusable hooks

Components should have one responsibility.

Prefer modifying existing components before creating new ones.

---

# AI Design Principles

Use AI only when deterministic approaches cannot achieve the goal.

Decision preference order:

1. Rules
2. Search
3. Graph traversal
4. Analytics
5. AI inference

AI outputs must:

- Be explainable
- Include provenance
- Include confidence
- Include source references

Never make business decisions automatically.

---

# Architecture Standards

Architecture documentation is part of the source of truth.

When introducing:

- Services
- APIs
- Integrations
- Domains
- Major components

Also update:

- Architecture documentation
- Domain documentation
- MemoryGraph documentation

Keep documentation synchronized with implementation.

---

# ADR Policy

Before implementing architectural changes:

1. Check existing ADRs.
2. Reuse existing decisions where appropriate.

When a significant architectural decision is made and no ADR exists:

1. Create a proposed ADR.
2. Save it under docs/adr.
3. Link it to affected components.
4. Link it to affected domain concepts.

Significant decisions include:

- Technology selection
- Security architecture
- Data architecture
- Integration architecture
- Major UI architecture
- AI architecture

---

# ArangoDB Standards

Prefer graph relationships over foreign keys.

Use:

- Vertices for strategic entities
- Edges for relationships

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

Avoid duplicating graph intelligence in application code.

---

# Security

Security is mandatory.

Requirements:

- OIDC authentication
- OAuth2 PKCE
- RBAC authorization
- Principle of least privilege
- Input validation
- Pydantic validation
- No secrets in source control

All APIs require:

- Authentication
- Authorization
- Audit logging

---

# Testing

All production code requires automated testing.

Coverage goals:

- 100% domain logic coverage
- 95%+ overall coverage
- 100% security-critical coverage

Required tests:

- Unit tests
- Integration tests
- API tests
- Graph query tests
- Authorization tests

Test business behavior.

Avoid testing implementation details.

---

# Observability

All services must provide:

- Structured logging
- Correlation IDs
- Audit events
- Metrics
- Health endpoints

Never use print statements.

Use structured logging.

---

# Performance

Prefer:

- Graph queries
- Server-side filtering
- Pagination
- Efficient lookups

Avoid:

- N+1 queries
- Client-side joins
- Excessive re-renders

---

# Cost Optimization

Prefer simple solutions.

When generating code:

- Reuse existing components
- Reuse existing hooks
- Reuse existing services
- Avoid unnecessary libraries
- Avoid speculative abstractions
- Avoid framework creation
- Avoid premature extensibility

Generate the smallest solution that satisfies requirements.

---

# Documentation

All public APIs require:

- OpenAPI documentation
- Examples
- Error responses

Complex business logic requires:

- ADRs
- Architecture documentation
- Rationale comments when necessary

---

# Copilot Response Preferences

When implementing features:

1. Check existing patterns first.
2. Follow existing folder structure.
3. Prefer modifying existing files.
4. Reuse existing services and components.
5. Generate complete solutions.
6. Minimize dependencies.
7. Explain trade-offs when relevant.
8. Prefer the simplest valid implementation.

---

# MemoryGraph Maintenance Rules

When a significant architectural decision is discovered and no ADR exists:

1. Generate a proposed ADR.
2. Save it to docs/adr.
3. Link it to affected components.

When new domain concepts are discovered:

1. Create or update docs/domain.
2. Add related concepts and relationships.

When new services, modules, APIs, or integrations are added:

1. Update architecture documentation.
2. Update component documentation.
3. Ensure MemoryGraph can index the resulting artifacts.

Documentation, memory, and implementation should evolve together.