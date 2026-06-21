import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Problem, ProblemDocument } from '../schemas/problem.schema';
import { UserProgress, UserProgressDocument } from '../schemas/user-progress.schema';
import { CacheService } from '../infra/cache/cache.service';
import { AppException } from '../common/exceptions/app.exception';
import { TopicsService } from '../topics/topics.service';

const PROGRESS_TTL = 5 * 60 * 1000;
const STATS_TTL = 5 * 60 * 1000;
const TOTALS_TTL = 30 * 60 * 1000;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Problem.name) private readonly problemModel: Model<ProblemDocument>,
    @InjectModel(UserProgress.name) private readonly progressModel: Model<UserProgressDocument>,
    private readonly cache: CacheService,
    private readonly topics: TopicsService,
  ) {}

  async setProgress(userId: string, problemId: string, completed: boolean, notes?: string) {
    if (!isValidObjectId(problemId)) throw AppException.notFound('Problem not found');
    const exists = await this.problemModel.exists({ _id: problemId });
    if (!exists) throw AppException.notFound('Problem not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { completed, completedAt: completed ? new Date() : null };
    if (notes !== undefined) update.notes = notes;

    const doc = await this.progressModel
      .findOneAndUpdate(
        { userId, problemId },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();

    // Delete-after-write invalidation.
    await this.cache.invalidate(`progress:${userId}`, `stats:${userId}`);

    return {
      problemId: String(doc.problemId),
      completed: doc.completed,
      completedAt: doc.completedAt,
      notes: doc.notes,
    };
  }

  getUserProgress(userId: string) {
    return this.cache.getOrSet(`progress:${userId}`, PROGRESS_TTL, async () => {
      const rows = await this.progressModel
        .find({ userId })
        .select('problemId completed completedAt')
        .lean();
      return rows.map((r) => ({
        problemId: String(r.problemId),
        completed: r.completed,
        completedAt: r.completedAt,
      }));
    });
  }

  private getProblemTotals() {
    return this.cache.getOrSet('problem:totals', TOTALS_TTL, async () => {
      const [agg] = await this.problemModel.aggregate([
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

  getStats(userId: string) {
    return this.cache.getOrSet(`stats:${userId}`, STATS_TTL, async () => {
      const uid = new Types.ObjectId(userId);
      const problemsCollection = this.problemModel.collection.name;

      const [solvedResult, totals, topics] = await Promise.all([
        this.progressModel.aggregate([
          { $match: { userId: uid, completed: true } },
          { $lookup: { from: problemsCollection, localField: 'problemId', foreignField: '_id', as: 'p' } },
          { $unwind: '$p' },
          {
            $facet: {
              total: [{ $count: 'count' }],
              byDifficulty: [{ $group: { _id: '$p.difficulty', count: { $sum: 1 } } }],
              byTopic: [{ $group: { _id: '$p.topicId', count: { $sum: 1 } } }],
            },
          },
        ]),
        this.getProblemTotals(),
        this.topics.getAllTopics(),
      ]);

      const solved = solvedResult[0] || { total: [], byDifficulty: [], byTopic: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const solvedDiff = new Map(solved.byDifficulty.map((x: any) => [x._id, x.count]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalDiff = new Map((totals.byDifficulty || []).map((x: any) => [x._id, x.count]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const solvedTopic = new Map(solved.byTopic.map((x: any) => [String(x._id), x.count]));

      const totalSolved = solved.total[0]?.count || 0;
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
}
