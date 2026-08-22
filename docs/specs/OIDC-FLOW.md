# OIDC Authentication Flow Specification

## Overview

This document describes the OpenID Connect (OIDC) authentication and authorization flows implemented in Sextant.

## Protocol Stack

```
┌──────────────────────────────────────┐
│      Application Layer               │
│  ┌──────────────────────────────┐   │
│  │  Frontend (React + Keycloak) │   │
│  │  Backend (FastAPI + JWT)     │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│      OIDC/OAuth 2.0                  │
│  ┌──────────────────────────────┐   │
│  │  Authorization Code Flow     │   │
│  │  Token Refresh Flow          │   │
│  │  Implicit Flow (frontend)    │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│      JWT Tokens                      │
│  ┌──────────────────────────────┐   │
│  │  RS256 Signature             │   │
│  │  ID Token (authentication)   │   │
│  │  Access Token (authorization)│   │
│  │  Refresh Token (renewal)     │   │
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│      HTTP/HTTPS                      │
└──────────────────────────────────────┘
```

## 1. User Login Flow

### Step-by-Step Diagram

```
┌────────────┐                                    ┌────────────┐
│  Frontend  │                                    │ Keycloak   │
│  (Browser) │                                    │   (IDP)    │
└────────────┘                                    └────────────┘
      │                                                  │
      │ 1. Click "Login"                               │
      ├─ Redirect to Keycloak ────────────────────────>│
      │   /auth?response_type=code&client_id=...      │
      │                                                 │
      │                                 2. Display login form
      │                                                 │
      │ 3. User enters credentials                     │
      │<─────────────────────────── Authenticate ─────┤
      │                                                 │
      │ 4. User is authenticated                       │
      │<─ Redirect with authorization code ───────────┤
      │   /?code=AUTH_CODE                             │
      │                                                 │
      │ 5. Exchange code for token (backend call)      │
      │   POST /token?code=AUTH_CODE&client_id=...    │
      ├────────────────────────────────────────────────>│
      │                                                 │
      │ 6. Keycloak returns tokens                     │
      │<─ {access_token, id_token, refresh_token} ────┤
      │                                                 │
      │ 7. Store tokens (localStorage/sessionStorage)  │
      │ 8. Redirect to dashboard                       │
      │                                                 │
```

### Token Exchange Details

**Request (Frontend to Keycloak):**
```
POST /auth/realms/sextant/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&client_id=sextant-app
&redirect_uri=http://localhost:3000/callback
&code_verifier=CODE_VERIFIER (PKCE)
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "refresh_expires_in": 604800,
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "not-before-policy": 0,
  "session_state": "SESSION_ID",
  "scope": "email profile roles"
}
```

## 2. Access Token Structure

### JWT Claims

```
HEADER.PAYLOAD.SIGNATURE
```

**Decoded Access Token Payload:**
```json
{
  "jti": "TOKEN_ID",
  "exp": 1704067200,
  "iat": 1704063600,
  "auth_time": 1704063600,
  "name": "Demo User",
  "preferred_username": "demo",
  "given_name": "Demo",
  "family_name": "User",
  "email": "demo@example.com",
  "email_verified": true,
  "acr": "1",
  "allowedOrigins": [
    "http://localhost:3000"
  ],
  "realm_access": {
    "roles": [
      "default-roles-sextant",
      "user"
    ]
  },
  "resource_access": {
    "sextant-app": {
      "roles": [
        "user"
      ]
    },
    "sextant-api": {
      "roles": [
        "user"
      ]
    }
  },
  "scope": "email profile roles",
  "sid": "SESSION_ID",
  "sub": "USER_ID",
  "type": "Bearer"
}
```

### Token Validation (Backend)

**Process:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify JWT signature using Keycloak's public key (RS256)
3. Check token expiration (`exp` claim)
4. Validate issuer (`iss` claim)
5. Extract user information and roles

**Backend Validation Code:**
```python
# Fetch Keycloak public key (cached)
jwks_url = "http://keycloak:8080/realms/sextant/protocol/openid-connect/certs"

# Decode and validate token
payload = jwt.decode(
    token,
    public_key,
    algorithms=["RS256"],
    audience="sextant-api"
)

# Extract user info
user_id = payload.get("sub")
username = payload.get("preferred_username")
roles = payload.get("realm_access", {}).get("roles", [])
```

