import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let client = null;
let ready = false;

/**
 * Initialise Redis if REDIS_URL is configured. Redis is OPTIONAL: when it is
 * absent or unreachable the rest of the app degrades gracefully (L1 cache +
 * Mongo for reads; fail-open for the auth denylist and rate limiter).
 *
 * `maxRetriesPerRequest: 1` makes commands fail fast instead of hanging when
 * Redis is down — essential for the fail-open behaviour.
 */
export function initRedis() {
  if (!env.REDIS_URL) {
    logger.warn('REDIS_URL not set — running without Redis (L1 cache + Mongo only).');
    return null;
  }

  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    reconnectOnError: () => true,
  });

  client.on('ready', () => {
    ready = true;
    logger.info('Redis connected');
  });
  client.on('end', () => {
    ready = false;
  });
  client.on('error', (err) => {
    // Don't crash — just mark unavailable. Logged at debug to avoid log spam
    // during an outage; the readiness flag drives behaviour.
    ready = false;
    logger.debug({ err: err.message }, 'Redis error');
  });

  return client;
}

/** Returns the client only when it is connected and usable, else null. */
export function getRedis() {
  return ready && client ? client : null;
}

export function redisReady() {
  return ready;
}

export async function closeRedis() {
  if (client) {
    await client.quit().catch(() => client.disconnect());
    client = null;
    ready = false;
  }
}
