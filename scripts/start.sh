#!/bin/bash

# Sextant - Start Services
# Starts local services in stages and waits for readiness to avoid transient
# compose failures caused by healthcheck timing.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "================================"
echo "Sextant - Starting Services"
echo "================================"
echo ""

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

if [ "$infra_failed" -ne 0 ]; then
    echo ""
    echo "❌ ERROR: One or more infrastructure services are not ready"
    ${COMPOSE_CMD} ps
    echo ""
    echo "Recent logs:"
    ${COMPOSE_CMD} logs --tail=80 postgres arangodb keycloak
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

echo ""
echo "================================"
echo "✅ Services Ready"
echo "================================"
echo ""
echo "Login:               http://localhost:3000/login"
echo "Strategy Dashboard:  http://localhost:3000/dashboard"
echo "Backend API:         http://localhost:8000"
echo "Keycloak Admin:      http://localhost:8080/admin"
echo "ArangoDB:            http://localhost:8529"
echo "MailHog:             http://localhost:8025"
echo "Ollama API:          http://localhost:11434"
echo ""
echo "Default credentials:"
echo "  Keycloak Admin: admin / changeme123"
echo "  Demo User:      demo / password123"
echo "  Admin User:     admin / admin123"
echo ""
echo "Quick commands:"
echo "  Logs:    ./scripts/logs.sh [service]"
echo "  Stop:    ./scripts/stop.sh"
echo "  Restart: ./scripts/restart.sh"
