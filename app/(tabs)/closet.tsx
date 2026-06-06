import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity, Shadows } from "../../src/design/tokens";

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
      {/* Magazine Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Closet</Text>
        <Text style={S.headerSub}>{items.length} 件衣物 · {categories.length} 个分类</Text>
      </View>

      {/* Category Stories */}
      <FlatList
        horizontal
        data={[{ id: null as any, name: "全部", icon: "✦" }, ...categories]}
        showsHorizontalScrollIndicator={false}
        style={S.catList}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}
        renderItem={({ item }) => {
          const active = selectedCat === item.id;
          return (
            <Pressable
              style={[S.catCard, active && S.catCardActive]}
              onPress={() => setSelectedCat(active ? null : item.id)}
            >
              <View style={[S.catRing, active && S.catRingActive]}>
                <Text style={S.catIcon}>{item.icon}</Text>
              </View>
              <Text style={[S.catName, active && S.catNameActive]}>{item.name}</Text>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id || "all"}
      />

      {/* Large Image Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        style={{ flex: 1 }}
        contentContainerStyle={S.grid}
        renderItem={({ item }: { item: Clothing }) => (
          <Pressable style={({ pressed }) => [S.item, pressed && S.itemPressed]} onPress={() => router.push(`/closet/${item.id}`)}>
            <AsyncImage uri={item.imageUri} style={S.image} />
            <View style={S.itemOverlay}>
              <Text style={S.itemName} numberOfLines={1}>{item.name || catName(item.categoryId)}</Text>
            </View>
            {item.favorite === 1 && (
              <View style={S.favBadge}>
                <Ionicons name="heart" size={12} color={Colors.danger} />
              </View>
            )}
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="👗"
            title="衣橱空空"
            action={{ label: "添加第一件", onPress: () => router.push("/closet/add") }}
          />
        }
      />

      <Pressable style={S.fab} onPress={() => router.push("/closet/add")}>
        <Ionicons name="add" size={26} color={Colors.textInverse} />
      </Pressable>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  headerTitle: { fontSize: 42, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -1.5, lineHeight: 48 },
  headerSub: { fontSize: FontSize.base, color: Colors.textTertiary, marginTop: Spacing.xs },

  // Category Stories (Instagram style with ring)
  catList: { maxHeight: 110, marginBottom: Spacing.md },
  catCard: { alignItems: "center", gap: 6 },
  catCardActive: {},
  catRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  catRingActive: {
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  catIcon: { fontSize: 28 },
  catName: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "500" },
  catNameActive: { color: Colors.accent, fontWeight: "600" },

  // Grid
  grid: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  item: {
    flex: 1,
    margin: 6,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    position: "relative",
    ...Shadows.sm,
  },
  itemPressed: { opacity: PressedOpacity },
  image: { width: "100%", aspectRatio: 0.85, backgroundColor: Colors.surfaceHighlight },
  itemOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  itemName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: "500" },
  favBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
});
