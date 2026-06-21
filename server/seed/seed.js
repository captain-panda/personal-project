import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Topic, Problem, User, UserProgress, UserSession } from '../src/models/index.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';
import { topics, problems } from './data.js';

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const TEST_USER = { email: 'test@dsa.dev', password: 'Test@1234', displayName: 'Test Student' };

async function seed() {
  await connectDB();

  logger.info('Clearing existing collections...');
  await Promise.all([
    Topic.deleteMany({}),
    Problem.deleteMany({}),
    UserProgress.deleteMany({}),
    UserSession.deleteMany({}),
  ]);

  const topicDocs = await Topic.insertMany(topics);
  const slugToId = new Map(topicDocs.map((t) => [t.slug, t._id]));

  // Assign per-topic display order by array position; derive unique slug from title.
  const orderByTopic = new Map();
  const problemDocs = problems.map((p) => {
    const topicId = slugToId.get(p.topicSlug);
    if (!topicId) throw new Error(`Unknown topicSlug: ${p.topicSlug}`);
    const order = (orderByTopic.get(p.topicSlug) || 0) + 1;
    orderByTopic.set(p.topicSlug, order);
    const { topicSlug, ...rest } = p;
    return { ...rest, topicId, order, slug: slugify(p.title) };
  });
  await Problem.insertMany(problemDocs);

  await User.deleteOne({ email: TEST_USER.email });
  const passwordHash = await bcrypt.hash(TEST_USER.password, env.BCRYPT_COST);
  await User.create({
    email: TEST_USER.email,
    passwordHash,
    displayName: TEST_USER.displayName,
  });

  logger.info(
    `Seeded ${topicDocs.length} topics, ${problemDocs.length} problems, and test user ${TEST_USER.email} (password: ${TEST_USER.password}).`,
  );

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
