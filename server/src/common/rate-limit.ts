import rateLimit, { Store, Options, IncrementResponse } from 'express-rate-limit';
import type { Request, Response, RequestHandler } from 'express';
import { RedisService } from '../infra/redis/redis.service';
import { Env } from '../config/env.validation';

const handler = (_req: Request, res: Response) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } });

// Per-instance memory floor — survives a Redis outage.
function memoryLimiter(max: number): RequestHandler {
  return rateLimit({ windowMs: 60_000, max, standardHeaders: false, legacyHeaders: false, handler });
}

/**
 * Simple ioredis-backed store. All Redis calls happen at request time (inside
 * increment/decrement/resetKey), so there are NO constructor-time Redis calls.
 * This avoids the unhandled-rejection crash that rate-limit-redis causes when
 * it tries to SCRIPT LOAD during module init before Redis is ready.
 * passOnStoreError:true on the enclosing rateLimit() catches the thrown error
 * and lets the request through when Redis is unavailable.
 */
class RedisRateLimitStore implements Store {
  private windowMs = 60_000;

  constructor(
    private readonly keyPrefix: string,
    private readonly redisService: RedisService,
  ) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const r = this.redisService.getClient();
    if (!r) throw new Error('redis-unavailable');
    const k = `${this.keyPrefix}${key}`;
    const totalHits = await r.incr(k);
    if (totalHits === 1) await r.pexpire(k, this.windowMs);
    const ttl = await r.pttl(k);
    return { totalHits, resetTime: new Date(Date.now() + Math.max(ttl, 0)) };
  }

  async decrement(key: string): Promise<void> {
    const r = this.redisService.getClient();
    if (!r) return;
    await r.decr(`${this.keyPrefix}${key}`);
  }

  async resetKey(key: string): Promise<void> {
    const r = this.redisService.getClient();
    if (!r) return;
    await r.del(`${this.keyPrefix}${key}`);
  }
}

// Cross-instance Redis limiter; fails OPEN on a Redis error.
function redisLimiter(max: number, prefix: string, redisService: RedisService): RequestHandler {
  return rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisRateLimitStore(prefix, redisService),
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
