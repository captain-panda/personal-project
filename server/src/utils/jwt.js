import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Access token: short-lived (15m), verified by signature only on the hot path.
 * Carries a `jti` so individual tokens can be added to the Redis denylist.
 */
export function signAccessToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: user._id.toString(), type: 'access', jti }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
  return { token, jti };
}

/**
 * Refresh token: long-lived (7d), single-use. `fam` groups rotations for
 * reuse detection. Stored server-side as a hash (see UserSession).
 */
export function signRefreshToken(user, familyId = crypto.randomUUID()) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user._id.toString(), type: 'refresh', jti, fam: familyId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_TTL },
  );
  return { token, jti, familyId };
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/** SHA-256 — used to store refresh tokens without keeping the raw value. */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Read a token's `exp` claim as a Date (no signature check). */
export function getTokenExpiry(token) {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : null;
}

export function newFamilyId() {
  return crypto.randomUUID();
}
