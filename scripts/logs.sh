#!/bin/bash

# Sextant - View Logs
# This script displays logs from Docker containers

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Get service name from argument
SERVICE="${1:-all}"

if [ "$SERVICE" = "all" ]; then
    echo "📋 Showing logs for all services (Ctrl+C to exit)..."
    docker-compose logs -f
elif [ "$SERVICE" = "app" ]; then
    echo "📋 Showing logs for Frontend..."
    docker-compose logs -f app
elif [ "$SERVICE" = "api" ]; then
    echo "📋 Showing logs for Backend API..."
    docker-compose logs -f api
elif [ "$SERVICE" = "keycloak" ]; then
    echo "📋 Showing logs for Keycloak..."
    docker-compose logs -f keycloak
elif [ "$SERVICE" = "postgres" ]; then
    echo "📋 Showing logs for PostgreSQL..."
    docker-compose logs -f postgres
elif [ "$SERVICE" = "arangodb" ]; then
    echo "📋 Showing logs for ArangoDB..."
    docker-compose logs -f arangodb
else
    echo "Usage: ./scripts/logs.sh [service]"
    echo ""
    echo "Services:"
    echo "  all       - Show logs for all services (default)"
    echo "  app       - Frontend React application"
    echo "  api       - FastAPI backend"
    echo "  keycloak  - Keycloak identity provider"
    echo "  postgres  - PostgreSQL database (for Keycloak)"
    echo "  arangodb  - ArangoDB database"
fi
