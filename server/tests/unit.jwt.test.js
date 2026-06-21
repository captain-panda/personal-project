import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getTokenExpiry,
} from '../src/utils/jwt.js';

const user = { _id: '507f1f77bcf86cd799439011' };

describe('jwt utils', () => {
  it('signs and verifies an access token carrying a jti', () => {
    const { token, jti } = signAccessToken(user);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(user._id);
    expect(payload.type).toBe('access');
    expect(payload.jti).toBe(jti);
  });

  it('signs a refresh token with a family id', () => {
    const { token, familyId } = signRefreshToken(user, 'fam-123');
    const payload = verifyRefreshToken(token);
    expect(payload.type).toBe('refresh');
    expect(payload.fam).toBe('fam-123');
    expect(familyId).toBe('fam-123');
  });

  it('hashToken is deterministic and collision-sensitive', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });

  it('reads the token expiry as a future Date', () => {
    const { token } = signAccessToken(user);
    const exp = getTokenExpiry(token);
    expect(exp).toBeInstanceOf(Date);
    expect(exp.getTime()).toBeGreaterThan(Date.now());
  });
});
