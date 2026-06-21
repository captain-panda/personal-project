import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

/**
 * Request/response logging with a correlation id (`x-request-id`) propagated on
 * the response so a single request is traceable end-to-end across logs.
 * Health and metrics endpoints are excluded to avoid log spam.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => ['/healthz', '/readyz', '/metrics'].includes(req.url),
  },
});
