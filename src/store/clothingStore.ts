import { create } from "zustand";
import { Clothing, Category } from "../types";
import { getAllClothing, addClothing, updateClothing, deleteClothing, getCategories } from "../db/database";

interface ClothingState {
  items: Clothing[];
  categories: Category[];
  loading: boolean;
  loadClothing: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addItem: (data: Omit<Clothing, "id" | "createdAt" | "updatedAt" | "deleted" | "favorite">) => Promise<Clothing>;
  updateItem: (id: string, data: Partial<Clothing>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getByCategory: (catId: string) => Clothing[];
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

  getByCategory: (catId) => get().items.filter((i) => i.categoryId === catId),
}));
