# Architecture Context

Before answering:

1. Query MemoryGraph first.
2. Prefer:
   - search_architecture
   - search_adrs
3. Use only the minimum number of memory queries required.
4. Stop once sufficient context is found.
5. Do not infer architectural decisions.
6. If architecture knowledge is missing from MemoryGraph but discoverable in code, identify the missing knowledge and propose documentation updates.

Answer format:

- Retrieved Architecture Knowledge
- Current Code Evidence
- Recommendation