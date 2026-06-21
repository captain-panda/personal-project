import { HttpException } from '@nestjs/common';

/**
 * Operational error carrying an explicit error `code` (mirrors the Express
 * AppError). The global filter turns it into `{ error: { code, message, details } }`.
 */
export class AppException extends HttpException {
  constructor(status: number, message: string, code: string, details?: unknown) {
    super({ code, message, details }, status);
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new AppException(400, message, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppException(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new AppException(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found') {
    return new AppException(404, message, 'NOT_FOUND');
  }
  static conflict(message = 'Conflict') {
    return new AppException(409, message, 'CONFLICT');
  }
  static tooMany(message = 'Too many requests') {
    return new AppException(429, message, 'RATE_LIMITED');
  }
}
