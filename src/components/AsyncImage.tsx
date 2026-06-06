import { useEffect, useState } from "react";
import { Image, View, Text } from "react-native";
import { getImageBlob } from "../services/imageStore";

export function AsyncImage({ uri, style }: { uri: string; style?: any }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uri) { setLoading(false); return; }

    if (uri.startsWith("idx://")) {
      const id = uri.replace("idx://", "");
      getImageBlob(id)
        .then((blob) => {
          if (blob) setSrc(URL.createObjectURL(blob));
          else setError(true);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else if (uri.startsWith("http") || uri.startsWith("data:") || uri.startsWith("blob:") || uri.startsWith("file:")) {
      setSrc(uri);
      setLoading(false);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [uri]);

  if (loading) {
    return <View style={[{ backgroundColor: "#f0eeec", justifyContent: "center", alignItems: "center" }, style]} />;
  }

  if (error || !src) {
    return (
      <View style={[{ backgroundColor: "#f0eeec", justifyContent: "center", alignItems: "center" }, style]}>
        <Text style={{ fontSize: 10, color: "#ccc" }}>📷</Text>
      </View>
    );
  }

  return <Image source={{ uri: src }} style={style} resizeMode="cover" />;
}
