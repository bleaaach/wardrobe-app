import { View, Text, Image, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";

export default function ClothingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useClothingStore((s) => s.items.find((i) => i.id === id));
  const categories = useClothingStore((s) => s.categories);
  const updateItem = useClothingStore((s) => s.updateItem);
  const deleteItem = useClothingStore((s) => s.deleteItem);

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#9ca3af" }}>衣物不存在</Text>
      </View>
    );
  }

  const catName = categories.find((c) => c.id === item.categoryId)?.name || "未分类";
  const catIcon = categories.find((c) => c.id === item.categoryId)?.icon || "👕";

  const handleDelete = () => {
    Alert.alert("删除衣物", "确定要删除吗？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => { await deleteItem(id!); router.back(); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: item.imageUri }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.header}>
          <View>
            <Text style={styles.cat}>{catIcon} {catName}</Text>
            <Text style={styles.name}>{item.name || "未命名"}</Text>
          </View>
          <Pressable onPress={() => updateItem(id!, { favorite: item.favorite ? 0 : 1 })}>
            <Ionicons name={item.favorite ? "star" : "star-outline"} size={28} color={item.favorite ? "#f59e0b" : "#d1d5db"} />
          </Pressable>
        </View>
        <View style={styles.tags}>
          {item.brand ? <View style={styles.tag}><Text style={styles.tagText}>🏷 {item.brand}</Text></View> : null}
          {item.color ? <View style={styles.tag}><Text style={styles.tagText}>🎨 {item.color}</Text></View> : null}
          {item.season ? <View style={styles.tag}><Text style={styles.tagText}>📅 {item.season}</Text></View> : null}
        </View>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        <Text style={styles.date}>添加于 {new Date(item.createdAt).toLocaleDateString("zh-CN")}</Text>
      </View>
      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
        <Text style={styles.deleteText}>删除</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { paddingBottom: 40 },
  image: { width: "100%", height: 360, backgroundColor: "#e5e7eb" },
  info: { backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  cat: { fontSize: 14, color: "#6366f1", marginBottom: 4 },
  name: { fontSize: 22, fontWeight: "700", color: "#111827" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: { backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: 13, color: "#6b7280" },
  notes: { fontSize: 14, color: "#6b7280", marginBottom: 12, lineHeight: 20 },
  date: { fontSize: 12, color: "#9ca3af" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, margin: 16, padding: 14, borderRadius: 12, backgroundColor: "#fff" },
  deleteText: { color: "#ef4444", fontSize: 15 },
});
