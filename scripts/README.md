# Scripts

This folder contains helper scripts for managing the Sextant application in Docker.

## Usage

All scripts should be run from the project root directory:

```bash
./scripts/start.sh
./scripts/start.sh --sync-memorygraph --embed-model nomic-embed-text --require-embeddings
./scripts/restart.sh
./scripts/stop.sh
./scripts/logs.sh [service]
./scripts/sync_memorygraph.sh
./scripts/check_memorygraph_health.sh
./scripts/open_arangodb_ui.sh
```

## Available Scripts

### `start.sh` - Start Services

Starts all Docker containers for the first time or after they've been stopped.

**Usage:**
```bash
./scripts/start.sh
./scripts/start.sh --sync-memorygraph --embed-model nomic-embed-text --require-embeddings
```

**What it does:**
1. Checks if Docker is running
2. Loads environment from `.env` file (creates from `.env.example` if needed)
3. Starts all containers via Docker Compose
4. Waits for services to become healthy
5. Displays access URLs and default credentials

**Options:**
- `--sync-memorygraph` ingests docs and refreshes vectors in `memory_documents` and `memory_vectors`
   and refreshes graph links in `memory_edges`
- `--embed-model <name>` sets the embedding model used for pull/validation and sync
- `--auto-pull-embed-model <bool>` controls startup model provisioning (default: true)
- `--require-embeddings` fails startup if pull or embed validation fails

**Output:**
```
✓ Keycloak is healthy (http://localhost:8080)
✓ ArangoDB is healthy (http://localhost:8529)
✓ FastAPI Backend is healthy (http://localhost:8000)
✓ React Frontend is healthy (http://localhost:3000)
```

---

### `restart.sh` - Restart Services

Stops and then starts all services. Useful when you need to reset state or apply configuration changes.

**Usage:**
```bash
./scripts/restart.sh
./scripts/restart.sh --sync-memorygraph
```

**What it does:**
1. Stops all running containers
2. Waits 5 seconds
3. Starts all containers again
4. Verifies services are healthy

**Options:**
- `--sync-memorygraph` ingests docs and refreshes vectors after restart
   and refreshes graph links in `memory_edges`

**Use cases:**
- Applying .env changes
- Fixing service issues
- Clearing session state
- Rebuilding after code changes

---

### `stop.sh` - Stop Services

Stops all Docker containers without removing volumes (preserves data).

**Usage:**
```bash
./scripts/stop.sh
```

**What it does:**
1. Stops all running containers
2. Preserves data in Docker volumes
3. Displays how to restart services

**Use cases:**
- Stopping the application temporarily
- Saving system resources
- Before system shutdown

---

### `logs.sh` - View Logs

Displays logs from one or all services. Useful for debugging.

**Usage:**
```bash
# View logs from all services
./scripts/logs.sh

# View logs from specific service
./scripts/logs.sh app
./scripts/logs.sh api
./scripts/logs.sh keycloak
./scripts/logs.sh postgres
./scripts/logs.sh arangodb
```

**Features:**
- Real-time log streaming (press Ctrl+C to exit)
- Last 100 lines of each service
- Color-coded output by service
- Timestamp for each log line

**Service Names:**
- `app` - React TypeScript frontend
- `api` - Python FastAPI backend
- `keycloak` - Keycloak identity provider
- `postgres` - PostgreSQL database (for Keycloak)
- `arangodb` - ArangoDB database

---

### `open_arangodb_ui.sh` - Open Correct ArangoDB Admin UI

Opens the exact ArangoDB Admin UI endpoint for Sextant to avoid port/database confusion when multiple Arango instances are running.

**Usage:**
```bash
./scripts/open_arangodb_ui.sh
./scripts/open_arangodb_ui.sh --sextant
./scripts/open_arangodb_ui.sh --system
./scripts/open_arangodb_ui.sh --no-open
```

**What it does:**
1. Defaults to Sextant DB UI (`http://127.0.0.1:8529/_db/sextant/_admin/aardvark/index.html`)
2. Prints expected credentials for the selected instance
3. Opens the URL in your browser on macOS

**Important:**
- Sextant ArangoDB is on port `8529`
- Sextant scripts target Sextant's local services only

---

### `sync_memorygraph.sh` - Sync MemoryGraph Documents + Vectors

Ingests architecture documentation into MemoryGraph and refreshes embeddings.

**Usage:**
```bash
./scripts/sync_memorygraph.sh
./scripts/sync_memorygraph.sh --embed-model nomic-embed-text
./scripts/sync_memorygraph.sh --no-ollama
```

