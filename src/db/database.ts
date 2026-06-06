import * as SQLite from "expo-sqlite";
import { DEFAULT_CATEGORIES } from "../types";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("wardrobe.db");
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clothing (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      image_uri TEXT NOT NULL,
      image_nobg_uri TEXT,
      brand TEXT DEFAULT '',
      color TEXT DEFAULT '',
      season TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT '',
      clothing_ids TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      outfit_id TEXT,
      clothing_ids TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      image_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      last_synced TEXT,
      version INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default categories
  const existingCats = await database.getAllAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories"
  );
  if (existingCats[0]?.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      const id = `cat_${cat.name}`;
      await database.runAsync(
        "INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)",
        [id, cat.name, cat.icon, cat.sortOrder]
      );
    }
  }
}
