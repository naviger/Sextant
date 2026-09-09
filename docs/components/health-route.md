# Health Route

## Purpose

The health API exposes readiness, liveness, and database-aware health information. It is used by Docker healthchecks and operational monitoring.

## Public API

- `GET /health`
- `GET /health/ready`
- `GET /health/live`

## Dependencies

- `get_db()`
- `HealthResponse` schema

## Consumers

- Docker health checks configured in [docker-compose.yml](../../docker-compose.yml)
- Operational monitoring systems
- Local startup scripts and deployment tooling

## Integration Points

- Calls `db.properties()` to verify database availability
- Returns status strings to show health and readiness
- Provides a straightforward operational check across service startup

## Source Code Evidence

- [api/app/routes/health.py](../../api/app/routes/health.py)
- [docker-compose.yml](../../docker-compose.yml)
