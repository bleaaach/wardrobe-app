import { View, Text, FlatList, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, Shadows } from "../../src/design/tokens";
import { initDatabase } from "../../src/db/sqlite";
import storage from "../../src/utils/storage";

export default function ArchiveScreen() {
  const router = useRouter();
  const restoreItem = useClothingStore((s) => s.restoreItem);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const categories = useClothingStore((s) => s.categories);
  const [archived, setArchived] = useState<Clothing[]>([]);

  const load = async () => {
    const items = await useClothingStore.getState().getArchived();
    setArchived(items);
  };

  useEffect(() => { load(); }, []);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "";
  };

  const handleEmptyAll = () => {
    if (archived.length === 0) return;
    Alert.alert(
      "清空回收站",
      `确定要永久删除 ${archived.length} 件已归档衣物吗？此操作不可恢复。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "清空",
          style: "destructive",
          onPress: async () => {
            try {
              if (Platform.OS === "web") {
                const raw = await storage.getItem("@wardrobe/clothing");
                if (raw) {
                  const items = JSON.parse(raw);
                  const remaining = items.filter((i: any) => i.deleted !== 1);
                  await storage.setItem("@wardrobe/clothing", JSON.stringify(remaining));
                }
              } else {
                const db = await initDatabase();
                await db.runAsync(`DELETE FROM clothing WHERE deleted = 1`);
              }
              await load();
              await loadClothing();
            } catch (e) {
              Alert.alert("清空失败", String(e));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>回收站</Text>
        <Pressable onPress={handleEmptyAll} style={styles.clearBtn}>
          <Text style={styles.clearText}>清空全部</Text>
        </Pressable>
      </View>

      <FlatList
        data={archived}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 120, flexGrow: 1 }}
        ListHeaderComponent={
          <>
            <View style={[styles.binInfo, Shadows.sm]}>
              <View style={styles.binIcon}>
                <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.binTitle}>30 天后自动删除</Text>
                <Text style={styles.binDesc}>在永久删除之前，您可以随时恢复这里的衣物。</Text>
              </View>
            </View>

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionLabel}>已删除衣物</Text>
              <Text style={styles.sectionCount}>{archived.length} 件</Text>
            </View>
          </>
        }
        renderItem={({ item }: { item: Clothing }) => (
          <View style={[styles.item, Shadows.sm]}>
            {item.imageUri && item.imageUri !== "placeholder" ? (
              <AsyncImage uri={item.imageUri} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: Colors.surfaceElevated, justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.textSecondary, letterSpacing: 0.5 }}>
                  {(item.name || "未命名").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name || "未命名"}</Text>
              <Text style={styles.meta}>
                {getCategoryName(item.categoryId) || "未分类"} · {new Date(item.updatedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} 删除
              </Text>
            </View>
            <Pressable
              style={styles.restoreBtn}
              onPress={() => {
                Alert.alert("恢复衣物", `确定恢复 "${item.name || "未命名"}" 吗？`, [
                  { text: "取消", style: "cancel" },
                  { text: "恢复", onPress: async () => { await restoreItem(item.id); await load(); await loadClothing(); } },
                ]);
              }}
            >
              <Text style={styles.restoreText}>恢复</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="archive-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>回收站是空的</Text>
            <Text style={styles.emptyDesc}>删除的衣物会在这里保留</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  clearText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: "600",
  },

  binInfo: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  binIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  binTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  binDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHighlight,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  restoreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.textPrimary,
  },
  restoreText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    fontWeight: "600",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 6,
  },
});
