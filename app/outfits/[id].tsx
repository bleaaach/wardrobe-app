import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getOutfits, deleteOutfit, getAllClothing } from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [items, setItems] = useState<Clothing[]>([]);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const all = await getOutfits();
    const o = all.find((x) => x.id === id);
    if (!o) return;
    setOutfit(o);
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    const allClothing = await getAllClothing();
    setItems(allClothing.filter((c) => ids.includes(c.id)));
  };

  if (!outfit) return <View style={S.centered}><Text style={{ color: Colors.textTertiary }}>搭配不存在</Text></View>;

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <Text style={S.name}>{outfit.name || "未命名搭配"}</Text>
      <Text style={S.date}>{new Date(outfit.createdAt).toLocaleDateString("zh-CN")}</Text>
      <Text style={S.section}>包含衣物 ({items.length}件)</Text>
      <View style={S.grid}>
        {items.map((item) => (
          <Pressable key={item.id} style={({ pressed }) => [S.item, pressed && S.pressed]} onPress={() => router.push(`/closet/${item.id}`)}>
            <AsyncImage uri={item.imageUri} style={S.itemImage} />
            <Text style={S.itemName} numberOfLines={1}>{item.name || "未命名"}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}
        onPress={() => {
          Alert.alert("删除搭配", "确定要删除吗？", [
            { text: "取消", style: "cancel" },
            { text: "删除", style: "destructive", onPress: async () => { await deleteOutfit(id!); router.back(); } },
          ]);
        }}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        <Text style={S.deleteText}>删除搭配</Text>
      </Pressable>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },
  name: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  date: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  section: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  item: { width: "31%", backgroundColor: Colors.surface, borderRadius: Radius.md, overflow: "hidden" },
  pressed: { opacity: PressedOpacity },
  itemImage: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.border },
  itemName: { fontSize: FontSize.xs, color: Colors.textSecondary, padding: 6, textAlign: "center" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: Spacing.xxxl, padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.surface, minHeight: TouchMin },
  deleteText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: "500" },
});
