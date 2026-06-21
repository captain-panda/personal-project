import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function notFound(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let code = typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Normalize common library errors into clean API responses.
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'BAD_IDENTIFIER';
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE';
    message = 'Resource already exists';
    details = err.keyValue;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues?.map((i) => ({ path: i.path.join('.'), message: i.message }));
  }

  if (statusCode >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled error');
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }

  res.status(statusCode).json({
    error: { code, message, ...(details ? { details } : {}) },
  });
}
