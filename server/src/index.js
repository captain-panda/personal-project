import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initRedis, closeRedis } from './config/redis.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDB();
  initRedis(); // optional — no-op if REDIS_URL is unset

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Graceful shutdown — stop accepting connections, drain, close deps.
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await closeRedis();
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
