import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

if (!fs.existsSync(env.paths.uploadsDir)) {
  fs.mkdirSync(env.paths.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.paths.uploadsDir);
  },
  filename(req, file, cb) {
    const ext = ALLOWED_MIME_TYPES.get(file.mimetype);
    if (!ext) {
      return cb(new AppError('Only JPG, PNG, and WebP images are permitted.', 400, 'INVALID_FILE_TYPE'));
    }
    const safeName = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const resolved = path.resolve(env.paths.uploadsDir, safeName);
    const baseWithSep = path.resolve(env.paths.uploadsDir) + path.sep;
    if (!resolved.startsWith(baseWithSep)) {
      return cb(new AppError('Invalid upload path.', 400, 'INVALID_UPLOAD_PATH'));
    }
    return cb(null, safeName);
  },
});

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError('Only JPG, PNG, and WebP image files are allowed.', 400, 'INVALID_FILE_TYPE'));
    }
    return cb(null, true);
  },
});
