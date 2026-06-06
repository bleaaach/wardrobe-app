import { useEffect, useState } from "react";
import { Image, ImageProps, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props extends Omit<ImageProps, "source"> {
  uri: string;
}

/**
 * Image wrapper that supports AsyncStorage-stored base64 images.
 * If URI starts with @wardrobe/img/, loads from AsyncStorage.
 * Otherwise passes through to standard Image.
 */
export function AsyncImage({ uri, style, ...props }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uri) { setLoading(false); return; }

    if (uri.startsWith("@wardrobe/img/") || uri.startsWith("data:")) {
      // Already a data URI or stored image reference
      if (uri.startsWith("data:")) {
        setSrc(uri);
        setLoading(false);
        return;
      }
      AsyncStorage.getItem(uri).then((data) => {
        if (data) {
          setSrc(`data:image/png;base64,${data}`);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setSrc(uri);
      setLoading(false);
    }
  }, [uri]);

  if (loading) {
    return <View style={[{ backgroundColor: "#f0eeec" }, style as any]} />;
  }

  return <Image source={{ uri: src || uri }} style={style} {...props} />;
}
