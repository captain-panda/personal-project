import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { httpMetrics } from './metrics.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import authRoutes from './modules/auth/auth.routes.js';
import topicsRoutes from './modules/topics/topics.routes.js';
import problemsRoutes from './modules/problems/problems.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';

/**
 * Build the Express app without starting a listener — keeps it importable from
 * tests (supertest) and the server entrypoint alike.
 */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind ALB/proxy — needed for correct req.ip
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use(httpMetrics);

  // Health/metrics first — unauthenticated, unthrottled.
  app.use('/', healthRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/topics', topicsRoutes);
  app.use('/api/problems', problemsRoutes);
  app.use('/api/progress', progressRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
