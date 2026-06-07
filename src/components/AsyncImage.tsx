import { useEffect, useState, useCallback } from "react";
import { Image, View, ActivityIndicator, Text, ImageStyle, Pressable } from "react-native";
import { Colors } from "../design/tokens";
import { getImageUrl } from "../utils/imageStorage";

export function AsyncImage({
  uri,
  style,
  resizeMode = "cover",
}: {
  uri: string;
  style?: ImageStyle | ImageStyle[];
  resizeMode?: "cover" | "contain" | "stretch" | "center" | "repeat";
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setLoading(true);
    if (!uri || uri === "placeholder") {
      setLoading(false);
      return;
    }
    if (uri.startsWith("idx://")) {
      getImageUrl(uri.replace("idx://", ""))
        .then((url) => {
          if (url) setSrc(url);
          else setError(true);
        })
        .catch((err) => {
          console.error("AsyncImage load error:", err);
          setError(true);
        })
        .finally(() => setLoading(false));
    } else if (
      uri.startsWith("http") ||
      uri.startsWith("data:") ||
      uri.startsWith("blob:") ||
      uri.startsWith("file:")
    ) {
      setSrc(uri);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [uri]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View
        style={[
          {
            backgroundColor: Colors.surface,
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
      >
        <ActivityIndicator size="small" color={Colors.textTertiary} />
      </View>
    );
  }
  if (!src || error) {
    return (
      <Pressable
        onPress={load}
        style={[
          {
            backgroundColor: Colors.surface,
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
      >
        <Text style={{ fontSize: 10, color: Colors.danger }}>加载失败</Text>
      </Pressable>
    );
  }
  return <Image source={{ uri: src }} style={style} resizeMode={resizeMode} />;
}
