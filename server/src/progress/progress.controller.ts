import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AppException } from '../common/exceptions/app.exception';
import { ProgressService } from './progress.service';
import { ToggleDto } from './dto/toggle.dto';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return { progress: await this.progress.getUserProgress(user.id) };
  }

  @Get('stats')
  async stats(@CurrentUser() user: AuthUser) {
    return { stats: await this.progress.getStats(user.id) };
  }

  // Ownership-enforced: a user may only read their own progress (IDOR-safe).
  @Get('user/:userId')
  async byUserId(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    if (userId !== user.id) throw AppException.forbidden("Cannot access another user's progress");
    return { progress: await this.progress.getUserProgress(user.id) };
  }

  @Patch(':problemId')
  async toggle(
    @CurrentUser() user: AuthUser,
    @Param('problemId') problemId: string,
    @Body() dto: ToggleDto,
  ) {
    return {
      progress: await this.progress.setProgress(user.id, problemId, dto.completed, dto.notes),
    };
  }
}
