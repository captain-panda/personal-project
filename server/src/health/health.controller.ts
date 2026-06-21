import { Controller, Get, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import type { Response } from 'express';
import { RedisService } from '../infra/redis/redis.service';

@Controller()
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly redisService: RedisService,
  ) {}

  // Shallow liveness — no dependency checks. Wired to the ALB health check.
  @Get('healthz')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }

  // Deep readiness — Mongo required, Redis optional (graceful). Diagnostics only.
  @Get('readyz')
  ready(@Res({ passthrough: true }) res: Response) {
    const checks = { mongo: this.connection.readyState === 1, redis: this.redisService.ready() };
    const ok = checks.mongo;
    res.status(ok ? 200 : 503);
    return { status: ok ? 'ready' : 'not-ready', checks };
  }
}
