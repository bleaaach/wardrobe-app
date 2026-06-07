import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { Clothing, Category, Outfit, DailyLog, DEFAULT_CATEGORIES } from "../types";

let dbInstance: SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync("wardrobe.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clothing (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      image_uri TEXT NOT NULL,
      image_nobg_uri TEXT,
      brand TEXT DEFAULT '',
      color TEXT DEFAULT '',
      season TEXT DEFAULT '',
      location TEXT DEFAULT '',
      clothing_size TEXT DEFAULT '',
      shoe_size TEXT DEFAULT '',
      price TEXT DEFAULT '',
      purchase_link TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      wear_count INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS outfits (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT '',
      clothing_ids TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      layout TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      outfit_id TEXT,
      clothing_ids TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      image_uri TEXT,
      mood TEXT,
      weather TEXT,
      occasion TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const rows = await db.getAllAsync<any>(`SELECT * FROM categories`);
  if (rows.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      const id = cat.parentId ? `sub_${cat.name}` : `parent_${cat.name}`;
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [id, cat.name, cat.icon || "", cat.parentId ?? null, cat.sortOrder]
      );
    }
  }

  dbInstance = db;
  return db;
}

export function getDb(): SQLiteDatabase {
  if (!dbInstance) throw new Error("Database not initialized. Call initDatabase() first.");
  return dbInstance;
}

function mapClothing(row: any): Clothing {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    imageUri: row.image_uri,
    imageNoBgUri: row.image_nobg_uri,
    brand: row.brand,
    color: row.color,
    season: row.season,
    location: row.location,
    clothingSize: row.clothing_size,
    shoeSize: row.shoe_size,
    price: row.price,
    purchaseLink: row.purchase_link,
    tags: row.tags,
    wearCount: row.wear_count,
    notes: row.notes,
    favorite: row.favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted,
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sort_order,
    parentId: row.parent_id,
  };
}

function mapOutfit(row: any): Outfit {
  return {
    id: row.id,
    name: row.name,
    clothingIds: row.clothing_ids,
    notes: row.notes,
    layout: row.layout,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted,
  };
}

function mapDailyLog(row: any): DailyLog {
  return {
    id: row.id,
    date: row.date,
    outfitId: row.outfit_id,
    clothingIds: row.clothing_ids,
    notes: row.notes,
    imageUri: row.image_uri,
    mood: row.mood,
    weather: row.weather,
    occasion: row.occasion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ====== Clothing ======
export async function getAllClothing(): Promise<Clothing[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM clothing WHERE deleted = 0 ORDER BY created_at DESC`);
  return rows.map(mapClothing);
}

export async function getArchivedClothing(): Promise<Clothing[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM clothing WHERE deleted = 1 ORDER BY created_at DESC`);
  return rows.map(mapClothing);
}

export async function getClothingByCategory(categoryId: string): Promise<Clothing[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM clothing WHERE category_id = ? AND deleted = 0 ORDER BY created_at DESC`,
    [categoryId]
  );
  return rows.map(mapClothing);
}

export async function getClothingById(id: string): Promise<Clothing | null> {
  const db = getDb();
  const row = await db.getFirstAsync<any>(`SELECT * FROM clothing WHERE id = ?`, [id]);
  return row ? mapClothing(row) : null;
}

export async function addClothing(
  data: Omit<Clothing, "id" | "createdAt" | "updatedAt" | "deleted" | "favorite"> & { favorite?: number }
): Promise<Clothing> {
  const db = getDb();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = Date.now().toString();
  const defaults = {
    brand: "",
    color: "",
    season: "",
    location: "",
    clothingSize: "",
    shoeSize: "",
    price: "",
    purchaseLink: "",
    tags: "[]",
    wearCount: 0,
    notes: "",
  };
  const item: Clothing = {
    ...defaults,
    ...data,
    id,
    favorite: data.favorite ?? 0,
    createdAt: now,
    updatedAt: now,
    deleted: 0,
  };

  await db.runAsync(
    `INSERT INTO clothing (id, category_id, name, image_uri, image_nobg_uri, brand, color, season, location, clothing_size, shoe_size, price, purchase_link, tags, wear_count, notes, favorite, created_at, updated_at, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.categoryId,
      item.name,
      item.imageUri,
      item.imageNoBgUri ?? null,
      item.brand,
      item.color,
      item.season,
      item.location,
      item.clothingSize,
      item.shoeSize,
      item.price,
      item.purchaseLink,
      item.tags,
      item.wearCount,
      item.notes,
      item.favorite,
      item.createdAt,
      item.updatedAt,
      item.deleted,
    ]
  );
  return item;
}

