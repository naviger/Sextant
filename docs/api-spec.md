# API Specification

## Overview

Sextant API is a FastAPI-based backend service that provides RESTful endpoints for user management, authentication validation, and data operations. All endpoints are secured using JWT tokens from Keycloak.

## Base URL

```
http://localhost:8000
```

## Authentication

All endpoints (except health checks) require Bearer token authentication via JWT.

**Header Format:**
```
Authorization: Bearer <access_token>
```

The access token is obtained from Keycloak's OIDC token endpoint.

## Endpoints

### Health & Status

#### Health Check
```
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "healthy",
  "timestamp": "2024-01-01T12:00:00"
}
```

#### Liveness Probe
```
GET /health/live
```

**Response (200 OK):**
```json
{
  "status": "alive"
}
```

#### Readiness Probe
```
GET /health/ready
```

**Response (200 OK):**
```json
{
  "status": "ready"
}
```

### Users

#### Get Current User Profile
```
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "user-id-123",
  "username": "demo",
  "email": "demo@example.com",
  "first_name": "Demo",
  "last_name": "User",
  "roles": ["user"],
  "is_active": true,
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: User inactive

---

#### Get User by ID
```
GET /api/v1/users/{user_id}
Authorization: Bearer <token>
```

**Path Parameters:**
- `user_id` (string): User ID

**Response (200 OK):**
```json
{
  "id": "user-id-123",
  "username": "demo",
  "email": "demo@example.com",
  "first_name": "Demo",
  "last_name": "User",
  "roles": ["user"],
  "is_active": true,
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Database error

---

#### Update User Profile
```
PUT /api/v1/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `user_id` (string): User ID

**Request Body:**
```json
{
  "first_name": "Updated",
  "last_name": "Name"
}
```

**Response (200 OK):**
```json
{
  "id": "user-id-123",
  "username": "demo",
  "email": "demo@example.com",
  "first_name": "Updated",
  "last_name": "Name",
  "roles": ["user"],
  "is_active": true,
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T13:00:00"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Cannot update other users
- `404 Not Found`: User not found
- `500 Internal Server Error`: Database error

---

## Error Handling

### Standard Error Response Format

```json
{
  "detail": "Error message",
  "status_code": 400,
  "timestamp": "2024-01-01T12:00:00"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server error |

## Rate Limiting

API requests are rate-limited to prevent abuse.

**Limit:** 60 requests per minute per IP

**Headers in Response:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

**Error Response (429 Too Many Requests):**
```json
{
  "detail": "Rate limit exceeded",
  "retry_after": 30
}
```

## Pagination

List endpoints support pagination via query parameters.

**Parameters:**
- `skip` (int, default: 0): Number of items to skip
- `limit` (int, default: 10, max: 100): Number of items to return

**Example:**
```
GET /api/v1/users?skip=20&limit=10
```

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "skip": 20,
  "limit": 10
}
```

## Filtering & Sorting

### Filter Parameters

Available filters depend on the endpoint. Common filters:

```
GET /api/v1/users?is_active=true&role=user
```

### Sort Parameter

```
GET /api/v1/users?sort=created_at,-username

// Sorting:
// created_at: ascending
// -username: descending (prefix with -)
```

## API Documentation

### Interactive API Docs

```
http://localhost:8000/docs
```

Swagger UI with:
- All available endpoints
- Request/response examples
- Try-it-out feature
- Authentication testing

### ReDoc

```
http://localhost:8000/redoc
```

Alternative API documentation viewer.

### OpenAPI Schema

```
http://localhost:8000/openapi.json
```

Raw OpenAPI specification.

## Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get current user
const user = await api.get('/api/v1/users/me');
console.log(user.data);
```

### Python

```python
import requests

BASE_URL = "http://localhost:8000"
token = "YOUR_ACCESS_TOKEN"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Get current user
response = requests.get(
    f"{BASE_URL}/api/v1/users/me",
    headers=headers
)

user = response.json()
print(user)
```

### cURL

```bash
# Get current user
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Update user
curl -X PUT "http://localhost:8000/api/v1/users/USER_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name"
  }'
```

## CORS

The API allows cross-origin requests from:
- `http://localhost:3000` (React frontend)

Additional origins can be configured in `.env`:
```
CORS_ORIGINS=["http://localhost:3000", "http://example.com"]
```

## Versioning

API uses URL-based versioning:
- Current version: `v1`
- Future versions: `v2`, `v3`, etc.

Example:
```
/api/v1/users/...
/api/v2/users/...  (future)
```

## Backward Compatibility

- Existing endpoints are maintained for backward compatibility
- Deprecated endpoints include a `Deprecation` header
- Breaking changes only in major versions

## Performance

### Response Times

- Average response time: < 100ms
- Health check: < 50ms
- Database queries: < 500ms

### Caching

- Responses include cache headers
- Client-side caching configured via `Cache-Control`
- Server-side caching for frequently accessed data

## Security

### HTTPS in Production

- All endpoints require HTTPS
- HSTS headers enabled
- Secure cookies only

### Token Security

- Tokens signed with RS256
- Token validation on every request
- Automatic token refresh support

### OWASP Compliance

- SQL Injection protection (parameterized queries)
- XSS protection (JSON responses, no HTML)
- CSRF protection (SameSite cookies)
- Rate limiting

## Monitoring & Logging

### Metrics

Available at `/metrics` (Prometheus format):
- Request count by endpoint
- Response times (p50, p95, p99)
- Error rates
- Database connection pool stats

### Logging

- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request tracing with correlation IDs

## Changelog

### Version 1.0.0 (2024-01-01)

Initial release with:
- User management endpoints
- OIDC authentication
- ArangoDB integration
- Health checks

## Support & Feedback

For issues or feature requests:
- GitHub Issues: [Sextant Issues](https://github.com/yourorg/sextant/issues)
- Email: support@example.com
- Documentation: [Full Docs](https://docs.example.com)
