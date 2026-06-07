import { describe, it, expect, vi, beforeEach } from "vitest";
import JSZip from "jszip";
import { mockStorage } from "../test-utils/mockStorage";

vi.mock("../utils/storage", () => ({
  default: {
    getItem: vi.fn((key: string) => mockStorage.getItem(key)),
    setItem: vi.fn((key: string, value: string) => mockStorage.setItem(key, value)),
    removeItem: vi.fn((key: string) => mockStorage.removeItem(key)),
  },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

vi.mock("expo-file-system/legacy", () => ({}));

import {
  mapSeason,
  mapCategory,
  importClosetData,
} from "./importCloset";
import { initDatabase, getAllClothing, getOutfits } from "../db/database";

describe("importCloset", () => {
  beforeEach(async () => {
    mockStorage.clear();
    globalThis.localStorage?.clear();
    await initDatabase();
  });

  describe("mapSeason", () => {
    it("returns empty for 0 or non-number", () => {
      expect(mapSeason(0)).toBe("");
      expect(mapSeason(undefined as any)).toBe("");
    });

    it("maps single season", () => {
      expect(mapSeason(1)).toBe("春");
      expect(mapSeason(2)).toBe("夏");
      expect(mapSeason(4)).toBe("秋");
      expect(mapSeason(8)).toBe("冬");
    });

    it("maps combined seasons", () => {
      expect(mapSeason(3)).toBe("春/夏");
      expect(mapSeason(15)).toBe("春/夏/秋/冬");
    });
  });

  describe("mapCategory", () => {
    it("returns empty for undefined", async () => {
      const id = await mapCategory(undefined);
      expect(id).toBe("");
    });

    it("returns empty for unmatched name", async () => {
      const id = await mapCategory("不存在的分类");
      expect(id).toBe("");
    });

    it("matches existing category by name", async () => {
      const id = await mapCategory("T恤");
      expect(id).not.toBe("");
    });

    it("prefers sub-category over parent", async () => {
      const id = await mapCategory("T恤");
      const cats = await import("../db/database").then((m) => m.getCategories());
      const cat = cats.find((c) => c.id === id);
      expect(cat?.parentId).toBeTruthy();
    });
  });

  describe("importClosetData", () => {
    async function buildZip(data: any) {
      const zip = new JSZip();
      zip.file("exporterData.json", JSON.stringify(data));
      return zip.generateAsync({ type: "arraybuffer" });
    }

    it("imports clothing from minimal zip", async () => {
      const data = {
        categories: [],
        brands: [],
        locations: [],
        clothingSizes: [],
        shoeSizes: [],
        clothings: [
          {
            uuid: "c1",
            name: "测试T恤",
            imageDataUUID: "img1",
            categoryUUID: "",
            brandUUID: "",
            locationUUID: "",
            clothingSizeUUID: "",
            shoeSizeUUID: "",
            price: 99,
            season: 1,
            wearsTotal: 0,
          },
        ],
        outfits: [],
      };
      const zipBuf = await buildZip(data);
      const result = await importClosetData(zipBuf);
      expect(result.clothing).toBe(1);
      expect(result.outfits).toBe(0);
      const items = await getAllClothing();
      expect(items.some((i) => i.name === "测试T恤")).toBe(true);
    });

    it("skips duplicate names against existing wardrobe", async () => {
      // First import one item
      const data1 = {
        categories: [],
        brands: [],
        locations: [],
        clothingSizes: [],
        shoeSizes: [],
        clothings: [
          { uuid: "c1", name: "唯一", imageDataUUID: "", categoryUUID: "", brandUUID: "", locationUUID: "", clothingSizeUUID: "", shoeSizeUUID: "", price: 0, season: 0, wearsTotal: 0 },
        ],
      };
      const zipBuf1 = await buildZip(data1);
      await importClosetData(zipBuf1);

      // Second import with same name should skip
      const data2 = {
        categories: [],
        brands: [],
        locations: [],
        clothingSizes: [],
        shoeSizes: [],
        clothings: [
          { uuid: "c2", name: "唯一", imageDataUUID: "", categoryUUID: "", brandUUID: "", locationUUID: "", clothingSizeUUID: "", shoeSizeUUID: "", price: 0, season: 0, wearsTotal: 0 },
        ],
      };
      const zipBuf2 = await buildZip(data2);
      const result = await importClosetData(zipBuf2);
      expect(result.clothing).toBe(0);
    });

    it("imports outfits with clothing mapping", async () => {
      const data = {
        categories: [],
        brands: [],
        locations: [],
        clothingSizes: [],
        shoeSizes: [],
        clothings: [
          {
            uuid: "c1",
            name: "T恤",
            imageDataUUID: "",
            categoryUUID: "",
            brandUUID: "",
            locationUUID: "",
            clothingSizeUUID: "",
            shoeSizeUUID: "",
            price: 0,
            season: 0,
            wearsTotal: 0,
          },
          {
            uuid: "c2",
            name: "裤子",
            imageDataUUID: "",
            categoryUUID: "",
            brandUUID: "",
            locationUUID: "",
            clothingSizeUUID: "",
            shoeSizeUUID: "",
            price: 0,
            season: 0,
            wearsTotal: 0,
          },
        ],
        outfits: [
          {
            uuid: "o1",
            imageDataUUID: "",
            background: {},
            occasionUUID: null,
            tagValueUUIDs: [],
            movables: [
              {
                uuid: "m1",
                clothingUUID: "c1",
                posX: 100,
                posY: 120,
                frameWidth: 120,
                frameHeight: 150,
                zIndex: 1,
                rotationDegree: 0,
              },
              {
                uuid: "m2",
                clothingUUID: "c2",
                posX: 200,
                posY: 180,
                frameWidth: 140,
                frameHeight: 160,
                zIndex: 2,
                rotationDegree: 15,
              },
            ],
            extraImageUUIDs: [],
            season: 0,
            status: 0,
            createDate_: "2026-01-01T00:00:00Z",
            updateDate_: "2026-01-01T00:00:00Z",
          },
        ],
      };
      const zipBuf = await buildZip(data);
      const result = await importClosetData(zipBuf);
      expect(result.clothing).toBe(2);
      expect(result.outfits).toBe(1);

      const outfits = await getOutfits();
      expect(outfits.length).toBe(1);
      expect(outfits[0].name).toBe("搭配 1");

      const clothingIds: string[] = JSON.parse(outfits[0].clothingIds || "[]");
      expect(clothingIds.length).toBe(2);

      const layout: any[] = JSON.parse(outfits[0].layout || "[]");
      expect(layout.length).toBe(2);
      expect(layout[0].x).toBe(-60);
      expect(layout[0].scale).toBe(1.2);
      expect(layout[1].rotation).toBe(15);
    });

    it("throws when exporterData.json missing", async () => {
      const zip = new JSZip();
      const zipBuf = await zip.generateAsync({ type: "arraybuffer" });
      await expect(importClosetData(zipBuf)).rejects.toThrow("exporterData.json");
    });
  });
});
