import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Topic, TopicDocument } from '../schemas/topic.schema';
import { Problem, ProblemDocument } from '../schemas/problem.schema';
import { CacheService } from '../infra/cache/cache.service';
import { AppException } from '../common/exceptions/app.exception';

const TOPIC_PROBLEMS_TTL = 30 * 60 * 1000;
const PROBLEM_TTL = 60 * 60 * 1000;

@Injectable()
export class ProblemsService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Problem.name) private readonly problemModel: Model<ProblemDocument>,
    private readonly cache: CacheService,
  ) {}

  private assertObjectId(id: string) {
    if (!isValidObjectId(id)) throw AppException.notFound('Not found');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapProblem(p: any) {
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

  getProblemsByTopic(topicId: string) {
    this.assertObjectId(topicId);
    return this.cache.getOrSet(`problems:topic:${topicId}`, TOPIC_PROBLEMS_TTL, async () => {
      const topic = await this.topicModel.findById(topicId).lean();
      if (!topic) throw AppException.notFound('Topic not found');
      const problems = await this.problemModel.find({ topicId }).sort({ order: 1 }).lean();
      return {
        topic: {
          id: String(topic._id),
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
        },
        problems: problems.map((p) => this.mapProblem(p)),
      };
    });
  }

  getProblemById(problemId: string) {
    this.assertObjectId(problemId);
    return this.cache.getOrSet(`problem:${problemId}`, PROBLEM_TTL, async () => {
      const p = await this.problemModel.findById(problemId).lean();
      if (!p) throw AppException.notFound('Problem not found');
      return this.mapProblem(p);
    });
  }
}
