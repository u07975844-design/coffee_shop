import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  signAuthToken,
} from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import {
  validateLoginInput,
  validateProfileUpdateInput,
  validateRegisterInput,
} from '../validators/authValidator.js';

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    default_address: user.default_address,
    role: user.role,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, defaultAddress } = validateRegisterInput(req.body);

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length > 0) {
    throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Public registration ALWAYS assigns 'customer' role
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, default_address, role, is_active)
     VALUES (?, ?, ?, ?, ?, 'customer', 1)`,
    [name, email, passwordHash, phone, defaultAddress]
  );

  const [rows] = await pool.query(
    'SELECT id, name, email, phone, default_address, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [result.insertId]
  );

  const user = rows[0];
  const token = signAuthToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions(req));

  res.status(201).json({
    success: true,
    message: 'Registration completed successfully.',
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = validateLoginInput(req.body);

  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash, phone, default_address, role, is_active, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    throw new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS');
  }

  const user = rows[0];
  if (!user.is_active) {
    throw new AppError('This account has been deactivated. Contact support for help.', 403, 'ACCOUNT_DISABLED');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS');
  }

  const token = signAuthToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions(req));

  res.json({
    success: true,
    message: 'Signed in successfully.',
    user: sanitizeUser(user),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const cookieOpts = buildAuthCookieOptions(req);
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: '/',
  });
  res.json({ success: true, message: 'Signed out successfully.' });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, defaultAddress, currentPassword, newPassword } = validateProfileUpdateInput(req.body);

  let passwordUpdateSql = '';
  const params = [name, phone, defaultAddress];

  if (newPassword) {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const validCurrent = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!validCurrent) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_PASSWORD');
    }
    const nextHash = await bcrypt.hash(newPassword, 12);
    passwordUpdateSql = ', password_hash = ?';
    params.push(nextHash);
  }

  params.push(req.user.id);
  await pool.query(
    `UPDATE users SET name = ?, phone = ?, default_address = ?${passwordUpdateSql} WHERE id = ?`,
    params
  );

  const [updatedRows] = await pool.query(
    'SELECT id, name, email, phone, default_address, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: sanitizeUser(updatedRows[0]),
  });
});
