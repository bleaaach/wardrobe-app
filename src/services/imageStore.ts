/**
 * IndexedDB-based image store for Blob data.
 * Can store gigabytes of binary data, persists across browser sessions.
 */

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

export async function storeImage(id: string, base64: string): Promise<void> {
  const db = await openDB();
  // Convert base64 to Blob
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

export async function getImageBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readonly");
    const req = txn.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
    txn.oncomplete = () => db.close();
  });
}

/** Get a Blob URL for an image (cached in memory after first load) */
const urlCache = new Map<string, string>();
export async function getImageUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const blob = await getImageBlob(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export async function imageExists(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve) => {
    const txn = db.transaction(STORE_NAME, "readonly");
    const req = txn.objectStore(STORE_NAME).count(id);
    req.onsuccess = () => resolve(req.result > 0);
    req.onerror = () => resolve(false);
    txn.oncomplete = () => db.close();
  });
}
