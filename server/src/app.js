import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { verifyDatabaseConnection } from './config/db.js';
import { env } from './config/env.js';
import { verifyCookieOrigin } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

export function createApiApp({ mountNotFound = true } = {}) {
  const app = express();
  app.set('trust proxy', 1);

  const allowedOrigins = new Set(
    [env.clientUrl, 'http://localhost:5173', 'http://localhost:3000', process.env.APP_URL].filter(Boolean)
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(verifyCookieOrigin);

  // Serve uploaded product and café images safely
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
    express.static(env.paths.uploadsDir)
  );

  app.get('/api/health', async (req, res, next) => {
    try {
      await verifyDatabaseConnection();
      res.json({
        success: true,
        status: 'ok',
        database: 'connected',
        currency: env.currencyCode,
      });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  if (mountNotFound) {
    app.use('/api', notFoundHandler);
    app.use(notFoundHandler);
  } else {
    app.use('/api', notFoundHandler);
  }

  app.use(errorHandler);
  return app;
}

export default createApiApp;
