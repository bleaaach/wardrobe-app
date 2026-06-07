// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
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

import { useClothingStore } from "./clothingStore";
import { initDatabase } from "../db/database";

describe("clothingStore", () => {
  beforeEach(async () => {
    mockStorage.clear();
    useClothingStore.setState({ items: [], categories: [], loading: false });
    await initDatabase();
  });

  it("loadClothing loads items into state", async () => {
    const store = useClothingStore.getState();
    await store.loadClothing();
    expect(useClothingStore.getState().items).toEqual([]);
  });

  it("loadCategories loads categories into state", async () => {
    const store = useClothingStore.getState();
    await store.loadCategories();
    expect(useClothingStore.getState().categories.length).toBeGreaterThan(0);
  });

  it("addItem adds to front of items array", async () => {
    const store = useClothingStore.getState();
    await store.addItem({ categoryId: "c1", name: "卫衣", imageUri: "u1" });
    const items = useClothingStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].name).toBe("卫衣");
  });

  it("deleteItem removes from items", async () => {
    const store = useClothingStore.getState();
    const item = await store.addItem({ categoryId: "c1", name: "夹克", imageUri: "u2" });
    await store.deleteItem(item.id);
    const items = useClothingStore.getState().items;
    expect(items.find((i) => i.id === item.id)).toBeUndefined();
  });

  it("deleteCat refreshes both categories and items", async () => {
    const store = useClothingStore.getState();
    await store.loadCategories();
    await store.addCat({ name: "临时", icon: "", sortOrder: 1, parentId: null });
    const cat = useClothingStore.getState().categories.find((c) => c.name === "临时")!;
    const item = await store.addItem({ categoryId: cat.id, name: "临时衣物", imageUri: "u3" });

    await store.deleteCat(cat.id);
    const state = useClothingStore.getState();
    expect(state.categories.find((c) => c.id === cat.id)).toBeUndefined();
    expect(state.items.find((i) => i.id === item.id)?.categoryId).toBe("");
  });
});
