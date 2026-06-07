import { Platform } from "react-native";

/* ---------- Web: IndexedDB ---------- */

const DB_NAME = "WardrobeImages";
const STORE_NAME = "images";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeImageWeb(id: string, base64: string): Promise<void> {
  const db = await openDB();
  const byteStr = atob(base64);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: "image/png" });

  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readwrite");
    txn.objectStore(STORE_NAME).put({ id, blob });
    txn.oncomplete = () => resolve();
    txn.onerror = () => reject(txn.error);
    db.close();
  });
}

async function getImageBlobWeb(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readonly");
    const req = txn.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
    txn.oncomplete = () => db.close();
  });
}

const urlCacheWeb = new Map<string, string>();

async function getImageUrlWeb(id: string): Promise<string | null> {
  if (urlCacheWeb.has(id)) return urlCacheWeb.get(id)!;
  const blob = await getImageBlobWeb(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCacheWeb.set(id, url);
  return url;
}

async function imageExistsWeb(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve) => {
    const txn = db.transaction(STORE_NAME, "readonly");
    const req = txn.objectStore(STORE_NAME).count(id);
    req.onsuccess = () => resolve(req.result > 0);
    req.onerror = () => resolve(false);
    txn.oncomplete = () => db.close();
  });
}

/* ---------- React Native: expo-file-system (legacy v56 API) ---------- */

let FileSystem: typeof import("expo-file-system/legacy") | undefined;

export function __setFileSystem(fs: typeof FileSystem) {
  FileSystem = fs;
}

function getFileSystem() {
  if (!FileSystem) {
    FileSystem = require("expo-file-system/legacy");
  }
  if (!FileSystem) {
    throw new Error("expo-file-system/legacy is not available");
  }
  return FileSystem;
}

const IMAGE_DIR = "wardrobe_images/";

function getImagePath(id: string): string {
  const fs = getFileSystem();
  return fs.documentDirectory! + IMAGE_DIR + id + ".png";
}

async function ensureDir(): Promise<void> {
  const fs = getFileSystem();
  const dir = fs.documentDirectory! + IMAGE_DIR;
  const info = await fs.getInfoAsync(dir);
  if (!info.exists) {
    await fs.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function storeImageNative(id: string, base64: string): Promise<void> {
  await ensureDir();
  const path = getImagePath(id);
  const fs = getFileSystem();
  await fs.writeAsStringAsync(path, base64, {
    encoding: fs.EncodingType.Base64,
  });
}

async function getImageUrlNative(id: string): Promise<string | null> {
  const path = getImagePath(id);
  const fs = getFileSystem();
  const info = await fs.getInfoAsync(path);
  return info.exists ? path : null;
}

async function imageExistsNative(id: string): Promise<boolean> {
  const path = getImagePath(id);
  const fs = getFileSystem();
  const info = await fs.getInfoAsync(path);
  return info.exists;
}

/* ---------- Cross-platform exports ---------- */

export async function storeImage(id: string, base64: string): Promise<void> {
  if (Platform.OS === "web") {
    return storeImageWeb(id, base64);
  }
  return storeImageNative(id, base64);
}

export async function getImageBlob(id: string): Promise<Blob | null> {
  if (Platform.OS === "web") {
    return getImageBlobWeb(id);
  }
  return null;
}

export async function getImageUrl(id: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return getImageUrlWeb(id);
  }
  return getImageUrlNative(id);
}

export async function imageExists(id: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return imageExistsWeb(id);
  }
  return imageExistsNative(id);
}
