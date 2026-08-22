# Quick Start Guide

This guide will get you up and running with Sextant in 5 minutes.

## Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Git
- ~8 GB free disk space
- ~2 GB RAM available

## Step 1: Clone and Setup

```bash
# Navigate to your workspace
cd ~/Documents/GitHub

# Clone the repository (or use existing directory)
cd Sextant

# Copy environment configuration
cp .env.example .env  # Already done, but do this if needed
```

## Step 2: Start Services

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/start.sh
```

**First run will take 2-5 minutes as Docker downloads and builds images.**

## Step 3: Verify Services Are Running

```bash
# Check service status
./scripts/logs.sh

# Or check individually
docker-compose ps
```

All services should show "Up" or "healthy".

## Step 4: Access the Application

Open these URLs in your browser:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Keycloak | http://localhost:8080/admin | User and role management |
| ArangoDB | http://localhost:8529 | Database viewer |
| MailHog | http://localhost:8025 | Email capture/testing |

## Step 5: Login

**Option 1: Demo User**
- Email: `demo@example.com`
- Password: `password123`

**Option 2: Admin User**
- Email: `admin@example.com`
- Password: `admin123`

Click "Login" on the frontend and enter either set of credentials.

## Common Issues

### Port Already in Use

If you get "port already allocated" error:

```bash
# Stop any existing containers
docker-compose down

# Or change ports in docker-compose.yml
```

### Docker Not Running

```bash
# macOS/Windows: Open Docker Desktop application
open -a Docker

# Linux: Start Docker daemon
sudo systemctl start docker
```

### Containers Won't Start

```bash
# Check logs for errors
./scripts/logs.sh api
./scripts/logs.sh app
./scripts/logs.sh keycloak

# Rebuild images
docker-compose build --no-cache

# Restart everything
./scripts/restart.sh
```

### Slow Performance

- Ensure Docker has sufficient memory (4+ GB recommended)
- Stop other resource-heavy applications
- Check disk space: `df -h`

### Reset Everything

```bash
# Stop services
./scripts/stop.sh

# Remove all containers and volumes (WARNING: deletes data)
docker-compose down -v

# Clean Docker system
docker system prune -a

# Start fresh
./scripts/start.sh
```

## What's Running

**5 Services:**
1. **Frontend** (React + TypeScript) - Your application UI
2. **Backend API** (Python FastAPI) - REST API endpoints
3. **Keycloak** (OIDC Server) - Authentication & user management
4. **ArangoDB** (Multi-model Database) - Data storage
5. **MailHog** (Email Trap) - Email testing

**Supporting:**
- PostgreSQL - Database for Keycloak (internal)
- Docker Network - Internal communication

## Next Steps

1. **Explore API Documentation** → http://localhost:8000/docs
2. **Manage Users** → http://localhost:8080/admin
3. **View Emails** → http://localhost:8025
4. **Read Full Docs** → See `/docs` folder
5. **Start Developing** → Edit files in `app/src/` or `api/app/`

## Development Workflow

### Frontend Changes

```bash
# Edit files in app/src/
# Changes auto-reload at http://localhost:3000
```

### Backend Changes

```bash
# Edit files in api/app/
# Changes auto-reload at http://localhost:8000
```

### Database Changes

```bash
# Connect to ArangoDB at http://localhost:8529
# Create collections and queries as needed
```

## Useful Commands

```bash
# View all logs
./scripts/logs.sh

# View specific service logs
./scripts/logs.sh api      # Backend
./scripts/logs.sh app      # Frontend
./scripts/logs.sh keycloak # Auth server

# Restart a service
docker-compose restart api

# Execute command in container
docker-compose exec api bash  # API shell
docker-compose exec app bash  # Frontend shell

# Stop services (keeps data)
./scripts/stop.sh

# Stop and remove everything (deletes data)
docker-compose down -v
```

## Documentation

- **README.md** - Project overview
- **docs/security-config.md** - Keycloak setup
- **docs/DEPLOYMENT.md** - Production deployment
- **docs/MAILHOG.md** - Email testing
- **docs/specs/OIDC-FLOW.md** - Authentication flow
- **CONTRIBUTING.md** - Development guidelines

## Getting Help

1. Check **docs/TROUBLESHOOTING.md** for common issues
2. View container logs: `./scripts/logs.sh [service]`
3. Restart services: `./scripts/restart.sh`
4. Reset everything: `docker-compose down -v && ./scripts/start.sh`

## That's It! 🎉

You should now have:
- ✓ Frontend accessible at http://localhost:3000
- ✓ Backend API documented at http://localhost:8000/docs
- ✓ Authentication working with Keycloak
- ✓ Database ready for data
- ✓ Email testing with MailHog

**Happy developing!**

---

## Tips & Tricks

### Watch Logs in Real-time

```bash
# Follow all service logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api
```

### Test API Endpoints

```bash
# Check health
curl http://localhost:8000/health

# Get API version
curl http://localhost:8000/version
```

### Database Access

```bash
# ArangoDB shell
docker-compose exec arangodb arangosh

# PostgreSQL for Keycloak
docker-compose exec postgres psql -U keycloak -d keycloak
```

### Clean and Rebuild

```bash
# Remove all images and containers
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-08-16
