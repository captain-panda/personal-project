# API Reference

Base URL (local): `http://localhost:5000`

- **Auth**: send the access token as `Authorization: Bearer <accessToken>`.
- **Refresh token**: an httpOnly cookie (`refreshToken`) scoped to `/api/auth`, set by
  register/login/refresh and sent automatically by the browser.
- **Errors**: every error returns `{ "error": { "code", "message", "details?" } }`.
- A machine-readable spec is in [`openapi.yaml`](openapi.yaml) — import it into Swagger UI or Postman.

## Auth

### POST /api/auth/register
```json
{ "email": "ada@dsa.dev", "password": "Test@1234", "displayName": "Ada" }
```
→ `201` `{ "accessToken": "…", "user": { … } }` (and sets the refresh cookie). `409` if the email exists.

### POST /api/auth/login
```json
{ "email": "test@dsa.dev", "password": "Test@1234" }
```
→ `200` `{ "accessToken": "…", "user": { … } }`. `401` on bad credentials.

### POST /api/auth/refresh
No body — relies on the refresh cookie. → `200` `{ "accessToken": "…", "user": { … } }` and rotates the cookie.
Replaying an already-rotated token returns `401` and revokes the whole session family.

### POST /api/auth/logout
Revokes the refresh session and denylists the current access token. → `200`.

### POST /api/auth/logout-all  *(auth required)*
Logs out of every session (bumps `revokeAfter`). → `200`.

### GET /api/auth/me  *(auth required)*
→ `200` `{ "user": { … } }`.

## Topics & Problems *(auth required)*

### GET /api/topics
→ `{ "topics": [ { "id", "name", "slug", "description", "order", "problemCount" } ] }`

### GET /api/topics/:topicId/problems
→ `{ "topic": { … }, "problems": [ { "id", "title", "difficulty", "links", "tags", … } ] }`

### GET /api/problems/:problemId
→ `{ "problem": { … } }`

## Progress *(auth required)*

### PATCH /api/progress/:problemId
```json
{ "completed": true }
```
→ `{ "progress": { "problemId", "completed", "completedAt" } }`. Idempotent in state. `404` if the problem doesn't exist.

### GET /api/progress/me
→ `{ "progress": [ { "problemId", "completed", "completedAt" } ] }`

### GET /api/progress/stats
→
```json
{ "stats": {
  "totalProblems": 50, "totalSolved": 12, "percentComplete": 24,
  "byDifficulty": [ { "difficulty": "Easy", "solved": 6, "total": 14 } ],
  "byTopic": [ { "topicId": "…", "name": "Arrays", "solved": 3, "total": 5 } ]
} }
```

### GET /api/progress/user/:userId
Ownership-enforced — `:userId` must match the token's user, else `403`.

## Ops (no auth)
- `GET /healthz` — shallow liveness (ALB health check).
- `GET /readyz` — deep readiness (`{ mongo, redis }`); `503` if Mongo is down.
- `GET /metrics` — Prometheus metrics, incl. `dsa_cache_hit_ratio` and per-route latency.

## Quick start with curl
```bash
# login, capture the access token
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@dsa.dev","password":"Test@1234"}' | jq -r .accessToken)

# list topics
curl -s localhost:5000/api/topics -H "Authorization: Bearer $TOKEN" | jq
```
