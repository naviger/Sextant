# ADR-0001: Containerized multi-service platform

- Status: Accepted

## Context

The repository is structured as a set of independently deployable runtime components: a React frontend, a Python FastAPI backend, Keycloak, PostgreSQL, ArangoDB, MailHog, and Ollama. The application is expected to run consistently across developer machines and deployment environments without ad hoc local setup differences.

The project includes a single orchestrator file, [docker-compose.yml](../../docker-compose.yml), with network definitions, health checks, dependency ordering, and volumes for persistent data. Each service runs under its own container and is explicitly expected to communicate over a shared Docker network.

## Decision

We will run the platform as a Docker Compose-based multi-service system with explicit service dependencies and health checks.

## Consequences

- Local development and deployment behavior are standardized.
- Services can be started and stopped together with predictable startup ordering.
- Infrastructure dependencies are isolated from the application runtime.
- The architecture is easy to extend with additional services, but it also couples application behavior to container startup order and network conventions.

## Evidence from code

- [docker-compose.yml](../../docker-compose.yml) declares `keycloak`, `postgres`, `arangodb`, `api`, `app`, `mailhog`, and `ollama` as separate services.
- The `depends_on` blocks enforce ordering between `keycloak` and `postgres`, and between `api` and `keycloak`/`arangodb`.
- Health checks are configured on several services, such as `keycloak`, `postgres`, `arangodb`, `api`, `app`, and `mailhog`.
- Shared network and volume definitions in [docker-compose.yml](../../docker-compose.yml) establish a consistent runtime topology.
- The backend startup command in [docker-compose.yml](../../docker-compose.yml) uses `uvicorn app.main:app --reload`, confirming a container-first development workflow.