## 3. API Authentication Flow

### Request with Access Token

**Frontend:**
```javascript
const token = localStorage.getItem('access_token');

const response = await fetch('http://localhost:8000/api/v1/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### API Processing

```
┌────────────┐                      ┌────────────┐
│  Frontend  │                      │   API      │
│  (Request) │                      │  (Backend) │
└────────────┘                      └────────────┘
      │                                   │
      │ 1. Send request with token       │
      ├──────────────────────────────────>│
      │  Authorization: Bearer TOKEN      │
      │                                   │
      │                    2. Extract token
      │                    3. Validate signature
      │                    4. Check expiration
      │                    5. Verify issuer
      │                    6. Extract claims
      │                                   │
      │                    7. Check permissions
      │                       (roles/scopes)
      │                                   │
      │ 8. Send response (if authorized) │
      │<──────────────────────────────────┤
      │  200 OK with user data            │
      │                                   │
```

## 4. Token Refresh Flow

### When Token Expires

**Problem:** Access token expires after 1 hour

**Solution:** Use refresh token to get new access token

```
┌────────────┐                      ┌────────────┐
│  Frontend  │                      │ Keycloak   │
│  (Browser) │                      │   (IDP)    │
└────────────┘                      └────────────┘
      │                                   │
      │ 1. API returns 401 Unauthorized   │
      │ (Token expired)                   │
      │                                   │
      │ 2. Interceptor detects 401        │
      │ 3. Send refresh token             │
      │    POST /token                    │
      ├──────────────────────────────────>│
      │    grant_type=refresh_token       │
      │    refresh_token=REFRESH_TOKEN    │
      │                                   │
      │ 4. Validate refresh token         │
      │ 5. Generate new access token      │
      │<───── New access token ───────────┤
      │                                   │
      │ 6. Retry original request         │
      │    with new token                 │
      ├──────────────────────────────────>│
      │                                   │
      │ 7. Request succeeds               │
      │<───── 200 OK with data ───────────┤
      │                                   │
```

**Implementation:**
```python
# API client interceptor
async def refresh_token_on_401(error):
    if error.response.status_code == 401:
        refresh_token = get_stored_refresh_token()
        
        response = await keycloak_client.post(
            '/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': 'sextant-app'
            }
        )
        
        new_access_token = response['access_token']
        store_access_token(new_access_token)
        
        # Retry original request
        return retry_original_request(new_access_token)
```

## 5. Role-Based Access Control (RBAC)

### Role Hierarchy

```
┌─────────────────────────────────────┐
│         Realm Roles                 │
├─────────────────────────────────────┤
│  • user      (basic user)           │
│  • admin     (administrator)        │
│  • moderator (content moderator)    │
└─────────────────────────────────────┘
          ↓ assigned to ↓
┌─────────────────────────────────────┐
│            Users                    │
├─────────────────────────────────────┤
│  • demo (user role)                 │
│  • admin (admin, user roles)        │
└─────────────────────────────────────┘
          ↓ token contains ↓
┌─────────────────────────────────────┐
│        JWT Claims (roles)           │
├─────────────────────────────────────┤
│  realm_access.roles: [...]          │
│  resource_access[CLIENT].roles: []  │
└─────────────────────────────────────┘
```

### Authorization Check (Backend)

```python
@app.get("/api/admin-only")
async def admin_endpoint(current_user: User = Depends(get_current_active_user)):
    # Check if user has admin role
    if "admin" not in current_user.roles:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    return {"message": "Admin data"}
```

## 6. Security Features

### PKCE (Proof Key for Public Clients)

Protects against authorization code interception:

```
Frontend                                    Keycloak
   │                                           │
   │ 1. Generate code_verifier (random)       │
   │    code_challenge = SHA256(code_verifier)│
   │                                           │
   │ 2. Authorization request                 │
   ├──────── /auth?code_challenge=... ───────>│
   │                                           │
   │ 3. User authenticates                    │
   │<─── auth code ──────────────────────────┤
   │                                           │
   │ 4. Token exchange                        │
   │    POST /token                           │
   │    code=AUTH_CODE                        │
   │    code_verifier=ORIGINAL_VERIFIER       │
   ├─────────────────────────────────────────>│
   │                                           │
   │ 5. Keycloak verifies:                    │
   │    SHA256(code_verifier) == code_challenge
   │                                           │
   │ 6. Issue tokens                          │
   │<─── tokens ────────────────────────────┤
   │                                           │
