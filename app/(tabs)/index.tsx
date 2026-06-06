import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const today = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });

  const favorites = items.filter((i) => i.favorite === 1).slice(0, 4);
  const recentItems = items.slice(0, 8);

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={S.header}>
        <Text style={S.greeting}>衣橱</Text>
        <Text style={S.date}>{today}</Text>
      </View>

      {/* If empty */}
      {items.length === 0 ? (
        <View style={S.emptyState}>
          <Text style={S.emptyIcon}>👗</Text>
          <Text style={S.emptyTitle}>开始构建你的衣橱</Text>
          <Text style={S.emptySub}>拍照添加第一件衣物</Text>
          <Pressable style={S.emptyCTA} onPress={() => router.push("/closet/add")}>
            <Ionicons name="camera" size={20} color={Colors.textInverse} />
            <Text style={S.emptyCTAText}>添加衣物</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Quick Stats */}
          <View style={S.statsRow}>
            <Pressable style={S.statCard} onPress={() => router.push("/closet")}>
              <Text style={S.statNum}>{items.length}</Text>
              <Text style={S.statLabel}>件衣物</Text>
            </Pressable>
            <Pressable style={S.statCard} onPress={() => router.push("/outfits")}>
              <Ionicons name="layers" size={24} color={Colors.accent} />
              <Text style={S.statLabel}>搭配</Text>
            </Pressable>
            <Pressable style={S.statCard} onPress={() => router.push("/calendar")}>
              <Ionicons name="calendar" size={24} color={Colors.accent} />
              <Text style={S.statLabel}>日历</Text>
            </Pressable>
          </View>

          {/* Favorites */}
          {favorites.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>收藏</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.hScroll}>
                {favorites.map((item) => (
                  <Pressable key={item.id} style={S.favItem} onPress={() => router.push(`/closet/${item.id}`)}>
                    <AsyncImage uri={item.imageUri} style={S.favImage} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recent Clothing */}
          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>全部衣物</Text>
              <Pressable onPress={() => router.push("/closet")}>
                <Text style={S.seeAll}>查看全部</Text>
              </Pressable>
            </View>
            <View style={S.grid}>
              {recentItems.map((item) => (
                <Pressable key={item.id} style={S.gridItem} onPress={() => router.push(`/closet/${item.id}`)}>
                  <AsyncImage uri={item.imageUri} style={S.gridImage} />
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  greeting: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.5 },
  date: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 4 },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: Spacing.xxxl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 6, marginBottom: Spacing.xl },
  emptyCTA: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, minHeight: TouchMin },
  emptyCTAText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: "center", minHeight: TouchMin * 2 },
  statNum: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.accent },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "500" },

  // Favorites
  hScroll: { paddingLeft: Spacing.xl },
  favItem: { marginRight: Spacing.md, borderRadius: Radius.lg, overflow: "hidden" },
  favImage: { width: 80, height: 100, backgroundColor: Colors.border, borderRadius: Radius.lg },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.md },
  gridItem: { width: "25%", padding: 4 },
  gridImage: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.border, borderRadius: Radius.md },
});
