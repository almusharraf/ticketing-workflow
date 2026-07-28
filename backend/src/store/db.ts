import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config';

// Persists across restarts (previously an in-memory Map that was wiped on
// every server restart / ts-node-dev respawn). Uses Node's built-in
// node:sqlite (stable since Node 22.5+) - no native module to compile,
// unlike better-sqlite3 which failed to build here for lack of a working
// Python/node-gyp toolchain.
//
// Path is configurable via DB_PATH (see config.ts) so multiple local
// instances can run against separate files - see README for why that
// matters (same path = shared data across processes).
const dbFilePath = config.dbPath || join(__dirname, '../../data/travel.db');
mkdirSync(dirname(dbFilePath), { recursive: true });

export const db = new DatabaseSync(dbFilePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS travel_requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    data TEXT NOT NULL
  )
`);
