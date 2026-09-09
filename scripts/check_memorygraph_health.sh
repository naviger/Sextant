#!/bin/bash

# Sextant - MemoryGraph Health Check
# Verifies Arango collections and embedding signal quality.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

ARANGO_URL="${ARANGO_URL:-http://127.0.0.1:8529}"
ARANGO_DB="${ARANGO_DB:-${DATABASE_NAME:-sextant}}"
ARANGO_USER="${ARANGO_USER:-${ARANGODB_USER:-root}}"
ARANGO_PASSWORD="${ARANGO_PASSWORD:-${ARANGODB_ROOT_PASSWORD:-arangodb123}}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
REQUIRE_SEMANTIC=false

usage() {
  cat <<'EOF'
Usage: ./scripts/check_memorygraph_health.sh [options]

Options:
  --require-semantic   Fail when no Ollama-based embeddings are detected
  --arango-url <url>   ArangoDB URL (default: http://127.0.0.1:8529)
  --arango-db <name>   Arango database (default: sextant)
  --arango-user <user> Arango user (default: root)
  --arango-password <p> Arango password (default: ARANGODB_ROOT_PASSWORD or arangodb123)
  --ollama-url <url>   Ollama URL (default: http://127.0.0.1:11434)
  -h, --help           Show this help message
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --require-semantic)
      REQUIRE_SEMANTIC=true
      shift
      ;;
    --arango-url)
      ARANGO_URL="$2"
      shift 2
      ;;
    --arango-db)
      ARANGO_DB="$2"
      shift 2
      ;;
    --arango-user)
      ARANGO_USER="$2"
      shift 2
      ;;
    --arango-password)
      ARANGO_PASSWORD="$2"
      shift 2
      ;;
    --ollama-url)
      OLLAMA_URL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

echo "================================"
echo "MemoryGraph Health Check"
echo "================================"

export ARANGO_URL ARANGO_DB ARANGO_USER ARANGO_PASSWORD OLLAMA_URL REQUIRE_SEMANTIC
python3 - <<'PY'
import base64
import json
import os
import sys
import urllib.error
import urllib.request

arango_url = os.environ["ARANGO_URL"].rstrip("/")
arango_db = os.environ["ARANGO_DB"]
arango_user = os.environ["ARANGO_USER"]
arango_password = os.environ["ARANGO_PASSWORD"]
ollama_url = os.environ["OLLAMA_URL"].rstrip("/")
require_semantic = os.environ.get("REQUIRE_SEMANTIC", "false").lower() == "true"

base = f"{arango_url}/_db/{arango_db}"
auth = base64.b64encode(f"{arango_user}:{arango_password}".encode("utf-8")).decode("ascii")


def request(method: str, url: str, payload=None, with_auth: bool = True):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if with_auth:
      req.add_header("Authorization", f"Basic {auth}")
    with urllib.request.urlopen(req, timeout=20) as resp:
      body = resp.read()
      return json.loads(body.decode("utf-8")) if body else {}


try:
    request("GET", f"{base}/_api/version")
except Exception as exc:
    print(f"FAIL: ArangoDB not reachable at {base}: {exc}")
    sys.exit(1)

counts = {}
for coll in ("memory_documents", "memory_vectors", "memory_edges"):
    data = request("GET", f"{base}/_api/collection/{coll}/count")
    counts[coll] = int(data.get("count", 0))

for name, count in counts.items():
    print(f"INFO: {name} count={count}")

missing = [name for name, count in counts.items() if count <= 0]
if missing:
    print("FAIL: Empty required collections: " + ", ".join(missing))
    sys.exit(1)

kind_query = {
    "query": "FOR d IN memory_documents COLLECT k=d.kind WITH COUNT INTO n RETURN {kind:k,count:n}"
}
kind_data = request("POST", f"{base}/_api/cursor", kind_query)
kind_rows = kind_data.get("result", [])
print("INFO: document kinds=" + json.dumps(kind_rows, separators=(",", ":")))

emb_query = {
    "query": """
    LET total = LENGTH(memory_vectors)
    LET fallback = LENGTH(FOR v IN memory_vectors FILTER v.metadata.embedding_source == 'fallback' RETURN 1)
    LET ollama = LENGTH(FOR v IN memory_vectors FILTER v.metadata.embedding_source == 'ollama' RETURN 1)
    RETURN {total, fallback, ollama}
    """
}
emb_data = request("POST", f"{base}/_api/cursor", emb_query)
row = (emb_data.get("result") or [{}])[0]
total = int(row.get("total", 0))
fallback = int(row.get("fallback", 0))
ollama = int(row.get("ollama", 0))
print(f"INFO: embeddings total={total} ollama={ollama} fallback={fallback}")

if total > 0 and ollama == 0:
    print("WARN: No Ollama embeddings detected in memory_vectors.")

if require_semantic and total > 0 and ollama == 0:
    print("FAIL: --require-semantic set, but semantic embeddings are not present.")
    sys.exit(1)

ollama_ok = False
ollama_note = ""
try:
    probe = request(
        "POST",
        f"{ollama_url}/api/embed",
        {"model": "qwen2.5-coder:7b", "input": "memory graph health check"},
        with_auth=False,
    )
    if isinstance(probe, dict):
        if isinstance(probe.get("embeddings"), list) and probe.get("embeddings"):
            ollama_ok = True
        elif isinstance(probe.get("embedding"), list) and probe.get("embedding"):
            ollama_ok = True
        elif "error" in probe:
            ollama_note = str(probe.get("error"))
except Exception as exc:
    ollama_note = str(exc)

if ollama_ok:
    print("OK: Ollama embedding endpoint returned embeddings.")
else:
    print("WARN: Ollama embedding endpoint is not ready for semantic embedding generation.")
    if ollama_note:
        print(f"INFO: Ollama detail: {ollama_note}")

print("PASS: MemoryGraph health check completed.")
PY
