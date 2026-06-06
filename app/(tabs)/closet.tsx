import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { useEffect, useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity, Shadows } from "../../src/design/tokens";

const SIDEBAR_WIDTH = 84;

export default function ClosetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subCat?: string }>();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const loadClothing = useClothingStore((s) => s.loadClothing);

  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<"parents" | "subs">("parents");

  useEffect(() => { loadClothing(); }, []);

  // Handle sub-cat filter from sub-category page
  useEffect(() => {
    if (params.subCat) {
      const pid = parentOf.get(params.subCat) || null;
      setSelectedParent(pid);
      setSelectedSub(params.subCat);
      if (pid) setSidebarMode("subs");
    }
  }, [params.subCat]);

  const { parents, subsByParent, parentOf } = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    const subsByParent = new Map<string, typeof categories>();
    const parentOf = new Map<string, string>();
    for (const p of parents) {
      const subs = categories.filter((c) => c.parentId === p.id).sort((a, b) => a.sortOrder - b.sortOrder);
      subsByParent.set(p.id, subs);
      for (const s of subs) parentOf.set(s.id, p.id);
    }
    return { parents, subsByParent, parentOf };
  }, [categories]);

  const filtered = useMemo(() => {
    if (selectedSub) return items.filter((i) => i.categoryId === selectedSub);
    if (selectedParent) {
      const subIds = new Set((subsByParent.get(selectedParent) || []).map((c) => c.id));
      return items.filter((i) => subIds.has(i.categoryId));
    }
    return items;
  }, [items, selectedParent, selectedSub, subsByParent]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name || "";

  const sidebarData = useMemo(() => {
    if (sidebarMode === "parents") {
      return [{ id: "all", name: "全部" }, ...parents];
    }
    // subs mode
    const subs = subsByParent.get(selectedParent!) || [];
    return [{ id: "__all__", name: "全部" }, ...subs];
  }, [sidebarMode, parents, subsByParent, selectedParent]);

  const activeSidebarId = useMemo(() => {
    if (sidebarMode === "parents") {
      return selectedParent || "all";
    }
    return selectedSub || "__all__";
  }, [sidebarMode, selectedParent, selectedSub]);

  const handleSidebarPress = (id: string) => {
    if (sidebarMode === "parents") {
      if (id === "all") {
        setSelectedParent(null);
        setSelectedSub(null);
      } else {
        setSelectedParent(id);
        setSelectedSub(null);
        setSidebarMode("subs");
      }
    } else {
      if (id === "__all__") {
        setSelectedSub(null);
      } else {
        setSelectedSub(id);
      }
    }
  };

  const handleBackToParents = () => {
    setSidebarMode("parents");
    setSelectedParent(null);
    setSelectedSub(null);
  };

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Closet</Text>
        <Text style={S.headerSub}>{items.length} 件衣物 · {categories.filter((c) => c.parentId).length} 个分类</Text>
      </View>

      {/* Sidebar + Content */}
      <View style={S.body}>
        {/* Left Sidebar */}
        <View style={S.sidebar}>
          {sidebarMode === "subs" && (
            <Pressable style={S.backBtn} onPress={handleBackToParents}>
              <Ionicons name="chevron-back" size={18} color={Colors.accent} />
              <Text style={S.backText}>返回</Text>
            </Pressable>
          )}
          <FlatList
            data={sidebarData}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: Spacing.sm }}
            renderItem={({ item }) => {
              const active = activeSidebarId === item.id;
              return (
                <Pressable
                  style={[S.sidebarItem, active && S.sidebarItemActive]}
                  onPress={() => handleSidebarPress(item.id)}
                >
                  {active && <View style={S.sidebarIndicator} />}
                  <Text style={[S.sidebarText, active && S.sidebarTextActive]} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* Right Content */}
        <View style={S.content}>
          {/* Grid */}
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
        </View>
      </View>

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

  body: { flex: 1, flexDirection: "row" },

  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  backBtn: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 2,
  },
  backText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.accent,
  },
  sidebarItem: {
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    position: "relative",
  },
  sidebarItemActive: {
    backgroundColor: Colors.bg,
  },
  sidebarIndicator: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: Colors.accent,
  },
  sidebarText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  sidebarTextActive: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  content: { flex: 1 },

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
