# 🎯 Quick Reference - Sextant Startup & Ollama

## 🚀 Start Everything (One Command)

```bash
cd /Users/jakesmith/Documents/GitHub/Sextant
./scripts/start.sh
```

**What it does:**
- ✅ Validates Docker daemon is running (with instructions if not)
- ✅ Builds all Docker images
- ✅ Starts all 7 services
- ✅ Waits for services to initialize (15 seconds)
- ✅ Checks health of each service
- ✅ Displays all URLs and credentials
- ✅ Shows Ollama setup guide

---

## 📍 Service URLs (After Start)

| Service | URL | Login |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | demo@example.com / password123 |
| **API Docs** | http://localhost:8000/docs | (No auth) |
| **Keycloak Admin** | http://localhost:8080/admin | admin / changeme123 |
| **ArangoDB** | http://localhost:8529 | root / arangodb123 |
| **MailHog** | http://localhost:8025 | (No auth) |
| **Ollama API** | http://localhost:11434 | (No auth) |

---

## 🤖 Ollama (Local AI/LLM)

### First Time Setup

```bash
# Start services (already includes Ollama)
./scripts/start.sh

# Pull a model (takes 5-15 minutes first time)
docker-compose exec ollama ollama pull mistral

# Quick models (for faster first start):
docker-compose exec ollama ollama pull orca-mini  # 2GB (very fast)
```

### Test It

```bash
# List models
curl http://localhost:11434/api/tags

# Generate text
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"mistral","prompt":"Hello! How are you?"}'

# Stream response (real-time)
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"mistral","prompt":"Count to 5","stream":true}'
```

### Use in Python

```python
from app.services.ollama_client import OllamaClient

client = OllamaClient()

# Generate text
response = client.generate(
    "Write a Python function to calculate Fibonacci",
    model="mistral",
    temperature=0.7
)
print(response)

# Stream response
for chunk in client.stream_generate("Tell me a story"):
    print(chunk, end="", flush=True)

# List available models
models = client.list_models()
for model in models:
    print(f"- {model['name']}")

client.close()
```

### Use in FastAPI

```python
from fastapi import APIRouter
from app.services.ollama_client import AsyncOllamaClient

router = APIRouter()

@router.post("/generate")
async def generate(prompt: str):
    async with AsyncOllamaClient() as client:
        response = await client.generate(prompt)
        return {"response": response}

# Or use pre-built endpoints at:
# POST /api/v1/llm/generate - Text generation
# GET /api/v1/llm/models - List models
# POST /api/v1/llm/summarize - Summarization
# POST /api/v1/llm/qa - Question answering
# POST /api/v1/llm/classify - Text classification
```

---

## ⚙️ Common Commands

```bash
# View logs for a service
./scripts/logs.sh api         # FastAPI logs
./scripts/logs.sh app         # React frontend logs
./scripts/logs.sh ollama      # Ollama logs
./scripts/logs.sh mailhog     # MailHog logs

# Check service status
docker-compose ps

# Stop all services (keeps data)
./scripts/stop.sh

# Restart services
./scripts/restart.sh

# Full reset (deletes all data - careful!)
docker-compose down -v
./scripts/start.sh

# Access a service's shell
docker-compose exec api bash       # Python API shell
docker-compose exec app bash       # Frontend shell
docker-compose exec ollama bash    # Ollama container
```

---

## 🔧 Troubleshooting

### Docker Not Running
**Error:** `❌ ERROR: Docker daemon is not running.`

**Fix:**
```bash
# macOS
open /Applications/Docker.app

# Linux
sudo systemctl start docker
```

### Port Already in Use
**Error:** `bind: Address already in use`

**Fix:**
```bash
# Find what's using the port
lsof -i :3000      # Frontend
lsof -i :8000      # API
lsof -i :11434     # Ollama

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Services Won't Start
**Error:** Container exits immediately

**Fix:**
```bash
# Check specific service logs
./scripts/logs.sh api | tail -50

