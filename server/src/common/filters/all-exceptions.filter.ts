import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';

const STATUS_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

/**
 * Centralized error handler — reproduces the Express error envelope and the
 * Mongoose/validation mappings.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = exception as any;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      const r = exception.getResponse() as { code: string; message: string; details?: unknown };
      code = r.code;
      message = r.message;
      details = r.details;
    } else if (e?.name === 'ValidationError' && e.errors) {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = 'Validation failed';
      details = Object.values(e.errors).map((x: { message: string }) => x.message);
    } else if (e?.name === 'CastError') {
      status = 400;
      code = 'BAD_IDENTIFIER';
      message = 'Invalid identifier';
    } else if (e?.code === 11000) {
      status = 409;
      code = 'DUPLICATE';
      message = 'Resource already exists';
      details = e.keyValue;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      const m = typeof r === 'string' ? r : (r as { message?: unknown }).message;
      message = Array.isArray(m) ? m.join(', ') : ((m as string) ?? message);
      code = STATUS_CODE[status] || 'ERROR';
    }

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
      if (process.env.NODE_ENV === 'production') message = 'Internal server error';
    }

    res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
  }
}
