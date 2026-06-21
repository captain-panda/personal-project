import client from 'prom-client';
import { hitRatio, cacheMetrics } from './utils/cache.js';

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

// Per-route latency histogram — track p95 per route (a global p95 hides the
// bcrypt login cost until a login storm shifts the mix).
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

// Cache hit ratio — first-class SLO metric (capacity model assumes >95%).
// eslint-disable-next-line no-new
new client.Gauge({
  name: 'dsa_cache_hit_ratio',
  help: 'Combined L1+L2 cache hit ratio',
  registers: [registry],
  collect() {
    this.set(hitRatio());
  },
});
// eslint-disable-next-line no-new
new client.Gauge({
  name: 'dsa_cache_hits_total',
  help: 'Total cache hits',
  registers: [registry],
  collect() {
    this.set(cacheMetrics.hits);
  },
});
// eslint-disable-next-line no-new
new client.Gauge({
  name: 'dsa_cache_misses_total',
  help: 'Total cache misses',
  registers: [registry],
  collect() {
    this.set(cacheMetrics.misses);
  },
});

export function httpMetrics(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    // Use the matched route pattern (e.g. /api/problems/:problemId) to keep
    // label cardinality low.
    const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
    end({ method: req.method, route, status: res.statusCode });
  });
  next();
}

export async function metricsHandler(_req, res) {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
