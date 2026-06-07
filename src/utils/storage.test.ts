import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockStorage } from "../test-utils/mockStorage";

let currentOS: "web" | "android" | "ios" = "web";

vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return currentOS;
    },
  },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => mockStorage.getItem(key)),
    setItem: vi.fn((key: string, value: string) => mockStorage.setItem(key, value)),
    removeItem: vi.fn((key: string) => mockStorage.removeItem(key)),
  },
}));

import storage from "./storage";

// localStorage mock for node environment
const localStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => localStore[key] ?? null,
  setItem: (key: string, value: string) => { localStore[key] = value; },
  removeItem: (key: string) => { delete localStore[key]; },
  clear: () => { for (const key of Object.keys(localStore)) delete localStore[key]; },
};
vi.stubGlobal("localStorage", mockLocalStorage);

describe("storage", () => {
  beforeEach(() => {
    mockStorage.clear();
    mockLocalStorage.clear();
    currentOS = "web";
  });

  afterEach(() => {
    mockStorage.clear();
    mockLocalStorage.clear();
  });

  describe("web path", () => {
    beforeEach(() => {
      currentOS = "web";
    });

    it("getItem reads from localStorage", async () => {
      mockLocalStorage.setItem("key1", "value1");
      const val = await storage.getItem("key1");
      expect(val).toBe("value1");
    });

    it("setItem writes to localStorage", async () => {
      await storage.setItem("key2", "value2");
      expect(mockLocalStorage.getItem("key2")).toBe("value2");
    });

    it("removeItem deletes from localStorage", async () => {
      mockLocalStorage.setItem("key3", "value3");
      await storage.removeItem("key3");
      expect(mockLocalStorage.getItem("key3")).toBeNull();
    });

    it("getItem returns null for missing key", async () => {
      const val = await storage.getItem("missing");
      expect(val).toBeNull();
    });

    it("handles localStorage errors gracefully", async () => {
      const original = mockLocalStorage.getItem;
      mockLocalStorage.getItem = vi.fn(() => {
        throw new Error("fail");
      });
      const val = await storage.getItem("key");
      expect(val).toBeNull();
      mockLocalStorage.getItem = original;
    });
  });

  describe("native path", () => {
    beforeEach(() => {
      currentOS = "android";
    });

    it("getItem reads from AsyncStorage", async () => {
      await mockStorage.setItem("nkey1", "nvalue1");
      const val = await storage.getItem("nkey1");
      expect(val).toBe("nvalue1");
    });

    it("setItem writes to AsyncStorage", async () => {
      await storage.setItem("nkey2", "nvalue2");
      expect(await mockStorage.getItem("nkey2")).toBe("nvalue2");
    });

    it("removeItem deletes from AsyncStorage", async () => {
      await mockStorage.setItem("nkey3", "nvalue3");
      await storage.removeItem("nkey3");
      expect(await mockStorage.getItem("nkey3")).toBeNull();
    });

    it("handles AsyncStorage errors gracefully", async () => {
      const original = mockStorage.getItem;
      mockStorage.getItem = vi.fn(() => Promise.reject(new Error("fail")));
      const val = await storage.getItem("key");
      expect(val).toBeNull();
      mockStorage.getItem = original;
    });
  });
});
