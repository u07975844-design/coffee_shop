import { createApiApp } from './app.js';
import { verifyDatabaseConnection } from './config/db.js';
import { env } from './config/env.js';

const app = createApiApp({ mountNotFound: true });

async function start() {
  try {
    await verifyDatabaseConnection();
    console.log(`[mysql] Connected to ${env.db.database} at ${env.db.host}:${env.db.port}`);
  } catch (err) {
    console.error(`[mysql] Initial connection warning (${err.code || err.message}). API will return 503 until MySQL is running.`);
  }

  app.listen(env.port, () => {
    console.log(`[server] Roast & Reverie API running at http://localhost:${env.port}`);
  });
}

start();
