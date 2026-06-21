import pino from 'pino';
import { env, isTest } from '../config/env.js';

/**
 * Structured JSON logger.
 * - test:        silent (keeps test output clean)
 * - development: pretty-printed via pino-pretty
 * - production:  raw JSON on stdout (shipped to CloudWatch Logs)
 */
export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
});
