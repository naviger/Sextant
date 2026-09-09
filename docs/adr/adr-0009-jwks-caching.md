# ADR-0009: JWKS caching to reduce repeated Keycloak validation overhead

- Status: Accepted

## Context

The backend validates bearer tokens against Keycloak. Repeatedly fetching the JWKS on each request would impose unnecessary network and latency overhead. The security layer already has a pattern that suggests the application values cached validation material.

## Decision

We will cache the Keycloak JWKS response using an LRU cache in the security layer before token verification.

## Consequences

- Token validation avoids repeated remote fetches for the same trust material.
- Startup and request latency are reduced for secure API traffic.
- The security boundary still depends on Keycloak being reachable when the cache expires or is first populated.
- The implementation is intentionally lightweight and does not include a more advanced cache strategy or distributed invalidation layer.

## Evidence from code

- [api/app/core/security.py](../../api/app/core/security.py) uses `@lru_cache(maxsize=1)` on `get_jwks()`.
- The function fetches the Keycloak certs endpoint and caches the parsed JSON response for repeated use.
- The `decode_token` function delegates to token verification logic that assumes the trusted signing material is available from the cached JWKS path.
