import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { todayStr } from '@/utils/dateHelpers';

async function openWithRetry(
  name: string,
  retries = 3,
  delayMs = 600
): Promise<SQLite.SQLiteDatabase> {
  for (let i = 0; i < retries; i++) {
    try {
      return await SQLite.openDatabaseAsync(name);
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : '';
      const isWebDbError =
        Platform.OS === 'web' &&
        (msg.includes('Access Handle') || msg.includes('VFS'));

      if (isWebDbError && i < retries - 1) {
        console.warn(`[SQLite OPFS] Caught web DB error: ${msg}. Attempting to delete and retry (Attempt ${i + 1}/${retries})...`);
        // Try to delete the corrupted database and recreate it
        try {
          await SQLite.deleteDatabaseAsync(name);
        } catch (delErr) {
          console.warn('[SQLite OPFS] Failed to delete corrupted database:', delErr);
        }
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to open database after retries');
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  // @ts-ignore - use global object to preserve connection across HMR
  if (!globalThis._dbPromise) {
    // @ts-ignore
    globalThis._dbPromise = (async () => {
      try {
        // On web, use a fresh database name to completely bypass OPFS lock conflicts during dev
        const dbName = Platform.OS === 'web' ? `pg_food_tracker_${Date.now()}.db` : 'pg_food_tracker.db';
        const db = await openWithRetry(dbName);
        await initSchema(db);
        return db;
      } catch (err) {
        // Reset so the next call can retry
        // @ts-ignore
        globalThis._dbPromise = null;
        throw err;
      }
    })();
  }
  // @ts-ignore
  return globalThis._dbPromise;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id),
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK (meal_type IN ('morning','afternoon','night')),
      ate INTEGER NOT NULL DEFAULT 0,
      UNIQUE(member_id, date, meal_type)
    );

    CREATE TABLE IF NOT EXISTS meal_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_type TEXT NOT NULL CHECK (meal_type IN ('morning','afternoon','night')),
      price REAL NOT NULL,
      effective_from TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id),
      month TEXT NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      note TEXT
    );
  `);

  // Seed default prices if none exist
  const priceCount = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM meal_prices'
  );
  if (!priceCount || priceCount.cnt === 0) {
    const today = todayStr();
    await db.runAsync(
      'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
      ['morning', 40, today]
    );
    await db.runAsync(
      'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
      ['afternoon', 50, today]
    );
    await db.runAsync(
      'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
      ['night', 30, today]
    );
  }
}
