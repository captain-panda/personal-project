import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import type { Request } from 'express';
import { TokenService } from '../../infra/tokens/token.service';
import { RedisService } from '../../infra/redis/redis.service';
import { AppException } from '../exceptions/app.exception';

/**
 * Instant-revocation auth guard (ported from middleware/auth.js).
 * Per request: verify signature → jti denylist → revokeAfter epoch.
 * Both Redis checks FAIL OPEN (token TTL is the backstop).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly revokeAfterCache = new LRUCache<string, number>({ max: 10_000, ttl: 15_000 });

  constructor(
    private readonly tokens: TokenService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw AppException.unauthorized('Missing access token');

    let payload;
    try {
      payload = this.tokens.verifyAccessToken(token);
    } catch {
      throw AppException.unauthorized('Invalid or expired token');
    }
    if (payload.type !== 'access') throw AppException.unauthorized('Invalid token type');

    if (await this.isDenied(payload.jti)) throw AppException.unauthorized('Token has been revoked');

    const ra = await this.revokeAfterEpoch(payload.sub);
    if (ra && payload.iat < ra) throw AppException.unauthorized('Session has been revoked');

    (req as Request & { user: unknown }).user = {
      id: payload.sub,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
    };
    return true;
  }

  private async isDenied(jti: string): Promise<boolean> {
    const redis = this.redisService.getClient();
    if (!redis) return false; // fail-open
    try {
      return (await redis.exists(`denylist:${jti}`)) === 1;
    } catch {
      return false; // fail-open
    }
  }

  private async revokeAfterEpoch(userId: string): Promise<number> {
    const cached = this.revokeAfterCache.get(userId);
    if (cached !== undefined) return cached;
    const redis = this.redisService.getClient();
    if (!redis) return 0; // fail-open
    try {
      const v = await redis.get(`revokeAfter:${userId}`);
      const epoch = v ? Number(v) : 0;
      this.revokeAfterCache.set(userId, epoch);
      return epoch;
    } catch {
      return 0; // fail-open
    }
  }
}
