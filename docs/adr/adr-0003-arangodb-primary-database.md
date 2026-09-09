# ADR-0003: ArangoDB as the primary application database

- Status: Accepted

## Context

The system is designed to store strategic, graph-like domain data and user profile information. The repository specifically references ArangoDB as the enterprise database and configures it in the platform stack. The backend code includes a database wrapper that manages connections and collection creation rather than using a relational model directly.

## Decision

We will use ArangoDB as the primary data store, with the application treating it as a document/graph database rather than a traditional SQL database.

## Consequences

- The application can store both document-oriented and graph-oriented records naturally.
- Strategic domain entities and relationships can be represented as vertices and edges.
- The architecture favors graph traversal in queries over application-side joins.
- The data access layer becomes more specialized to ArangoDB semantics and less portable to SQL-only systems.

## Evidence from code

- [docker-compose.yml](../../docker-compose.yml) includes an `arangodb` service with a persistent data volume and health check.
- [api/app/core/database.py](../../api/app/core/database.py) defines `ArangoDB`, a singleton wrapper around `ArangoClient`, and a `get_collection` helper.
- [api/app/routes/users.py](../../api/app/routes/users.py) accesses `db.collection("users")` and performs document lookups and updates directly on that collection.
- [api/app/core/config.py](../../api/app/core/config.py) exposes `DATABASE_URL`, `DATABASE_NAME`, `ARANGODB_USER`, and `ARANGODB_PASSWORD` as environment variables.
- The repository description in [README.md](../../README.md) states: "Database: ArangoDB Enterprise - Multi-model database for flexible data management."
