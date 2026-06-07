import { SQLiteDatabase } from "expo-sqlite";
import storage from "../utils/storage";
import { Clothing, Category, Outfit, DailyLog } from "../types";

const OLD_KEYS = {
  clothing: "@wardrobe/clothing",
  outfits: "@wardrobe/outfits",
  dailyLogs: "@wardrobe/dailyLogs",
  categories: "@wardrobe/categories",
  settings: "@wardrobe/settings",
};

export async function runMigration(db: SQLiteDatabase): Promise<void> {
  const migrated = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'sqlite_migrated'`
  );
  if (migrated?.value === "1") return;

  const oldClothing = await getOldJson<Clothing[]>(OLD_KEYS.clothing, []);
  const oldCategories = await getOldJson<Category[]>(OLD_KEYS.categories, []);
  const oldOutfits = await getOldJson<Outfit[]>(OLD_KEYS.outfits, []);
  const oldDailyLogs = await getOldJson<DailyLog[]>(OLD_KEYS.dailyLogs, []);
  const oldSettings = await getOldJson<Record<string, string>>(OLD_KEYS.settings, {});

  await db.withTransactionAsync(async () => {
    for (const cat of oldCategories) {
      await db.runAsync(
        `INSERT OR REPLACE INTO categories (id, name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.icon || "", cat.parentId ?? null, cat.sortOrder]
      );
    }

    for (const item of oldClothing) {
      await db.runAsync(
        `INSERT OR REPLACE INTO clothing (id, category_id, name, image_uri, image_nobg_uri, brand, color, season, location, clothing_size, shoe_size, price, purchase_link, tags, wear_count, notes, favorite, created_at, updated_at, deleted)
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
          item.tags || "[]",
          item.wearCount ?? 0,
          item.notes,
          item.favorite ?? 0,
          item.createdAt,
          item.updatedAt,
          item.deleted ?? 0,
        ]
      );
    }

    for (const outfit of oldOutfits) {
      await db.runAsync(
        `INSERT OR REPLACE INTO outfits (id, name, clothing_ids, notes, layout, created_at, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          outfit.id,
          outfit.name,
          outfit.clothingIds || "[]",
          outfit.notes ?? "",
          outfit.layout ?? null,
          outfit.createdAt,
          outfit.updatedAt,
          outfit.deleted ?? 0,
        ]
      );
    }

    for (const log of oldDailyLogs) {
      await db.runAsync(
        `INSERT OR REPLACE INTO daily_logs (id, date, outfit_id, clothing_ids, notes, image_uri, mood, weather, occasion, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.date,
          log.outfitId ?? null,
          log.clothingIds ?? "[]",
          log.notes ?? "",
          log.imageUri ?? null,
          log.mood ?? null,
          log.weather ?? null,
          log.occasion ?? null,
          log.createdAt,
          log.updatedAt,
        ]
      );
    }

    for (const [key, value] of Object.entries(oldSettings)) {
      await db.runAsync(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        [key, value]
      );
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
      ["sqlite_migrated", "1"]
    );
  });
}

async function getOldJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Migration JSON parse error:", e);
    return fallback;
  }
}
