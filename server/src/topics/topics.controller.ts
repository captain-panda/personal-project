import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TopicsService } from './topics.service';
import { ProblemsService } from '../problems/problems.service';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(
    private readonly topics: TopicsService,
    private readonly problems: ProblemsService,
  ) {}

  @Get()
  async list() {
    return { topics: await this.topics.getAllTopics() };
  }

  @Get(':topicId/problems')
  async byTopic(@Param('topicId') topicId: string) {
    return this.problems.getProblemsByTopic(topicId);
  }
}
