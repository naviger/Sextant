# Ollama LLM Integration Guide

## Overview

Ollama provides local LLM (Large Language Model) access for AI-powered features without requiring external API calls. The Sextant application includes Ollama support for development and production use.

## Quick Start

### 1. Start Services with Ollama

```bash
./scripts/start.sh
```

Ollama will start automatically on port 11434.

### 2. Pull Your First Model

```bash
# Pull Llama 2 (default, 4GB)
docker-compose exec ollama ollama pull llama2

# Or choose another model:
docker-compose exec ollama ollama pull mistral          # Faster, 4GB
docker-compose exec ollama ollama pull neural-chat      # Fast, 4GB
docker-compose exec ollama ollama pull orca-mini        # Fast, 2GB
docker-compose exec ollama ollama pull zephyr           # Very fast, 4GB
```

### 3. Test the Model

```bash
curl -X POST http://localhost:11434/api/generate \
  -d '{
    "model": "llama2",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'
```

### 4. Use in Your Application

#### Python (Backend)

```python
import requests
from typing import Optional

class OllamaClient:
    def __init__(self, base_url: str = "http://ollama:11434"):
        self.base_url = base_url

    def generate(
        self,
        prompt: str,
        model: str = "llama2",
        stream: bool = False,
        temperature: float = 0.7
    ) -> str:
        """Generate text using Ollama"""
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": temperature
                }
            },
            timeout=300
        )
        
        if response.status_code == 200:
            return response.json()["response"]
        else:
            raise Exception(f"Ollama error: {response.text}")

    def list_models(self) -> list:
        """List available models"""
        response = requests.get(f"{self.base_url}/api/tags")
        if response.status_code == 200:
            return response.json().get("models", [])
        return []


# Usage in FastAPI endpoint
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
ollama = OllamaClient()

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "llama2"
    temperature: float = 0.7

@router.post("/api/v1/llm/generate")
async def generate_text(request: GenerateRequest):
    """Generate text using Ollama LLM"""
    try:
        response = ollama.generate(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature
        )
        return {"response": response, "model": request.model}
    except Exception as e:
        return {"error": str(e)}, 500

@router.get("/api/v1/llm/models")
async def list_models():
    """List available models"""
    return {"models": ollama.list_models()}
```

#### JavaScript/TypeScript (Frontend)

```typescript
// src/services/ollama.ts

interface GenerateOptions {
  model?: string;
  temperature?: number;
  stream?: boolean;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<string> {
    const {
      model = "llama2",
      temperature = 0.7,
      stream = false
    } = options;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        stream,
        options: { temperature }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch models");
    }

    const data = await response.json();
    return data.models || [];
  }

  async streamGenerate(
    prompt: string,
    options: GenerateOptions = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const {
      model = "llama2",
      temperature = 0.7
    } = options;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: { temperature }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to stream from Ollama");
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              onChunk(json.response);
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Usage in React component
import { useState } from "react";
import { OllamaService } from "@/services/ollama";

const ollama = new OllamaService();

export function AIAssistant() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setResponse("");
    
    try {
      await ollama.streamGenerate(prompt, {}, (chunk) => {
        setResponse(prev => prev + chunk);
      });
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-assistant">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask me anything..."
        disabled={loading}
      />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Thinking..." : "Generate"}
      </button>
      {response && <pre>{response}</pre>}
    </div>
  );
}
```

## Available Models

| Model | Size | Speed | Notes |
|-------|------|-------|-------|
| **llama2** | 4GB | Moderate | Default, well-balanced |
| **mistral** | 4GB | Fast | Faster responses |
| **neural-chat** | 4GB | Moderate | Optimized for chat |
| **orca-mini** | 2GB | Very Fast | Lightweight |
| **zephyr** | 4GB | Fast | Instruction-tuned |
| **openchat** | 4GB | Moderate | Good quality |
| **dolphin-mixtral** | 26GB | Moderate | Very capable (needs GPU) |

### Pulling Models

```bash
# Pull multiple models
docker-compose exec ollama ollama pull llama2
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull neural-chat

# List all pulled models
docker-compose exec ollama ollama list

# Remove a model to save space
docker-compose exec ollama ollama rm mistral
```

## API Endpoints

### Generate Text

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "What is machine learning?",
    "stream": false
  }'
