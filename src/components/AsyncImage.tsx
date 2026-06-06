import { useEffect, useState } from "react";
import { Image, View, ActivityIndicator, Text } from "react-native";
import { Colors } from "../design/tokens";

const urlCache = new Map<string, string>();

function loadFromIDB(id: string): Promise<string> {
  if (urlCache.has(id)) return Promise.resolve(urlCache.get(id)!);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open("WardrobeImages", 1);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("images")) { db.close(); return reject(new Error("no store")); }
      const txn = db.transaction("images", "readonly");
      const getReq = txn.objectStore("images").get(id);
      getReq.onsuccess = () => {
        const blob = getReq.result?.blob;
        if (blob) {
          const url = URL.createObjectURL(blob);
          urlCache.set(id, url);
          resolve(url);
        } else {
          reject(new Error("not found"));
        }
      };
      getReq.onerror = () => reject(getReq.error);
      txn.oncomplete = () => db.close();
    };
    req.onerror = () => reject(req.error);
  });
}

export function AsyncImage({ uri, style }: { uri: string; style?: any }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uri || uri === "placeholder") { setLoading(false); return; }
    if (uri.startsWith("idx://")) {
      loadFromIDB(uri.replace("idx://", ""))
        .then(setSrc)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (uri.startsWith("http") || uri.startsWith("data:") || uri.startsWith("blob:") || uri.startsWith("file:")) {
      setSrc(uri);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [uri]);

  if (loading) {
    return (
      <View style={[{ backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }, style]}>
        <ActivityIndicator size="small" color={Colors.textTertiary} />
      </View>
    );
  }
  if (!src) {
    return (
      <View style={[{ backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }, style]}>
        <Text style={{ fontSize: 10, color: Colors.textTertiary }}>📷</Text>
      </View>
    );
  }
  return <Image source={{ uri: src }} style={style} resizeMode="cover" />;
}
