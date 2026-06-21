import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { User } from '../../models/index.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';

/**
 * httpOnly refresh cookie, scoped to /api/auth so it's only sent to the auth
 * endpoints. In production (cross-subdomain) SameSite=None + Secure is required;
 * locally we use Lax.
 */
function cookieOpts() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/api/auth',
    maxAge: 7 * 24 * 3600 * 1000,
  };
}

function clearOpts() {
  const { maxAge, ...rest } = cookieOpts();
  return rest;
}

function clientMeta(req) {
  return { userAgent: req.headers['user-agent'] || '', ip: req.ip };
}

function bearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;
  const { user, accessToken, refreshToken } = await authService.registerUser({
    email,
    password,
    displayName,
    ...clientMeta(req),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  res.status(201).json({ user: user.toSafeJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser({
    email,
    password,
    ...clientMeta(req),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
  res.json({ user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  const result = await authService.rotateRefreshToken({ refreshToken, ...clientMeta(req) });
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts());
  res.json({ user: result.user.toSafeJSON(), accessToken: result.accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  const accessToken = bearer(req);
  let accessJti;
  let accessExp;
  if (accessToken) {
    try {
      const p = verifyAccessToken(accessToken);
      accessJti = p.jti;
      accessExp = p.exp;
    } catch {
      /* expired/invalid access token — still proceed to revoke refresh session */
    }
  }
  await authService.logout({ refreshToken, accessJti, accessExp });
  res.clearCookie(REFRESH_COOKIE, clearOpts());
  res.json({ success: true });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll({ userId: req.user.id });
  res.clearCookie(REFRESH_COOKIE, clearOpts());
  res.json({ success: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw AppError.notFound('User not found');
  res.json({ user: user.toSafeJSON() });
});
