// ============ 衣物分类 ============
export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  parentId?: string | null;
}

export const DEFAULT_PARENT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "上装", icon: "", sortOrder: 1, parentId: null },
  { name: "下装", icon: "", sortOrder: 2, parentId: null },
  { name: "连体服装", icon: "", sortOrder: 3, parentId: null },
  { name: "外套", icon: "", sortOrder: 4, parentId: null },
  { name: "鞋子", icon: "", sortOrder: 5, parentId: null },
  { name: "包袋", icon: "", sortOrder: 6, parentId: null },
  { name: "配饰", icon: "", sortOrder: 7, parentId: null },
];

export const DEFAULT_SUB_CATEGORIES: Omit<Category, "id">[] = [
  // 上装
  { name: "T恤", icon: "", sortOrder: 1, parentId: "parent_上装" },
  { name: "polo衫", icon: "", sortOrder: 2, parentId: "parent_上装" },
  { name: "衬衫", icon: "", sortOrder: 3, parentId: "parent_上装" },
  { name: "女衬衫", icon: "", sortOrder: 4, parentId: "parent_上装" },
  { name: "马甲", icon: "", sortOrder: 5, parentId: "parent_上装" },
  { name: "毛衣", icon: "", sortOrder: 6, parentId: "parent_上装" },
  { name: "背心", icon: "", sortOrder: 7, parentId: "parent_上装" },
  { name: "文胸", icon: "", sortOrder: 8, parentId: "parent_上装" },
  { name: "卫衣", icon: "", sortOrder: 9, parentId: "parent_上装" },
  // 下装
  { name: "长裤", icon: "", sortOrder: 1, parentId: "parent_下装" },
  { name: "裙子", icon: "", sortOrder: 2, parentId: "parent_下装" },
  { name: "牛仔裤", icon: "", sortOrder: 3, parentId: "parent_下装" },
  { name: "短裤", icon: "", sortOrder: 4, parentId: "parent_下装" },
  { name: "紧身裤", icon: "", sortOrder: 5, parentId: "parent_下装" },
  // 连体服装
  { name: "连衣裙", icon: "", sortOrder: 1, parentId: "parent_连体服装" },
  { name: "连身裤", icon: "", sortOrder: 2, parentId: "parent_连体服装" },
  // 外套
  { name: "大衣", icon: "", sortOrder: 1, parentId: "parent_外套" },
  { name: "夹克", icon: "", sortOrder: 2, parentId: "parent_外套" },
  { name: "西装外套", icon: "", sortOrder: 3, parentId: "parent_外套" },
  { name: "连帽衫", icon: "", sortOrder: 4, parentId: "parent_外套" },
  { name: "羽绒服", icon: "", sortOrder: 5, parentId: "parent_外套" },
  { name: "开衫", icon: "", sortOrder: 6, parentId: "parent_外套" },
  { name: "其他", icon: "", sortOrder: 7, parentId: "parent_外套" },
  // 鞋子
  { name: "靴子", icon: "", sortOrder: 1, parentId: "parent_鞋子" },
  { name: "平底鞋", icon: "", sortOrder: 2, parentId: "parent_鞋子" },
  { name: "高跟鞋", icon: "", sortOrder: 3, parentId: "parent_鞋子" },
  { name: "凉鞋", icon: "", sortOrder: 4, parentId: "parent_鞋子" },
  { name: "拖鞋", icon: "", sortOrder: 5, parentId: "parent_鞋子" },
  { name: "运动鞋", icon: "", sortOrder: 6, parentId: "parent_鞋子" },
  // 包袋
  { name: "单肩包", icon: "", sortOrder: 1, parentId: "parent_包袋" },
  { name: "手拿包", icon: "", sortOrder: 2, parentId: "parent_包袋" },
  { name: "腰包", icon: "", sortOrder: 3, parentId: "parent_包袋" },
  { name: "手提包", icon: "", sortOrder: 4, parentId: "parent_包袋" },
  { name: "背包", icon: "", sortOrder: 5, parentId: "parent_包袋" },
  { name: "公文包", icon: "", sortOrder: 6, parentId: "parent_包袋" },
  // 配饰
  { name: "帽子", icon: "", sortOrder: 1, parentId: "parent_配饰" },
  { name: "手镯", icon: "", sortOrder: 2, parentId: "parent_配饰" },
  { name: "戒指", icon: "", sortOrder: 3, parentId: "parent_配饰" },
  { name: "胸针", icon: "", sortOrder: 4, parentId: "parent_配饰" },
  { name: "墨镜", icon: "", sortOrder: 5, parentId: "parent_配饰" },
  { name: "腰带", icon: "", sortOrder: 6, parentId: "parent_配饰" },
  { name: "手表", icon: "", sortOrder: 7, parentId: "parent_配饰" },
  { name: "手套", icon: "", sortOrder: 8, parentId: "parent_配饰" },
  { name: "耳环", icon: "", sortOrder: 9, parentId: "parent_配饰" },
];

export const DEFAULT_CATEGORIES = [...DEFAULT_PARENT_CATEGORIES, ...DEFAULT_SUB_CATEGORIES];

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

// 搭配拼图中单个衣物的布局信息
export interface OutfitLayoutItem {
  clothingId: string;
  x: number;      // 相对于画布中心的偏移（像素）
  y: number;
  scale: number;  // 缩放比例
  zIndex: number; // 层级
  rotation?: number; // 旋转角度（可选）
}

// ============ 搭配 ============
export interface Outfit {
  id: string;
  name: string;
  clothingIds: string; // JSON array
  notes?: string;
  layout?: string;     // JSON array of OutfitLayoutItem
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
  mood?: string;
  weather?: string;
  occasion?: string;
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
