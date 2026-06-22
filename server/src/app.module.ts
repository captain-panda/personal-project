import { randomUUID } from 'node:crypto';
import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import type { ValidationError } from 'class-validator';

import { APP_CONFIG, Env, validateEnv } from './config/env.validation';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './auth/auth.module';
import { TopicsModule } from './topics/topics.module';
import { ProblemsModule } from './problems/problems.module';
import { ProgressModule } from './progress/progress.module';
import { HealthModule } from './health/health.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { MetricsInterceptor } from './infra/metrics/metrics.interceptor';
import { AppException } from './common/exceptions/app.exception';
import { buildLimiterStack } from './common/rate-limit';
import { RedisService } from './infra/redis/redis.service';
import { AuthController } from './auth/auth.controller';
import { TopicsController } from './topics/topics.controller';
import { ProblemsController } from './problems/problems.controller';
import { ProgressController } from './progress/progress.controller';

const IGNORED_LOG_PATHS = ['/healthz', '/readyz', '/metrics'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Tests must be hermetic: never read the developer's .env (which may point
      // at a real Redis/Mongo). Config comes solely from process.env under test.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info',
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string) || randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        autoLogging: { ignore: (req) => IGNORED_LOG_PATHS.includes(req.url || '') },
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
            : undefined,
      },
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const cfg = validateEnv(process.env);
        return { uri: cfg.MONGO_URI, serverSelectionTimeoutMS: 10_000, maxPoolSize: 20, minPoolSize: 2 };
      },
    }),
    InfraModule,
    AuthModule,
    TopicsModule,
    ProblemsModule,
    ProgressModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
          exceptionFactory: (errors: ValidationError[]) =>
            AppException.badRequest(
              'Validation failed',
              errors.flatMap((e) =>
                Object.values(e.constraints || {}).map((message) => ({ path: e.property, message })),
              ),
            ),
        }),
    },
  ],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(APP_CONFIG) private readonly config: Env,
    private readonly redisService: RedisService,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    if (this.config.NODE_ENV === 'test') return; // no rate limiting under test

    const auth = buildLimiterStack(
      this.config.RATE_LIMIT_AUTH_MAX,
      'rl:auth:',
      this.config,
      this.redisService,
    );
    const data = buildLimiterStack(
      this.config.RATE_LIMIT_DATA_MAX,
      'rl:data:',
      this.config,
      this.redisService,
    );

    consumer.apply(...auth).forRoutes(AuthController);
    consumer.apply(...data).forRoutes(TopicsController, ProblemsController, ProgressController);
  }
}