```

**Response:**
```json
{
  "model": "llama2",
  "created_at": "2024-01-15T10:30:00Z",
  "response": "Machine learning is a subset of artificial intelligence...",
  "done": true,
  "context": [1, 2, 3, ...],
  "total_duration": 5000000000,
  "load_duration": 1000000000,
  "prompt_eval_count": 12,
  "prompt_eval_duration": 2000000000,
  "eval_count": 48,
  "eval_duration": 2000000000
}
```

### Stream Response

Use `"stream": true` to get real-time responses:

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "Count to 5",
    "stream": true
  }' | while IFS= read -r line; do
  echo "$line" | jq -r '.response'
done
```

### List Models

```bash
curl http://localhost:11434/api/tags
```

**Response:**
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 3826519040,
      "digest": "sha256:..."
    }
  ]
}
```

## Performance Optimization

### GPU Acceleration

For NVIDIA GPUs, uncomment the GPU section in docker-compose.yml:

```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

### Temperature & Top-P

Control response creativity:

```python
{
  "model": "llama2",
  "prompt": "Write a poem",
  "options": {
    "temperature": 0.9,  # 0.0=deterministic, 1.0=creative
    "top_p": 0.95,       # Nucleus sampling
    "top_k": 40          # Top K sampling
  }
}
```

### Timeout Configuration

Set in .env:
```bash
OLLAMA_REQUEST_TIMEOUT=300  # seconds
```

## Troubleshooting

### Model Not Found

```bash
# List available models
docker-compose exec ollama ollama list

# Pull the model
docker-compose exec ollama ollama pull llama2
```

### Connection Refused

```bash
# Check if Ollama is running
docker-compose ps ollama

# View Ollama logs
./scripts/logs.sh ollama

# Restart Ollama
docker-compose restart ollama
```

### Out of Memory

Ollama requires RAM for model loading:
- llama2 (4B): ~4GB RAM
- mistral (7B): ~8GB RAM
- Neural-chat: ~8GB RAM

To use smaller models:
```bash
docker-compose exec ollama ollama pull orca-mini  # 2GB
```

### Slow Responses

Use a faster model or enable GPU acceleration:

```bash
# Try a faster model
docker-compose exec ollama ollama pull mistral

# Or reduce model size
docker-compose exec ollama ollama pull orca-mini
```

## Production Deployment

### With GPU

```yaml
ollama:
  image: ollama/ollama:latest
  environment:
    NVIDIA_VISIBLE_DEVICES: all
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

### Resource Limits

```yaml
ollama:
  deploy:
    resources:
      limits:
        cpus: "4.0"
        memory: 16G
      reservations:
        cpus: "2.0"
        memory: 8G
```

### Persistent Storage

Already configured via `ollama-data` volume. Models persist across restarts.

## Security Considerations

1. **Network Access**: Ollama listens on `0.0.0.0:11434` by default
   - Only accessible from within the Docker network in production
   - Add firewall rules for external access if needed

2. **Rate Limiting**: Implement in your API layer
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   
   @router.post("/api/v1/llm/generate")
   @limiter.limit("10/minute")
   async def generate_text(request: GenerateRequest):
       ...
   ```

3. **Input Validation**: Always validate user prompts
   ```python
   if len(prompt) > 2000:
       raise ValueError("Prompt too long")
   ```

## Example Use Cases

### Code Generation
```python
prompt = "Generate a Python function to calculate Fibonacci numbers"
response = await ollama.generate(prompt, model="mistral")
```

### Content Creation
```python
prompt = "Write a blog post about machine learning"
response = await ollama.generate(prompt, model="llama2", temperature=0.8)
```

### Summarization
```python
prompt = f"Summarize this text:\n\n{long_text}"
response = await ollama.generate(prompt, model="mistral")
```

### Q&A System
```python
prompt = f"Context:\n{context}\n\nQuestion: {question}"
response = await ollama.generate(prompt, model="neural-chat")
```

## Resources

- **Ollama Website**: https://ollama.ai
- **Model Library**: https://ollama.ai/library
- **Documentation**: https://github.com/ollama/ollama
- **Discord Community**: https://discord.gg/ollama

## Next Steps

1. ✅ Start Ollama with: `./scripts/start.sh`
2. ✅ Pull a model: `docker-compose exec ollama ollama pull llama2`
3. ✅ Test it: See examples above
4. ✅ Integrate into your app: Use Python or JavaScript client
5. ✅ Monitor performance: Check logs and response times
