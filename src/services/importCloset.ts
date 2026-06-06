import JSZip from "jszip";
import { Clothing } from "../types";
import { getAllClothing, addClothing } from "../db/database";

// Global image cache using Blob URLs (persist for session on web)
const imageUrlCache = new Map<string, string>();

export function getCachedImageUrl(uuid: string): string | undefined {
  return imageUrlCache.get(uuid.toUpperCase());
}

// 分类映射: 上装→上衣, 下装→裤子, 鞋→鞋子, 连体→裙子, 外套→外套, 配饰→配饰, 包包→包包
const CAT_MAP: Record<string, string> = {
  "上装": "cat_上衣",
  "下装": "cat_裤子",
  "鞋": "cat_鞋子",
  "连体": "cat_裙子",
  "外套": "cat_外套",
  "配饰": "cat_配饰",
  "包包": "cat_包包",
};

// 子分类映射
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
  "乐福鞋": "cat_鞋子", "切尔西": "cat_鞋子", "凉鞋": "cat_鞋子", "拖鞋": "cat_鞋子",
  "德比鞋": "cat_鞋子", "高跟鞋": "cat_鞋子", "小白鞋": "cat_鞋子",
  "帽子": "cat_配饰", "围巾": "cat_配饰", "手套": "cat_配饰", "袜子": "cat_配饰",
  "眼镜": "cat_配饰", "墨镜": "cat_配饰", "领带": "cat_配饰", "皮带": "cat_配饰",
  "双肩包": "cat_包包", "单肩包": "cat_包包", "邮差包": "cat_包包", "手提包": "cat_包包",
};

function mapCategory(catName: string, subName?: string): string {
  if (subName && SUB_CAT_MAP[subName]) return SUB_CAT_MAP[subName];
  for (const [key, val] of Object.entries(CAT_MAP)) {
    if (catName.includes(key)) return val;
  }
  return "cat_上衣"; // fallback
}

function mapSeason(seasons: string[]): string {
  const m: Record<string, string> = { spring: "春", summer: "夏", autumn: "秋", winter: "冬", all: "" };
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
): Promise<{ clothing: number; outfits: number; logs: number }> {
  const zip = await JSZip.loadAsync(zipData);
  const jsonFile = zip.file("exporterData.json");
  if (!jsonFile) throw new Error("找不到 exporterData.json");

  const jsonText = await jsonFile.async("string");
  const data = JSON.parse(jsonText);

  // 构建图片索引
  const imageFiles = new Map<string, JSZip.JSZipObject>();
  zip.folder("images")?.forEach((path, file) => {
    const name = path.split("/").pop()?.replace(/\.(png|jpg|jpeg)$/i, "");
    if (name) imageFiles.set(name.toUpperCase(), file);
  });

  // 构建分类索引
  const catMap = new Map<string, { name: string; subName?: string }>();
  for (const cat of data.categories || []) {
    catMap.set(cat.uuid.toUpperCase(), { name: cat.nameKey_ || "" });
    for (const sub of cat.subCategories || []) {
      catMap.set(sub.uuid.toUpperCase(), { name: cat.nameKey_ || "", subName: sub.nameKey_ || "" });
    }
  }

  // 导入衣物
  let clothingCount = 0;
  const imageCache = new Map<string, string>(); // uuid → dataURI
  const existingItems = await getAllClothing();
  const existingNames = new Set(existingItems.map((i) => i.name?.toLowerCase()));

  const clothingList: Clothing[] = data.clothings || [];

  for (let i = 0; i < clothingList.length; i++) {
    const c = clothingList[i];
    onProgress?.({ current: i + 1, total: clothingList.length, message: `导入衣物 ${i + 1}/${clothingList.length}` });

    try {
      // 跳过已存在的
      if (c.name && existingNames.has(c.name.toLowerCase())) continue;

      // 获取图片 - 用 Blob URL（浏览器内存）存储
      const imgUUID = (c.imageDataUUID || "").toUpperCase();
      let imageUri = "";
      if (imageFiles.has(imgUUID)) {
        if (!imageCache.has(imgUUID)) {
          const base64 = await imageFiles.get(imgUUID)!.async("base64");
          const byteChars = atob(base64);
          const byteNums = new Array(byteChars.length);
          for (let j = 0; j < byteChars.length; j++) byteNums[j] = byteChars.charCodeAt(j);
          const byteArr = new Uint8Array(byteNums);
          const blob = new Blob([byteArr], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          imageCache.set(imgUUID, url);
          imageUrlCache.set(imgUUID, url);
        }
        imageUri = imageCache.get(imgUUID) || "";
      }

      if (!imageUri) continue; // Skip items without images

      const catInfo = catMap.get((c.categoryUUID || "").toUpperCase());
      const categoryId = mapCategory(catInfo?.name || "", catInfo?.subName);

      await addClothing({
        categoryId,
        name: c.name || "",
        imageUri,
        brand: data.brands?.find((b: any) => b.uuid === c.brandUUID)?.desc_ || "",
        color: c.primaryColorHex || "",
        season: mapSeason(c.season || []),
        notes: c.comment_ || "",
      });
      clothingCount++;
    } catch (e) {
      console.warn("导入失败:", c.name, e);
    }
  }

  return { clothing: clothingCount, outfits: 0, logs: 0 };
}
