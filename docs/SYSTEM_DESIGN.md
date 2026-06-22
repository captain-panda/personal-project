# System Design — DSA Learning Platform

A MERN application for tracking progress across a structured DSA sheet, designed for
**10k–50k concurrent users**, **p95 API latency < 500 ms**, and **99.5% uptime**.

---

## 1. Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  CLIENT — React SPA (Vite + Tailwind)                          │
│  Hosted on S3 + CloudFront CDN                                 │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTPS (REST, Bearer access token + httpOnly refresh cookie)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  AWS Application Load Balancer (multi-AZ)                      │
└───────────────────────────┬───────────────────────────────────┘
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌───────────────────────────────────────────────────────────────┐
│  API — NestJS (Express platform, stateless, Auto Scaling Group)│
│  Auth · Topics · Problems · Progress · /healthz /readyz /metrics│
└──────────────┬─────────────────────────────┬──────────────────┘
               │                             │
               ▼                             ▼
   ┌────────────────────┐        ┌────────────────────────┐
   │ Redis (ElastiCache)│        │ MongoDB Atlas          │
   │ L2 cache + auth     │        │ replica set (multi-AZ) │
   │ denylist + rate lim │        │ users/topics/problems… │
   └────────────────────┘        └────────────────────────┘
```

Each API instance also keeps an **L1 in-process LRU cache** in front of Redis.

### Read path (cache-aside, two tiers)

```
request → L1 (in-process LRU, ~20s) → L2 (Redis, jittered TTL) → MongoDB
                                                    ▲ single-flight collapses
                                                      concurrent misses
