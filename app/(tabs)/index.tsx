import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity, Shadows } from "../../src/design/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const today = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });

  const favorites = items.filter((i) => i.favorite === 1).slice(0, 6);
  const recentItems = items.slice(0, 8);

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Magazine Header */}
      <View style={S.header}>
        <Text style={S.date}>{today}</Text>
        <Text style={S.title}>Wardrobe</Text>
        <Text style={S.subtitle}>{items.length} 件衣物</Text>
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
          {/* Featured Hero - Large Image */}
          {recentItems.length > 0 && (
            <Pressable style={({ pressed }) => [S.hero, pressed && S.pressed]} onPress={() => router.push(`/closet/${recentItems[0].id}`)}>
              <AsyncImage uri={recentItems[0].imageUri} style={S.heroImage} />
              <View style={S.heroOverlay}>
                <Text style={S.heroLabel}>最新添加</Text>
                <Text style={S.heroName}>{recentItems[0].name || "未命名"}</Text>
              </View>
            </Pressable>
          )}

          {/* Favorites - Horizontal Stories */}
          {favorites.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>收藏精选</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.hScroll} contentContainerStyle={{ paddingRight: Spacing.xl }}>
                {favorites.map((item) => (
                  <Pressable key={item.id} style={({ pressed }) => [S.storyItem, pressed && S.pressed]} onPress={() => router.push(`/closet/${item.id}`)}>
                    <AsyncImage uri={item.imageUri} style={S.storyImage} />
                    <View style={S.storyRing} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recent Clothing - Large Grid */}
          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>全部衣物</Text>
              <Pressable onPress={() => router.push("/closet")} hitSlop={8}>
                <Text style={S.seeAll}>查看全部 →</Text>
              </Pressable>
            </View>
            <View style={S.grid}>
              {recentItems.map((item) => (
                <Pressable key={item.id} style={({ pressed }) => [S.gridItem, pressed && S.pressed]} onPress={() => router.push(`/closet/${item.id}`)}>
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

  // Magazine Header
  header: { paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  date: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 42, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -1.5, lineHeight: 48 },
  subtitle: { fontSize: FontSize.base, color: Colors.textTertiary, marginTop: Spacing.xs },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: Spacing.xxxl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg, opacity: 0.6 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 6, marginBottom: Spacing.xl },
  emptyCTA: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full, minHeight: TouchMin },
  emptyCTAText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },

  // Hero
  hero: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xxl, borderRadius: Radius.xl, overflow: "hidden", ...Shadows.md },
  pressed: { opacity: PressedOpacity },
  heroImage: { width: "100%", aspectRatio: 0.85, backgroundColor: Colors.surface },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.xl, backgroundColor: "rgba(0,0,0,0.5)" },
  heroLabel: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: "600", marginBottom: 2 },
  heroName: { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: "700" },

  // Section
  section: { marginBottom: Spacing.xxl },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "500" },

  // Stories
  hScroll: { paddingLeft: Spacing.xl },
  storyItem: { marginRight: Spacing.md, width: 80, height: 80, borderRadius: Radius.lg, overflow: "hidden", position: "relative" },
  storyImage: { width: 80, height: 80, borderRadius: Radius.lg, backgroundColor: Colors.surface },
  storyRing: { position: "absolute", top: -2, left: -2, right: -2, bottom: -2, borderRadius: Radius.lg + 2, borderWidth: 2, borderColor: Colors.accent },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.md },
  gridItem: { width: "25%", padding: 4 },
  gridImage: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.surface, borderRadius: Radius.md },
});
