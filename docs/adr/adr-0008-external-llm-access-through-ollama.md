# ADR-0008: External LLM access through Ollama

- Status: Accepted

## Context

The platform includes an AI/LLM capability and the repository explicitly includes an Ollama service in the container stack. The codebase contains a dedicated client for communicating with an Ollama server instead of embedding model calls directly into the application logic.

## Decision

We will use Ollama as the external LLM gateway and keep model access behind a dedicated client abstraction.

## Consequences

- AI functionality is decoupled from the web API layer and can be swapped or configured separately.
- Model selection and infrastructure concerns are isolated to a single service boundary.
- Local experiments and production decisions remain consistent with a centralized LLM provider.
- The system currently does not yet integrate LLM services deeply into domain workflows, so this decision is infrastructural rather than fully productized.

## Evidence from code

- [docker-compose.yml](../../docker-compose.yml) includes an `ollama` service bound to port `11434`.
- [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py) defines `OllamaClient`, `OllamaModel`, and request functions such as `generate`, `stream_generate`, `list_models`, and `pull_model`.
- The service config in [docker-compose.yml](../../docker-compose.yml) sets `OLLAMA_HOST` and persists data in a named volume.
- [docs/OLLAMA.md](../OLLAMA.md) provides operational instructions for installing and using the local LLM service.
