import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function ArchiveScreen() {
  const router = useRouter();
  const restoreItem = useClothingStore((s) => s.restoreItem);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const [archived, setArchived] = useState<Clothing[]>([]);

  const load = async () => {
    const items = await useClothingStore.getState().getArchived();
    setArchived(items);
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={S.container}>
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={S.headerTitle}>回收站</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={S.subtitle}>{archived.length} 件已归档衣物</Text>

      <FlatList
        data={archived}
        numColumns={2}
        style={{ flex: 1 }}
        contentContainerStyle={S.grid}
        renderItem={({ item }: { item: Clothing }) => (
          <View style={S.item}>
            <AsyncImage uri={item.imageUri} style={S.image} />
            <View style={S.overlay}>
              <Text style={S.name} numberOfLines={1}>{item.name || "未命名"}</Text>
              <Text style={S.date}>{new Date(item.updatedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} 删除</Text>
            </View>
            <Pressable
              style={S.restoreBtn}
              onPress={() => {
                Alert.alert("恢复衣物", `确定恢复 "${item.name || "未命名"}" 吗？`, [
                  { text: "取消", style: "cancel" },
                  { text: "恢复", onPress: async () => { await restoreItem(item.id); await load(); await loadClothing(); } },
                ]);
              }}
            >
              <Ionicons name="refresh" size={14} color={Colors.accent} />
              <Text style={S.restoreText}>恢复</Text>
            </Pressable>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={S.empty}>
            <Ionicons name="archive-outline" size={48} color={Colors.textTertiary} />
            <Text style={S.emptyText}>回收站是空的</Text>
            <Text style={S.emptyHint}>删除的衣物会在这里保留</Text>
          </View>
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },

  subtitle: { fontSize: FontSize.base, color: Colors.textTertiary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },

  grid: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  item: {
    flex: 1,
    margin: 6,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    position: "relative",
    opacity: 0.7,
  },
  image: { width: "100%", aspectRatio: 0.85, backgroundColor: Colors.surfaceHighlight },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  name: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: "500" },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  restoreBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  restoreText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: "600" },

  empty: { alignItems: "center", paddingVertical: 120 },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
});
