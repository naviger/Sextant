# Security Configuration - Keycloak Setup Guide

## Overview

Sextant uses Keycloak as the Identity Provider (IDP) for OIDC (OpenID Connect) based authentication and authorization. This guide explains how to set up and configure Keycloak for secure authentication.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Sextant Application                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐            ┌──────▼──┐
    │ Frontend│            │  Backend │
    │ (React) │            │(FastAPI) │
    └───┬────┘            └──────┬──┘
        │                        │
        └────────────┬───────────┘
                     │
                 OIDC Flow
                     │
            ┌────────▼────────┐
            │    Keycloak     │
            │  (IDP + AuthZ)  │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │  PostgreSQL DB  │
            │  (User Storage) │
            └─────────────────┘
```

## Installation & Setup

### Prerequisites

- Docker and Docker Compose
- The application should be running via `./scripts/start.sh`

### Initial Configuration

1. **Access Keycloak Admin Console**
   - URL: http://localhost:8080/admin
   - Username: `admin`
   - Password: `changeme123` (from .env)

2. **Change Admin Password (Important for Production)**
   - Log in with default credentials
   - Click on username (admin) in top-right
   - Select "Manage Account" → "Password"
   - Set a strong password

## Realm Configuration

A realm in Keycloak is a space where users, clients, and roles are managed. Sextant uses the `sextant` realm.

### Access Realm Settings

1. In the Admin Console, select "sextant" from the realm dropdown (top-left)
2. Go to "Realm settings"

### Key Realm Settings

- **Realm name**: `sextant`
- **Enabled**: Toggle ON
- **User-managed access**: Optional
- **Brute force detection**: Recommended to enable
  - Max login failures: 30
  - Quick login check min delta: 1 minute
  - Minimum quick login wait: 1 minute

## Clients Configuration

Keycloak has two main clients: one for the frontend and one for the backend API.

### Frontend Client: `sextant-app`

This is the public OIDC client for the React frontend.

**Configuration:**
- **Client ID**: `sextant-app`
- **Client Protocol**: `openid-connect`
- **Public Client**: Yes
- **Access Type**: Public
- **Standard Flow Enabled**: Yes

**Valid Redirect URIs:**
```
http://localhost:3000/*
http://localhost:3000
```

**Web Origins:**
```
http://localhost:3000
```

**Client Scopes:**
- profile
- email
- roles

**Advanced Settings:**
- Access Token Lifespan: 1 hour (3600 seconds)
- Refresh Token Lifespan: 7 days (604800 seconds)

### Backend Client: `sextant-api`

This is the confidential client for the FastAPI backend.

**Configuration:**
- **Client ID**: `sextant-api`
- **Client Protocol**: `openid-connect`
- **Public Client**: No
- **Access Type**: Confidential
- **Bearer Only**: Yes (optional for API-only)

**Client Secret:**
- Found in the "Credentials" tab
- Use this in the API's `.env` file

**Valid Redirect URIs:**
```
http://localhost:8000/*
http://localhost:8000
```

**Client Scopes:**
- profile
- email
- roles

## Users and Roles

### Default Users

Two demo users are pre-configured:

1. **Demo User**
   - Username: `demo`
   - Email: `demo@example.com`
   - Password: `password123`
   - Roles: `user`

2. **Admin User**
   - Username: `admin`
   - Email: `admin@example.com`
   - Password: `admin123`
   - Roles: `admin`, `user`

### Create New Users

1. Go to "Users" menu
2. Click "Add user"
3. Fill in user details:
   - Username
   - Email
   - First Name
   - Last Name
   - User enabled: Toggle ON
4. Click "Create"
5. Set password in the "Credentials" tab

### Role Management

#### Realm Roles

1. Go to "Roles" menu
2. Available roles:
   - `user`: Standard user role
   - `admin`: Administrator role
   - Custom roles can be added

#### Assign Roles to Users

1. Go to "Users"
2. Select a user
3. Go to "Role Mappings" tab
4. Select roles and click "Add selected"

## OIDC Authentication Flow

### Authorization Code Flow (Frontend)

This is the flow used by the React frontend:

```
1. User clicks "Login" button
   ↓
2. Frontend redirects to Keycloak login page
   ↓
3. User enters credentials
   ↓
4. Keycloak authenticates and redirects back to frontend with authorization code
   ↓
