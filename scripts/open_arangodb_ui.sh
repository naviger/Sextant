#!/bin/bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

target="sextant"
do_open=true

usage() {
    cat <<'EOF'
Usage: ./scripts/open_arangodb_ui.sh [--sextant|--system] [--no-open]

Options:
  --sextant        Open Sextant ArangoDB UI (default, port 8529)
  --system         Open _system database UI on Sextant ArangoDB (port 8529)
  --no-open        Print URL and credentials only
  -h, --help       Show this help message
EOF
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        --sextant)
            target="sextant"
            shift
            ;;
        --system)
            target="system"
            shift
            ;;
        --no-open)
            do_open=false
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

sextant_password="arangodb123"
if [ -f .env ]; then
    env_password="$(grep -E '^ARANGODB_ROOT_PASSWORD=' .env | tail -n 1 | cut -d= -f2-)"
    if [ -n "$env_password" ]; then
        sextant_password="$env_password"
    fi
fi

case "$target" in
    sextant)
        url="http://127.0.0.1:8529/_db/sextant/_admin/aardvark/index.html"
        creds="root / ${sextant_password}"
        ;;
    system)
        url="http://127.0.0.1:8529/_db/_system/_admin/aardvark/index.html"
        creds="root / ${sextant_password}"
        ;;
esac

echo "ArangoDB UI URL: ${url}"
echo "Credentials: ${creds}"

if [ "$do_open" = true ]; then
    if command -v open >/dev/null 2>&1; then
        open "$url"
        echo "Opened in browser."
    else
        echo "Cannot auto-open browser on this system."
    fi
fi
