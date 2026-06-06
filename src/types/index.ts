// ============ 衣物分类 ============
export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  // 上衣
  { name: "T恤", icon: "👕", sortOrder: 1 },
  { name: "衬衫", icon: "👔", sortOrder: 2 },
  { name: "卫衣", icon: "🏃", sortOrder: 3 },
  { name: "毛衣", icon: "🧶", sortOrder: 4 },
  { name: "开衫", icon: "🧥", sortOrder: 5 },
  { name: "背心", icon: "🎽", sortOrder: 6 },
  { name: "马甲", icon: "🦺", sortOrder: 7 },
  // 裤子
  { name: "牛仔裤", icon: "👖", sortOrder: 10 },
  { name: "休闲裤", icon: "👖", sortOrder: 11 },
  { name: "短裤", icon: "🩳", sortOrder: 12 },
  { name: "运动裤", icon: "🦿", sortOrder: 13 },
  // 裙子
  { name: "连衣裙", icon: "👗", sortOrder: 20 },
  { name: "半身裙", icon: "👗", sortOrder: 21 },
  // 外套
  { name: "羽绒服", icon: "🧥", sortOrder: 30 },
  { name: "大衣", icon: "🧥", sortOrder: 31 },
  { name: "风衣", icon: "🧥", sortOrder: 32 },
  { name: "夹克", icon: "🧥", sortOrder: 33 },
  { name: "西装", icon: "🤵", sortOrder: 34 },
  // 鞋子
  { name: "运动鞋", icon: "👟", sortOrder: 40 },
  { name: "靴子", icon: "🥾", sortOrder: 41 },
  { name: "板鞋", icon: "👟", sortOrder: 42 },
  { name: "凉鞋", icon: "👡", sortOrder: 43 },
  // 配饰
  { name: "帽子", icon: "🧢", sortOrder: 50 },
  { name: "围巾", icon: "🧣", sortOrder: 51 },
  { name: "手套", icon: "🧤", sortOrder: 52 },
  { name: "袜子", icon: "🧦", sortOrder: 53 },
  { name: "眼镜", icon: "👓", sortOrder: 54 },
  { name: "皮带", icon: "🪢", sortOrder: 55 },
  // 包包
  { name: "双肩包", icon: "🎒", sortOrder: 60 },
  { name: "单肩包", icon: "👜", sortOrder: 61 },
  { name: "手提包", icon: "👜", sortOrder: 62 },
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
