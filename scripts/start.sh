#!/bin/bash

# Sextant - Start Services
# Starts local services in stages and waits for readiness to avoid transient
# compose failures caused by healthcheck timing.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

SYNC_MEMORYGRAPH=false
EMBED_MODEL="${MEMORYGRAPH_EMBED_MODEL:-nomic-embed-text}"
AUTO_PULL_EMBED_MODEL="${AUTO_PULL_EMBED_MODEL:-true}"
REQUIRE_EMBEDDINGS="${REQUIRE_EMBEDDINGS:-false}"

EMBED_MODEL_SET_BY_ARG=false
AUTO_PULL_EMBED_MODEL_SET_BY_ARG=false
REQUIRE_EMBEDDINGS_SET_BY_ARG=false

usage() {
        cat <<'EOF'
Usage: ./scripts/start.sh [options]

Options:
    --sync-memorygraph          Ingest docs and refresh vectors in MemoryGraph ArangoDB
    --embed-model <name>        Embedding model to pull and use for MemoryGraph sync
    --auto-pull-embed-model <bool>
                                                             Pull embedding model from Ollama at startup (default: true)
    --require-embeddings        Fail startup when embedding model pull/validation fails
    -h, --help                  Show this help message
EOF
}

load_env_file() {
    if [ ! -f .env ]; then
        return 0
    fi

    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
            ''|[[:space:]]*'#'*)
                continue
                ;;
        esac

        if [[ "$line" != *=* ]]; then
            continue
        fi

        local key="${line%%=*}"
        local value="${line#*=}"

        key="${key##${key%%[![:space:]]*}}"
        key="${key%%${key##*[![:space:]]}}"

        if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            continue
        fi

        export "$key=$value"
    done < .env
}

is_true() {
    local value="${1:-false}"
    value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"
    [ "$value" = "1" ] || [ "$value" = "true" ] || [ "$value" = "yes" ] || [ "$value" = "on" ]
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        # Backward-compatibility: legacy flag is accepted as a no-op.
        --with-mcp)
            shift
            ;;
        --sync-memorygraph)
            SYNC_MEMORYGRAPH=true
            shift
            ;;
        --embed-model)
            if [ "$#" -lt 2 ]; then
                echo "❌ ERROR: --embed-model requires a model name"
                usage
                exit 1
            fi
            EMBED_MODEL="$2"
            EMBED_MODEL_SET_BY_ARG=true
            shift 2
            ;;
        --auto-pull-embed-model)
            if [ "$#" -lt 2 ]; then
                echo "❌ ERROR: --auto-pull-embed-model requires true or false"
                usage
                exit 1
            fi
            AUTO_PULL_EMBED_MODEL="$2"
            AUTO_PULL_EMBED_MODEL_SET_BY_ARG=true
            shift 2
            ;;
        --require-embeddings)
            REQUIRE_EMBEDDINGS=true
            REQUIRE_EMBEDDINGS_SET_BY_ARG=true
            shift
            ;;
        # Backward-compatibility: legacy flag and value are accepted as no-op.
        --mcp-repo)
            if [ "$#" -lt 2 ]; then
                echo "❌ ERROR: --mcp-repo requires a path"
                usage
                exit 1
            fi
            shift 2
            ;;
        # Backward-compatibility: legacy flag and value are accepted as no-op.
        --mcp-auth)
            if [ "$#" -lt 2 ]; then
                echo "❌ ERROR: --mcp-auth requires true or false"
                usage
                exit 1
            fi
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "❌ ERROR: Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

echo "================================"
echo "Sextant - Starting Services"
echo "================================"
echo ""

sync_memorygraph_storage() {
    if [ ! -x "./scripts/sync_memorygraph.sh" ]; then
        echo "❌ ERROR: scripts/sync_memorygraph.sh is missing or not executable"
        exit 1
    fi

    echo ""
    echo "🧭 Syncing MemoryGraph documents and vectors..."
    MEMORYGRAPH_EMBED_MODEL="$EMBED_MODEL" ./scripts/sync_memorygraph.sh
}

if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ .env created from .env.example"
    else
        echo "❌ ERROR: .env.example not found"
        exit 1
    fi
    echo ""
fi

load_env_file

if [ "$EMBED_MODEL_SET_BY_ARG" = false ]; then
    EMBED_MODEL="${MEMORYGRAPH_EMBED_MODEL:-$EMBED_MODEL}"
fi
if [ "$AUTO_PULL_EMBED_MODEL_SET_BY_ARG" = false ]; then
    AUTO_PULL_EMBED_MODEL="${AUTO_PULL_EMBED_MODEL:-$AUTO_PULL_EMBED_MODEL}"
fi
if [ "$REQUIRE_EMBEDDINGS_SET_BY_ARG" = false ]; then
    REQUIRE_EMBEDDINGS="${REQUIRE_EMBEDDINGS:-$REQUIRE_EMBEDDINGS}"
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker daemon is not running."
    if [ "$(uname)" = "Darwin" ]; then
        echo "Run: open /Applications/Docker.app"
    else
        echo "Run: sudo systemctl start docker"
    fi
    exit 1
fi

if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ ERROR: Docker Compose is not installed"
    exit 1
fi

echo "🐳 Using: ${COMPOSE_CMD}"
echo ""

echo "🔨 Building images..."
if ! ${COMPOSE_CMD} build; then
    echo "❌ ERROR: Failed to build images"
    exit 1
