import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'fs';
import { join } from 'path';

// Persists across restarts (previously an in-memory Map that was wiped on
// every server restart / ts-node-dev respawn). Uses Node's built-in
// node:sqlite (stable since Node 22.5+) - no native module to compile,
// unlike better-sqlite3 which failed to build here for lack of a working
// Python/node-gyp toolchain.
const dataDir = join(__dirname, '../../data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, 'travel.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS travel_requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);
