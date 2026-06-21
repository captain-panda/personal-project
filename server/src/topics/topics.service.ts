import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic, TopicDocument } from '../schemas/topic.schema';
import { Problem, ProblemDocument } from '../schemas/problem.schema';
import { CacheService } from '../infra/cache/cache.service';

const TOPICS_TTL = 60 * 60 * 1000;

export interface TopicView {
  id: string;
  name: string;
  description: string;
  order: number;
  slug: string;
  iconUrl: string;
  problemCount: number;
}

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Problem.name) private readonly problemModel: Model<ProblemDocument>,
    private readonly cache: CacheService,
  ) {}

  getAllTopics(): Promise<TopicView[]> {
    return this.cache.getOrSet('topics:all', TOPICS_TTL, async () => {
      const [topics, counts] = await Promise.all([
        this.topicModel.find().sort({ order: 1 }).lean(),
        this.problemModel.aggregate<{ _id: unknown; count: number }>([
          { $group: { _id: '$topicId', count: { $sum: 1 } } },
        ]),
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
}
