import request from 'supertest';
import RedisMock from 'ioredis-mock';
import { createTestApp, closeTestApp, resetState, refreshFromRes, TestCtx } from './utils';

// Back the Redis-dependent paths with an in-memory ioredis-mock so instant
// revocation can be tested deterministically.
const redisClient = new RedisMock();
const redisOverride = {
  getClient: () => redisClient,
  ready: () => true,
  onModuleInit: () => undefined,
  onModuleDestroy: async () => undefined,
};

let ctx: TestCtx;
const http = () => ctx.app.getHttpServer();
const creds = { email: 'rev@dsa.dev', password: 'Test@1234' };

beforeAll(async () => {
  ctx = await createTestApp(redisOverride);
});
afterAll(async () => {
  await closeTestApp(ctx);
});
beforeEach(async () => {
  await resetState(ctx.app);
  await redisClient.flushall();
});

describe('instant revocation', () => {
  it('denylists a logged-out access token immediately (jti)', async () => {
    const reg = await request(http()).post('/api/auth/register').send(creds).expect(201);
    const token = reg.body.accessToken;
    const rt = refreshFromRes(reg);

    await request(http()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

    await request(http())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: rt })
      .expect(200);

    await request(http()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('logout-all revokes all refresh sessions', async () => {
    const reg = await request(http()).post('/api/auth/register').send(creds).expect(201);
    const token = reg.body.accessToken;
    const rt = refreshFromRes(reg);

    await request(http())
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(http()).post('/api/auth/refresh').send({ refreshToken: rt }).expect(401);
  });
});
