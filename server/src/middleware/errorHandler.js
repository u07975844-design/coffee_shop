import multer from 'multer';
import { env } from '../config/env.js';

const DB_CONNECTION_ERRORS = new Set([
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ENOTFOUND',
  'ETIMEDOUT',
]);

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded image exceeds the 5MB size limit.'
        : err.message;
    return res.status(400).json({
      success: false,
      code: 'UPLOAD_ERROR',
      message,
    });
  }

  if (err && DB_CONNECTION_ERRORS.has(err.code)) {
    console.error('[mysql-error]', err.code, err.message);
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message:
        'MySQL database connection is unavailable. Verify your local MySQL server is running and server/.env credentials are configured.',
    });
  }

  if (err && err.code === 'ER_NO_SUCH_TABLE') {
    console.error('[mysql-schema-error]', err.message);
    return res.status(503).json({
      success: false,
      code: 'SCHEMA_NOT_INITIALIZED',
      message:
        'Database tables are not initialized. Import server/database/schema.sql and run the seed script first.',
    });
  }

  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_ENTRY',
      message: 'A record with this unique value already exists.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected server error occurred.';

  if (statusCode >= 500) {
    console.error('[server-error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message,
    ...(err.details ? { details: err.details } : {}),
    ...(env.nodeEnv === 'development' && !err.isOperational ? { debug: err.message } : {}),
  });
}
