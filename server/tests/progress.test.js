import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Topic, Problem } from '../src/models/index.js';
import { setupDB, teardownDB, clearDB } from './helpers/db.js';

const app = createApp();

beforeAll(setupDB);
afterAll(teardownDB);
beforeEach(clearDB);

async function registerUser(email = 'p@dsa.dev') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Test@1234', displayName: 'P' })
    .expect(201);
  return { token: res.body.accessToken, userId: res.body.user.id };
}

async function seedProblems() {
  const topic = await Topic.create({ name: 'Arrays', slug: 'arrays', order: 1 });
  const easy = await Problem.create({
    topicId: topic._id,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    order: 1,
  });
  const medium = await Problem.create({
    topicId: topic._id,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    order: 2,
  });
  return { topic, easy, medium };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('progress + stats', () => {
  it('marks a problem complete and reflects it in /progress/me', async () => {
    const { token } = await registerUser();
    const { easy } = await seedProblems();

    await request(app)
      .patch(`/api/progress/${easy._id}`)
      .set(auth(token))
      .send({ completed: true })
      .expect(200);

    const me = await request(app).get('/api/progress/me').set(auth(token)).expect(200);
    const row = me.body.progress.find((p) => p.problemId === String(easy._id));
    expect(row.completed).toBe(true);
  });

  it('is idempotent — marking complete twice counts once', async () => {
    const { token } = await registerUser();
    const { easy } = await seedProblems();

    await request(app).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });
    await request(app).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });

    const stats = await request(app).get('/api/progress/stats').set(auth(token)).expect(200);
    expect(stats.body.stats.totalSolved).toBe(1);
  });

  it('computes stats by difficulty and topic', async () => {
    const { token } = await registerUser();
    const { easy, medium, topic } = await seedProblems();

    await request(app).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });
    await request(app).patch(`/api/progress/${medium._id}`).set(auth(token)).send({ completed: true });

    const res = await request(app).get('/api/progress/stats').set(auth(token)).expect(200);
    const { stats } = res.body;

    expect(stats.totalProblems).toBe(2);
    expect(stats.totalSolved).toBe(2);
    expect(stats.percentComplete).toBe(100);
    expect(stats.byDifficulty.find((d) => d.difficulty === 'Easy').solved).toBe(1);
    expect(stats.byDifficulty.find((d) => d.difficulty === 'Medium').solved).toBe(1);
    const arrays = stats.byTopic.find((t) => t.topicId === String(topic._id));
    expect(arrays.solved).toBe(2);
    expect(arrays.total).toBe(2);
  });

  it('un-toggling a problem decrements the solved count', async () => {
    const { token } = await registerUser();
    const { easy } = await seedProblems();

    await request(app).patch(`/api/progress/${easy._id}`).set(auth(token)).send({ completed: true });
    await request(app)
      .patch(`/api/progress/${easy._id}`)
      .set(auth(token))
      .send({ completed: false })
      .expect(200);

    const stats = await request(app).get('/api/progress/stats').set(auth(token)).expect(200);
    expect(stats.body.stats.totalSolved).toBe(0);
  });

  it('returns 404 when toggling a non-existent problem', async () => {
    const { token } = await registerUser();
    await request(app)
      .patch('/api/progress/507f1f77bcf86cd799439099')
      .set(auth(token))
      .send({ completed: true })
      .expect(404);
  });

  it('prevents reading another user’s progress (IDOR)', async () => {
    const a = await registerUser('a@dsa.dev');
    const b = await registerUser('b@dsa.dev');

    await request(app)
      .get(`/api/progress/user/${a.userId}`)
      .set(auth(b.token))
      .expect(403);

    await request(app)
      .get(`/api/progress/user/${a.userId}`)
      .set(auth(a.token))
      .expect(200);
  });
});
