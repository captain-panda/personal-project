import 'reflect-metadata';

// Runs before any test module is imported (jest setupFiles).
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_0123456789_abcdef';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_0123456789_abcdef';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '7d';
process.env.BCRYPT_COST = '4'; // fast hashing in tests
// Empty string ⇒ "no Redis" (env schema maps '' → undefined). Using '' rather
// than delete is deliberate: dotenv never overrides an already-present key, so
// even if an .env file were loaded it cannot reintroduce a real REDIS_URL here.
process.env.REDIS_URL = '';
