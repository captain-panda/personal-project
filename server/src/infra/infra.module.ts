import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, validateEnv } from '../config/env.validation';
import { RedisService } from './redis/redis.service';
import { CacheService } from './cache/cache.service';
import { TokenService } from './tokens/token.service';
import { MetricsService } from './metrics/metrics.service';
import { MetricsController } from './metrics/metrics.controller';

/**
 * Global infrastructure: typed config + Redis + two-tier cache + tokens +
 * metrics. Exported so every feature module can inject them without re-importing.
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    { provide: APP_CONFIG, useFactory: () => validateEnv(process.env) },
    RedisService,
    CacheService,
    TokenService,
    MetricsService,
  ],
  exports: [APP_CONFIG, RedisService, CacheService, TokenService, MetricsService],
})
export class InfraModule {}
