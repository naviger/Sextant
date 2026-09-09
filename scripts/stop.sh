#!/bin/bash

# Sextant - Stop Services
# This script stops all Docker containers

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

usage() {
	cat <<'EOF'
Usage: ./scripts/stop.sh [options]

Options:
  -h, --help            Show this help message
EOF
}

while [ "$#" -gt 0 ]; do
	case "$1" in
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
echo "Sextant - Stopping Services"
echo "================================"
echo ""

echo "🛑 Stopping Docker Compose services..."
if docker compose version > /dev/null 2>&1; then
	COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
	COMPOSE_CMD="docker-compose"
else
	echo "❌ ERROR: Docker Compose is not installed"
	exit 1
fi

${COMPOSE_CMD} down

echo ""
echo "✓ All services have been stopped!"
echo ""
echo "To view logs, use: ./scripts/logs.sh"
echo "To restart, use: ./scripts/start.sh or ./scripts/restart.sh"
echo ""
