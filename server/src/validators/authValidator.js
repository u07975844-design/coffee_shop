import { AppError } from '../utils/errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one numeric digit.';
  }
  return null;
}

export function validateRegisterInput(body) {
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const phone = body?.phone ? String(body.phone).trim() : null;
  const defaultAddress = body?.default_address ? String(body.default_address).trim() : null;

  if (name.length < 2 || name.length > 120) {
    throw new AppError('Full name must be between 2 and 120 characters.', 400, 'VALIDATION_ERROR');
  }
  if (!isValidEmail(email)) {
    throw new AppError('Please provide a valid email address.', 400, 'VALIDATION_ERROR');
  }
  const passwordIssue = validatePasswordStrength(password);
  if (passwordIssue) {
    throw new AppError(passwordIssue, 400, 'VALIDATION_ERROR');
  }
  if (phone && phone.length > 40) {
    throw new AppError('Phone number must be 40 characters or fewer.', 400, 'VALIDATION_ERROR');
  }

  return { name, email, password, phone, defaultAddress };
}

export function validateLoginInput(body) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!isValidEmail(email)) {
    throw new AppError('Please enter a valid email address.', 400, 'VALIDATION_ERROR');
  }
  if (!password) {
    throw new AppError('Password is required.', 400, 'VALIDATION_ERROR');
  }

  return { email, password };
}

export function validateProfileUpdateInput(body) {
  const name = String(body?.name || '').trim();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const defaultAddress = body?.default_address ? String(body.default_address).trim() : null;
  const currentPassword = body?.current_password ? String(body.current_password) : null;
  const newPassword = body?.new_password ? String(body.new_password) : null;

  if (name.length < 2 || name.length > 120) {
    throw new AppError('Name must be between 2 and 120 characters.', 400, 'VALIDATION_ERROR');
  }
  if (phone && phone.length > 40) {
    throw new AppError('Phone number must be 40 characters or fewer.', 400, 'VALIDATION_ERROR');
  }
  if (defaultAddress && defaultAddress.length > 500) {
    throw new AppError('Address must be 500 characters or fewer.', 400, 'VALIDATION_ERROR');
  }

  if (newPassword) {
    if (!currentPassword) {
      throw new AppError('Current password is required to set a new password.', 400, 'VALIDATION_ERROR');
    }
    const passwordIssue = validatePasswordStrength(newPassword);
    if (passwordIssue) {
      throw new AppError(passwordIssue, 400, 'VALIDATION_ERROR');
    }
  }

  return { name, phone, defaultAddress, currentPassword, newPassword };
}
