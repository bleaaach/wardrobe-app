import { View, Text, FlatList, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

export default function ClosetScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => { loadClothing(); }, []);

  const filtered = selectedCat ? items.filter((i) => i.categoryId === selectedCat) : items;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name || "";

  return (
    <View style={S.container}>
      {/* Category Chips */}
      <FlatList
        horizontal
        data={[{ id: null as any, name: "全部", icon: "📋" }, ...categories]}
        showsHorizontalScrollIndicator={false}
        style={S.catList}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
        renderItem={({ item }) => {
          const active = selectedCat === item.id;
          return (
            <Pressable
              style={[S.chip, active && S.chipActive]}
              onPress={() => setSelectedCat(active ? null : item.id)}
            >
              <Text style={[S.chipText, active && S.chipTextActive]}>{item.icon} {item.name}</Text>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id || "all"}
      />

      {/* Grid */}
      <FlatList
        data={filtered}
        numColumns={3}
        contentContainerStyle={S.grid}
        renderItem={({ item }: { item: Clothing }) => (
          <Pressable style={S.item} onPress={() => router.push(`/closet/${item.id}`)}>
            <Image source={{ uri: item.imageUri }} style={S.image} />
            <Text style={S.name} numberOfLines={1}>{item.name || catName(item.categoryId)}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={S.emptyIcon}>👗</Text>
            <Text style={S.emptyText}>衣橱空空</Text>
            <Pressable style={S.addBtn} onPress={() => router.push("/closet/add")}>
              <Text style={S.addBtnText}>添加第一件</Text>
            </Pressable>
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={S.fab} onPress={() => router.push("/closet/add")}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  catList: { maxHeight: 52, marginVertical: Spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, minHeight: TouchMin, justifyContent: "center" },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textInverse, fontWeight: "600" },
  grid: { paddingHorizontal: Spacing.sm, paddingBottom: 100 },
  item: { flex: 1, margin: 4, backgroundColor: Colors.surface, borderRadius: Radius.md, overflow: "hidden" },
  image: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.border },
  name: { fontSize: FontSize.xs, color: Colors.textSecondary, padding: 6, textAlign: "center" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: Colors.textTertiary, marginBottom: Spacing.lg },
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, minHeight: TouchMin, justifyContent: "center" },
  addBtnText: { color: Colors.textInverse, fontWeight: "600", fontSize: FontSize.base },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, justifyContent: "center", alignItems: "center", elevation: 4, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
