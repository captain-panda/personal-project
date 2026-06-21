import mongoose from 'mongoose';
import { Problem, UserProgress } from '../../models/index.js';
import { getOrSet, invalidate } from '../../utils/cache.js';
import { AppError } from '../../utils/AppError.js';
import { getAllTopics } from '../topics/topics.service.js';

const PROGRESS_TTL = 5 * 60 * 1000; // 5 min — per-user, changes on every toggle
const STATS_TTL = 5 * 60 * 1000;
const TOTALS_TTL = 30 * 60 * 1000; // global problem totals, rarely change
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** Toggle a problem complete/incomplete (atomic upsert on {userId, problemId}). */
export async function setProgress(userId, problemId, completed, notes) {
  if (!mongoose.isValidObjectId(problemId)) throw AppError.notFound('Problem not found');

  const exists = await Problem.exists({ _id: problemId });
  if (!exists) throw AppError.notFound('Problem not found');

  const update = { completed, completedAt: completed ? new Date() : null };
  if (notes !== undefined) update.notes = notes;

  const doc = await UserProgress.findOneAndUpdate(
    { userId, problemId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  // Delete-after-write: drop derived caches so the next read repopulates fresh.
  await invalidate(`progress:${userId}`, `stats:${userId}`);

  return {
    problemId: String(doc.problemId),
    completed: doc.completed,
    completedAt: doc.completedAt,
    notes: doc.notes,
  };
}

/** A user's full progress list (cached). Frontend derives per-topic counts from this. */
export async function getUserProgress(userId) {
  return getOrSet(`progress:${userId}`, PROGRESS_TTL, async () => {
    const rows = await UserProgress.find({ userId })
      .select('problemId completed completedAt')
      .lean();
    return rows.map((r) => ({
      problemId: String(r.problemId),
      completed: r.completed,
      completedAt: r.completedAt,
    }));
  });
}

/** Global denominators (total problems, by difficulty) — shared across users. */
function getProblemTotals() {
  return getOrSet('problem:totals', TOTALS_TTL, async () => {
    const [agg] = await Problem.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byDifficulty: [{ $group: { _id: '$difficulty', count: { $sum: 1 } } }],
        },
      },
    ]);
    return agg || { total: [], byDifficulty: [] };
  });
}

/** Per-user statistics: totals, by difficulty, by topic. */
export async function getStats(userId) {
  return getOrSet(`stats:${userId}`, STATS_TTL, async () => {
    const uid = new mongoose.Types.ObjectId(userId);

    const [[solved], totals, topics] = await Promise.all([
      UserProgress.aggregate([
        { $match: { userId: uid, completed: true } },
        { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        {
          $facet: {
            total: [{ $count: 'count' }],
            byDifficulty: [{ $group: { _id: '$p.difficulty', count: { $sum: 1 } } }],
            byTopic: [{ $group: { _id: '$p.topicId', count: { $sum: 1 } } }],
          },
        },
      ]),
      getProblemTotals(),
      getAllTopics(),
    ]);

    const solvedAgg = solved || { total: [], byDifficulty: [], byTopic: [] };
    const solvedDiff = new Map(solvedAgg.byDifficulty.map((x) => [x._id, x.count]));
    const totalDiff = new Map((totals.byDifficulty || []).map((x) => [x._id, x.count]));
    const solvedTopic = new Map(solvedAgg.byTopic.map((x) => [String(x._id), x.count]));

    const totalSolved = solvedAgg.total[0]?.count || 0;
    const totalProblems = totals.total?.[0]?.count || 0;

    return {
      totalProblems,
      totalSolved,
      percentComplete: totalProblems ? Math.round((totalSolved / totalProblems) * 100) : 0,
      byDifficulty: DIFFICULTIES.map((d) => ({
        difficulty: d,
        solved: solvedDiff.get(d) || 0,
        total: totalDiff.get(d) || 0,
      })),
      byTopic: topics.map((t) => ({
        topicId: t.id,
        name: t.name,
        order: t.order,
        solved: solvedTopic.get(t.id) || 0,
        total: t.problemCount || 0,
      })),
    };
  });
}

export async function invalidateUser(userId) {
  await invalidate(`progress:${userId}`, `stats:${userId}`);
}