5. Frontend exchanges code for access token + ID token
   ↓
6. Access token is stored and used for API calls
   ↓
7. Frontend is authenticated
```

### Token Validation (Backend)

The FastAPI backend validates tokens using Keycloak's public key:

```
1. Frontend sends API request with Bearer token
   ↓
2. Backend extracts token from Authorization header
   ↓
3. Backend validates token signature using Keycloak's public key
   ↓
4. Backend checks token expiration and claims
   ↓
5. Backend extracts user info and roles from token claims
   ↓
6. Request is processed with user context
```

## API Integration

### Frontend Configuration

In your `.env.example`:

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=sextant
VITE_KEYCLOAK_CLIENT_ID=sextant-app
```

### Backend Configuration

In your `api/.env`:

```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=sextant
KEYCLOAK_CLIENT_ID=sextant-api
KEYCLOAK_CLIENT_SECRET=<copy from Keycloak credentials>
```

## Security Best Practices

### For Development

- ✓ Use HTTP for localhost testing
- ✓ Use weak passwords only for demo accounts
- ✓ Enable CORS only for localhost

### For Production

- ✗ Never use default admin credentials
- ✓ Use HTTPS for all endpoints
- ✓ Set strong passwords for all users
- ✓ Configure proper CORS origins
- ✓ Use secure cookie settings
- ✓ Enable brute force protection
- ✓ Set appropriate token lifespans
- ✓ Store client secrets securely (use secrets management)
- ✓ Enable audit logging
- ✓ Use TLS/SSL certificates from trusted CA
- ✓ Configure OAuth/OIDC scopes properly
- ✓ Regular security audits

### Token Security

- **Access Token**
  - Short-lived (1 hour default)
  - Contains user claims and roles
  - Used for API authentication

- **Refresh Token**
  - Longer-lived (7 days default)
  - Used to obtain new access tokens
  - Should be stored securely

- **ID Token**
  - Contains user identity information
  - Only for authentication, not authorization

### Session Management

1. **Session Timeout**: Configure in realm settings
2. **Remember Me**: Optional feature in login form
3. **Concurrent Sessions**: Can limit per user

## Troubleshooting

### Can't Access Keycloak

1. Check if container is running: `docker-compose ps keycloak`
2. Check logs: `./scripts/logs.sh keycloak`
3. Verify network: `docker network ls`

### Login Not Working

1. Verify client configuration (redirect URIs)
2. Check CORS settings
3. Verify Keycloak health: `curl http://localhost:8080/health`

### Token Validation Fails

1. Verify Keycloak URL in API configuration
2. Check if JWT algorithm matches
3. Ensure token is not expired
4. Verify client credentials

### Users Can't Get Roles

1. Check role assignments in user profile
2. Verify role scope is added to client
3. Check token contains role claims

## Database Backup & Recovery

### Backup User Data

```bash
# Export users from Keycloak realm
docker-compose exec keycloak \
  /opt/keycloak/bin/kc.sh export \
  --realm sextant \
  --users realm_file \
  --dir /tmp
```

### Manual Database Backup

PostgreSQL data is stored in Docker volume. To backup:

```bash
docker-compose exec postgres \
  pg_dump -U keycloak keycloak > backup.sql
```

## Advanced Configuration

### Social Login Providers

Configure identity providers for:
- Google
- GitHub
- Microsoft
- Custom OIDC providers

### Multi-Factor Authentication (MFA)

1. Go to "Authentication" → "Required Actions"
2. Configure OTP or other MFA methods
3. Bind to specific users or groups

### Custom Themes

Customize login pages and admin console with custom themes.

### Event Logging

Enable audit logging for security events:
1. Go to "Realm settings" → "Events"
2. Enable "Save Events"
3. Set events logging configuration

## Resources

- [Keycloak Official Documentation](https://www.keycloak.org/documentation.html)
- [OpenID Connect Protocol](https://openid.net/connect/)
- [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [JWT Claims](https://www.rfc-editor.org/rfc/rfc7519)

## Support

For issues related to:
- **Keycloak**: Check [Keycloak Issues](https://github.com/keycloak/keycloak/issues)
- **OIDC Flow**: Refer to [OIDC-FLOW.md](specs/OIDC-FLOW.md)
- **API Integration**: Check API documentation at http://localhost:8000/docs
