# Deployment Guide

This guide covers deploying Sextant to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Infrastructure](#infrastructure)
4. [Configuration](#configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling](#scaling)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- Docker & Docker Compose (or Kubernetes)
- Domain name with SSL certificate
- External database (optional, can use containers)
- Monitoring solution (Prometheus, CloudWatch, etc.)
- Log aggregation (ELK Stack, CloudWatch, etc.)
- Container registry (Docker Hub, ECR, GCR, etc.)

### Recommended
- Load balancer (nginx, AWS ELB, etc.)
- Backup solution
- Disaster recovery plan
- CDN for static assets
- Secret management (AWS Secrets Manager, HashiCorp Vault)

## Environment Setup

### 1. Production Environment Variables

Create `.env.production`:

```env
# Environment
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=<generate-strong-random-key>
KEYCLOAK_ADMIN_PASSWORD=<strong-password>
ARANGODB_ROOT_PASSWORD=<strong-password>
KEYCLOAK_DB_PASSWORD=<strong-password>

# Domains
FRONTEND_URL=https://app.yourdomain.com
API_URL=https://api.yourdomain.com
KEYCLOAK_URL=https://auth.yourdomain.com
KEYCLOAK_HOST=auth.yourdomain.com

# Database
DATABASE_URL=<external-arangodb-or-container>
DATABASE_NAME=sextant_prod

# Security
JWT_ALGORITHM=RS256
JWT_EXPIRATION_HOURS=24

# CORS
CORS_ORIGINS=["https://app.yourdomain.com"]

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100

# Monitoring
PROMETHEUS_ENABLED=true
SENTRY_DSN=<optional-sentry-dsn>
```

### 2. Generate Secure Keys

```bash
# Generate secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate JWT key pair (if using RS256)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

## Infrastructure

### Docker Compose Deployment

**Production-optimized docker-compose.yml:**

```yaml
# See docker-compose.prod.yml
version: '3.8'

services:
  # Use specific versions (not 'latest')
  # Enable restart policies
  # Configure resource limits
  # Use separate database service
  # Configure healthchecks
  # Use secrets management
```

### Kubernetes Deployment

Structure:

```
k8s/
├── namespace.yaml
├── secrets.yaml
├── configmaps.yaml
├── keycloak/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── postgres/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── arangodb/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── api/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── app/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
└── ingress.yaml
```

### AWS Deployment (ECS/Fargate)

**Task Definitions:**
- `sextant-keycloak-task`
- `sextant-postgres-task`
- `sextant-arangodb-task`
- `sextant-api-task`
- `sextant-app-task`

**Services:**
- ALB (Application Load Balancer)
- RDS (for databases)
- CloudWatch (logs/monitoring)
- Secrets Manager (for sensitive data)

## Configuration

### 1. TLS/SSL Certificates

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d auth.yourdomain.com -d api.yourdomain.com -d app.yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/auth.yourdomain.com/fullchain.pem ./certs/
cp /etc/letsencrypt/live/auth.yourdomain.com/privkey.pem ./certs/
```

### 2. Nginx Reverse Proxy Configuration

```nginx
# nginx.conf

# Frontend
server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Keycloak
server {
    listen 443 ssl http2;
    server_name auth.yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    location / {
        proxy_pass http://keycloak:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP redirect
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

### 3. Database Setup

#### External ArangoDB

```bash
# Connection string
DATABASE_URL=https://user:password@arangodb.yourdomain.com:8529

# Initialize database
arangosh --server.endpoint https://arangodb.yourdomain.com:8529 \
         --server.username admin \
         --server.password <password> \
         < init-db.js
```

#### PostgreSQL for Keycloak

```bash
# RDS connection
KC_DB_URL=jdbc:postgresql://rds-instance.region.rds.amazonaws.com:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=<strong-password>
```

## Deployment Steps

### 1. Pre-Deployment Checks

```bash
# Verify all required files
- docker-compose.prod.yml exists
- .env.production configured
- SSL certificates ready
- Backup of current system
- Rollback plan documented
```

### 2. Build Images

```bash
# Tag images with version
docker build -t myregistry/sextant-app:1.0.0 ./app
docker build -t myregistry/sextant-api:1.0.0 ./api
docker build -t myregistry/sextant-keycloak:1.0.0 ./infra/keycloak

# Push to registry
docker push myregistry/sextant-app:1.0.0
docker push myregistry/sextant-api:1.0.0
docker push myregistry/sextant-keycloak:1.0.0
```

### 3. Deploy to Production Server

```bash
# SSH into production server
ssh deploy@production.yourdomain.com

# Clone repository
git clone https://github.com/yourorg/sextant.git
cd sextant

# Create .env.production
cp .env.example .env.production
# Edit with production values
nano .env.production

# Use production docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps
```

### 4. Database Migrations

```bash
# Initialize database collections
docker-compose -f docker-compose.prod.yml exec api python -m app.migrations.init

# Run any pending migrations
docker-compose -f docker-compose.prod.yml exec api python -m app.migrations.run
```

### 5. Health Checks

```bash
# Check API
curl https://api.yourdomain.com/health

# Check Frontend
curl https://app.yourdomain.com

# Check Keycloak
curl https://auth.yourdomain.com/health/ready

# Check ArangoDB
curl https://arangodb.yourdomain.com/_api/version
```

## Post-Deployment

### 1. Verification

```bash
# Test login flow
1. Open https://app.yourdomain.com
2. Click login
3. Enter demo@example.com / password123
4. Verify successful login
5. Check user profile
```

### 2. Configure Email

Update Keycloak for email notifications:
1. Admin Console → Realm Settings → Email
2. Configure SMTP server
3. Test email: Users → Select user → Send verification email

### 3. Enable Monitoring

```bash
# Enable Prometheus
- Update API config to expose /metrics
- Add Prometheus job to scrape metrics
- Set up Grafana dashboards

# Enable CloudWatch/Sentry
- Configure SENTRY_DSN in .env
- Set up log groups in CloudWatch
- Configure alarms
```

### 4. Backup Strategy

```bash
# Daily backup
0 2 * * * /scripts/backup.sh

# Backup script should:
- Export Keycloak users
- Backup PostgreSQL database
- Backup ArangoDB data
- Upload to S3/secure storage
- Rotate old backups
```

### 5. SSL Certificate Auto-Renewal

```bash
# Certbot renewal
0 3 1 * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Monitoring & Logging

### Application Monitoring

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sextant-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

### Log Aggregation

```bash
# ELK Stack
docker-compose -f docker-compose.elk.yml up -d

# CloudWatch
- Configure log groups for each service
- Set up log filters
- Configure alarms
```

### Key Metrics to Monitor

- Request latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database query performance
- Cache hit rates
- Token validation times
- Active sessions

### Alerting

Configure alerts for:
- High error rate (> 5%)
- Service down (health check failing)
- High latency (> 1 second)
- Database connection pool exhausted
- Disk space low (< 10%)
- Memory usage high (> 80%)

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  api:
    deploy:
      replicas: 3
    environment:
      WORKERS: 4
      
  app:
    deploy:
      replicas: 2
```

### Load Balancing

```nginx
upstream api_backend {
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_connect_timeout 10s;
    }
}
```

### Database Scaling

- Read replicas for PostgreSQL
- ArangoDB cluster setup
- Caching layer (Redis)

## Security

### Production Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] Secret key rotated and secure
- [ ] Database passwords strong (16+ chars, mixed)
- [ ] SSH keys configured (no passwords)
- [ ] Firewall rules restrictive
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HSTS headers enabled
- [ ] Security headers configured
- [ ] Regular security updates applied
- [ ] WAF (Web Application Firewall) configured
- [ ] DDoS protection enabled
- [ ] Regular backups verified
- [ ] Disaster recovery plan tested
- [ ] Security audit scheduled

### Security Headers

```nginx
# Add to nginx config
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### Network Segmentation

```
Internet
   │
   ├─ WAF
   │
   ├─ Load Balancer
   │
   ├─ Reverse Proxy (nginx)
   │
   ├─ API Cluster (private network)
   │
   ├─ Database (private network)
   │
   └─ Cache (private network)
```

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Verify environment
docker-compose -f docker-compose.prod.yml config

# Check resource usage
docker stats
```

### Database connection issues

```bash
# Test database connection
docker-compose exec api python -c "from app.core.database import db_client; print(db_client.db.properties())"

# Check network connectivity
docker exec api ping arangodb
```

### Performance issues

```bash
# Monitor metrics
curl http://localhost:9090/metrics

# Check slow queries
# (specific to database being used)

# Analyze Keycloak auth times
# (in Keycloak logs)
```

### Recovery Procedures

```bash
# Quick restart
docker-compose -f docker-compose.prod.yml restart

# Full restart (with volume preservation)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Restore from backup
# (use backup management system)
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Verify backups
- **Monthly**: Security patches
- **Quarterly**: Capacity planning
- **Annually**: Disaster recovery drill

### Update Procedure

1. Create backup
2. Test in staging environment
3. Schedule maintenance window
4. Update docker-compose.yml with new image versions
5. Rebuild images
6. Perform rolling update
7. Monitor and verify
8. Document changes

## Support

- [Keycloak Documentation](https://www.keycloak.org/documentation.html)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Kubernetes](https://kubernetes.io/docs/)
- [AWS ECS](https://docs.aws.amazon.com/ecs/)
