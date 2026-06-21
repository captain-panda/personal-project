import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';
import { env, isTest } from '../config/env.js';

const handler = (_req, res) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } });

// Per-instance memory limiter — the floor that survives a Redis outage.
function memoryLimiter(max) {
  return rateLimit({ windowMs: 60_000, max, standardHeaders: false, legacyHeaders: false, handler });
}

// Cross-instance Redis limiter. `passOnStoreError` fails OPEN if Redis errors,
// so a Redis blip drops precise limiting but the memory floor still applies.
function redisLimiter(max, prefix) {
  return rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisStore({
      prefix,
      sendCommand: (...args) => {
        const r = getRedis();
        if (!r) throw new Error('redis-unavailable');
        return r.call(...args);
      },
    }),
    handler,
  });
}

function build(max, prefix) {
  if (isTest) return []; // no rate limiting under test
  if (env.REDIS_URL) return [memoryLimiter(max * 3), redisLimiter(max, prefix)];
  return [memoryLimiter(max)];
}

export const authLimiters = build(env.RATE_LIMIT_AUTH_MAX, 'rl:auth:');
export const dataLimiters = build(env.RATE_LIMIT_DATA_MAX, 'rl:data:');
