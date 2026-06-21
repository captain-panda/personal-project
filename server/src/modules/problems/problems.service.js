import mongoose from 'mongoose';
import { Topic, Problem } from '../../models/index.js';
import { getOrSet, invalidate } from '../../utils/cache.js';
import { AppError } from '../../utils/AppError.js';

const TOPIC_PROBLEMS_TTL = 30 * 60 * 1000; // 30 min
const PROBLEM_TTL = 60 * 60 * 1000; // 60 min

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Not found');
}

function mapProblem(p) {
  return {
    id: String(p._id),
    topicId: String(p.topicId),
    subtopic: p.subtopic,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    description: p.description,
    order: p.order,
    links: p.links,
    tags: p.tags,
  };
}

export async function getProblemsByTopic(topicId) {
  assertObjectId(topicId);
  return getOrSet(`problems:topic:${topicId}`, TOPIC_PROBLEMS_TTL, async () => {
    const topic = await Topic.findById(topicId).lean();
    if (!topic) throw AppError.notFound('Topic not found');
    const problems = await Problem.find({ topicId }).sort({ order: 1 }).lean();
    return {
      topic: {
        id: String(topic._id),
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
      },
      problems: problems.map(mapProblem),
    };
  });
}

export async function getProblemById(problemId) {
  assertObjectId(problemId);
  return getOrSet(`problem:${problemId}`, PROBLEM_TTL, async () => {
    const p = await Problem.findById(problemId).lean();
    if (!p) throw AppError.notFound('Problem not found');
    return mapProblem(p);
  });
}

export async function invalidateProblem(problemId, topicId) {
  const keys = [`problem:${problemId}`];
  if (topicId) keys.push(`problems:topic:${topicId}`);
  await invalidate(...keys);
}
