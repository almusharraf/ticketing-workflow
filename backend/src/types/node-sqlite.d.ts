// Minimal ambient types for Node's built-in `node:sqlite` (stable since
// Node 22.5+, used here without native deps). The installed @types/node
// (v20) predates this module, so TypeScript doesn't know about it yet -
// this declares just the surface this project actually uses rather than
// bumping a shared dependency version for one import.
declare module 'node:sqlite' {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
