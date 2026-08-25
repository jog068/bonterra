import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function createDb(file: string = path.join(serverRoot, 'data', 'budget.db')) {
  if (file !== ':memory:') {
    mkdirSync(path.dirname(file), { recursive: true });
  }
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(serverRoot, 'drizzle') });
  return db;
}

export type Db = ReturnType<typeof createDb>;
