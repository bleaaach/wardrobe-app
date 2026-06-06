import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getOutfits, deleteOutfit, getAllClothing } from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

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

  if (!outfit) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#9ca3af" }}>搭配不存在</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{outfit.name || "未命名搭配"}</Text>
      <Text style={styles.date}>{new Date(outfit.createdAt).toLocaleDateString("zh-CN")}</Text>
      <Text style={styles.section}>包含衣物 ({items.length}件)</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable key={item.id} style={styles.item} onPress={() => router.push(`/closet/${item.id}`)}>
            <AsyncImage uri={item.imageUri} style={styles.itemImage} />
            <Text style={styles.itemName} numberOfLines={1}>{item.name || "未命名"}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.deleteBtn} onPress={() => {
        Alert.alert("删除搭配", "确定要删除吗？", [
          { text: "取消", style: "cancel" },
          { text: "删除", style: "destructive", onPress: async () => { await deleteOutfit(id!); router.back(); } },
        ]);
      }}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
        <Text style={styles.deleteText}>删除搭配</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, paddingBottom: 40 },
  name: { fontSize: 24, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  section: { fontSize: 15, fontWeight: "600", color: "#374151", marginTop: 20, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  item: { width: "31%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  itemImage: { width: "100%", aspectRatio: 0.8, backgroundColor: "#f3f4f6" },
  itemName: { fontSize: 11, color: "#6b7280", padding: 6, textAlign: "center" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24, padding: 14, borderRadius: 12, backgroundColor: "#fff" },
  deleteText: { color: "#ef4444", fontSize: 15 },
});
