import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Back the Redis-dependent paths (denylist) with an in-memory ioredis-mock so
// instant revocation can be tested deterministically.
vi.mock('../src/config/redis.js', async () => {
  const RedisMock = (await import('ioredis-mock')).default;
  const client = new RedisMock();
  return {
    getRedis: () => client,
    redisReady: () => true,
    initRedis: () => client,
    closeRedis: async () => {},
  };
});

const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { setupDB, teardownDB, clearDB, refreshFromRes } = await import('./helpers/db.js');

const app = createApp();
const creds = { email: 'rev@dsa.dev', password: 'Test@1234' };

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

describe('instant revocation', () => {
  it('denylists a logged-out access token immediately (jti)', async () => {
    const reg = await request(app).post('/api/auth/register').send(creds).expect(201);
    const token = reg.body.accessToken;
    const rt = refreshFromRes(reg);

    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: rt })
      .expect(200);

    // Same access token is now rejected by the denylist (no waiting for expiry).
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('logout-all revokes all refresh sessions', async () => {
    const reg = await request(app).post('/api/auth/register').send(creds).expect(201);
    const token = reg.body.accessToken;
    const rt = refreshFromRes(reg);

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // The refresh token from before logout-all can no longer be rotated.
    await request(app).post('/api/auth/refresh').send({ refreshToken: rt }).expect(401);
  });
});
