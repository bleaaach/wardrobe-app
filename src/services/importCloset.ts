import JSZip from "jszip";
import { Platform } from "react-native";
import { Clothing, OutfitLayoutItem } from "../types";
import { getAllClothing, addClothing, getCategories, addOutfit } from "../db/database";

// 分类映射（作为数据库查找的备用名称映射）
const SUB_CAT_MAP: Record<string, string> = {
  "T恤": "T恤", "polo衫": "polo衫", "衬衫": "衬衫", "卫衣": "卫衣",
  "毛衣": "毛衣", "开衫": "开衫", "背心": "背心", "吊带": "背心",
  "马甲": "马甲", "针织衫": "毛衣", "短袖": "T恤", "长袖T恤": "T恤",
  "牛仔裤": "牛仔裤", "休闲裤": "长裤", "短裤": "短裤", "运动裤": "长裤",
  "直筒裤": "长裤", "阔腿裤": "长裤", "紧身裤": "紧身裤", "束脚裤": "长裤",
  "工装裤": "长裤", "西裤": "长裤", "长裤": "长裤",
  "连衣裙": "连衣裙", "半身裙": "裙子", "连体裤": "连身裤", "短裙": "裙子",
  "百褶裙": "裙子", "A字裙": "裙子", "长裙": "裙子", "裙子": "裙子",
  "羽绒服": "羽绒服", "棉服": "羽绒服", "大衣": "大衣", "风衣": "大衣",
  "夹克": "夹克", "西装": "西装外套", "冲锋衣": "夹克", "派克服": "羽绒服",
  "牛仔外套": "夹克", "棒球服": "夹克", "西装外套": "西装外套", "连帽衫": "连帽衫",
  "运动鞋": "运动鞋", "靴子": "靴子", "板鞋": "运动鞋", "帆布鞋": "运动鞋",
  "乐福鞋": "平底鞋", "凉鞋": "凉鞋", "拖鞋": "拖鞋", "德比鞋": "平底鞋",
  "帽子": "帽子", "围巾": "腰带", "手套": "手套", "袜子": "配饰",
  "眼镜": "墨镜", "墨镜": "墨镜", "领带": "配饰", "皮带": "腰带",
  "双肩包": "背包", "单肩包": "单肩包", "手提包": "手提包",
  "其他": "其他", "女衬衫": "女衬衫",
};

