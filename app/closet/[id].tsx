import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

export default function ClothingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useClothingStore((s) => s.items.find((i) => i.id === id));
  const categories = useClothingStore((s) => s.categories);
  const updateItem = useClothingStore((s) => s.updateItem);
  const deleteItem = useClothingStore((s) => s.deleteItem);

  if (!item) return <View style={S.centered}><Text style={{ color: Colors.textTertiary }}>衣物不存在</Text></View>;

  const cat = categories.find((c) => c.id === item.categoryId);

  return (
    <View style={S.container}>
      <AsyncImage uri={item.imageUri} style={S.image} />

      {/* Close & Favorite */}
      <Pressable style={S.closeBtn} onPress={() => router.back()}><Ionicons name="close" size={22} color={Colors.textPrimary} /></Pressable>
      <Pressable style={S.favBtn} onPress={() => updateItem(id!, { favorite: item.favorite ? 0 : 1 })}>
        <Ionicons name={item.favorite ? "heart" : "heart-outline"} size={24} color={item.favorite ? Colors.danger : Colors.textPrimary} />
      </Pressable>

      <View style={S.info}>
        <View style={S.titleRow}>
          <Text style={S.cat}>{cat?.icon} {cat?.name}</Text>
          <Text style={S.name}>{item.name || "未命名"}</Text>
        </View>
        {item.season ? <View style={S.tag}><Text style={S.tagText}>{item.season}季</Text></View> : null}
      </View>

      <View style={S.actions}>
        <Pressable style={S.deleteBtn} onPress={() => {
          Alert.alert("删除", "确定删除这件衣物？", [
            { text: "取消", style: "cancel" },
            { text: "删除", style: "destructive", onPress: async () => { await deleteItem(id!); router.back(); } },
          ]);
        }}>
          <Text style={S.deleteText}>删除</Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },
  image: { width: "100%", height: "55%", backgroundColor: Colors.surface },
  closeBtn: { position: "absolute", top: 56, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" },
  favBtn: { position: "absolute", top: 56, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" },
  info: { padding: Spacing.xl, flex: 1 },
  titleRow: { marginBottom: Spacing.md },
  cat: { fontSize: FontSize.sm, color: Colors.accent, marginBottom: 4 },
  name: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  tag: { alignSelf: "flex-start", backgroundColor: Colors.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  tagText: { fontSize: FontSize.sm, color: Colors.accent },
  actions: { padding: Spacing.xl, paddingTop: 0 },
  deleteBtn: { alignItems: "center", paddingVertical: 14, minHeight: TouchMin, justifyContent: "center" },
  deleteText: { color: Colors.textTertiary, fontSize: FontSize.base },
});
