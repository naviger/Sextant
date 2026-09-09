# Database Layer

## Purpose

The database layer provides the application’s ArangoDB connection management and the single access point used by backend routes. It hides the underlying connection setup and exposes a configured database handle.

## Public API

- `ArangoDB` singleton class
- `db_client`
- `get_db()`

## Dependencies

- `python-arango` / `ArangoClient`
- `app.core.config.settings`

## Consumers

- `get_db()` is consumed by `users` and `health` routes
- Database access is intentionally centralized behind a dependency injection factory

## Integration Points

- Creates the configured ArangoDB database if it does not exist
- Provides collection access helpers via `get_collection()`
- Supplies database object to FastAPI route dependencies

## Source Code Evidence

- [api/app/core/database.py](../../api/app/core/database.py)
- [api/app/routes/users.py](../../api/app/routes/users.py)
- [api/app/routes/health.py](../../api/app/routes/health.py)
