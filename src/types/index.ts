// ============ 衣物分类 ============
export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "上衣", icon: "👕", sortOrder: 1 },
  { name: "裤子", icon: "👖", sortOrder: 2 },
  { name: "裙子", icon: "👗", sortOrder: 3 },
  { name: "外套", icon: "🧥", sortOrder: 4 },
  { name: "鞋子", icon: "👟", sortOrder: 5 },
  { name: "配饰", icon: "💍", sortOrder: 6 },
  { name: "包包", icon: "👜", sortOrder: 7 },
];

// ============ 衣物 ============
export interface Clothing {
  id: string;
  categoryId: string;
  name: string;
  imageUri: string;
  imageNoBgUri?: string;
  brand: string;
  color: string;
  season: string;
  location: string;       // 存放位置
  clothingSize: string;    // 服装尺码
  shoeSize: string;        // 鞋码
  price: string;           // 价格
  purchaseLink: string;    // 购买链接
  tags: string;            // JSON array of tag strings
  wearCount: number;       // 穿着次数
  notes: string;
  favorite: number;
  createdAt: string;
  updatedAt: string;
  deleted: number;
}

// ============ 搭配 ============
export interface Outfit {
  id: string;
  name: string;
  clothingIds: string; // JSON array
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deleted: number;
}

// ============ 每日记录 ============
export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  outfitId?: string;
  clothingIds?: string;
  notes?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 同步 ============
export interface SyncMeta {
  id: string;
  tableName: string;
  lastSynced: string;
  version: number;
}

export interface SyncPayload {
  lastSynced: string;
  changes: {
    table: string;
    action: "insert" | "update" | "delete";
    data: Record<string, unknown>;
  }[];
}

export interface SyncSettings {
  serverUrl: string;
  token: string;
  webdavUrl: string;
  webdavUser: string;
  webdavPass: string;
  autoSync: boolean;
}
