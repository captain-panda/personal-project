import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { Topic } from '../src/schemas/topic.schema';
import { Problem } from '../src/schemas/problem.schema';
import { User } from '../src/schemas/user.schema';
import { UserProgress } from '../src/schemas/user-progress.schema';
import { UserSession } from '../src/schemas/user-session.schema';
import { validateEnv } from '../src/config/env.validation';
import { topics, problems } from './data';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const TEST_USER = { email: 'test@dsa.dev', password: 'Test@1234', displayName: 'Test Student' };

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (name: string): Model<any> => app.get(getModelToken(name));
  const topicModel = m(Topic.name);
  const problemModel = m(Problem.name);
  const userModel = m(User.name);
  const progressModel = m(UserProgress.name);
  const sessionModel = m(UserSession.name);

  await Promise.all([
    topicModel.deleteMany({}),
    problemModel.deleteMany({}),
    progressModel.deleteMany({}),
    sessionModel.deleteMany({}),
  ]);

  const topicDocs = await topicModel.insertMany(topics);
  const slugToId = new Map(topicDocs.map((t) => [t.slug, t._id]));

  const orderByTopic = new Map<string, number>();
  const problemDocs = problems.map((p) => {
    const topicId = slugToId.get(p.topicSlug);
    if (!topicId) throw new Error(`Unknown topicSlug: ${p.topicSlug}`);
    const order = (orderByTopic.get(p.topicSlug) || 0) + 1;
    orderByTopic.set(p.topicSlug, order);
    const { topicSlug, ...rest } = p;
    return { ...rest, topicId, order, slug: slugify(p.title) };
  });
  await problemModel.insertMany(problemDocs);

  await userModel.deleteOne({ email: TEST_USER.email });
  const cfg = validateEnv(process.env);
  const passwordHash = await bcrypt.hash(TEST_USER.password, cfg.BCRYPT_COST);
  await userModel.create({
    email: TEST_USER.email,
    passwordHash,
    displayName: TEST_USER.displayName,
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${topicDocs.length} topics, ${problemDocs.length} problems, and test user ${TEST_USER.email} (password: ${TEST_USER.password}).`,
  );

  await app.close();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
