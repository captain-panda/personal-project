import { LRUCache } from 'lru-cache';
import { getRedis } from '../config/redis.js';
import { logger } from './logger.js';

/**
 * Two-tier cache-aside helper.
 *
 *   L1  in-process LRU (short TTL) — shields Mongo even when Redis is down
 *   L2  Redis (longer, jittered TTL) — shared across instances
 *
 * Plus single-flight: concurrent misses for the same key collapse into ONE
 * loader call, preventing a cache stampede onto Mongo when a hot key expires.
 * Every Redis call is wrapped so a Redis outage degrades to L1 + Mongo rather
 * than erroring (graceful degradation).
 */

const L1_TTL_MS = 20_000; // 20s
const l1 = new LRUCache({ max: 5000, ttl: L1_TTL_MS });
const inflight = new Map();

export const cacheMetrics = { hits: 0, misses: 0, l1Hits: 0, l2Hits: 0 };

function jitter(ttlMs) {
  // ±10% so keys don't all expire on the same tick (stampede protection).
  const delta = ttlMs * 0.1;
  return Math.round(ttlMs - delta + Math.random() * 2 * delta);
}

export async function getOrSet(key, ttlMs, loader) {
  const fromL1 = l1.get(key);
  if (fromL1 !== undefined) {
    cacheMetrics.hits++;
    cacheMetrics.l1Hits++;
    return fromL1;
  }

  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw != null) {
        const val = JSON.parse(raw);
        l1.set(key, val);
        cacheMetrics.hits++;
        cacheMetrics.l2Hits++;
        return val;
      }
    } catch (err) {
      logger.debug({ err: err.message, key }, 'Redis GET failed — falling through to loader');
    }
  }

  cacheMetrics.misses++;

  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    const data = await loader();
    if (data !== undefined && data !== null) {
      const r = getRedis();
      if (r) {
        try {
          await r.set(key, JSON.stringify(data), 'PX', jitter(ttlMs));
        } catch (err) {
          logger.debug({ err: err.message, key }, 'Redis SET failed');
        }
      }
      l1.set(key, data);
    }
    return data;
  })().finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

/** Delete-after-write invalidation across both tiers. */
export async function invalidate(...keys) {
  for (const k of keys) l1.delete(k);
  const redis = getRedis();
  if (redis && keys.length) {
    try {
      await redis.del(...keys);
    } catch (err) {
      logger.debug({ err: err.message }, 'Redis DEL failed');
    }
  }
}

export function hitRatio() {
  const total = cacheMetrics.hits + cacheMetrics.misses;
  return total === 0 ? 1 : cacheMetrics.hits / total;
}

export function l1Clear() {
  l1.clear();
}
