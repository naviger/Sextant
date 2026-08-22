# Troubleshooting Guide

## Common Issues and Solutions

### Services Won't Start

#### Docker is not running
**Error:**
```
Cannot connect to Docker daemon
```

**Solution:**
1. Start Docker Desktop (macOS/Windows) or Docker daemon (Linux)
2. Verify Docker is running: `docker ps`

#### Port already in use
**Error:**
```
Bind for 0.0.0.0:3000 failed: port is already allocated
```

**Solution:**
1. Identify the process using the port: `lsof -i :3000`
2. Either stop that process or change the port in `docker-compose.yml`

#### Insufficient disk space
**Error:**
```
No space left on device
```

**Solution:**
1. Free up disk space
2. Clean Docker: `docker system prune -a`
3. Remove old images: `docker image prune`

---

### Keycloak Issues

#### Can't access Keycloak admin console
**URL:** http://localhost:8080/admin

**Solution:**
1. Check if Keycloak container is running: `./scripts/logs.sh keycloak`
2. Wait for startup (can take 1-2 minutes): `docker-compose ps keycloak`
3. Verify network: `docker network ls`
4. Check logs: `./scripts/logs.sh keycloak`

#### Forgot Keycloak admin password
**Solution:**
1. Stop containers: `./scripts/stop.sh`
2. Change password in `.env`: Update `KEYCLOAK_ADMIN_PASSWORD`
3. Delete volume: `docker volume rm sextant_keycloak-data`
4. Start again: `./scripts/start.sh`

#### Can't login to Keycloak with demo credentials
**Solution:**
1. Verify users are created in realm (Menu → Users)
2. Check user is enabled (icon should be blue)
3. Check credentials in demo accounts:
   - Username: `demo`, Password: `password123`
   - Username: `admin`, Password: `admin123`
4. Reset password if needed (User → Reset Password)

#### CORS error when accessing from frontend
**Error in console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Verify Keycloak Web Origins config:
   - Clients → sextant-app → Web Origins
   - Should include: `http://localhost:3000`
2. Verify redirect URIs:
   - Should include: `http://localhost:3000/*`
3. Restart Keycloak: `./scripts/restart.sh`

#### Keycloak database connection error
**Error in logs:**
```
Could not connect to database
```

**Solution:**
1. Check PostgreSQL container: `./scripts/logs.sh postgres`
2. Verify database credentials match in `docker-compose.yml`
3. Check network connectivity between containers
4. Restart both Keycloak and PostgreSQL: `./scripts/restart.sh`

---

### Frontend Issues

#### Port 3000 connection refused
**Error:**
```
Cannot GET http://localhost:3000
```

**Solution:**
1. Check container is running: `docker-compose ps app`
2. View logs: `./scripts/logs.sh app`
3. Verify .env variables are correct
4. Check npm build succeeded

#### Login redirects to blank page
**Solution:**
1. Check browser console for errors
2. Verify Keycloak configuration:
   - `VITE_KEYCLOAK_URL` points to correct Keycloak URL
   - `VITE_KEYCLOAK_REALM` matches realm name
   - `VITE_KEYCLOAK_CLIENT_ID` matches client ID
3. Check Keycloak client configuration:
   - Valid redirect URIs include `http://localhost:3000/*`
4. Restart frontend: `docker-compose restart app`

#### "Invalid Client" error during login
**Solution:**
1. Verify client ID in .env matches Keycloak configuration
2. Check if client is enabled in Keycloak
3. Verify public client setting (should be "ON" for frontend)
4. Clear browser cache and restart

#### Styles not loading (unstyled page)
**Solution:**
1. Check that Tailwind CSS is loading from CDN
2. Verify .env variables are set
3. Check browser console for network errors
4. Rebuild frontend: `docker-compose rebuild app`

---

### API (Backend) Issues

#### API won't start / 500 errors
**Solution:**
1. Check logs: `./scripts/logs.sh api`
2. Verify database connection in logs
3. Check .env file is correct
4. Verify ArangoDB is healthy: `docker-compose ps arangodb`

#### Can't connect to ArangoDB
**Error in logs:**
```
Failed to connect to ArangoDB at http://arangodb:8529
```

**Solution:**
1. Verify ArangoDB container is running: `docker-compose ps arangodb`
2. Check credentials in .env: `ARANGODB_ROOT_PASSWORD`
3. Verify container network: `docker network inspect sextant-network`
4. Check logs: `./scripts/logs.sh arangodb`
5. Restart ArangoDB: `docker-compose restart arangodb`

#### 401 Unauthorized on API calls
**Error:**
```
{"detail":"Invalid token"}
```

**Solution:**
1. Verify token is being sent in Authorization header
2. Check token is not expired
3. Verify Keycloak URL in API config
4. Check token contains required claims
5. View token claims at: https://jwt.io

#### 403 Forbidden on protected routes
**Error:**
```
{"detail":"User does not have required role: admin"}
```

**Solution:**
1. Verify user has required role in Keycloak
2. Check role is assigned to user profile
3. Verify role is in client scope
4. Generate new token after role assignment
5. Refresh browser / re-login

#### CORS errors from frontend calling API
**Error:**
```
Access to fetch at 'http://localhost:8000/api/v1/users/me' 
blocked by CORS policy
```

