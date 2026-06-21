import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.env.js'],
    // Each file gets its own process + its own in-memory Mongo; run serially so
    // the single Mongoose connection isn't shared across files.
    pool: 'forks',
    fileParallelism: false,
    hookTimeout: 120_000, // first run downloads the mongodb-memory-server binary
    testTimeout: 30_000,
  },
});
