import request from 'supertest';
import { createTestApp, closeTestApp, TestCtx } from './utils';

let ctx: TestCtx;
const http = () => ctx.app.getHttpServer();

beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(async () => {
  await closeTestApp(ctx);
});

describe('ops endpoints (parity)', () => {
  it('GET /healthz → shallow liveness', async () => {
    const res = await request(http()).get('/healthz').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /readyz → mongo up, redis optional (false)', async () => {
    const res = await request(http()).get('/readyz').expect(200);
    expect(res.body.checks.mongo).toBe(true);
    expect(res.body.checks.redis).toBe(false);
  });

  it('GET /metrics → exposes the cache hit-ratio gauge', async () => {
    const res = await request(http()).get('/metrics').expect(200);
    expect(res.text).toContain('dsa_cache_hit_ratio');
  });

  it('protected data routes require a token', async () => {
    await request(http()).get('/api/topics').expect(401);
  });
});