async function saveImageToIDB(uuid: string, base64: string): Promise<void> {
  if (Platform.OS !== "web") return;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("WardrobeImages", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("images")) {
        req.result.createObjectStore("images", { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      try {
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const txn = db.transaction("images", "readwrite");
        txn.objectStore("images").put({ id: uuid, blob: new Blob([bytes], { type: "image/png" }) });
        txn.oncomplete = () => { db.close(); resolve(); };
        txn.onerror = () => { db.close(); reject(txn.error); };
      } catch (e) { db.close(); reject(e); }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function mapCategory(subName?: string): Promise<string> {
  if (!subName) return "";

  const categories = await getCategories();
  const lookup = (name: string) => {
    const matches = categories.filter(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (matches.length === 0) return null;
    // Prefer sub-categories over parent categories
    const sub = matches.find((c) => c.parentId);
    return sub ? sub.id : matches[0].id;
  };

  // 1. Direct match
  let id = lookup(subName);
  if (id) return id;

  // 2. Fallback via SUB_CAT_MAP
  const mapped = SUB_CAT_MAP[subName];
  if (mapped) {
    id = lookup(mapped);
    if (id) return id;
  }

  return "";
}

export function mapSeason(seasonFlag: number): string {
  // Bit flags: 1=春 2=夏 4=秋 8=冬
  if (!seasonFlag || typeof seasonFlag !== "number") return "";
  const parts: string[] = [];
  if (seasonFlag & 1) parts.push("春");
  if (seasonFlag & 2) parts.push("夏");
  if (seasonFlag & 4) parts.push("秋");
  if (seasonFlag & 8) parts.push("冬");
  return parts.join("/");
}

export interface ImportProgress {
  current: number;
  total: number;
  message: string;
}

export async function importClosetData(
  zipData: ArrayBuffer,
  onProgress?: (p: ImportProgress) => void
): Promise<{ clothing: number; outfits: number }> {
  // 1. Load zip
  const zip = await JSZip.loadAsync(zipData);

  const jsonFile = zip.file("exporterData.json");
  if (!jsonFile) throw new Error("找不到 exporterData.json");

  const jsonText = await jsonFile.async("string");
  const data = JSON.parse(jsonText);

  // 2. Build lookup maps
  const subCatMap = new Map<string, string>();
  for (const cat of data.categories || []) {
    for (const sub of cat.subCategories || []) {
      subCatMap.set(sub.uuid.toUpperCase(), sub.nameKey_ || "");
    }
  }
  const brandMap = new Map<string, string>();
  for (const b of data.brands || []) brandMap.set(b.uuid.toUpperCase(), b.desc_ || "");
  const locationMap = new Map<string, string>();
  for (const l of data.locations || []) locationMap.set(l.uuid.toUpperCase(), l.desc_ || "");
  const sizeMap = new Map<string, string>();
  for (const s of data.clothingSizes || []) sizeMap.set(s.uuid.toUpperCase(), s.desc_ || "");
  for (const s of data.shoeSizes || []) sizeMap.set(s.uuid.toUpperCase(), s.desc_ || "");

  // 3. Get existing items
  const existingItems = await getAllClothing();
  const existingNames = new Set(existingItems.map((i: Clothing) => i.name?.toLowerCase()));

  // 4. Build image index
  const imageFiles = new Map<string, JSZip.JSZipObject>();
  zip.folder("images")?.forEach((path, file) => {
    const name = path.split("/").pop()?.replace(/\.(png|jpg|jpeg|webp)$/i, "");
    if (name) imageFiles.set(name.toUpperCase(), file);
  });

  // 5. Import clothing
  const clothingList = data.clothings || [];
  let count = 0;
  const clothingIdMap = new Map<string, string>(); // source uuid -> new id

  for (let i = 0; i < clothingList.length; i++) {
    const c = clothingList[i];
    const uuid = c.uuid || "";
    const name = (c.name || "").trim();
    const imgUUID = (c.imageDataUUID || "").toUpperCase();

    onProgress?.({ current: i + 1, total: clothingList.length, message: `${i + 1}/${clothingList.length}` });

    if (name && existingNames.has(name.toLowerCase())) {
      // Try to map existing item by name so outfits can reference it
      const existing = existingItems.find((item) => item.name?.toLowerCase() === name.toLowerCase());
      if (existing) {
        clothingIdMap.set(uuid.toUpperCase(), existing.id);
      }
      continue; // Skip duplicate
    }

    const displayName = name || imgUUID.slice(0, 8);

    try {
      // Image to IndexedDB
      let imageUri = "placeholder";
      if (imageFiles.has(imgUUID)) {
        try {
          const base64 = await imageFiles.get(imgUUID)!.async("base64");
          await saveImageToIDB(imgUUID, base64);
          imageUri = "idx://" + imgUUID;
        } catch (e) { /* ignore image storage errors for now */ }
      }

      const subName = subCatMap.get((c.categoryUUID || "").toUpperCase());
      const categoryId = await mapCategory(subName);
      const brand = brandMap.get((c.brandUUID || "").toUpperCase()) || "";
      const loc = locationMap.get((c.locationUUID || "").toUpperCase()) || "";
      const cSize = sizeMap.get((c.clothingSizeUUID || "").toUpperCase()) || "";
      const sSize = sizeMap.get((c.shoeSizeUUID || "").toUpperCase()) || "";
      const itemPrice = c.price ? String(c.price) : "";

      const newClothing = await addClothing({
        categoryId,
        name: displayName,
        imageUri,
        brand,
        color: c.primaryColorHex || "",
        season: mapSeason(c.season),
        location: loc,
        clothingSize: cSize,
        shoeSize: sSize,
        price: itemPrice,
        purchaseLink: c.purchaseLink_ || c.purchaseLinkString_ || "",
        tags: "[]",
        wearCount: c.wearsTotal || 0,
        notes: c.comment_ || "",
      });

      clothingIdMap.set(uuid.toUpperCase(), newClothing.id);
      count++;
    } catch (e: unknown) {
      /* ignore single item import errors */
    }
  }

  // 6. Import outfits
  const outfitList = data.outfits || [];
  let outfitCount = 0;

  for (let i = 0; i < outfitList.length; i++) {
    const o = outfitList[i];
    const movables = o.movables || [];
    const clothingIds: string[] = [];
    const layout: OutfitLayoutItem[] = [];

    for (const m of movables) {
      if (!m.clothingUUID) continue;
      const srcUUID = m.clothingUUID.toUpperCase();
      const newId = clothingIdMap.get(srcUUID);
      if (!newId) continue;

      if (!clothingIds.includes(newId)) {
        clothingIds.push(newId);
      }

      layout.push({
        clothingId: newId,
        x: (m.posX ?? 0) - 160,
        y: (m.posY ?? 0) - 160,
        scale: (m.frameWidth ?? 100) / 100,
        zIndex: Math.round(m.zIndex ?? 0),
        rotation: m.rotationDegree ?? 0,
      });
    }

    if (clothingIds.length === 0) continue;

    try {
      await addOutfit({
        name: `搭配 ${i + 1}`,
        clothingIds: JSON.stringify(clothingIds),
        notes: "",
        layout: JSON.stringify(layout),
      });
      outfitCount++;
    } catch (e: unknown) {
      /* ignore single outfit import errors */
    }
  }

  return { clothing: count, outfits: outfitCount };
}
