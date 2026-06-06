import JSZip from "jszip";
import { Clothing } from "../types";
import { getAllClothing, addClothing } from "../db/database";
import { storeImage } from "./imageStore";

// 分类映射
const SUB_CAT_MAP: Record<string, string> = {
  "T恤": "cat_上衣", "polo衫": "cat_上衣", "衬衫": "cat_上衣", "卫衣": "cat_上衣",
  "毛衣": "cat_上衣", "开衫": "cat_上衣", "背心": "cat_上衣", "吊带": "cat_上衣",
  "马甲": "cat_上衣", "针织衫": "cat_上衣", "短袖": "cat_上衣", "长袖T恤": "cat_上衣",
  "牛仔裤": "cat_裤子", "休闲裤": "cat_裤子", "短裤": "cat_裤子", "运动裤": "cat_裤子",
  "直筒裤": "cat_裤子", "阔腿裤": "cat_裤子", "紧身裤": "cat_裤子", "束脚裤": "cat_裤子",
  "工装裤": "cat_裤子", "西裤": "cat_裤子",
  "连衣裙": "cat_裙子", "半身裙": "cat_裙子", "连体裤": "cat_裙子", "短裙": "cat_裙子",
  "百褶裙": "cat_裙子", "A字裙": "cat_裙子", "长裙": "cat_裙子",
  "羽绒服": "cat_外套", "棉服": "cat_外套", "大衣": "cat_外套", "风衣": "cat_外套",
  "夹克": "cat_外套", "西装": "cat_外套", "冲锋衣": "cat_外套", "派克服": "cat_外套",
  "牛仔外套": "cat_外套", "棒球服": "cat_外套",
  "运动鞋": "cat_鞋子", "靴子": "cat_鞋子", "板鞋": "cat_鞋子", "帆布鞋": "cat_鞋子",
  "乐福鞋": "cat_鞋子", "凉鞋": "cat_鞋子", "拖鞋": "cat_鞋子", "德比鞋": "cat_鞋子",
  "帽子": "cat_配饰", "围巾": "cat_配饰", "手套": "cat_配饰", "袜子": "cat_配饰",
  "眼镜": "cat_配饰", "墨镜": "cat_配饰", "领带": "cat_配饰", "皮带": "cat_配饰",
  "双肩包": "cat_包包", "单肩包": "cat_包包", "手提包": "cat_包包",
};

function mapCategory(subName?: string): string {
  if (subName && SUB_CAT_MAP[subName]) return SUB_CAT_MAP[subName];
  return "cat_上衣";
}

function mapSeason(seasons: string[]): string {
  const m: Record<string, string> = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };
  return seasons?.map((s) => m[s] || "").filter(Boolean).join("/") || "";
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
  const zip = await JSZip.loadAsync(zipData);
  const jsonFile = zip.file("exporterData.json");
  if (!jsonFile) throw new Error("找不到 exporterData.json");

  const jsonText = await jsonFile.async("string");
  const data = JSON.parse(jsonText);

  // 图片索引
  const imageFiles = new Map<string, JSZip.JSZipObject>();
  zip.folder("images")?.forEach((path, file) => {
    const name = path.split("/").pop()?.replace(/\.(png|jpg|jpeg)$/i, "");
    if (name) imageFiles.set(name.toUpperCase(), file);
  });

  // 子分类索引
  const subCatMap = new Map<string, string>();
  for (const cat of data.categories || []) {
    for (const sub of cat.subCategories || []) {
      subCatMap.set(sub.uuid.toUpperCase(), sub.nameKey_ || "");
    }
  }

  const clothingList: Clothing[] = data.clothings || [];
  const existingItems = await getAllClothing();
  const existingNames = new Set(existingItems.map((i) => i.name?.toLowerCase()));

  let count = 0;
  for (let i = 0; i < clothingList.length; i++) {
    const c = clothingList[i];
    const name = c.name || "";
    const imgUUID = (c.imageDataUUID || "").toUpperCase();

    onProgress?.({ current: i + 1, total: clothingList.length, message: `${i + 1}/${clothingList.length}` });

    // 跳过已存在或无图片的
    if (name && existingNames.has(name.toLowerCase())) continue;
    if (!imageFiles.has(imgUUID)) continue;

    try {
      const base64 = await imageFiles.get(imgUUID)!.async("base64");
      await storeImage(imgUUID, base64);
      const imageUrl = "idx://" + imgUUID; // IndexedDB reference, resolved by AsyncImage

      const subName = subCatMap.get((c.categoryUUID || "").toUpperCase());
      const categoryId = mapCategory(subName);

      await addClothing({
        categoryId,
        name,
        imageUri: imageUrl,
        brand: data.brands?.find((b: any) => b.uuid === c.brandUUID)?.desc_ || "",
        color: c.primaryColorHex || "",
        season: mapSeason(c.season || []),
        notes: c.comment_ || "",
      });
      count++;
    } catch (e) {
      console.warn("导入失败:", name, e);
    }
  }

  return { clothing: count };
}
