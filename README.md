# Sextant - Full-Stack Application

A modern full-stack application featuring secure identity management with Keycloak OIDC, a React TypeScript frontend, Python FastAPI backend, and ArangoDB Enterprise database.

## Architecture Overview

- **Frontend**: React with TypeScript - Modern, responsive web UI with OIDC authentication
- **Backend**: Python FastAPI - RESTful API with JWT authorization
- **Authentication**: Keycloak - Enterprise-grade identity provider (OIDC/OAuth2)
- **Database**: ArangoDB Enterprise - Multi-model database for flexible data management
- **Containerization**: Docker & Docker Compose - Consistent development and deployment

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Setup and Running

```bash
# Start all services
./scripts/start.sh

# Restart services
./scripts/restart.sh

# Shutdown services
./scripts/stop.sh
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Keycloak Admin**: http://localhost:8080/admin
- **ArangoDB**: http://localhost:8529
- **MailHog**: http://localhost:8025 (Email Web UI)

API Documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

```
.
├── app/                          # React TypeScript frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API and auth services
│   │   ├── context/             # React context for auth state
│   │   ├── types/               # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── api/                          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── core/                # Core configurations
│   │   │   └── security.py      # OIDC/JWT security
│   │   ├── routes/              # API routes
│   │   ├── schemas/             # Pydantic schemas
│   │   └── dependencies.py      # Dependency injection
│   ├── requirements.txt
│   ├── .env
│   ├── Dockerfile
│   └── pytest.ini
│
├── infra/                        # Docker infrastructure
│   ├── docker-compose.yml
│   ├── keycloak/
│   │   ├── Dockerfile
│   │   └── realm-config.json
│   ├── arangodb/
│   │   └── Dockerfile
│   └── nginx/
│       └── nginx.conf
│
├── docs/                        # Documentation
│   ├── README.md
│   ├── security-config.md        # Keycloak setup guide
│   ├── api-spec.md               # API documentation
│   └── specs/                    # Specification documents
│       └── OIDC-FLOW.md
│
├── scripts/                      # Management scripts
│   ├── start.sh
│   ├── restart.sh
│   └── stop.sh
│
├── .env.example                  # Example environment variables
└── docker-compose.yml            # Root compose file
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `KEYCLOAK_ADMIN_PASSWORD`: Keycloak admin password
- `ARANGODB_ROOT_PASSWORD`: ArangoDB root password
- `FRONTEND_URL`: Frontend application URL
- `API_URL`: Backend API URL
- `OIDC_CLIENT_SECRET`: Keycloak client secret

## Development

### Frontend Development

```bash
cd app
npm install
npm run dev
```

### Backend Development

```bash
cd api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Security

See [docs/security-config.md](docs/security-config.md) for:
- Keycloak realm and client configuration
- OIDC setup instructions
- JWT token validation
- User roles and permissions
- Best practices for production

## API Documentation

The FastAPI backend includes interactive documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database

ArangoDB configuration and migration scripts are in the `api/migrations/` folder. Access the ArangoDB Web UI at http://localhost:8529 (default credentials: root/password).

## Deployment

For production deployment, refer to:
- Docker image optimization guidelines
- Kubernetes deployment configs (if applicable)
- Environment-specific configurations in `docs/specs/`

## Support & Documentation

- [Security Configuration](docs/security-config.md)
- [OIDC Flow Documentation](docs/specs/OIDC-FLOW.md)
- [API Specification](docs/api-spec.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## License

Proprietary - All rights reserved
