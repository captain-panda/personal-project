import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/infra/redis/redis.service';
import { CacheService } from '../src/infra/cache/cache.service';

export interface TestCtx {
  app: INestApplication;
  mongod: MongoMemoryServer;
}

/** Boot the full app against a fresh in-memory Mongo, mirroring main.ts setup. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createTestApp(redisOverride?: any): Promise<TestCtx> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();

  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (redisOverride) builder = builder.overrideProvider(RedisService).useValue(redisOverride);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ bufferLogs: false });
  app.setGlobalPrefix('api', { exclude: ['healthz', 'readyz', 'metrics'] });
  app.use(cookieParser());
  await app.init();
  return { app, mongod };
}

export async function closeTestApp(ctx: TestCtx): Promise<void> {
  await ctx.app.close();
  await ctx.mongod.stop();
}

/** Wipe all collections AND the in-process cache between tests. */
export async function resetState(app: INestApplication): Promise<void> {
  const conn = app.get<Connection>(getConnectionToken());
  for (const key of Object.keys(conn.collections)) {
    await conn.collections[key].deleteMany({});
  }
  app.get(CacheService).l1Clear();
}

/** Extract the refreshToken value from a Set-Cookie response header. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function refreshFromRes(res: any): string | null {
  const cookies: string[] = res.headers['set-cookie'] || [];
  const c = cookies.find((x) => x.startsWith('refreshToken='));
  return c ? decodeURIComponent(c.split(';')[0].split('=').slice(1).join('=')) : null;
}
