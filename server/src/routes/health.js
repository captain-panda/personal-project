import { Router } from 'express';
import { dbReady } from '../config/db.js';
import { redisReady } from '../config/redis.js';
import { metricsHandler } from '../metrics.js';

const router = Router();

/**
 * Shallow liveness — the process is up and the event loop is responsive.
 * This is what the ALB target health check should hit. It must NOT touch
 * dependencies, or a Mongo/Redis blip would drain the whole fleet.
 */
router.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/**
 * Deep readiness — dependency health. For diagnostics and deploy gating only,
 * never wired to ALB rotation. Redis is optional, so it doesn't gate readiness.
 */
router.get('/readyz', (_req, res) => {
  const checks = { mongo: dbReady(), redis: redisReady() };
  const ready = checks.mongo;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready', checks });
});

router.get('/metrics', metricsHandler);

export default router;