export async function updateClothing(id: string, data: Partial<Clothing>): Promise<void> {
  const db = getDb();
  const existing = await getClothingById(id);
  if (!existing) return;

  const merged = { ...existing, ...data, updatedAt: Date.now().toString() };
  await db.runAsync(
    `UPDATE clothing SET
      category_id = ?, name = ?, image_uri = ?, image_nobg_uri = ?, brand = ?, color = ?,
      season = ?, location = ?, clothing_size = ?, shoe_size = ?, price = ?, purchase_link = ?,
      tags = ?, wear_count = ?, notes = ?, favorite = ?, updated_at = ?, deleted = ?
     WHERE id = ?`,
    [
      merged.categoryId,
      merged.name,
      merged.imageUri,
      merged.imageNoBgUri ?? null,
      merged.brand,
      merged.color,
      merged.season,
      merged.location,
      merged.clothingSize,
      merged.shoeSize,
      merged.price,
      merged.purchaseLink,
      merged.tags,
      merged.wearCount,
      merged.notes,
      merged.favorite,
      merged.updatedAt,
      merged.deleted,
      id,
    ]
  );
}

export async function deleteClothing(id: string): Promise<void> {
  await updateClothing(id, { deleted: 1 });
}

export async function restoreClothing(id: string): Promise<void> {
  await updateClothing(id, { deleted: 0 });
}

// ====== Categories ======
export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM categories ORDER BY sort_order ASC`);
  return rows.map(mapCategory);
}

export async function addCategory(data: Omit<Category, "id">): Promise<Category> {
  const db = getDb();
  const id = `cat_${Date.now().toString(36)}`;
  const item: Category = { ...data, id };
  await db.runAsync(
    `INSERT INTO categories (id, name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [item.id, item.name, item.icon || "", item.parentId ?? null, item.sortOrder]
  );
  return item;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const db = getDb();
  const row = await db.getFirstAsync<any>(`SELECT * FROM categories WHERE id = ?`, [id]);
  if (!row) return;

  const merged = { ...mapCategory(row), ...data };
  await db.runAsync(
    `UPDATE categories SET name = ?, icon = ?, parent_id = ?, sort_order = ? WHERE id = ?`,
    [merged.name, merged.icon || "", merged.parentId ?? null, merged.sortOrder, id]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`UPDATE clothing SET category_id = '' WHERE category_id = ?`, [id]);
  await db.runAsync(`DELETE FROM categories WHERE id = ?`, [id]);
}

// ====== Outfits ======
export async function getOutfits(): Promise<Outfit[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM outfits WHERE deleted = 0 ORDER BY created_at DESC`);
  return rows.map(mapOutfit);
}

export async function getOutfitsByClothingId(clothingId: string): Promise<Outfit[]> {
  const outfits = await getOutfits();
  return outfits.filter((o) => {
    try {
      const ids: string[] = JSON.parse(o.clothingIds || "[]");
      return ids.includes(clothingId);
    } catch (e) {
      console.error("Parse clothingIds error:", e);
      return false;
    }
  });
}

export async function addOutfit(data: Omit<Outfit, "id" | "createdAt" | "updatedAt" | "deleted">): Promise<Outfit> {
  const db = getDb();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = Date.now().toString();
  const item: Outfit = { ...data, id, createdAt: now, updatedAt: now, deleted: 0 };

  await db.runAsync(
    `INSERT INTO outfits (id, name, clothing_ids, notes, layout, created_at, updated_at, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.name, item.clothingIds, item.notes ?? "", item.layout ?? null, item.createdAt, item.updatedAt, item.deleted]
  );
  return item;
}

export async function updateOutfit(id: string, data: Partial<Outfit>): Promise<void> {
  const db = getDb();
  const row = await db.getFirstAsync<any>(`SELECT * FROM outfits WHERE id = ?`, [id]);
  if (!row) return;

  const merged = { ...mapOutfit(row), ...data, updatedAt: Date.now().toString() };
  await db.runAsync(
    `UPDATE outfits SET name = ?, clothing_ids = ?, notes = ?, layout = ?, updated_at = ?, deleted = ? WHERE id = ?`,
    [merged.name, merged.clothingIds, merged.notes ?? "", merged.layout ?? null, merged.updatedAt, merged.deleted, id]
  );
}

export async function deleteOutfit(id: string): Promise<void> {
  await updateOutfit(id, { deleted: 1 });
}

