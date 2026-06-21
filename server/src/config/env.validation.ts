import { z } from 'zod';

/** Injection token for the validated, typed environment config. */
export const APP_CONFIG = 'APP_CONFIG';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/dsa_platform'),

  // Optional: empty string ⇒ "no Redis".
  REDIS_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined)),

  JWT_ACCESS_SECRET: z.string().min(16).default('change_me_dev_access_secret_0123456789'),
  JWT_REFRESH_SECRET: z.string().min(16).default('change_me_dev_refresh_secret_0123456789'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),

  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined)),
  COOKIE_SECURE: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((v) => v === true || v === 'true'),

  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_DATA_MAX: z.coerce.number().int().positive().default(300),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment configuration. Used both by @nestjs/config (boot-time
 * fail-fast) and by the APP_CONFIG provider (typed injection).
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }
  const env = parsed.data;

  if (env.NODE_ENV === 'production') {
    const usingDefaults = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET].some((s) =>
      s.includes('change_me'),
    );
    if (usingDefaults) {
      throw new Error(
        'Refusing to start in production with default JWT secrets. Set strong JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.',
      );
    }
  }
  return env;
}
