import { View, Text, FlatList, Pressable, Image, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Clothing } from "../../src/types";

export default function ClosetScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadClothing(); }, []);

  const filtered = items.filter((i) => {
    if (selectedCat && i.categoryId !== selectedCat) return false;
    if (search && !(i.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catName = (id: string) => categories.find((c) => c.id === id)?.name || "未分类";

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="搜索衣物..." value={search} onChangeText={setSearch} />
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={[{ id: null, name: "全部", icon: "📋" } as any, ...categories]}
        showsHorizontalScrollIndicator={false}
        style={styles.catList}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.catChip, selectedCat === item.id && styles.catChipActive]}
            onPress={() => setSelectedCat(item.id)}
          >
            <Text style={styles.catIcon}>{item.icon}</Text>
            <Text style={[styles.catName, selectedCat === item.id && styles.catNameActive]}>{item.name}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id || "all"}
      />

      {/* Clothing Grid */}
      <FlatList
        data={filtered}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }: { item: Clothing }) => (
          <Pressable style={styles.item} onPress={() => router.push(`/closet/${item.id}`)}>
            <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
            <Text style={styles.itemName} numberOfLines={1}>{item.name || catName(item.categoryId)}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{search ? "没有找到匹配的衣物" : "衣橱还是空的"}</Text>
            {!search && (
              <Pressable style={styles.addBtn} onPress={() => router.push("/closet/add")}>
                <Text style={styles.addBtnText}>+ 添加第一件衣物</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push("/closet/add")}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 12, paddingHorizontal: 12, backgroundColor: "#fff", borderRadius: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  catList: { maxHeight: 56, marginHorizontal: 12, marginBottom: 8 },
  catChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: "#fff" },
  catChipActive: { backgroundColor: "#6366f1" },
  catIcon: { fontSize: 14, marginRight: 4 },
  catName: { fontSize: 13, color: "#6b7280" },
  catNameActive: { color: "#fff" },
  grid: { padding: 8 },
  item: { flex: 1, margin: 4, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  itemImage: { width: "100%", aspectRatio: 0.8, backgroundColor: "#f3f4f6" },
  itemName: { fontSize: 11, color: "#6b7280", padding: 8, textAlign: "center" },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#9ca3af", marginBottom: 16 },
  addBtn: { backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  addBtnText: { color: "#fff", fontWeight: "600" },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center", elevation: 6 },
});
