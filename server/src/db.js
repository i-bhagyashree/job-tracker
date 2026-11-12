import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

// <project root>/.data — outside server/ so the dev file-watcher never sees DB writes
const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.data');

async function startLocalMongo() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // On a quick restart the previous mongod may still hold the data-dir lock; retry briefly.
  for (let attempt = 1; ; attempt++) {
    try {
      const mem = await MongoMemoryServer.create({
        instance: { dbPath: DATA_DIR, storageEngine: 'wiredTiger' },
      });
      return mem.getUri('jobtracker');
    } catch (err) {
      if (attempt >= 10) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

let connecting;

// Reuses one connection across calls (serverless functions are invoked many times per instance)
export function connectDB() {
  connecting ??= doConnect().catch((err) => {
    connecting = undefined;
    throw err;
  });
  return connecting;
}

async function doConnect() {
  // MONGODB_URI is what the Vercel ↔ MongoDB Atlas integration sets automatically
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI must be set in production');
    }
    uri = await startLocalMongo();
    console.log(`⚠️  No MONGO_URI set — using local dev database in ${DATA_DIR}`);
  }
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
}
