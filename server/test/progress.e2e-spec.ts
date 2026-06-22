import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from '../src/schemas/topic.schema';
import { Problem } from '../src/schemas/problem.schema';
import { createTestApp, closeTestApp, resetState, TestCtx } from './utils';

let ctx: TestCtx;
const http = () => ctx.app.getHttpServer();
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(async () => {
  await closeTestApp(ctx);
});
beforeEach(async () => {
  await resetState(ctx.app);
});

async function registerUser(email = 'p@dsa.dev') {
  const res = await request(http())
    .post('/api/auth/register')
    .send({ email, password: 'Test@1234', displayName: 'P' })
    .expect(201);
  return { token: res.body.accessToken as string, userId: res.body.user.id as string };
}

async function seedProblems() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topicModel = ctx.app.get<Model<any>>(getModelToken(Topic.name));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const problemModel = ctx.app.get<Model<any>>(getModelToken(Problem.name));
  const topic = await topicModel.create({ name: 'Arrays', slug: 'arrays', order: 1 });
  const easy = await problemModel.create({
    topicId: topic._id,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    order: 1,
  });
  const medium = await problemModel.create({
    topicId: topic._id,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    order: 2,
  });
  return { topic, easy, medium };
}

describe('progress + stats', () => {
  it('marks a problem complete and reflects it in /progress/me', async () => {
    const { token } = await registerUser();
    const { easy } = await seedProblems();

    await request(http())
      .patch(`/api/progress/${easy._id}`)
      .set(auth(token))
      .send({ completed: true })
      .expect(200);

    const me = await request(http()).get('/api/progress/me').set(auth(token)).expect(200);
    const row = me.body.progress.find((p: { problemId: string }) => p.problemId === String(easy._id));
    expect(row.completed).toBe(true);
  });

  it('is idempotent — marking complete twice counts once', async () => {
    const { token } = await registerUser();
    const { easy } = await seedProblems();
    await request(http()).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });
    await request(http()).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });

    const stats = await request(http()).get('/api/progress/stats').set(auth(token)).expect(200);
    expect(stats.body.stats.totalSolved).toBe(1);
  });

  it('computes stats by difficulty and topic', async () => {
    const { token } = await registerUser();
    const { easy, medium, topic } = await seedProblems();

    await request(http()).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });
    await request(http()).patch(`/api/progress/${medium._id}`).set(auth(token)).send({ completed: true });

    const res = await request(http()).get('/api/progress/stats').set(auth(token)).expect(200);
    const { stats } = res.body;
    expect(stats.totalProblems).toBe(2);
    expect(stats.totalSolved).toBe(2);
    expect(stats.percentComplete).toBe(100);
    expect(stats.byDifficulty.find((d: { difficulty: string }) => d.difficulty === 'Easy').solved).toBe(1);
    expect(stats.byDifficulty.find((d: { difficulty: string }) => d.difficulty === 'Medium').solved).toBe(1);
    const arrays = stats.byTopic.find((t: { topicId: string }) => t.topicId === String(topic._id));
    expect(arrays.solved).toBe(2);
    expect(arrays.total).toBe(2);
  });

  it('un-toggling a problem decrements the solved count', async () => {
    const { token } = await registerUser();
    const { easy } = await seedProblems();
    await request(http()).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });
    await request(http())
      .patch(`/api/progress/${easy._id}`)
      .set(auth(token))
      .send({ completed: false })
      .expect(200);

    const stats = await request(http()).get('/api/progress/stats').set(auth(token)).expect(200);
    expect(stats.body.stats.totalSolved).toBe(0);
  });

  it('returns 404 when toggling a non-existent problem', async () => {
    const { token } = await registerUser();
    await request(http())
      .patch('/api/progress/507f1f77bcf86cd799439099')
      .set(auth(token))
      .send({ completed: true })
      .expect(404);
  });

  it('prevents reading another user’s progress (IDOR)', async () => {
    const a = await registerUser('a@dsa.dev');
    const b = await registerUser('b@dsa.dev');
    await request(http()).get(`/api/progress/user/${a.userId}`).set(auth(b.token)).expect(403);
    await request(http()).get(`/api/progress/user/${a.userId}`).set(auth(a.token)).expect(200);
  });
});
