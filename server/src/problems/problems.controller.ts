import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProblemsService } from './problems.service';

@Controller('problems')
@UseGuards(JwtAuthGuard)
export class ProblemsController {
  constructor(private readonly problems: ProblemsService) {}

  @Get(':problemId')
  async getOne(@Param('problemId') problemId: string) {
    return { problem: await this.problems.getProblemById(problemId) };
  }
}
