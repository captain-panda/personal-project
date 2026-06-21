import { LRUCache } from 'lru-cache';
import { getRedis } from '../config/redis.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

/**
 * Instant-revocation auth guard.
 *
 * Hot path per authenticated request:
 *   1. verify signature + expiry (stateless, fast)
 *   2. jti denylist check (single-session logout / compromised token)
 *   3. per-user revokeAfter epoch (ban / logout-everywhere)
 *
 * Both Redis checks FAIL OPEN: if Redis is unreachable the request is allowed
 * (signature is still valid; the ≤15-min token TTL is the backstop). Failing
 * closed would turn a Redis blip into a total auth outage.
 */

// Tiny in-process cache so revokeAfter isn't fetched from Redis on every request.
const revokeAfterCache = new LRUCache({ max: 10_000, ttl: 15_000 });

async function isDenied(jti) {
  const redis = getRedis();
  if (!redis) return false; // fail-open
  try {
    return (await redis.exists(`denylist:${jti}`)) === 1;
  } catch {
    return false; // fail-open
  }
}

async function revokeAfterEpoch(userId) {
  const cached = revokeAfterCache.get(userId);
  if (cached !== undefined) return cached;

  const redis = getRedis();
  if (!redis) return 0; // fail-open (no revocation enforced)
  try {
    const v = await redis.get(`revokeAfter:${userId}`);
    const epoch = v ? Number(v) : 0;
    revokeAfterCache.set(userId, epoch);
    return epoch;
  } catch {
    return 0; // fail-open
  }
}

export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw AppError.unauthorized('Missing access token');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    if (payload.type !== 'access') throw AppError.unauthorized('Invalid token type');

    if (await isDenied(payload.jti)) throw AppError.unauthorized('Token has been revoked');

    const ra = await revokeAfterEpoch(payload.sub);
    if (ra && payload.iat < ra) throw AppError.unauthorized('Session has been revoked');

    req.user = { id: payload.sub, jti: payload.jti, iat: payload.iat, exp: payload.exp };
    next();
  } catch (err) {
    next(err);
  }
};
