import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { IconButton } from "../../src/components/ui/IconButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

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
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <View style={S.imageWrap}>
        <AsyncImage uri={item.imageUri} style={S.image} />
        <View style={S.overlayActions}>
          <IconButton name="close" onPress={() => router.back()} />
          <IconButton
            name={item.favorite ? "heart" : "heart-outline"}
            color={item.favorite ? Colors.danger : Colors.textPrimary}
            onPress={() => updateItem(id!, { favorite: item.favorite ? 0 : 1 })}
          />
        </View>
      </View>

      <View style={S.info}>
        <View style={S.titleRow}>
          <Text style={S.cat}>{cat?.icon} {cat?.name}</Text>
          <Text style={S.name}>{item.name || "未命名"}</Text>
        </View>
        {item.season ? (
          <View style={S.tagRow}>
            <View style={S.tag}><Text style={S.tagText}>{item.season}季</Text></View>
          </View>
        ) : null}
      </View>

      <View style={S.actions}>
        <Pressable
          style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}
          onPress={() => {
            Alert.alert("删除", "确定删除这件衣物？", [
              { text: "取消", style: "cancel" },
              { text: "删除", style: "destructive", onPress: async () => { await deleteItem(id!); router.back(); } },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
          <Text style={S.deleteText}>删除</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },
  imageWrap: { position: "relative", width: "100%", height: "50%" },
  image: { width: "100%", height: "100%", backgroundColor: Colors.surface },
  overlayActions: { position: "absolute", top: 48, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  info: { padding: Spacing.xxl, flex: 1 },
  titleRow: { marginBottom: Spacing.md },
  cat: { fontSize: FontSize.sm, color: Colors.accent, marginBottom: 4, fontWeight: "500" },
  name: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tag: { alignSelf: "flex-start", backgroundColor: Colors.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  tagText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "500" },
  actions: { padding: Spacing.xxl, paddingTop: 0 },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, minHeight: TouchMin, borderRadius: Radius.lg, backgroundColor: Colors.surface },
  pressed: { opacity: PressedOpacity },
  deleteText: { color: Colors.textTertiary, fontSize: FontSize.base, fontWeight: "500" },
});
