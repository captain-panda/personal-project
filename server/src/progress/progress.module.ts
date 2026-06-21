import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Problem, ProblemSchema } from '../schemas/problem.schema';
import { UserProgress, UserProgressSchema } from '../schemas/user-progress.schema';
import { TopicsModule } from '../topics/topics.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Problem.name, schema: ProblemSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
    TopicsModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
