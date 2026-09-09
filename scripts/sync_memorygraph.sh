#!/bin/bash

# Sextant - Sync MemoryGraph Storage
# Ingests docs into memory_documents and refreshes memory_vectors embeddings.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
            ''|[[:space:]]*'#'*)
                continue
                ;;
        esac

        if [[ "$line" != *=* ]]; then
            continue
        fi

        key="${line%%=*}"
        value="${line#*=}"
        key="${key##${key%%[![:space:]]*}}"
        key="${key%%${key##*[![:space:]]}}"

        if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
            continue
        fi

        export "$key=$value"
    done < .env
fi

ARANGO_URL="${ARANGO_URL:-http://127.0.0.1:8529}"
ARANGO_DB="${ARANGO_DB:-${DATABASE_NAME:-sextant}}"
ARANGO_USER="${ARANGO_USER:-${ARANGODB_USER:-root}}"
ARANGO_PASSWORD="${ARANGO_PASSWORD:-${ARANGODB_ROOT_PASSWORD:-arangodb123}}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
EMBED_MODEL="${MEMORYGRAPH_EMBED_MODEL:-nomic-embed-text}"
EMBED_DIM="${EMBED_DIM:-64}"
USE_OLLAMA=true

usage() {
    cat <<'EOF'
Usage: ./scripts/sync_memorygraph.sh [options]

Options:
    --arango-url <url>       ArangoDB base URL (default: http://127.0.0.1:8529)
    --arango-db <name>       ArangoDB database (default: sextant)
  --arango-user <name>     ArangoDB user (default: root)
    --arango-password <pwd>  ArangoDB password (default: ARANGODB_ROOT_PASSWORD or arangodb123)
  --ollama-url <url>       Ollama base URL (default: http://127.0.0.1:11434)
  --embed-model <name>     Embedding model (default: nomic-embed-text)
  --embed-dim <n>          Fallback embedding dimension (default: 64)
  --no-ollama              Skip Ollama and always use deterministic fallback vectors
  -h, --help               Show this help message
EOF
}

while [ "$#" -gt 0 ]; do
    case "$1" in
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
        --embed-model)
            EMBED_MODEL="$2"
            shift 2
            ;;
        --embed-dim)
            EMBED_DIM="$2"
            shift 2
            ;;
        --no-ollama)
            USE_OLLAMA=false
            shift
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

export ARANGO_URL ARANGO_DB ARANGO_USER ARANGO_PASSWORD OLLAMA_URL EMBED_MODEL EMBED_DIM USE_OLLAMA

echo "Syncing MemoryGraph documents and vectors..."
python3 - <<'PY'
import base64
import hashlib
import json
import math
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional
from urllib.parse import unquote

root = Path.cwd()

doc_roots = [
    root / "docs" / "architecture",
    root / "docs" / "adr",
    root / "docs" / "domain",
    root / "docs" / "design-language",
]

arango_url = os.environ["ARANGO_URL"].rstrip("/")
arango_db = os.environ["ARANGO_DB"]
arango_user = os.environ["ARANGO_USER"]
arango_password = os.environ["ARANGO_PASSWORD"]
ollama_url = os.environ["OLLAMA_URL"].rstrip("/")
embed_model = os.environ["EMBED_MODEL"]
embed_dim = int(os.environ["EMBED_DIM"])
use_ollama = os.environ.get("USE_OLLAMA", "true").lower() == "true"

base = f"{arango_url}/_db/{arango_db}"
auth = base64.b64encode(f"{arango_user}:{arango_password}".encode("utf-8")).decode("ascii")


