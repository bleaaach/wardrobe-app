import { Clothing, Category, Outfit, DailyLog, DEFAULT_CATEGORIES } from "../types";

// Use direct localStorage for reliability (avoid AsyncStorage web compat issues)
const storage = {
  getItem(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem(key: string): void {
    try { localStorage.removeItem(key); } catch {}
  },
};

const STORAGE_KEYS = {
  clothing: "@wardrobe/clothing",
  outfits: "@wardrobe/outfits",
  dailyLogs: "@wardrobe/dailyLogs",
  categories: "@wardrobe/categories",
  settings: "@wardrobe/settings",
};

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const raw = storage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  storage.setItem(key, JSON.stringify(value));
}

// ====== 初始化 ======
export async function initDatabase(): Promise<void> {
  let cats = await getJson<Category[]>(STORAGE_KEYS.categories, []);
  const defaults: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
    ...c,
    id: `cat_${c.name}`,
    sortOrder: i + 1,
  }));
  // Force full reset if old version (only 7 categories from v1)
  if (cats.length <= 7) {
    cats = defaults;
  } else {
    for (const dc of defaults) {
      if (!cats.find((c) => c.id === dc.id)) cats.push(dc);
    }
  }
  if (cats.length !== defaults.length || cats.length === 0) {
    await setJson(STORAGE_KEYS.categories, cats);
  }
}

// ====== 衣物 ======
export async function getAllClothing(): Promise<Clothing[]> {
  return getJson<Clothing[]>(STORAGE_KEYS.clothing, []);
}

export async function getClothingByCategory(categoryId: string): Promise<Clothing[]> {
  const items = await getAllClothing();
  return items.filter((i) => i.categoryId === categoryId);
}

export async function getClothingById(id: string): Promise<Clothing | null> {
  const items = await getAllClothing();
  return items.find((i) => i.id === id) || null;
}

export async function addClothing(data: Omit<Clothing, "id" | "createdAt" | "updatedAt" | "deleted" | "favorite"> & {favorite?: number}): Promise<Clothing> {
  const items = await getAllClothing();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const defaults = { brand:"", color:"", season:"", location:"", clothingSize:"", shoeSize:"", price:"", purchaseLink:"", tags:"[]", wearCount:0, notes:"" };
  const item: Clothing = { ...defaults, ...data, id, favorite: 0, createdAt: now, updatedAt: now, deleted: 0 };
  items.unshift(item);
  await setJson(STORAGE_KEYS.clothing, items);
  return item;
}

export async function updateClothing(id: string, data: Partial<Clothing>): Promise<void> {
  const items = await getAllClothing();
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
    await setJson(STORAGE_KEYS.clothing, items);
  }
}

export async function deleteClothing(id: string): Promise<void> {
  const items = await getAllClothing();
  await setJson(STORAGE_KEYS.clothing, items.filter((i) => i.id !== id));
}

// ====== 分类 ======
export async function getCategories(): Promise<Category[]> {
  await initDatabase(); // always sync before reading
  return getJson<Category[]>(STORAGE_KEYS.categories, []);
}

// ====== 搭配 ======
export async function getOutfits(): Promise<Outfit[]> {
  return getJson<Outfit[]>(STORAGE_KEYS.outfits, []);
}

export async function addOutfit(data: Omit<Outfit, "id" | "createdAt" | "updatedAt" | "deleted">): Promise<Outfit> {
  const items = await getOutfits();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const item: Outfit = { ...data, id, createdAt: now, updatedAt: now, deleted: 0 };
  items.unshift(item);
  await setJson(STORAGE_KEYS.outfits, items);
  return item;
}

export async function deleteOutfit(id: string): Promise<void> {
  const items = await getOutfits();
  await setJson(STORAGE_KEYS.outfits, items.filter((i) => i.id !== id));
}

// ====== 每日记录 ======
export async function getDailyLogs(): Promise<DailyLog[]> {
  return getJson<DailyLog[]>(STORAGE_KEYS.dailyLogs, []);
}

export async function addDailyLog(data: Omit<DailyLog, "id" | "createdAt" | "updatedAt">): Promise<DailyLog> {
  const items = await getDailyLogs();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const item: DailyLog = { ...data, id, createdAt: now, updatedAt: now };
  items.unshift(item);
  await setJson(STORAGE_KEYS.dailyLogs, items);
  return item;
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | null> {
  const items = await getDailyLogs();
  return items.find((l) => l.date === date) || null;
}

// ====== 设置 ======
export async function getSetting(key: string): Promise<string | null> {
  const settings = await getJson<Record<string, string>>(STORAGE_KEYS.settings, {});
  return settings[key] || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const settings = await getJson<Record<string, string>>(STORAGE_KEYS.settings, {});
  settings[key] = value;
  await setJson(STORAGE_KEYS.settings, settings);
}
