import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. `retryWrites`/`retryReads` should be set in the Atlas
 * connection string so the driver replays ops transparently across a primary
 * failover (see SYSTEM_DESIGN — failure-mode runbook).
 */
export async function connectDB(uri = env.MONGO_URI) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: 2,
  });

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  logger.info('MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

/** readyState === 1 means connected — used by /readyz. */
export function dbReady() {
  return mongoose.connection.readyState === 1;
}
