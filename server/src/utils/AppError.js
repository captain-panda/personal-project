/**
 * Operational error with an HTTP status. Thrown anywhere and converted to a
 * JSON response by the centralized error handler.
 */
export class AppError extends Error {
  constructor(statusCode, message, code = undefined, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found') {
    return new AppError(404, message, 'NOT_FOUND');
  }
  static conflict(message = 'Conflict') {
    return new AppError(409, message, 'CONFLICT');
  }
  static tooMany(message = 'Too many requests') {
    return new AppError(429, message, 'RATE_LIMITED');
  }
}
