import { create } from "zustand";
import { Clothing, Category } from "../types";
import {
  getAllClothing,
  addClothing,
  updateClothing,
  deleteClothing,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getOutfitsByClothingId,
  getArchivedClothing,
  restoreClothing,
} from "../db/database";

interface ClothingState {
  items: Clothing[];
  categories: Category[];
  loading: boolean;
  loadClothing: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addItem: (data: Omit<Clothing, "id" | "createdAt" | "updatedAt" | "deleted" | "favorite">) => Promise<Clothing>;
  updateItem: (id: string, data: Partial<Clothing>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  getByCategory: (catId: string) => Clothing[];
  addCat: (data: Omit<Category, "id">) => Promise<void>;
  updateCat: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCat: (id: string) => Promise<void>;
  getRelatedOutfits: (clothingId: string) => ReturnType<typeof getOutfitsByClothingId>;
  getArchived: () => ReturnType<typeof getArchivedClothing>;
}

export const useClothingStore = create<ClothingState>((set, get) => ({
  items: [],
  categories: [],
  loading: false,

  loadClothing: async () => {
    set({ loading: true });
    const items = await getAllClothing();
    set({ items, loading: false });
  },

  loadCategories: async () => {
    const categories = await getCategories();
    set({ categories });
  },

  addItem: async (data) => {
    const item = await addClothing(data);
    set((s) => ({ items: [item, ...s.items] }));
    return item;
  },

  updateItem: async (id, data) => {
    await updateClothing(id, data);
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  },

  deleteItem: async (id) => {
    await deleteClothing(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  restoreItem: async (id) => {
    await restoreClothing(id);
    const items = await getAllClothing();
    set({ items });
  },

  getByCategory: (catId) => get().items.filter((i) => i.categoryId === catId),

  addCat: async (data) => {
    await addCategory(data);
    const categories = await getCategories();
    set({ categories });
  },

  updateCat: async (id, data) => {
    await updateCategory(id, data);
    const categories = await getCategories();
    set({ categories });
  },

  deleteCat: async (id) => {
    await deleteCategory(id);
    const categories = await getCategories();
    set({ categories });
  },

  getRelatedOutfits: (clothingId) => getOutfitsByClothingId(clothingId),

  getArchived: () => getArchivedClothing(),
}));
