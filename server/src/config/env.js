import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../..');

// Load server/.env if present, then root .env as fallback
dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config();

const rawJwtSecret = process.env.JWT_SECRET;
const jwtSecret =
  rawJwtSecret && rawJwtSecret !== 'replace_with_a_long_random_secret'
    ? rawJwtSecret
    : crypto.randomBytes(32).toString('hex');

if (!rawJwtSecret || rawJwtSecret === 'replace_with_a_long_random_secret') {
  console.warn('[security] JWT_SECRET is not set or still placeholder; using ephemeral runtime secret.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  currencyCode: process.env.CURRENCY_CODE || 'PKR',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'coffee_shop_db',
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Project Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || '',
  },
  paths: {
    serverRoot,
    uploadsDir: path.join(serverRoot, 'uploads'),
  },
};
