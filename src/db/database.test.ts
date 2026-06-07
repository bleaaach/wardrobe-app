// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockStorage } from "../test-utils/mockStorage";
import type { Clothing, Category, Outfit, DailyLog } from "../types";

vi.mock("../utils/storage", () => ({
  default: {
    getItem: vi.fn((key: string) => mockStorage.getItem(key)),
    setItem: vi.fn((key: string, value: string) => mockStorage.setItem(key, value)),
    removeItem: vi.fn((key: string) => mockStorage.removeItem(key)),
  },
}));

import {
  initDatabase,
  getAllClothing,
  getClothingById,
  addClothing,
  updateClothing,
  deleteClothing,
  restoreClothing,
  getArchivedClothing,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getOutfits,
  addOutfit,
  updateOutfit,
  deleteOutfit,
  getDailyLogs,
  addDailyLog,
  updateDailyLog,
  deleteDailyLog,
  getSetting,
  setSetting,
} from "./database";

describe("database", () => {
  beforeEach(async () => {
    mockStorage.clear();
    // fresh init each test
    await initDatabase();
  });

  describe("initDatabase", () => {
    it("writes default categories on first call", async () => {
      const cats = await getCategories();
      expect(cats.length).toBeGreaterThan(0);
    });

    it("does not duplicate defaults on repeated calls", async () => {
      await initDatabase();
      const cats = await getCategories();
      const ids = new Set(cats.map((c) => c.id));
      expect(ids.size).toBe(cats.length);
    });
  });

  describe("clothing CRUD", () => {
    it("adds clothing and returns it", async () => {
      const item = await addClothing({ categoryId: "c1", name: "T恤", imageUri: "uri1" });
      expect(item.name).toBe("T恤");
      expect(item.deleted).toBe(0);
    });

    it("getAllClothing excludes deleted", async () => {
      const item = await addClothing({ categoryId: "c1", name: "衬衫", imageUri: "uri2" });
      await deleteClothing(item.id);
      const all = await getAllClothing();
      expect(all.find((i) => i.id === item.id)).toBeUndefined();
    });

    it("getById returns item", async () => {
      const item = await addClothing({ categoryId: "c1", name: "牛仔裤", imageUri: "uri3" });
      const found = await getClothingById(item.id);
      expect(found?.name).toBe("牛仔裤");
    });

    it("updateClothing modifies fields", async () => {
      const item = await addClothing({ categoryId: "c1", name: "卫衣", imageUri: "uri4" });
      await updateClothing(item.id, { name: "连帽卫衣" });
      const found = await getClothingById(item.id);
      expect(found?.name).toBe("连帽卫衣");
    });

    it("deleteClothing soft deletes", async () => {
      const item = await addClothing({ categoryId: "c1", name: "外套", imageUri: "uri5" });
      await deleteClothing(item.id);
      const found = await getClothingById(item.id);
      expect(found?.deleted).toBe(1);
    });

    it("restoreClothing recovers soft deleted", async () => {
      const item = await addClothing({ categoryId: "c1", name: "夹克", imageUri: "uri6" });
      await deleteClothing(item.id);
      await restoreClothing(item.id);
      const found = await getClothingById(item.id);
      expect(found?.deleted).toBe(0);
    });

    it("getArchivedClothing returns only deleted", async () => {
      const item = await addClothing({ categoryId: "c1", name: "旧鞋", imageUri: "uri7" });
      await deleteClothing(item.id);
      const archived = await getArchivedClothing();
      expect(archived.some((i) => i.id === item.id)).toBe(true);
    });
  });

  describe("category CRUD", () => {
    it("adds category", async () => {
      const cat = await addCategory({ name: "测试分类", icon: "", sortOrder: 99, parentId: null });
      expect(cat.name).toBe("测试分类");
    });

    it("updates category", async () => {
      const cat = await addCategory({ name: "旧名", icon: "", sortOrder: 1, parentId: null });
      await updateCategory(cat.id, { name: "新名" });
      const cats = await getCategories();
      expect(cats.find((c) => c.id === cat.id)?.name).toBe("新名");
    });

    it("deleting category resets关联衣物 categoryId", async () => {
      const cat = await addCategory({ name: "临时分类", icon: "", sortOrder: 1, parentId: null });
      const item = await addClothing({ categoryId: cat.id, name: "关联衣物", imageUri: "uri8" });
      await deleteCategory(cat.id);
      const found = await getClothingById(item.id);
      expect(found?.categoryId).toBe("");
    });
  });

  describe("outfit CRUD", () => {
    it("adds outfit", async () => {
      const outfit = await addOutfit({ name: "周一搭配", clothingIds: "[]", notes: "" });
      expect(outfit.name).toBe("周一搭配");
    });

    it("getOutfits excludes deleted", async () => {
      const outfit = await addOutfit({ name: "旧搭配", clothingIds: "[]", notes: "" });
      await deleteOutfit(outfit.id);
      const all = await getOutfits();
      expect(all.find((o) => o.id === outfit.id)).toBeUndefined();
    });

    it("updateOutfit changes fields", async () => {
      const outfit = await addOutfit({ name: "搭配A", clothingIds: "[]", notes: "" });
      await updateOutfit(outfit.id, { name: "搭配B" });
      const all = await getOutfits();
      expect(all.find((o) => o.id === outfit.id)?.name).toBe("搭配B");
    });

    it("deleteOutfit soft deletes", async () => {
      const outfit = await addOutfit({ name: "废弃搭配", clothingIds: "[]", notes: "" });
      await deleteOutfit(outfit.id);
      const all = await getOutfits();
      expect(all.find((o) => o.id === outfit.id)).toBeUndefined();
    });
  });

  describe("dailyLog with wearCount联动", () => {
    it("addDailyLog increases wearCount for outfit clothing", async () => {
      const c1 = await addClothing({ categoryId: "c1", name: "上衣", imageUri: "u1" });
      const outfit = await addOutfit({ name: "搭配1", clothingIds: JSON.stringify([c1.id]), notes: "" });
      await addDailyLog({ date: "2026-06-01", outfitId: outfit.id });
      const updated = await getClothingById(c1.id);
      expect(updated?.wearCount).toBe(1);
    });

    it("updateDailyLog switches wearCount when outfit changes", async () => {
      const c1 = await addClothing({ categoryId: "c1", name: "上衣", imageUri: "u1" });
      const c2 = await addClothing({ categoryId: "c1", name: "裤子", imageUri: "u2" });
      const o1 = await addOutfit({ name: "搭配A", clothingIds: JSON.stringify([c1.id]), notes: "" });
      const o2 = await addOutfit({ name: "搭配B", clothingIds: JSON.stringify([c2.id]), notes: "" });
      const log = await addDailyLog({ date: "2026-06-02", outfitId: o1.id });
      expect((await getClothingById(c1.id))?.wearCount).toBe(1);

      await updateDailyLog(log.id, { outfitId: o2.id });
      expect((await getClothingById(c1.id))?.wearCount).toBe(0);
      expect((await getClothingById(c2.id))?.wearCount).toBe(1);
    });

    it("deleteDailyLog decreases wearCount", async () => {
      const c1 = await addClothing({ categoryId: "c1", name: "上衣", imageUri: "u1" });
      const o1 = await addOutfit({ name: "搭配A", clothingIds: JSON.stringify([c1.id]), notes: "" });
      const log = await addDailyLog({ date: "2026-06-03", outfitId: o1.id });
      expect((await getClothingById(c1.id))?.wearCount).toBe(1);

      await deleteDailyLog(log.id);
      expect((await getClothingById(c1.id))?.wearCount).toBe(0);
    });

    it("same-day overwrite reverts old wearCount and applies new", async () => {
      const c1 = await addClothing({ categoryId: "c1", name: "上衣", imageUri: "u1" });
      const c2 = await addClothing({ categoryId: "c1", name: "裤子", imageUri: "u2" });
      const o1 = await addOutfit({ name: "搭配A", clothingIds: JSON.stringify([c1.id]), notes: "" });
      const o2 = await addOutfit({ name: "搭配B", clothingIds: JSON.stringify([c2.id]), notes: "" });
      await addDailyLog({ date: "2026-06-04", outfitId: o1.id });
      expect((await getClothingById(c1.id))?.wearCount).toBe(1);

      await addDailyLog({ date: "2026-06-04", outfitId: o2.id });
      expect((await getClothingById(c1.id))?.wearCount).toBe(0);
      expect((await getClothingById(c2.id))?.wearCount).toBe(1);
    });
  });

  describe("settings", () => {
    it("getSetting returns null when missing", async () => {
      const val = await getSetting("theme");
      expect(val).toBeNull();
    });

    it("setSetting stores value", async () => {
      await setSetting("theme", "dark");
      const val = await getSetting("theme");
      expect(val).toBe("dark");
    });

    it("setSetting overwrites existing", async () => {
      await setSetting("lang", "zh");
      await setSetting("lang", "en");
      const val = await getSetting("lang");
      expect(val).toBe("en");
    });
  });
});
