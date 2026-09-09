# Ollama Client

## Purpose

The Ollama client wraps access to the local AI service used for model generation, metadata retrieval, and model management. It gives the backend a consistent access layer to the LLM infrastructure.

## Public API

- `generate(prompt, model=None, stream=False, options=None)`
- `stream_generate(prompt, model=None, options=None)`
- `list_models()`
- `model_info(model_name)`
- `pull_model(model_name)`

## Dependencies

- `requests`
- Ollama HTTP service at the configured base URL
- App configuration values for model and endpoint settings

## Consumers

- Future AI-enabled strategy or recommendation workflows
- Existing backend endpoints that need generative or model metadata behavior

## Integration Points

- Calls the local Ollama server over HTTP
- Can pull or inspect models before generation
- Is structured as a service layer to isolate LLM behavior from route logic

## Source Code Evidence

- [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py)
- [docker-compose.yml](../../docker-compose.yml)
- [api/app/routes/llm_endpoints.py](../../api/app/routes/llm_endpoints.py)
