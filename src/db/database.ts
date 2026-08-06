import * as SQLite from 'expo-sqlite';
import { todayStr } from '@/utils/dateHelpers';

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  // @ts-ignore - use global object to preserve connection across HMR
  if (!globalThis._dbPromise) {
    // @ts-ignore
    globalThis._dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('pg_food_tracker.db');
      await initSchema(db);
      return db;
    })();
  }
  // @ts-ignore
  return globalThis._dbPromise;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
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
      ['morning', 50, today]
    );
    await db.runAsync(
      'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
      ['afternoon', 80, today]
    );
    await db.runAsync(
      'INSERT INTO meal_prices (meal_type, price, effective_from) VALUES (?, ?, ?)',
      ['night', 70, today]
    );
  }
}