**What it does:**
1. Reads docs from `docs/architecture`, `docs/adr`, `docs/domain`, and `docs/design-language`
2. Upserts documents into `memory_documents`
3. Generates embeddings with Ollama when available
4. Falls back to deterministic vectors when embedding generation is unavailable
5. Upserts vectors into `memory_vectors`
6. Builds document relationships in `memory_edges` from markdown links and category grouping

**Options:**
- `--arango-url`, `--arango-db`, `--arango-user`, `--arango-password`
- `--ollama-url`, `--embed-model`, `--embed-dim`, `--no-ollama`

---

### `check_memorygraph_health.sh` - Verify Memory Collections

Validates MemoryGraph availability and data readiness for coding agents.

**Usage:**
```bash
./scripts/check_memorygraph_health.sh
./scripts/check_memorygraph_health.sh --require-semantic
```

**What it checks:**
1. ArangoDB database connectivity
2. Non-empty `memory_documents`, `memory_vectors`, and `memory_edges`
3. Document kind distribution
4. Embedding source ratio (`ollama` vs `fallback`)
5. Ollama embedding endpoint probe status

**Options:**
- `--require-semantic` fails the check when no Ollama-based embeddings are present
- `--arango-url`, `--arango-db`, `--arango-user`, `--arango-password`, `--ollama-url`

## Service Health Checks

All scripts automatically verify service health:

```
Service              URL                        Expected Status
────────────────────────────────────────────────────────────
React Frontend       http://localhost:3000      Running
FastAPI Backend      http://localhost:8000      Healthy
Keycloak Admin       http://localhost:8080      Healthy
ArangoDB Web UI      http://localhost:8529      Healthy
```

## Environment Configuration

Scripts load configuration from `.env` file. Key variables:

```env
KEYCLOAK_ADMIN_PASSWORD=changeme123
ARANGODB_ROOT_PASSWORD=arangodb123
KEYCLOAK_DB_PASSWORD=keycloak123
MEMORYGRAPH_EMBED_MODEL=nomic-embed-text
AUTO_PULL_EMBED_MODEL=true
REQUIRE_EMBEDDINGS=false
```

If `.env` doesn't exist, `start.sh` creates it from `.env.example`.

## Troubleshooting

### Scripts won't execute
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run with bash if needed
bash scripts/start.sh
```

### Permission denied
```bash
# Add execute permission
chmod +x scripts/start.sh
sudo chmod +x scripts/*.sh
```

### Port already in use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Docker not running
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker daemon (Linux)
sudo systemctl start docker

# Verify
docker ps
```

## Manual Docker Commands

If you prefer not to use scripts:

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service]

# Restart specific service
docker-compose restart api

# Rebuild images
docker-compose build --no-cache

# Full reset (WARNING: deletes data)
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d
```

## Advanced Usage

### Execute commands in containers

```bash
# Run Python script in API container
docker-compose exec api python script.py

# Run SQL query in PostgreSQL
docker-compose exec postgres psql -U keycloak -d keycloak -c "SELECT * FROM users;"

# Access ArangoDB shell
docker-compose exec arangodb arangosh --server.endpoint tcp://127.0.0.1:8529 --server.username root --server.password $ARANGODB_ROOT_PASSWORD

# Get shell in container
docker-compose exec api bash
```

### View container resource usage

```bash
# Real-time resource usage
docker stats

# Specific container
docker stats sextant-api
```

### Inspect container details

```bash
# Get container IP and network info
docker inspect sextant-api

# Get environment variables
docker inspect sextant-api | grep -A 20 "Env"

# Get volumes
docker inspect sextant-arangodb | grep -A 10 "Mounts"
```

## Best Practices

1. **Always use scripts for consistent commands**
   - Ensures proper startup order
   - Handles health checks
   - Sets correct environment

2. **Check logs if something seems wrong**
   ```bash
   ./scripts/logs.sh [service]
   ```

3. **Restart instead of just stopping**
   - `./scripts/restart.sh` is safer than manual restarts
   - Ensures proper container restart order

4. **Keep .env secure**
   - Add to .gitignore (already done)
   - Don't share passwords
   - Rotate credentials in production

5. **Regular backups**
   - Backup PostgreSQL and ArangoDB data
   - Keep snapshots before major changes

## Integration with CI/CD

Scripts can be used in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Start services
  run: ./scripts/start.sh

- name: Run tests
  run: ./scripts/tests.sh

- name: Stop services
  run: ./scripts/stop.sh
```

## Support

For issues with scripts:
1. Check [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
2. View container logs: `./scripts/logs.sh`
3. Check Docker is installed: `docker --version`
4. Verify Docker Compose: `docker-compose --version`

## Additional Information

- See [README.md](../README.md) for project overview
- See [docs/security-config.md](../docs/security-config.md) for Keycloak setup
- See [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for common issues
