import bcrypt from 'bcrypt';
import { User, UserSession } from '../../models/index.js';
import { env } from '../../config/env.js';
import { getRedis } from '../../config/redis.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getTokenExpiry,
  newFamilyId,
} from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

/** Issue an access token + a fresh refresh token, persisting the session row. */
async function issueSession(user, familyId, meta = {}) {
  const { token: refreshToken } = signRefreshToken(user, familyId);
  await UserSession.create({
    userId: user._id,
    familyId,
    tokenHash: hashToken(refreshToken),
    userAgent: meta.userAgent || '',
    ipAddress: meta.ip || '',
    expiresAt: getTokenExpiry(refreshToken) ?? new Date(Date.now() + 7 * 864e5),
  });
  const { token: accessToken } = signAccessToken(user);
  return { accessToken, refreshToken };
}

export async function registerUser({ email, password, displayName, userAgent, ip }) {
  const existing = await User.findOne({ email }).lean();
  if (existing) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  const user = await User.create({ email, passwordHash, displayName: displayName || '' });
  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueSession(user, newFamilyId(), { userAgent, ip });
  return { user, ...tokens };
}

export async function loginUser({ email, password, userAgent, ip }) {
  const user = await User.findOne({ email });
  // Same generic error whether the email is unknown or the password is wrong.
  if (!user || !user.isActive) throw AppError.unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueSession(user, newFamilyId(), { userAgent, ip });
  return { user, ...tokens };
}

/**
 * Rotate a refresh token. Implements single-use rotation + reuse detection:
 * presenting an already-rotated token revokes the entire session family.
 */
export async function rotateRefreshToken({ refreshToken, userAgent, ip }) {
  if (!refreshToken) throw AppError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
  if (payload.type !== 'refresh') throw AppError.unauthorized('Invalid token type');

  const session = await UserSession.findOne({ tokenHash: hashToken(refreshToken) });
  if (!session) throw AppError.unauthorized('Invalid refresh token');

  // REUSE DETECTION — a revoked token replayed = theft signal → nuke the family.
  if (session.revokedAt) {
    await UserSession.updateMany(
      { familyId: session.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    logger.warn(
      { userId: String(session.userId), familyId: session.familyId },
      'Refresh token reuse detected — session family revoked',
    );
    throw AppError.unauthorized('Refresh token reuse detected. Please log in again.');
  }

  if (session.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized('Refresh token expired');
  }

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) throw AppError.unauthorized('Account unavailable');

  // Rotate: revoke the presented token, mint a new one in the same family.
  session.revokedAt = new Date();
  await session.save();

  const tokens = await issueSession(user, session.familyId, { userAgent, ip });
  return { user, ...tokens };
}

/** Single-session logout: revoke the refresh session + denylist the access jti. */
export async function logout({ refreshToken, accessJti, accessExp }) {
  if (refreshToken) {
    await UserSession.updateOne(
      { tokenHash: hashToken(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  const redis = getRedis();
  if (redis && accessJti && accessExp) {
    const ttl = accessExp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      try {
        await redis.set(`denylist:${accessJti}`, '1', 'EX', ttl);
      } catch (err) {
        logger.debug({ err: err.message }, 'denylist set failed');
      }
    }
  }
}

/** Log out everywhere: bump revokeAfter epoch + revoke all sessions. */
export async function logoutAll({ userId }) {
  const now = new Date();
  await User.updateOne({ _id: userId }, { $set: { revokeAfter: now } });
  await UserSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: now } });

  const redis = getRedis();
  if (redis) {
    const epoch = Math.floor(now.getTime() / 1000) + 1;
    try {
      await redis.set(`revokeAfter:${userId}`, String(epoch), 'EX', 7 * 24 * 3600);
    } catch (err) {
      logger.debug({ err: err.message }, 'revokeAfter set failed');
    }
  }
}