def request(method: str, url: str, payload=None, auth_header: Optional[str] = auth):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if auth_header:
        req.add_header("Authorization", f"Basic {auth_header}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
        return json.loads(body.decode("utf-8")) if body else {}


def ensure_collection(name: str, collection_type: int = 2) -> None:
    """Ensure Arango collection exists (2=document, 3=edge)."""
    try:
        request("GET", f"{base}/_api/collection/{name}")
        return
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise

    try:
        request(
            "POST",
            f"{base}/_api/collection",
            {
                "name": name,
                "type": collection_type,
            },
        )
    except urllib.error.HTTPError as exc:
        # Concurrent creation can race and return conflict.
        if exc.code != 409:
            raise


def infer_kind(rel_path: str) -> str:
    if rel_path.startswith("docs/architecture/"):
        return "architecture"
    if rel_path.startswith("docs/adr/"):
        return "adr"
    if rel_path.startswith("docs/domain/"):
        return "domain-concept"
    if rel_path.startswith("docs/design-language/"):
        return "design-language"
    return "memory"


def make_key(rel_path: str) -> str:
    key = rel_path.lower().replace("/", "__")
    key = re.sub(r"[^a-z0-9_.-]", "-", key)
    return key[:250]


def fallback_embedding(text: str, dim: int) -> list[float]:
    vec = [0.0] * dim
    for idx, token in enumerate(text.split()):
        digest = hashlib.sha256(token.encode("utf-8", errors="ignore")).digest()
        for j in range(dim):
            vec[j] += digest[j % len(digest)] / 255.0
        if idx > 1200:
            break

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def get_embedding(text: str) -> tuple[list[float], str]:
    global ollama_embedding_unavailable
    if use_ollama:
        candidates = [
            (f"{ollama_url}/api/embeddings", {"model": embed_model, "prompt": text[:8000]}),
            (f"{ollama_url}/api/embed", {"model": embed_model, "input": text[:8000]}),
        ]
        for endpoint, payload in candidates:
            try:
                data = request("POST", endpoint, payload, auth_header=None)
                if isinstance(data, dict):
                    err = data.get("error")
                    if isinstance(err, str) and "does not support embeddings" in err.lower():
                        ollama_embedding_unavailable = True
                        continue
                emb = data.get("embedding")
                if isinstance(emb, list) and emb:
                    return [float(x) for x in emb], "ollama"

                embeddings = data.get("embeddings")
                if isinstance(embeddings, list) and embeddings and isinstance(embeddings[0], list):
                    return [float(x) for x in embeddings[0]], "ollama"
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
                continue

    return fallback_embedding(text, embed_dim), "fallback"


# Connectivity preflight
request("GET", f"{base}/_api/version")

# Ensure required collections exist before writing documents.
ensure_collection("memory_documents", 2)
ensure_collection("memory_vectors", 2)
ensure_collection("memory_edges", 3)

files: list[Path] = []
for p in doc_roots:
    if p.exists():
        files.extend(sorted(f for f in p.rglob("*") if f.is_file()))

if not files:
    print("No documentation files found to index.")
    raise SystemExit(0)

doc_count = 0
vec_count = 0
edge_count = 0
ollama_used = 0
fallback_used = 0
ollama_embedding_unavailable = False
key_to_rel: dict[str, str] = {}
rel_to_key: dict[str, str] = {}

for path in files:
    rel = path.relative_to(root).as_posix()
    kind = infer_kind(rel)
    content = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem.replace("-", " ").replace("_", " ").strip().title() or rel
    key = make_key(rel)
    key_to_rel[key] = rel
    rel_to_key[rel] = key

    embed_text = f"{title}\n\n{content}"
    embedding, emb_source = get_embedding(embed_text)
    if emb_source == "ollama":
        ollama_used += 1
    else:
        fallback_used += 1

    tags = ["sextant", "docs", kind]
    if kind == "adr":
        tags.extend(["decision-record", "architecture-decision"])

    document = {
        "_key": key,
        "kind": kind,
        "title": title,
        "content": content,
        "tags": tags,
        "source": rel,
        "embedding": embedding,
        "metadata": {
            "repo": "Sextant",
            "path": rel,
            "embedding_source": emb_source,
            "embedding_model": embed_model if emb_source == "ollama" else f"deterministic-{embed_dim}",
            "indexed_from": "scripts/sync_memorygraph.sh",
        },
    }

    vector_doc = {
        "_key": key,
        "kind": kind,
        "title": title,
        "source": rel,
        "tags": tags,
        "embedding": embedding,
        "metadata": {
            "repo": "Sextant",
            "path": rel,
            "embedding_source": emb_source,
            "embedding_model": embed_model if emb_source == "ollama" else f"deterministic-{embed_dim}",
            "indexed_from": "scripts/sync_memorygraph.sh",
        },
    }

    request("POST", f"{base}/_api/document/memory_documents?overwriteMode=replace", document)
    request("POST", f"{base}/_api/document/memory_vectors?overwriteMode=replace", vector_doc)
    doc_count += 1
    vec_count += 1


def normalize_link_source(link_value: str, current_rel: str) -> Optional[str]:
    link_value = link_value.strip()
    if not link_value or "://" in link_value or link_value.startswith("mailto:"):
        return None

    target = link_value.split("#", 1)[0].strip()
    if not target:
        return None

    target = unquote(target)
    current_abs = (root / current_rel).resolve()
    candidate = (current_abs.parent / target).resolve()

    try:
        rel = candidate.relative_to(root).as_posix()
    except ValueError:
        return None

    if rel in rel_to_key:
        return rel

    if not rel.endswith(".md") and f"{rel}.md" in rel_to_key:
        return f"{rel}.md"

    return None


def edge_key(from_key: str, to_key: str, relation: str, detail: str = "") -> str:
    raw = f"{from_key}|{to_key}|{relation}|{detail}"
    return hashlib.sha1(raw.encode("utf-8", errors="ignore")).hexdigest()


edges: dict[str, dict] = {}

for from_rel, from_key in rel_to_key.items():
    text = (root / from_rel).read_text(encoding="utf-8", errors="ignore")
    for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", text):
        target_rel = normalize_link_source(link, from_rel)
        if not target_rel:
            continue

        to_key = rel_to_key[target_rel]
        if to_key == from_key:
            continue

        e_key = edge_key(from_key, to_key, "REFERENCES", target_rel)
        edges[e_key] = {
            "_key": e_key,
            "_from": f"memory_documents/{from_key}",
            "_to": f"memory_documents/{to_key}",
            "relation": "REFERENCES",
            "metadata": {
                "source": from_rel,
                "target": target_rel,
                "indexed_from": "scripts/sync_memorygraph.sh",
            },
        }

kind_groups: dict[str, list[str]] = {}
for rel, key in rel_to_key.items():
    kind = infer_kind(rel)
    kind_groups.setdefault(kind, []).append(key)

for kind, keys in kind_groups.items():
    if len(keys) < 2:
        continue
    hub = sorted(keys)[0]
    for key in sorted(keys):
        if key == hub:
            continue
        e_key = edge_key(key, hub, "IN_CATEGORY", kind)
        edges[e_key] = {
            "_key": e_key,
            "_from": f"memory_documents/{key}",
            "_to": f"memory_documents/{hub}",
            "relation": "IN_CATEGORY",
            "metadata": {
                "kind": kind,
                "indexed_from": "scripts/sync_memorygraph.sh",
            },
        }

for edge_doc in edges.values():
    request("POST", f"{base}/_api/document/memory_edges?overwriteMode=replace", edge_doc)
    edge_count += 1

request(
    "POST",
    f"{base}/_api/cursor",
    {
        "query": """
        FOR e IN memory_edges
            FILTER e.metadata.indexed_from == @source
            FILTER e._key NOT IN @keys
            REMOVE e IN memory_edges
        """,
        "bindVars": {
            "source": "scripts/sync_memorygraph.sh",
            "keys": list(edges.keys()),
        },
    },
)

print(f"Indexed documents: {doc_count}")
print(f"Updated vectors: {vec_count}")
print(f"Updated edges: {edge_count}")
print(f"Embedding source usage: ollama={ollama_used}, fallback={fallback_used}")
if use_ollama and ollama_used == 0 and fallback_used > 0:
    print("WARNING: No Ollama embeddings were produced; fallback deterministic vectors were used.")
if ollama_embedding_unavailable:
    print("WARNING: Ollama runtime reports embeddings are not supported.")
    print("WARNING: Fallback deterministic vectors were used for this sync.")
PY

echo "MemoryGraph sync complete."
