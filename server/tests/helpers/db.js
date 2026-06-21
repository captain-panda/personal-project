import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { l1Clear } from '../../src/utils/cache.js';

let mongod;

export async function setupDB() {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
}

export async function teardownDB() {
  await disconnectDB();
  if (mongod) await mongod.stop();
}

/** Wipe all collections AND the in-process cache between tests. */
export async function clearDB() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  l1Clear();
}

/** Extract the refreshToken value from a Set-Cookie response header. */
export function refreshFromRes(res) {
  const cookies = res.headers['set-cookie'] || [];
  const c = cookies.find((x) => x.startsWith('refreshToken='));
  return c ? decodeURIComponent(c.split(';')[0].split('=').slice(1).join('=')) : null;
}
