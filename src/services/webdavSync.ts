import { createClient } from "webdav";
import JSZip from "jszip";
import { getSetting, setSetting } from "../db/database";
import { getDb } from "../db/sqlite";
import { Clothing, Category, Outfit, DailyLog } from "../types";

const SETTINGS_KEYS = {
  url: "webdav_url",
  username: "webdav_username",
  password: "webdav_password",
  autoSync: "webdav_auto_sync",
  lastSyncTime: "webdav_last_sync_time",
};

const BACKUP_DIR = "/wardrobe-backup";
const LATEST_FILE = `${BACKUP_DIR}/latest.zip`;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export async function configureWebDAV(
  url: string,
  username: string,
  password: string
): Promise<boolean> {
  const client = createClient(url, { username, password });
  try {
    await client.getDirectoryContents("/");
    await setSetting(SETTINGS_KEYS.url, url);
    await setSetting(SETTINGS_KEYS.username, username);
    await setSetting(SETTINGS_KEYS.password, password);
    return true;
  } catch {
    return false;
  }
}

export async function getWebDAVConfig(): Promise<{
  url: string;
  username: string;
  password: string;
} | null> {
  const url = await getSetting(SETTINGS_KEYS.url);
  const username = await getSetting(SETTINGS_KEYS.username);
  const password = await getSetting(SETTINGS_KEYS.password);
  if (!url || !username || !password) return null;
  return { url, username, password };
}

export async function isWebDAVConfigured(): Promise<boolean> {
  const config = await getWebDAVConfig();
  return config !== null;
}

export async function syncToWebDAV(): Promise<void> {
  const config = await getWebDAVConfig();
  if (!config) throw new Error("WebDAV 未配置");

  const client = createClient(config.url, {
    username: config.username,
    password: config.password,
  });

  const db = getDb();
  const clothing = await db.getAllAsync<any>(`SELECT * FROM clothing`);
  const outfits = await db.getAllAsync<any>(`SELECT * FROM outfits`);
  const dailyLogs = await db.getAllAsync<any>(`SELECT * FROM daily_logs`);
  const categories = await db.getAllAsync<any>(`SELECT * FROM categories`);

  const mappedClothing: Clothing[] = clothing.map((row: any) => ({
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
  }));

  const mappedOutfits: Outfit[] = outfits.map((row: any) => ({
    id: row.id,
    name: row.name,
    clothingIds: row.clothing_ids,
    notes: row.notes,
    layout: row.layout,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted,
  }));

  const mappedDailyLogs: DailyLog[] = dailyLogs.map((row: any) => ({
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
  }));

  const mappedCategories: Category[] = categories.map((row: any) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sort_order,
    parentId: row.parent_id,
  }));

  const zip = new JSZip();
  zip.file("clothing.json", JSON.stringify(mappedClothing, null, 2));
  zip.file("outfits.json", JSON.stringify(mappedOutfits, null, 2));
  zip.file("daily_logs.json", JSON.stringify(mappedDailyLogs, null, 2));
  zip.file("categories.json", JSON.stringify(mappedCategories, null, 2));

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  const dateStr = new Date().toISOString().slice(0, 10);
  const backupPath = `${BACKUP_DIR}/wardrobe_backup_${dateStr}.zip`;

  await client.createDirectory(BACKUP_DIR, { recursive: true });
  await client.putFileContents(backupPath, zipBuffer, { overwrite: true });
  await client.putFileContents(LATEST_FILE, zipBuffer, { overwrite: true });

  await setSetting(SETTINGS_KEYS.lastSyncTime, Date.now().toString());
}

export async function syncFromWebDAV(): Promise<void> {
  const config = await getWebDAVConfig();
  if (!config) throw new Error("WebDAV 未配置");

  const client = createClient(config.url, {
    username: config.username,
    password: config.password,
  });

  const exists = await client.exists(LATEST_FILE);
  if (!exists) throw new Error("WebDAV 上没有找到备份文件");

  const fileData = await client.getFileContents(LATEST_FILE, {
    format: "binary",
  });
  const buffer =
    fileData instanceof ArrayBuffer
      ? fileData
      : (fileData as any).buffer ?? fileData;

  const zip = await JSZip.loadAsync(buffer);

  const clothingFile = zip.file("clothing.json");
  const outfitsFile = zip.file("outfits.json");
  const dailyLogsFile = zip.file("daily_logs.json");
  const categoriesFile = zip.file("categories.json");

  const newClothing: Clothing[] = clothingFile
    ? JSON.parse(await clothingFile.async("string"))
    : [];
  const newOutfits: Outfit[] = outfitsFile
    ? JSON.parse(await outfitsFile.async("string"))
    : [];
  const newDailyLogs: DailyLog[] = dailyLogsFile
    ? JSON.parse(await dailyLogsFile.async("string"))
    : [];
  const newCategories: Category[] = categoriesFile
    ? JSON.parse(await categoriesFile.async("string"))
    : [];

  const db = getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM clothing`);
    await db.runAsync(`DELETE FROM outfits`);
    await db.runAsync(`DELETE FROM daily_logs`);
    await db.runAsync(`DELETE FROM categories`);

    for (const cat of newCategories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.icon || "", cat.parentId ?? null, cat.sortOrder]
      );
    }

    for (const item of newClothing) {
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

    for (const outfit of newOutfits) {
      await db.runAsync(
        `INSERT INTO outfits (id, name, clothing_ids, notes, layout, created_at, updated_at, deleted)
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

    for (const log of newDailyLogs) {
      await db.runAsync(
        `INSERT INTO daily_logs (id, date, outfit_id, clothing_ids, notes, image_uri, mood, weather, occasion, created_at, updated_at)
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
  });

  await setSetting(SETTINGS_KEYS.lastSyncTime, Date.now().toString());
}

export async function getAutoSync(): Promise<boolean> {
  const val = await getSetting(SETTINGS_KEYS.autoSync);
  return val === "true";
}

export async function setAutoSync(value: boolean): Promise<void> {
  await setSetting(SETTINGS_KEYS.autoSync, String(value));
}

export async function getLastSyncTime(): Promise<string | null> {
  return await getSetting(SETTINGS_KEYS.lastSyncTime);
}

export function triggerAutoSync(): void {
  getAutoSync().then((enabled) => {
    if (!enabled) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncToWebDAV().catch((e) => {
        console.error("Auto-sync failed:", e);
      });
    }, 5000);
  });
}
