import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request, Response, RequestHandler } from 'express';
import { RedisService } from '../infra/redis/redis.service';
import { Env } from '../config/env.validation';

const handler = (_req: Request, res: Response) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } });

// Per-instance memory floor — survives a Redis outage.
function memoryLimiter(max: number): RequestHandler {
  return rateLimit({ windowMs: 60_000, max, standardHeaders: false, legacyHeaders: false, handler });
}

// Cross-instance Redis limiter; fails OPEN on a Redis error.
function redisLimiter(max: number, prefix: string, redisService: RedisService): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisStore({
      prefix,
      sendCommand: (...args: string[]) => {
        const r = redisService.getClient();
        if (!r) throw new Error('redis-unavailable');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (r.call as any)(...args);
      },
    }),
    handler,
  });
}

export function buildLimiterStack(
  max: number,
  prefix: string,
  config: Env,
  redisService: RedisService,
): RequestHandler[] {
  if (config.REDIS_URL) return [memoryLimiter(max * 3), redisLimiter(max, prefix, redisService)];
  return [memoryLimiter(max)];
}
