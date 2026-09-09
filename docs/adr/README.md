# Architecture Decision Records

This directory captures the architectural decisions currently embodied in the repository.

## ADR index

- [ADR-0001: Containerized multi-service platform](./adr-0001-containerized-multi-service-platform.md)
- [ADR-0002: Keycloak OIDC authentication and JWT validation](./adr-0002-keycloak-oidc-authentication.md)
- [ADR-0003: ArangoDB as the primary application database](./adr-0003-arangodb-primary-database.md)
- [ADR-0004: FastAPI REST API with Pydantic contracts](./adr-0004-fastapi-rest-api-with-pydantic-contracts.md)
- [ADR-0005: React + TypeScript single-page client with routing](./adr-0005-react-typescript-spa-with-routing.md)
- [ADR-0006: Dependency injection for access to database and auth state](./adr-0006-dependency-injection-for-db-and-auth.md)
- [ADR-0007: Development email messaging via MailHog](./adr-0007-development-email-messaging-via-mailhog.md)
- [ADR-0008: External LLM access through Ollama](./adr-0008-external-llm-access-through-ollama.md)
- [ADR-0009: JWKS caching to reduce repeated Keycloak validation overhead](./adr-0009-jwks-caching.md)

This repository does not currently implement an event-sourcing model, a dedicated repository abstraction layer, or a distributed message broker such as Kafka or RabbitMQ.
