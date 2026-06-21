import { Topic, Problem } from '../../models/index.js';
import { getOrSet, invalidate } from '../../utils/cache.js';

const TOPICS_TTL = 60 * 60 * 1000; // 60 min — topics rarely change

/**
 * All topics in display order, each with a problemCount. Counts are computed
 * once per cache-fill via a single aggregation (no per-topic N+1). Globally
 * identical for every user → highly cacheable.
 */
export async function getAllTopics() {
  return getOrSet('topics:all', TOPICS_TTL, async () => {
    const [topics, counts] = await Promise.all([
      Topic.find().sort({ order: 1 }).lean(),
      Problem.aggregate([{ $group: { _id: '$topicId', count: { $sum: 1 } } }]),
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    return topics.map((t) => ({
      id: String(t._id),
      name: t.name,
      description: t.description,
      order: t.order,
      slug: t.slug,
      iconUrl: t.iconUrl,
      problemCount: countMap.get(String(t._id)) || 0,
    }));
  });
}

/** Invalidate the topics cache (called when content changes / on seed). */
export async function invalidateTopics() {
  await invalidate('topics:all');
}