export async function getArchivedOutfits(): Promise<Outfit[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM outfits WHERE deleted = 1 ORDER BY created_at DESC`);
  return rows.map(mapOutfit);
}

export async function restoreOutfit(id: string): Promise<void> {
  await updateOutfit(id, { deleted: 0 });
}

// ====== Daily Logs ======
export async function getDailyLogs(): Promise<DailyLog[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM daily_logs ORDER BY date DESC`);
  return rows.map(mapDailyLog);
}

export async function addDailyLog(data: Omit<DailyLog, "id" | "createdAt" | "updatedAt">): Promise<DailyLog> {
  const db = getDb();
  const items = await getDailyLogs();
  const existingIdx = items.findIndex((l) => l.date === data.date);
  const now = Date.now().toString();

  if (existingIdx >= 0) {
    const old = items[existingIdx];
    await adjustWearCount(old.outfitId, -1);
    const item: DailyLog = { ...old, ...data, updatedAt: now };
    await db.runAsync(
      `UPDATE daily_logs SET date = ?, outfit_id = ?, clothing_ids = ?, notes = ?, image_uri = ?, mood = ?, weather = ?, occasion = ?, updated_at = ? WHERE id = ?`,
      [
        item.date,
        item.outfitId ?? null,
        item.clothingIds ?? "[]",
        item.notes ?? "",
        item.imageUri ?? null,
        item.mood ?? null,
        item.weather ?? null,
        item.occasion ?? null,
        item.updatedAt,
        old.id,
      ]
    );
    await adjustWearCount(item.outfitId, +1);
    return item;
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const item: DailyLog = { ...data, id, createdAt: now, updatedAt: now };
  await db.runAsync(
    `INSERT INTO daily_logs (id, date, outfit_id, clothing_ids, notes, image_uri, mood, weather, occasion, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.date,
      item.outfitId ?? null,
      item.clothingIds ?? "[]",
      item.notes ?? "",
      item.imageUri ?? null,
      item.mood ?? null,
      item.weather ?? null,
      item.occasion ?? null,
      item.createdAt,
      item.updatedAt,
    ]
  );
  await adjustWearCount(item.outfitId, +1);
  return item;
}

export async function updateDailyLog(id: string, data: Partial<DailyLog>): Promise<void> {
  const db = getDb();
  const items = await getDailyLogs();
  const idx = items.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const old = items[idx];

  if (data.outfitId !== undefined && data.outfitId !== old.outfitId) {
    await adjustWearCount(old.outfitId, -1);
  }

  const merged = { ...old, ...data, updatedAt: Date.now().toString() };
  await db.runAsync(
    `UPDATE daily_logs SET date = ?, outfit_id = ?, clothing_ids = ?, notes = ?, image_uri = ?, mood = ?, weather = ?, occasion = ?, updated_at = ? WHERE id = ?`,
    [
      merged.date,
      merged.outfitId ?? null,
      merged.clothingIds ?? "[]",
      merged.notes ?? "",
      merged.imageUri ?? null,
      merged.mood ?? null,
      merged.weather ?? null,
      merged.occasion ?? null,
      merged.updatedAt,
      id,
    ]
  );

  if (data.outfitId !== undefined && data.outfitId !== old.outfitId) {
    await adjustWearCount(data.outfitId, +1);
  }
}

export async function deleteDailyLog(id: string): Promise<void> {
  const db = getDb();
  const items = await getDailyLogs();
  const item = items.find((l) => l.id === id);
  if (item) {
    await adjustWearCount(item.outfitId, -1);
  }
  await db.runAsync(`DELETE FROM daily_logs WHERE id = ?`, [id]);
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | null> {
  const db = getDb();
  const row = await db.getFirstAsync<any>(`SELECT * FROM daily_logs WHERE date = ?`, [date]);
  return row ? mapDailyLog(row) : null;
}

// ====== Settings ======
export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

// ====== wearCount helper ======
async function adjustWearCount(outfitId: string | undefined, delta: number): Promise<void> {
  if (!outfitId) return;
  const outfits = await getOutfits();
  const outfit = outfits.find((o) => o.id === outfitId);
  if (!outfit) return;
  const ids: string[] = JSON.parse(outfit.clothingIds || "[]");
  if (ids.length === 0) return;

  const db = getDb();
  for (const cid of ids) {
    const clothing = await getClothingById(cid);
    if (clothing) {
      const newCount = Math.max(0, (clothing.wearCount || 0) + delta);
      await db.runAsync(`UPDATE clothing SET wear_count = ? WHERE id = ?`, [newCount, cid]);
    }
  }
}
