import JSZip from "jszip";
import { Clothing } from "../types";
import { getAllClothing, addClothing } from "../db/database";

// 分类映射
const SUB_CAT_MAP: Record<string, string> = {
  "T恤": "cat_上衣", "polo衫": "cat_上衣", "衬衫": "cat_上衣", "卫衣": "cat_上衣",
  "毛衣": "cat_上衣", "开衫": "cat_上衣", "背心": "cat_上衣", "吊带": "cat_上衣",
  "马甲": "cat_上衣", "针织衫": "cat_上衣", "短袖": "cat_上衣", "长袖T恤": "cat_上衣",
  "牛仔裤": "cat_裤子", "休闲裤": "cat_裤子", "短裤": "cat_裤子", "运动裤": "cat_裤子",
  "直筒裤": "cat_裤子", "阔腿裤": "cat_裤子", "紧身裤": "cat_裤子", "束脚裤": "cat_裤子",
  "工装裤": "cat_裤子", "西裤": "cat_裤子", "长裤": "cat_裤子",
  "连衣裙": "cat_裙子", "半身裙": "cat_裙子", "连体裤": "cat_裙子", "短裙": "cat_裙子",
  "百褶裙": "cat_裙子", "A字裙": "cat_裙子", "长裙": "cat_裙子", "裙子": "cat_裙子",
  "羽绒服": "cat_外套", "棉服": "cat_外套", "大衣": "cat_外套", "风衣": "cat_外套",
  "夹克": "cat_外套", "西装": "cat_外套", "冲锋衣": "cat_外套", "派克服": "cat_外套",
  "牛仔外套": "cat_外套", "棒球服": "cat_外套", "西装外套": "cat_外套", "连帽衫": "cat_外套",
  "运动鞋": "cat_鞋子", "靴子": "cat_鞋子", "板鞋": "cat_鞋子", "帆布鞋": "cat_鞋子",
  "乐福鞋": "cat_鞋子", "凉鞋": "cat_鞋子", "拖鞋": "cat_鞋子", "德比鞋": "cat_鞋子",
  "帽子": "cat_配饰", "围巾": "cat_配饰", "手套": "cat_配饰", "袜子": "cat_配饰",
  "眼镜": "cat_配饰", "墨镜": "cat_配饰", "领带": "cat_配饰", "皮带": "cat_配饰",
  "双肩包": "cat_包包", "单肩包": "cat_包包", "手提包": "cat_包包",
  "其他": "cat_上衣", "女衬衫": "cat_上衣",
};

async function saveImageToIDB(uuid: string, base64: string): Promise<void> {
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

function mapCategory(subName?: string): string {
  if (subName && SUB_CAT_MAP[subName]) return SUB_CAT_MAP[subName];
  return "cat_上衣";
}

function mapSeason(seasonFlag: number): string {
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
): Promise<{ clothing: number }> {
  console.log("[import] Starting...");

  // 1. Load zip
  const zip = await JSZip.loadAsync(zipData);
  console.log("[import] Zip loaded:", Object.keys(zip.files).length, "files");

  const jsonFile = zip.file("exporterData.json");
  if (!jsonFile) throw new Error("找不到 exporterData.json");

  const jsonText = await jsonFile.async("string");
  const data = JSON.parse(jsonText);
  console.log("[import] JSON parsed, clothing count:", data.clothings?.length);

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
  const existingNames = new Set(existingItems.map((i: any) => i.name?.toLowerCase()));

  // 4. Build image index
  const imageFiles = new Map<string, JSZip.JSZipObject>();
  zip.folder("images")?.forEach((path, file) => {
    const name = path.split("/").pop()?.replace(/\.(png|jpg|jpeg|webp)$/i, "");
    if (name) imageFiles.set(name.toUpperCase(), file);
  });

  // 5. Import
  const clothingList = data.clothings || [];
  let count = 0;

  for (let i = 0; i < clothingList.length; i++) {
    const c = clothingList[i];
    const uuid = c.uuid || "";
    const name = (c.name || "").trim();
    const imgUUID = (c.imageDataUUID || "").toUpperCase();

    onProgress?.({ current: i + 1, total: clothingList.length, message: `${i + 1}/${clothingList.length}` });

    if (name && existingNames.has(name.toLowerCase())) continue; // Skip duplicate

    const displayName = name || imgUUID.slice(0, 8);

    try {
      // Image to IndexedDB
      let imageUri = "placeholder";
      if (imageFiles.has(imgUUID)) {
        try {
          const base64 = await imageFiles.get(imgUUID)!.async("base64");
          await saveImageToIDB(imgUUID, base64);
          imageUri = "idx://" + imgUUID;
        } catch (e) { console.warn("[import] IDB fail", imgUUID); }
      }

      const subName = subCatMap.get((c.categoryUUID || "").toUpperCase());
      const categoryId = mapCategory(subName);
      const brand = brandMap.get((c.brandUUID || "").toUpperCase()) || "";
      const loc = locationMap.get((c.locationUUID || "").toUpperCase()) || "";
      const cSize = sizeMap.get((c.clothingSizeUUID || "").toUpperCase()) || "";
      const sSize = sizeMap.get((c.shoeSizeUUID || "").toUpperCase()) || "";
      const itemPrice = c.price ? String(c.price) : "";

      await addClothing({
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

      count++;
    } catch (e: any) {
      console.error("[import] Failed:", displayName, e?.message || e);
    }
  }

  console.log("[import] Done! Imported", count, "items");
  return { clothing: count };
}
