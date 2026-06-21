import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { APP_CONFIG, Env } from '../../config/env.validation';

export interface AccessPayload {
  sub: string;
  type: 'access';
  jti: string;
  iat: number;
  exp: number;
}
export interface RefreshPayload {
  sub: string;
  type: 'refresh';
  jti: string;
  fam: string;
  iat: number;
  exp: number;
}

/** JWT + token-hash helpers (ported from utils/jwt.js). */
@Injectable()
export class TokenService {
  constructor(@Inject(APP_CONFIG) private readonly config: Env) {}

  signAccessToken(userId: string): { token: string; jti: string } {
    const jti = randomUUID();
    const token = jwt.sign({ sub: userId, type: 'access', jti }, this.config.JWT_ACCESS_SECRET, {
      expiresIn: this.config.ACCESS_TOKEN_TTL,
    } as jwt.SignOptions);
    return { token, jti };
  }

  signRefreshToken(userId: string, familyId: string = randomUUID()): {
    token: string;
    jti: string;
    familyId: string;
  } {
    const jti = randomUUID();
    const token = jwt.sign(
      { sub: userId, type: 'refresh', jti, fam: familyId },
      this.config.JWT_REFRESH_SECRET,
      { expiresIn: this.config.REFRESH_TOKEN_TTL } as jwt.SignOptions,
    );
    return { token, jti, familyId };
  }

  verifyAccessToken(token: string): AccessPayload {
    return jwt.verify(token, this.config.JWT_ACCESS_SECRET) as AccessPayload;
  }

  verifyRefreshToken(token: string): RefreshPayload {
    return jwt.verify(token, this.config.JWT_REFRESH_SECRET) as RefreshPayload;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getTokenExpiry(token: string): Date | null {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  }

  newFamilyId(): string {
    return randomUUID();
  }
}
