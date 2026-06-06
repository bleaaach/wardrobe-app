import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { getImageBlob } from "../services/imageStore";

/**
 * Image wrapper that supports IndexedDB-stored images.
 * If URI starts with "idx://", loads from IndexedDB as Blob URL.
 * Otherwise passes through to standard Image.
 */
export function AsyncImage({ uri, style }: { uri: string; style?: any }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uri) { setLoading(false); return; }

    if (uri.startsWith("idx://")) {
      const id = uri.replace("idx://", "");
      getImageBlob(id).then((blob) => {
        if (blob) {
          setSrc(URL.createObjectURL(blob));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setSrc(uri);
      setLoading(false);
    }
  }, [uri]);

  if (loading) {
    return <View style={[{ backgroundColor: "#f0eeec" }, style]} />;
  }

  return <Image source={{ uri: src || uri }} style={style} />;
}