```

Topics and problems are **globally identical for every user**, so they cache extremely
well and carry the vast majority of read traffic from memory.

---

## 2. Request flows

### Login
1. `POST /api/auth/login {email, password}` → validated, rate-limited.
2. Look up user by indexed `email`; `bcrypt.compare` (native async, libuv threadpool).
3. Sign **access JWT (15m)** + **refresh JWT (7d)**; persist the refresh token's hash in `user_sessions`.
4. Return `{ accessToken, user }`; set the refresh token as an **httpOnly cookie** scoped to `/api/auth`.

### Authenticated read (e.g. topics)
1. `GET /api/topics` with `Authorization: Bearer <access>`.
2. Auth middleware: verify signature → check `jti` denylist → check `revokeAfter` epoch (both fail-open).
3. Service: `getOrSet('topics:all', …)` → L1 → L2 → Mongo aggregation.

### Track progress
1. `PATCH /api/progress/:problemId {completed}` (userId taken from the token — IDOR-safe).
2. Atomic `findOneAndUpdate` upsert on `{userId, problemId}`.
3. **Delete-after-write**: invalidate `progress:{userId}` and `stats:{userId}`.

### Token refresh + reuse detection
1. Access token expires → client `POST /api/auth/refresh` (cookie sent automatically).
2. Verify refresh JWT → look up the session by token hash.
3. If the token was **already rotated** → reuse/theft → revoke the **entire session family**.
4. Otherwise rotate: revoke the presented token, issue a new access + refresh pair in the same family.

---

## 3. Authentication & security

| Concern | Approach |
| --- | --- |
| Passwords | `bcrypt` (native async), cost 12 (configurable) |
| Access token | JWT HS256, 15 min, signature-only on the hot path, carries `jti` |
| Refresh token | JWT HS256, 7 day, single-use, stored **hashed** (SHA-256) in `user_sessions` |
| Rotation | Reuse detection — replaying a rotated token revokes the whole family |
| Instant revocation | Redis `jti` denylist (single session) + per-user `revokeAfter` epoch (logout-all/ban) |
| Fail-open | If Redis is down, denylist/revokeAfter checks allow (token TTL is the backstop) |
| Transport | httpOnly + `SameSite` refresh cookie; CORS limited to the client origin with credentials |
| Headers | `helmet`; `x-powered-by` disabled; JSON body limit 100 kb |
| Input | `zod` validation on every mutating endpoint |

---

## 4. Caching strategy

| Key | Tier | TTL | Invalidated when |
| --- | --- | --- | --- |
| `topics:all` | L1+L2 | 60 min | content changes / seed |
| `problems:topic:{id}` | L1+L2 | 30 min | problem in topic changes |
| `problem:{id}` | L1+L2 | 60 min | that problem changes |
| `problem:totals` | L1+L2 | 30 min | content changes |
| `progress:{userId}` | L1+L2 | 5 min | user toggles a problem |
| `stats:{userId}` | L1+L2 | 5 min | user toggles a problem |

- **Single-flight** prevents a stampede when a hot key expires.
- **Jittered TTL** (±10%) avoids synchronized expiry.
- **Graceful degradation**: any Redis error falls through to L1 + Mongo; the API never 500s on a Redis outage.

---

## 5. Scalability (10k–50k users)

A study tracker is read-heavy with think-time, so concurrent users ≠ requests/sec:

| Scenario | Cadence | Sustained RPS @ 50k |
| --- | --- | --- |
| Conservative | 1 req / 30s | ~1,700 |
| Active | 1 req / 10s | ~5,000 |
| Peak burst (2×) | — | ~10,000 |

Writes are far rarer: ~550 writes/sec at 50k.

- **API**: stateless behind ALB; ASG min 2, **max ~12–15** (≈2–4k RPS/vCPU on cache hits).
- **Reads**: globally-shared topics/problems served from cache (>95% hit) — Mongo barely sees them.
- **Writes**: indexed point-upserts on `{userId, problemId}` — trivial for an Atlas M30 replica set.
- **Sharding** is unnecessary at this scale; a replica set suffices.

---

## 6. Observability

- **Health**: `/healthz` (shallow liveness, wired to ALB) vs `/readyz` (deep dep check — diagnostics/deploy gating only, never gates ALB rotation).
- **Metrics** (`/metrics`, Prometheus): default Node metrics, per-route latency histogram, and **cache hit ratio** (first-class SLO metric — alert if < 90%). Event-loop lag is the real saturation signal for Node.
- **Logs**: `pino` structured JSON with an `x-request-id` correlation id per request.
- **SLO**: 99.5% uptime = ~3h39m/month error budget → multi-AZ + zero-downtime deploys. p95 measured server-side; RUM tracked separately as UX truth.
- **Alerting**: multi-window burn-rate alerts, not static thresholds.

---

## 7. Failure-mode runbook

| Failure | Behavior | Recovery |
| --- | --- | --- |
| Redis outage | Fall-through to L1→Mongo; denylist + rate-limiter fail open | Auto MZ failover (~1 min) |
| Mongo primary lost | `retryWrites/Reads` replay; writes pause ~30s; cached reads fine | Auto election (~30s) |
| API instance crash | `/healthz` fail → ALB drains → ASG replaces; clients retry idempotent ops | Auto (1–2 min) |
| AZ outage | Surviving AZ + failovers — OK if provisioned N+AZ | Auto (~1–2 min) |
| Bad deploy | Health-gated rollout halts; auto-rollback on 5xx burn-rate | Auto-rollback |
| Login storm | Async bcrypt on threadpool; ASG scales on event-loop lag | Auto scale-out |

Design rules this surfaced: size Mongo for Redis-loss read load; N+AZ headroom; expand–contract migrations; native async `bcrypt` (never `bcryptjs`); local rate-limit floor; auto-rollback wired to alarms.

---

## 8. AWS deployment

| Component | Service | Notes |
| --- | --- | --- |
| Frontend | **S3 + CloudFront** | `npm run build` → sync `client/dist` to S3; CloudFront in front; HTTPS via ACM |
| API | **EC2 / ECS Fargate** behind an **ALB** | ASG across ≥2 AZs; `/healthz` health check; rolling/blue-green deploys |
| Database | **MongoDB Atlas** (M30+) | 3-node replica set, multi-AZ; VPC peering; `retryWrites=true` in the URI |
| Cache | **ElastiCache (Redis 7)** | Multi-AZ with a replica (it's on the auth critical path) |
| TLS | **ACM** | on ALB + CloudFront |
| DNS | **Route 53** | `app.*` → CloudFront, `api.*` → ALB |
| Secrets | **Secrets Manager** / SSM | `JWT_*`, `MONGO_URI`, `REDIS_URL` |
| Logs/metrics | **CloudWatch** | logs + alarms; Synthetics canary for external uptime |

### Deploy outline
```bash
# Frontend
cd client && npm ci && npm run build
aws s3 sync dist/ s3://<bucket> --delete
aws cloudfront create-invalidation --distribution-id <id> --paths '/*'

# Backend (ECS example)
docker build -t <ecr>/dsa-api:latest server/
docker push <ecr>/dsa-api:latest
# update the ECS service (rolling deploy, health-gated on /healthz)
```

### Environments
`.env` files per environment (dev / staging / prod). Production refuses to boot with default
JWT secrets. Staging should mirror prod sizing so load tests are meaningful.

---

## 9. CI/CD (suggested)

- **Per PR**: lint + unit + integration tests (`mongodb-memory-server`).
- **Pre-deploy**: E2E happy path.
- **Pre-prod gate**: k6 load test with SLO thresholds (`p95<500ms`, `errors<0.5%`, `cache hit>95%`) — fails the pipeline on breach.
- **Deploy**: GitHub Actions → build, push image, update ECS/Beanstalk + S3/CloudFront; auto-rollback on post-deploy 5xx burn-rate alarm.
