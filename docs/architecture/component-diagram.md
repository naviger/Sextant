# Component Diagram

## Runtime component view

```mermaid
flowchart TB
    subgraph Client[Client Runtime]
        Browser[Web Browser]
        FE[React Frontend\nVite + TypeScript]
        AuthCtx[AuthContext\nKeycloak state]
        Routes[React Router\nProtectedRoute]
        APIClient[Axios API client\nBearer token injection]
    end

    subgraph API[Backend Runtime]
        Main[FastAPI app\nmain.py]
        Security[Security layer\nJWT validation + RBAC]
        Users[Users routes\n/api/v1/users]
        Health[Health routes]
        DBLayer[Database wrapper\nArangoDB connection]
        AIClient[Ollama client]
    end

    subgraph Identity[Identity Platform]
        KC[Keycloak\nOIDC provider]
        PG[(PostgreSQL\nKeycloak state)]
    end

    subgraph Data[Data Platform]
        ADB[(ArangoDB\nApp data)]
    end

    subgraph DevOps[Developer Services]
        MH[MailHog\nemail trap]
        OLM[Ollama\nLLM runtime]
    end

    Browser --> FE
    FE --> AuthCtx
    FE --> Routes
    FE --> APIClient
    AuthCtx -->|OIDC init/login/logout| KC
    APIClient -->|Authorization: Bearer token| Main
    Main --> Security
    Main --> Users
    Main --> Health
    Security -->|JWKS validation| KC
    Users --> DBLayer
    Health --> DBLayer
    DBLayer --> ADB
    Main --> AIClient
    AIClient --> OLM
    KC --> PG
    KC --> MH
```

## Key responsibilities by component

### Frontend
- Renders the user experience
- Handles auth state through `AuthContext`
- Protects routes using `ProtectedRoute`
- Adds bearer tokens to API calls

### API backend
- Exposes the application surface area
- Performs token verification and permission checks
- Downloads or loads persistence data
- Coordinates AI calls and health checks

### Identity
- Centralizes authentication decisions
- Issues tokens and manages realm roles
- Persists user metadata and authentication state

### Data layer
- Stores the application’s strategic and user data in ArangoDB
- Stores Keycloak persistence in PostgreSQL

### Supporting services
- MailHog supports development email testing
- Ollama provides local LLM inference for AI-related features

## Dependency boundaries

- The browser never talks directly to ArangoDB.
- The frontend never writes database state directly.
- The backend is the only application component that accesses the app datastore.
- Keycloak sits outside the application domain but underpins trust and authorization.
