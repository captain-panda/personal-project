import { Injectable, Logger } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { RedisService } from '../redis/redis.service';

/**
 * Two-tier cache-aside with single-flight (ported from the Express cache util).
 *   L1 in-process LRU (short TTL) → L2 Redis (jittered TTL) → loader (Mongo)
 * Every Redis call is wrapped so an outage degrades to L1 + Mongo, never errors.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly L1_TTL_MS = 20_000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly l1 = new LRUCache<string, any>({ max: 5000, ttl: this.L1_TTL_MS });
  private readonly inflight = new Map<string, Promise<unknown>>();

  readonly metrics = { hits: 0, misses: 0, l1Hits: 0, l2Hits: 0 };

  constructor(private readonly redisService: RedisService) {}

  private jitter(ttlMs: number): number {
    const delta = ttlMs * 0.1;
    return Math.round(ttlMs - delta + Math.random() * 2 * delta);
  }

  async getOrSet<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const fromL1 = this.l1.get(key);
    if (fromL1 !== undefined) {
      this.metrics.hits++;
      this.metrics.l1Hits++;
      return fromL1 as T;
    }

    const redis = this.redisService.getClient();
    if (redis) {
      try {
        const raw = await redis.get(key);
        if (raw != null) {
          const val = JSON.parse(raw) as T;
          this.l1.set(key, val);
          this.metrics.hits++;
          this.metrics.l2Hits++;
          return val;
        }
      } catch (err) {
        this.logger.debug(`Redis GET failed (${key}): ${(err as Error).message}`);
      }
    }

    this.metrics.misses++;

    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = (async () => {
      const data = await loader();
      if (data !== undefined && data !== null) {
        const r = this.redisService.getClient();
        if (r) {
          try {
            await r.set(key, JSON.stringify(data), 'PX', this.jitter(ttlMs));
          } catch (err) {
            this.logger.debug(`Redis SET failed (${key}): ${(err as Error).message}`);
          }
        }
        this.l1.set(key, data);
      }
      return data;
    })().finally(() => this.inflight.delete(key));

    this.inflight.set(key, promise);
    return promise as Promise<T>;
  }

  /** Delete-after-write invalidation across both tiers. */
  async invalidate(...keys: string[]): Promise<void> {
    for (const k of keys) this.l1.delete(k);
    const redis = this.redisService.getClient();
    if (redis && keys.length) {
      try {
        await redis.del(...keys);
      } catch (err) {
        this.logger.debug(`Redis DEL failed: ${(err as Error).message}`);
      }
    }
  }

  hitRatio(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total === 0 ? 1 : this.metrics.hits / total;
  }

  l1Clear(): void {
    this.l1.clear();
  }
}
