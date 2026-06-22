import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { APP_CONFIG, Env } from './config/env.validation';

async function bootstrap() {
  // Disable Nest's default body parser so we can set the 100kb JSON limit.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(app.get(Logger));

  const config = app.get<Env>(APP_CONFIG);

  app.setGlobalPrefix('api', { exclude: ['healthz', 'readyz', 'metrics'] });

  const instance = app.getHttpAdapter().getInstance();
  instance.set('trust proxy', 1); // behind ALB/proxy — correct req.ip
  instance.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.enableCors({ origin: config.CLIENT_ORIGIN, credentials: true });
  app.enableShutdownHooks(); // graceful shutdown → OnModuleDestroy hooks

  await app.listen(config.PORT);
}

bootstrap();
