import { TokenService } from '../src/infra/tokens/token.service';
import { Env } from '../src/config/env.validation';

const config = {
  JWT_ACCESS_SECRET: 'test_access_secret_0123456789_abcdef',
  JWT_REFRESH_SECRET: 'test_refresh_secret_0123456789_abcdef',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '7d',
} as Env;

const tokens = new TokenService(config);
const userId = '507f1f77bcf86cd799439011';

describe('TokenService', () => {
  it('signs and verifies an access token carrying a jti', () => {
    const { token, jti } = tokens.signAccessToken(userId);
    const payload = tokens.verifyAccessToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.type).toBe('access');
    expect(payload.jti).toBe(jti);
  });

  it('signs a refresh token with a family id', () => {
    const { token, familyId } = tokens.signRefreshToken(userId, 'fam-123');
    const payload = tokens.verifyRefreshToken(token);
    expect(payload.type).toBe('refresh');
    expect(payload.fam).toBe('fam-123');
    expect(familyId).toBe('fam-123');
  });

  it('hashToken is deterministic and collision-sensitive', () => {
    expect(tokens.hashToken('abc')).toBe(tokens.hashToken('abc'));
    expect(tokens.hashToken('abc')).not.toBe(tokens.hashToken('abd'));
  });

  it('reads the token expiry as a future Date', () => {
    const { token } = tokens.signAccessToken(userId);
    const exp = tokens.getTokenExpiry(token);
    expect(exp).toBeInstanceOf(Date);
    expect(exp!.getTime()).toBeGreaterThan(Date.now());
  });
});
