import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Records per-route request latency. Labels by the matched route pattern (e.g.
 * /api/problems/:problemId) to keep cardinality low. Mirrors the Express
 * httpMetrics middleware (records on response 'finish' for the final status).
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const route = req.route?.path
        ? `${req.baseUrl || ''}${req.route.path}`
        : (req.originalUrl?.split('?')[0] ?? 'unmatched');
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      this.metrics.observe(req.method, route, res.statusCode, seconds);
    });

    return next.handle();
  }
}
