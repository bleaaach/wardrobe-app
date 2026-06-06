import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getDatabase } from "../../src/db/database";
import { Outfit } from "../../src/types";

export default function OutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  useEffect(() => { loadOutfits(); }, []);
  const loadOutfits = async () => {
    const db = await getDatabase();
    const data = await db.getAllAsync<Outfit>("SELECT * FROM outfits WHERE deleted = 0 ORDER BY created_at DESC");
    setOutfits(data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={outfits}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/outfits/${item.id}`)}>
            <View style={styles.cardPreview}>
              <Ionicons name="layers" size={40} color="#6366f1" />
            </View>
            <Text style={styles.cardName}>{item.name || "搭配"}</Text>
            <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>还没有创建搭配</Text>
            <Pressable style={styles.createBtn} onPress={() => router.push("/outfits/create")}>
              <Text style={styles.createBtnText}>+ 创建第一个搭配</Text>
            </Pressable>
          </View>
        }
      />
      <Pressable style={styles.fab} onPress={() => router.push("/outfits/create")}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  grid: { padding: 12 },
  card: { flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 16, padding: 12 },
  cardPreview: { height: 120, backgroundColor: "#f3f4f6", borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  cardName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#9ca3af", marginBottom: 16 },
  createBtn: { backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  createBtnText: { color: "#fff", fontWeight: "600" },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center", elevation: 6 },
});