**Solution:**
1. Check API CORS configuration in `app/main.py`
2. Verify `CORS_ORIGINS` in .env includes frontend URL
3. Restart API: `docker-compose restart api`
4. Check browser console for exact CORS error message

#### Database connection pooling issues
**Error:**
```
Too many connections / Connection pool exhausted
```

**Solution:**
1. Check for connection leaks in code
2. Reduce number of workers in API: `api/app/main.py`
3. Increase connection pool size in database config
4. Restart API: `docker-compose restart api`

---

### Database Issues

#### ArangoDB won't start
**Solution:**
1. Check logs: `./scripts/logs.sh arangodb`
2. Verify storage volume: `docker volume ls`
3. Check disk space: `df -h`
4. Try removing volume (WARNING: data loss): 
   ```bash
   docker volume rm sextant_arangodb-data
   ./scripts/restart.sh
   ```

#### Can't access ArangoDB Web UI
**URL:** http://localhost:8529

**Solution:**
1. Wait for startup (can take 30 seconds)
2. Verify container is running and healthy
3. Check credentials: root / (password from .env)
4. Try direct curl: `curl http://localhost:8529/_api/version`

#### Database quota exceeded
**Solution:**
1. Check database size: `du -sh /var/lib/docker/volumes/sextant_arangodb-data`
2. Clean old data if needed
3. Increase Docker disk allocation

#### Data lost after container restart
**Important:** Volumes persist data between restarts. If data is lost:
1. Check volume exists: `docker volume ls | grep sextant`
2. Verify volume mount in docker-compose.yml
3. Check permissions on volume directory
4. Restore from backup if available

---

### Network & Connectivity Issues

#### Containers can't communicate with each other
**Error:**
```
Name does not resolve
```

**Solution:**
1. Verify all containers are on same network: `docker network inspect sextant-network`
2. Check service names in docker-compose.yml match hostnames used in code
3. Verify no typos in URLs (e.g., `http://keycloak:8080`)
4. Restart network: `docker-compose down && docker-compose up -d`

#### Host can't connect to containers
**Error:**
```
Connection refused
```

**Solution:**
1. Verify ports are exposed in docker-compose.yml
2. Check firewall isn't blocking ports
3. Use `localhost` or `127.0.0.1` instead of container name when connecting from host
4. Verify port mappings: `docker-compose ps`

---

### Performance Issues

#### Services running slowly
**Solution:**
1. Check system resources: `docker stats`
2. Increase Docker memory/CPU allocation
3. Check logs for errors: `./scripts/logs.sh`
4. Monitor database: http://localhost:8529/_admin/aardvark/
5. Check network bandwidth usage

#### High memory usage
**Solution:**
1. Check which container uses most: `docker stats`
2. Limit memory in docker-compose.yml
3. Reduce number of workers/connections
4. Check for memory leaks in logs

---

### Debugging Tips

#### View service logs
```bash
# All services
./scripts/logs.sh

# Specific service
./scripts/logs.sh api
./scripts/logs.sh app
./scripts/logs.sh keycloak
./scripts/logs.sh arangodb
./scripts/logs.sh postgres

# Follow logs (tail)
docker-compose logs -f [service]

# Last 100 lines
docker-compose logs --tail 100 [service]
```

#### Execute commands in container
```bash
# Bash shell in API container
docker-compose exec api bash

# Python shell in API container
docker-compose exec api python

# PostgreSQL CLI
docker-compose exec postgres psql -U keycloak -d keycloak

# ArangoDB shell
docker-compose exec arangodb arangosh
```

#### Check container status
```bash
# See all containers and their status
docker-compose ps

# Check specific container
docker-compose ps [service]

# Health check status
docker-compose ps | grep healthy
```

#### Network debugging
```bash
# Test connectivity between containers
docker-compose exec app ping keycloak

# DNS resolution
docker-compose exec app nslookup api

# Port connectivity
docker-compose exec app curl -v http://api:8000/health
```

#### Reset Everything
```bash
# Stop all containers
./scripts/stop.sh

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down -v --remove-orphans --rmi all

# Clean up Docker system
docker system prune -a --volumes

# Fresh start
./scripts/start.sh
```

---

## Getting Help

1. **Check Logs First:** `./scripts/logs.sh`
2. **Read Documentation:** See `/docs` folder
3. **GitHub Issues:** Open issue with:
   - Error message
   - Logs output
   - Steps to reproduce
   - Docker version
   - OS and hardware info
4. **Community Support:**
   - Keycloak: https://www.keycloak.org/community
   - FastAPI: https://fastapi.tiangolo.com/
   - ArangoDB: https://www.arangodb.com/community/

## Common Command Reference

```bash
# Start services
./scripts/start.sh

# Restart services  
./scripts/restart.sh

# Stop services
./scripts/stop.sh

# View logs
./scripts/logs.sh [service]

# Rebuild images
docker-compose build --no-cache

# Full reset
./scripts/stop.sh && docker volume prune -f && ./scripts/start.sh

# Health check
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:8080
curl http://localhost:8529
```

## Still Having Issues?

If you can't resolve the issue:
1. Collect all error messages and logs
2. Note the exact steps you took
3. Document your environment (OS, Docker version, etc.)
4. Create detailed GitHub issue with this information
5. Include docker-compose output: `docker-compose config`
