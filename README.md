# DSA Sheet — Full-Stack Learning Platform

A production-minded MERN application that helps students track their progress across a
structured Data Structures & Algorithms sheet. Built for 10k–50k concurrent users with a
cache-aside read path, hardened JWT auth, and graceful degradation when Redis is unavailable.

> Design & review docs: see [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md),
> [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md), and [`docs/API.md`](docs/API.md).

---

## Architecture at a glance

```
React (Vite + Tailwind)  ──HTTPS──►  Express API  ──►  MongoDB (Atlas)
   S3 + CloudFront                   EC2/ECS + ALB        Redis (cache + auth denylist)
```

- **Read path:** L1 in-process LRU → L2 Redis → MongoDB (cache-aside, single-flight).
- **Auth:** short-lived access JWT (15m) + rotating refresh token with reuse detection;
  instant revocation via a Redis `jti` denylist + per-user `revokeAfter` epoch.
- **Resilience:** the API boots and serves traffic even with **no Redis** (degrades to L1 + Mongo).

## Monorepo layout

```
.
├── server/      # Node.js + Express API (ESM)
├── client/      # React SPA (Vite + Tailwind)
├── docs/        # System design, DB schema, API spec, deployment guide
└── README.md
```

## Prerequisites

- Node.js ≥ 18 (tested on 22.x)
- A MongoDB connection string — local `mongod` **or** a free MongoDB Atlas cluster
- Redis — **optional** (the app runs without it)

## Quick start

```bash
# 1. Backend
cd server
cp .env.example .env          # then edit MONGO_URI (Atlas or local)
npm install
npm run seed                  # loads the sample DSA sheet + a test user
npm run dev                   # http://localhost:5000

# 2. Frontend (separate terminal)
cd client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

### Sample credentials (created by the seed script)

| Email           | Password    |
| --------------- | ----------- |
| `test@dsa.dev`  | `Test@1234` |

## Scripts

| Location | Command            | Purpose                                  |
| -------- | ------------------ | ---------------------------------------- |
| server   | `npm run dev`      | Start API with watch reload              |
| server   | `npm run seed`     | Seed topics, problems, and a test user   |
| server   | `npm test`         | Unit + integration tests (Vitest)        |
| client   | `npm run dev`      | Start the React dev server               |
| client   | `npm run build`    | Production build to `dist/`              |

## Deployment

See the **Deployment** section in [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) for the
AWS topology (S3 + CloudFront, EC2/ECS behind an ALB, MongoDB Atlas, ElastiCache Redis).
