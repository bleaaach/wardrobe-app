import { View, Text, Pressable, StyleSheet } from "react-native";
import { AsyncImage } from "./AsyncImage";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../design/tokens";

interface Props {
  imageUri: string;
  name?: string;
  category?: string;
  selected?: boolean;
  onPress?: () => void;
  onFavorite?: () => void;
  favorite?: boolean;
}

export function ClothingCard({ imageUri, name, category, selected, onPress, favorite, onFavorite }: Props) {
  return (
    <Pressable style={({ pressed }) => [S.card, selected && S.selected, pressed && S.pressed]} onPress={onPress}>
      <AsyncImage uri={imageUri} style={S.image} />
      {name ? <Text style={S.name} numberOfLines={1}>{name}</Text> : null}
      {category ? <Text style={S.cat}>{category}</Text> : null}
      {selected !== undefined && (
        <View style={[S.check, selected && S.checkActive]}>
          {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      )}
      {onFavorite && (
        <Pressable style={S.favBtn} onPress={onFavorite} hitSlop={8}>
          <Ionicons name={favorite ? "heart" : "heart-outline"} size={18} color={favorite ? Colors.danger : Colors.textTertiary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const S = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, overflow: "hidden", minHeight: TouchMin },
  selected: { borderWidth: 2, borderColor: Colors.accent, borderRadius: Radius.md },
  pressed: { opacity: PressedOpacity },
  image: { width: "100%", aspectRatio: 0.75, backgroundColor: Colors.surfaceHighlight },
  name: { fontSize: FontSize.xs, color: Colors.textPrimary, paddingHorizontal: 6, paddingTop: 6 },
  cat: { fontSize: FontSize.xs, color: Colors.textTertiary, paddingHorizontal: 6, paddingBottom: 6 },
  check: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.textTertiary, justifyContent: "center", alignItems: "center" },
  checkActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  favBtn: { position: "absolute", top: 4, left: 4, padding: 4 },
});