```

### State Parameter

Prevents CSRF attacks:

```javascript
// Frontend generates random state
const state = generateRandomString();
sessionStorage.setItem('oidc_state', state);

// Include in authorization request
const loginUrl = `${KEYCLOAK_URL}/auth?state=${state}&...`;

// After callback, verify state matches
if (URLParams.get('state') !== sessionStorage.getItem('oidc_state')) {
    throw new Error('State mismatch - possible CSRF attack');
}
```

### Secure Token Storage

```javascript
// ❌ INSECURE: localStorage vulnerable to XSS
localStorage.setItem('access_token', token); // Don't do this!

// ✓ SECURE: httpOnly cookie (inaccessible to JavaScript)
// Keycloak can issue tokens as httpOnly cookies
// Browser automatically sends with requests
// Requires SameSite cookie attribute for CSRF protection
```

## 7. CORS Considerations

### Frontend to Keycloak

```
Frontend: http://localhost:3000
Keycloak: http://localhost:8080

CORS Headers in Keycloak response:
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: POST, GET, OPTIONS
```

### Frontend to API

```
Frontend: http://localhost:3000
API: http://localhost:8000

CORS must be enabled in FastAPI:
allow_origins: ["http://localhost:3000"]
allow_credentials: true
allow_methods: ["*"]
allow_headers: ["Authorization", "Content-Type"]
```

## 8. Error Handling

### Common Error Scenarios

**Invalid Token**
```
Response Status: 401 Unauthorized
Response Body: {
  "detail": "Invalid token"
}

Frontend Action: Redirect to login
```

**Token Expired**
```
Response Status: 401 Unauthorized
Response Body: {
  "detail": "Token expired"
}

Frontend Action: Use refresh token or redirect to login
```

**Insufficient Permissions**
```
Response Status: 403 Forbidden
Response Body: {
  "detail": "User does not have required role: admin"
}

Frontend Action: Show access denied message
```

**Invalid Credentials**
```
Keycloak Response: 401 Unauthorized
Response Body: {
  "error": "invalid_grant",
  "error_description": "Invalid user credentials"
}

Frontend Action: Show error message, allow retry
```

## 9. Logout Flow

```
Frontend                                    Keycloak
   │                                           │
   │ 1. User clicks logout                    │
   │                                           │
   │ 2. Clear local tokens                    │
   │    localStorage.removeItem('access_token')
   │                                           │
   │ 3. Redirect to Keycloak logout           │
   ├─ GET /logout?redirect_uri=... ────────>│
   │                                           │
   │ 4. Keycloak clears session               │
   │ 5. Redirect to dashboard                 │
   │<─ redirect to app ──────────────────────┤
   │                                           │
   │ 6. User is logged out                    │
   │                                           │
```

## 10. Session Management

### Session Timeout

```
Token Lifespan:
├─ Issued at: 14:00:00
├─ Access token expires: 15:00:00 (1 hour)
└─ Refresh token expires: 21:00:00 (7 days)

Idle timeout:
- Session expires after 30 minutes of inactivity
- User must re-login if inactive
```

### Concurrent Sessions

```
User logs in from:
├─ Browser 1 → Session A, Token A
├─ Browser 2 → Session B, Token B
└─ Mobile   → Session C, Token C

Settings:
- Allow concurrent sessions: Yes
- Max sessions per user: Unlimited (or configured limit)
```

## References

- RFC 6749: OAuth 2.0 Authorization Framework
- RFC 6750: OAuth 2.0 Bearer Token Usage
- RFC 7519: JSON Web Token (JWT)
- RFC 7636: PKCE
- OpenID Connect Core: https://openid.net/specs/openid-connect-core-1_0.html
- Keycloak Documentation: https://www.keycloak.org/
