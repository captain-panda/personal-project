import request from 'supertest';
import { createTestApp, closeTestApp, resetState, refreshFromRes, TestCtx } from './utils';

let ctx: TestCtx;
const http = () => ctx.app.getHttpServer();
const creds = { email: 'alice@dsa.dev', password: 'Test@1234', displayName: 'Alice' };

beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(async () => {
  await closeTestApp(ctx);
});
beforeEach(async () => {
  await resetState(ctx.app);
});

describe('auth flow', () => {
  it('registers a user and returns an access token + refresh cookie', async () => {
    const res = await request(http()).post('/api/auth/register').send(creds).expect(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe(creds.email);
    expect(refreshFromRes(res)).toBeTruthy();
  });

  it('rejects duplicate registration with 409', async () => {
    await request(http()).post('/api/auth/register').send(creds).expect(201);
    await request(http()).post('/api/auth/register').send(creds).expect(409);
  });

  it('rejects weak passwords with 400', async () => {
    await request(http())
      .post('/api/auth/register')
      .send({ email: 'x@y.com', password: 'short' })
      .expect(400);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(http()).post('/api/auth/register').send(creds).expect(201);
    await request(http())
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password })
      .expect(200);
    await request(http())
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrong' })
      .expect(401);
  });

  it('protects /me and returns the user with a valid token', async () => {
    const reg = await request(http()).post('/api/auth/register').send(creds).expect(201);
    await request(http()).get('/api/auth/me').expect(401);
    const me = await request(http())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .expect(200);
    expect(me.body.user.email).toBe(creds.email);
  });

  it('rotates the refresh token on /refresh', async () => {
    const reg = await request(http()).post('/api/auth/register').send(creds).expect(201);
    const rt1 = refreshFromRes(reg);
    const res = await request(http()).post('/api/auth/refresh').send({ refreshToken: rt1 }).expect(200);
    const rt2 = refreshFromRes(res);
    expect(res.body.accessToken).toBeTruthy();
    expect(rt2).toBeTruthy();
    expect(rt2).not.toBe(rt1);
  });

  it('detects refresh-token reuse and revokes the whole family', async () => {
    const reg = await request(http()).post('/api/auth/register').send(creds).expect(201);
    const rt1 = refreshFromRes(reg);

    const rotated = await request(http())
      .post('/api/auth/refresh')
      .send({ refreshToken: rt1 })
      .expect(200);
    const rt2 = refreshFromRes(rotated);

    const reuse = await request(http())
      .post('/api/auth/refresh')
      .send({ refreshToken: rt1 })
      .expect(401);
    expect(reuse.body.error.message).toMatch(/reuse/i);

    await request(http()).post('/api/auth/refresh').send({ refreshToken: rt2 }).expect(401);
  });

  it('logout revokes the refresh session', async () => {
    const reg = await request(http()).post('/api/auth/register').send(creds).expect(201);
    const rt1 = refreshFromRes(reg);
    await request(http())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ refreshToken: rt1 })
      .expect(200);
    await request(http()).post('/api/auth/refresh').send({ refreshToken: rt1 }).expect(401);
  });
});