fi

wait_for_service() {
    local container_name="$1"
    local label="$2"
    local timeout_seconds="$3"
    local deadline=$((SECONDS + timeout_seconds))

    while [ "$SECONDS" -lt "$deadline" ]; do
        local state
        state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || true)"

        if [ "$state" = "healthy" ] || [ "$state" = "running" ]; then
            echo "✓ ${label} is ${state}"
            return 0
        fi

        sleep 3
    done

    echo "⚠️  ${label} did not become ready within ${timeout_seconds}s"
    return 1
}

echo ""
echo "📦 Starting infrastructure services..."
${COMPOSE_CMD} up -d --remove-orphans postgres arangodb keycloak mailhog ollama

echo ""
echo "⏳ Waiting for infrastructure readiness..."
infra_failed=0
wait_for_service sextant-postgres "PostgreSQL" 90 || infra_failed=1
wait_for_service sextant-arangodb "ArangoDB" 120 || infra_failed=1
wait_for_service sextant-keycloak "Keycloak" 150 || infra_failed=1
wait_for_service sextant-mailhog "MailHog" 90 || infra_failed=1
wait_for_service sextant-ollama "Ollama" 180 || true

ensure_embedding_model() {
    if ! is_true "$AUTO_PULL_EMBED_MODEL"; then
        echo "ℹ️  Skipping Ollama embedding model pull (AUTO_PULL_EMBED_MODEL=${AUTO_PULL_EMBED_MODEL})"
        return 0
    fi

    if ! nc -z 127.0.0.1 11434 >/dev/null 2>&1; then
        local msg="⚠️  Ollama is not reachable on 127.0.0.1:11434; cannot pull embedding model"
        if is_true "$REQUIRE_EMBEDDINGS"; then
            echo "${msg}"
            return 1
        fi
        echo "${msg}"
        return 0
    fi

    echo "🧩 Ensuring Ollama embedding model is available: ${EMBED_MODEL}"
    if ! curl -fsS "http://127.0.0.1:11434/api/pull" \
        -H "Content-Type: application/json" \
        -d "{\"model\":\"${EMBED_MODEL}\",\"stream\":false}" >/dev/null; then
        local msg="⚠️  Failed to pull embedding model '${EMBED_MODEL}' from Ollama"
        if is_true "$REQUIRE_EMBEDDINGS"; then
            echo "${msg}"
            return 1
        fi
        echo "${msg}"
        return 0
    fi

    if ! curl -fsS "http://127.0.0.1:11434/api/embed" \
        -H "Content-Type: application/json" \
        -d "{\"model\":\"${EMBED_MODEL}\",\"input\":\"Sextant semantic check\"}" >/dev/null; then
        local msg="⚠️  Ollama responded, but embeddings endpoint validation failed for '${EMBED_MODEL}'"
        if is_true "$REQUIRE_EMBEDDINGS"; then
            echo "${msg}"
            return 1
        fi
        echo "${msg}"
        return 0
    fi

    echo "✓ Embedding model ready: ${EMBED_MODEL}"
}

if [ "$infra_failed" -ne 0 ]; then
    echo ""
    echo "❌ ERROR: One or more infrastructure services are not ready"
    ${COMPOSE_CMD} ps
    echo ""
    echo "Recent logs:"
    ${COMPOSE_CMD} logs --tail=80 postgres arangodb keycloak
    exit 1
fi

if ! ensure_embedding_model; then
    echo ""
    echo "❌ ERROR: Embedding model setup failed and embeddings are required"
    exit 1
fi

echo ""
echo "📦 Starting application services..."
${COMPOSE_CMD} up -d api app

echo ""
echo "⏳ Waiting for application readiness..."
app_failed=0
wait_for_service sextant-api "FastAPI Backend" 150 || app_failed=1
wait_for_service sextant-app "React Frontend" 120 || app_failed=1

echo ""
echo "🔍 Final status"
${COMPOSE_CMD} ps

if [ "$app_failed" -ne 0 ]; then
    echo ""
    echo "❌ ERROR: One or more application services are not ready"
    echo "Recent logs:"
    ${COMPOSE_CMD} logs --tail=120 api app
    exit 1
fi

if [ "$SYNC_MEMORYGRAPH" = true ]; then
    sync_memorygraph_storage
fi

echo ""
echo "================================"
echo "✅ Services Ready"
echo "================================"
echo ""
echo "Login:               http://localhost:3000/login"
echo "Strategy Dashboard:  http://localhost:3000/dashboard"
echo "Backend API:         http://localhost:8000"
echo "Keycloak Admin:      http://localhost:8080/admin"
echo "ArangoDB (_system):  http://127.0.0.1:8529/_db/_system/_admin/aardvark/index.html"
echo "ArangoDB (sextant):  http://127.0.0.1:8529/_db/sextant/_admin/aardvark/index.html"
echo "MailHog:             http://localhost:8025"
echo "Ollama API:          http://localhost:11434"
echo ""
echo "Default credentials:"
echo "  Keycloak Admin: admin / changeme123"
echo "  Demo User:      demo / password123"
echo "  Admin User:     admin / admin123"
echo ""
echo "Quick commands:"
echo "  Arango UI: ./scripts/open_arangodb_ui.sh"
echo "  Logs:    ./scripts/logs.sh [service]"
echo "  Stop:    ./scripts/stop.sh"
echo "  Restart: ./scripts/restart.sh"
