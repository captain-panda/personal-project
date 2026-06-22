import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from '../schemas/topic.schema';
import { Problem, ProblemSchema } from '../schemas/problem.schema';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { ProblemsModule } from '../problems/problems.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: Problem.name, schema: ProblemSchema },
    ]),
    ProblemsModule,
  ],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
