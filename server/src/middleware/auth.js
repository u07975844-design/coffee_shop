import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/errors.js';

export const AUTH_COOKIE_NAME = 'rr_auth_token';

export function buildAuthCookieOptions(req) {
  const isSecure =
    env.nodeEnv === 'production' ||
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https';

  return {
    httpOnly: true,
    secure: Boolean(isSecure),
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    throw new AppError('Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new AppError('Session expired or invalid. Please sign in again.', 401, 'INVALID_TOKEN');
  }

  const [rows] = await pool.query(
    `SELECT id, name, email, phone, default_address, role, is_active, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [decoded.sub]
  );

  if (rows.length === 0 || !rows[0].is_active) {
    throw new AppError('Account is unavailable or deactivated.', 401, 'ACCOUNT_INACTIVE');
  }

  req.user = rows[0];
  next();
});

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Administrator privileges are required for this action.', 403, 'FORBIDDEN'));
  }
  return next();
}

export function verifyCookieOrigin(req, res, next) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const allowedOrigins = new Set(
    [
      env.clientUrl,
      `http://${host}`,
      `https://${host}`,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean)
  );

  if (origin) {
    if (!allowedOrigins.has(origin)) {
      return next(new AppError('Request origin is not permitted.', 403, 'INVALID_ORIGIN'));
    }
    return next();
  }

  // Fallback check if browser omits Origin on same-origin fetch
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return next();
  }

  return next();
}
