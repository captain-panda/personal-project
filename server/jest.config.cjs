module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '\\.e2e-spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  testTimeout: 120000,
  // Single worker: each suite spins up its own in-memory Mongo and the Mongoose
  // connection is process-global.
  maxWorkers: 1,
};