# Rebuild images
docker-compose build --no-cache

# Try again
./scripts/start.sh
```

### Ollama Won't Download Models
**Error:** `curl: (7) Failed to connect`

**Fix:**
```bash
# Wait longer - first start might take a minute
sleep 30

# Check if Ollama is running
docker-compose ps ollama

# View Ollama logs
./scripts/logs.sh ollama

# Restart Ollama
docker-compose restart ollama
```

### Out of Disk Space
**Error:** `No space left on device`

**Fix:**
```bash
# Check available space
df -h

# Remove unused Docker images/containers
docker system prune

# Or clean everything (careful!)
docker system prune -a -v
```

---

## 📚 Documentation Files

**Quick Start:**
- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup

**Setup & Config:**
- [OLLAMA_SETUP.md](OLLAMA_SETUP.md) - Ollama setup summary
- [docs/OLLAMA.md](docs/OLLAMA.md) - Complete Ollama guide (500+ lines)
- [.env](.env) - Environment configuration

**Development:**
- [START_HERE.md](START_HERE.md) - Project overview
- [INDEX.md](INDEX.md) - Complete navigation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

**API & Code:**
- [api/app/services/ollama_client.py](api/app/services/ollama_client.py) - Python client
- [api/app/routes/llm_endpoints.py](api/app/routes/llm_endpoints.py) - FastAPI endpoints
- [api/tests/test_ollama.py](api/tests/test_ollama.py) - Tests

**Troubleshooting:**
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - 50+ solutions

---

## 🎯 Next Steps

1. **Start Services:**
   ```bash
   ./scripts/start.sh
   ```

2. **Access Frontend:**
   - Open http://localhost:3000
   - Login: `demo@example.com` / `password123`

3. **Try the API:**
   - Open http://localhost:8000/docs
   - Expand and test endpoints

4. **Setup Ollama Model:**
   ```bash
   docker-compose exec ollama ollama pull mistral
   ```

5. **Test Ollama:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

6. **Add LLM Features to Your App:**
   - Use Python client from `api/app/services/ollama_client.py`
   - Use FastAPI endpoints from `api/app/routes/llm_endpoints.py`
   - See [docs/OLLAMA.md](docs/OLLAMA.md) for examples

---

## ✅ Verification Checklist

After running `./scripts/start.sh`:

- [ ] All containers show "Up" in `docker-compose ps`
- [ ] Frontend loads at http://localhost:3000
- [ ] Can login with demo credentials
- [ ] API docs load at http://localhost:8000/docs
- [ ] Keycloak loads at http://localhost:8080/admin
- [ ] MailHog loads at http://localhost:8025
- [ ] Ollama responds at http://localhost:11434/api/tags
- [ ] No error messages in logs

---

## 🚨 Emergency Commands

```bash
# Stop everything immediately
docker-compose down

# Kill all containers forcefully
docker-compose kill

# Remove all containers and volumes (CLEARS ALL DATA)
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache --pull
./scripts/start.sh

# View all logs at once
docker-compose logs -f

# Clean up Docker system
docker system prune -a --volumes
```

---

## 💡 Pro Tips

1. **Models are cached** - First pull takes time, subsequent starts are fast
2. **Use smaller models first** - `orca-mini` (2GB) is faster than `llama2` (4GB)
3. **Stream for better UX** - Use `stream=true` for real-time feedback
4. **Check health before developing** - `./scripts/logs.sh ollama` if issues
5. **Use temperature wisely** - 0.3 for facts, 0.7-0.9 for creativity
6. **Monitor disk space** - Models can use several GB
7. **Enable GPU if available** - See [docs/OLLAMA.md](docs/OLLAMA.md) for GPU setup

---

**Status:** ✅ Ready to develop with AI/LLM support!  
**Last Updated:** August 16, 2026
