import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { APP_CONFIG, Env } from '../../config/env.validation';

/**
 * Optional Redis client with graceful degradation. When REDIS_URL is unset or
 * Redis is unreachable, `getClient()` returns null and callers fall back to
 * L1 cache + Mongo (reads) or fail-open (auth denylist, rate limiting).
 *
 * `maxRetriesPerRequest: 1` makes commands fail fast instead of hanging.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isReady = false;

  constructor(@Inject(APP_CONFIG) private readonly config: Env) {}

  onModuleInit(): void {
    if (!this.config.REDIS_URL) {
      this.logger.warn('REDIS_URL not set — running without Redis (L1 cache + Mongo only).');
      return;
    }
    this.client = new Redis(this.config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      reconnectOnError: () => true,
    });
    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('Redis connected');
    });
    this.client.on('end', () => {
      this.isReady = false;
    });
    this.client.on('error', (err) => {
      this.isReady = false;
      this.logger.debug(`Redis error: ${err.message}`);
    });
  }

  /** Returns the client only when connected and usable, else null. */
  getClient(): Redis | null {
    return this.isReady && this.client ? this.client : null;
  }

  ready(): boolean {
    return this.isReady;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => this.client?.disconnect());
      this.client = null;
      this.isReady = false;
    }
  }
}
