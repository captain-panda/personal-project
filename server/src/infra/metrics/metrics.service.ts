import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';
import { CacheService } from '../cache/cache.service';

/** Prometheus registry + metrics (ported from metrics.js). */
@Injectable()
export class MetricsService {
  readonly registry = new client.Registry();
  private readonly httpDuration: client.Histogram<string>;

  constructor(private readonly cache: CacheService) {
    client.collectDefaultMetrics({ register: this.registry });

    this.httpDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    const cacheRef = this.cache;
    // eslint-disable-next-line no-new
    new client.Gauge({
      name: 'dsa_cache_hit_ratio',
      help: 'Combined L1+L2 cache hit ratio',
      registers: [this.registry],
      collect() {
        this.set(cacheRef.hitRatio());
      },
    });
    // eslint-disable-next-line no-new
    new client.Gauge({
      name: 'dsa_cache_hits_total',
      help: 'Total cache hits',
      registers: [this.registry],
      collect() {
        this.set(cacheRef.metrics.hits);
      },
    });
    // eslint-disable-next-line no-new
    new client.Gauge({
      name: 'dsa_cache_misses_total',
      help: 'Total cache misses',
      registers: [this.registry],
      collect() {
        this.set(cacheRef.metrics.misses);
      },
    });
  }

  observe(method: string, route: string, status: number, seconds: number): void {
    this.httpDuration.observe({ method, route, status: String(status) }, seconds);
  }

  contentType(): string {
    return this.registry.contentType;
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
