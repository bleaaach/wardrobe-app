import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockImageStore } from "../test-utils/mockImageStorage";

const platformMock = vi.hoisted(() => ({ OS: "web" as "web" | "android" | "ios" }));

vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return platformMock.OS;
    },
  },
}));

import {
  storeImage,
  getImageUrl,
  imageExists,
  __setFileSystem,
} from "./imageStorage";

// Mock IndexedDB for web tests
class MockIDBRequest {
  result: any = null;
  error: any = null;
  onsuccess: ((this: MockIDBRequest, ev: any) => any) | null = null;
  onerror: ((this: MockIDBRequest, ev: any) => any) | null = null;
  onupgradeneeded: ((this: MockIDBRequest, ev: any) => any) | null = null;
  source: any = null;
  transaction: any = null;
  readyState: "pending" | "done" = "pending";
}

class MockIDBTransaction {
  oncomplete: ((this: MockIDBTransaction, ev: any) => any) | null = null;
  onerror: ((this: MockIDBTransaction, ev: any) => any) | null = null;
  objectStore(_name: string) {
    return mockObjectStore;
  }
}

const mockObjectStore = {
  put: vi.fn(() => {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.readyState = "done";
      if (req.onsuccess) req.onsuccess.call(req, {});
      if (mockTxn.oncomplete) mockTxn.oncomplete.call(mockTxn, {});
    }, 0);
    return req;
  }),
  get: vi.fn((id: string) => {
    const req = new MockIDBRequest();
    const data = idbData.get(id);
    setTimeout(() => {
      req.result = data ? { id, blob: data } : undefined;
      req.readyState = "done";
      if (req.onsuccess) req.onsuccess.call(req, {});
      if (mockTxn.oncomplete) mockTxn.oncomplete.call(mockTxn, {});
    }, 0);
    return req;
  }),
  count: vi.fn((id: string) => {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = idbData.has(id) ? 1 : 0;
      req.readyState = "done";
      if (req.onsuccess) req.onsuccess.call(req, {});
      if (mockTxn.oncomplete) mockTxn.oncomplete.call(mockTxn, {});
    }, 0);
    return req;
  }),
};

const mockTxn = new MockIDBTransaction();

const idbData = new Map<string, Blob>();

class MockIDBDatabase {
  objectStoreNames = {
    contains: (name: string) => name === "images",
  };
  createObjectStore = vi.fn(() => mockObjectStore);
  transaction = vi.fn(() => mockTxn);
  close = vi.fn();
}

const mockDB = new MockIDBDatabase();

vi.stubGlobal("indexedDB", {
  open: vi.fn(() => {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = mockDB;
      req.readyState = "done";
      if (req.onsuccess) req.onsuccess.call(req, {});
    }, 0);
    return req;
  }),
});

vi.stubGlobal("URL", {
  createObjectURL: vi.fn((blob: Blob) => `blob://fake-url`),
});

const mockFs = {
  documentDirectory: "file:///mock/",
  getInfoAsync: vi.fn(async (path: string) => {
    const id = path.replace("file:///mock/wardrobe_images/", "").replace(".png", "");
    const exists = await mockImageStore.imageExists(id);
    return { exists, uri: path };
  }),
  makeDirectoryAsync: vi.fn(() => Promise.resolve()),
  writeAsStringAsync: vi.fn(async (path: string, base64: string) => {
    const id = path.replace("file:///mock/wardrobe_images/", "").replace(".png", "");
    await mockImageStore.storeImage(id, base64);
  }),
  EncodingType: { Base64: "base64" },
};

describe("imageStorage", () => {
  beforeEach(() => {
    mockImageStore.clear();
    idbData.clear();
    platformMock.OS = "web";
    __setFileSystem(undefined);
    vi.clearAllMocks();
  });

  describe("web path", () => {
    beforeEach(() => {
      platformMock.OS = "web";
    });

    it("storeImage stores via IndexedDB", async () => {
      await storeImage("img1", "aGVsbG8=");
      expect(mockObjectStore.put).toHaveBeenCalled();
    });

    it("getImageUrl returns cached or blob url", async () => {
      idbData.set("img2", new Blob(["x"]));
      const url = await getImageUrl("img2");
      expect(url).toBe("blob://fake-url");
    });

    it("imageExists returns true if in IndexedDB", async () => {
      idbData.set("img3", new Blob(["x"]));
      const exists = await imageExists("img3");
      expect(exists).toBe(true);
    });

    it("imageExists returns false if not in IndexedDB", async () => {
      const exists = await imageExists("img-missing");
      expect(exists).toBe(false);
    });
  });

  describe("native path", () => {
    beforeEach(() => {
      platformMock.OS = "android";
      __setFileSystem(mockFs as any);
    });

    it("storeImage stores via expo-file-system", async () => {
      await storeImage("nimg1", "base64data");
      expect(await mockImageStore.imageExists("nimg1")).toBe(true);
    });

    it("getImageUrl returns path if exists", async () => {
      await mockImageStore.storeImage("nimg2", "x");
      const url = await getImageUrl("nimg2");
      expect(url).toBe("file:///mock/wardrobe_images/nimg2.png");
    });

    it("getImageUrl returns null if missing", async () => {
      const url = await getImageUrl("nimg-missing");
      expect(url).toBeNull();
    });

    it("imageExists returns true if file exists", async () => {
      await mockImageStore.storeImage("nimg3", "x");
      const exists = await imageExists("nimg3");
      expect(exists).toBe(true);
    });

    it("imageExists returns false if file missing", async () => {
      const exists = await imageExists("nimg-missing");
      expect(exists).toBe(false);
    });
  });
});
