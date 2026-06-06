import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { OutfitPreview } from "../../src/components/OutfitPreview";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getOutfits, getAllClothing } from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity, Shadows } from "../../src/design/tokens";

export default function OutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(new Map());

  useEffect(() => {
    (async () => {
      const [os, all] = await Promise.all([getOutfits(), getAllClothing()]);
      setOutfits(os);
      const map = new Map<string, Clothing>();
      for (const c of all) map.set(c.id, c);
      setClothingMap(map);
    })();
  }, []);

  const getOutfitItems = (o: Outfit) => {
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    return ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
  };

  return (
    <View style={S.container}>
      {/* Magazine Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>My Looks</Text>
        <Text style={S.headerSub}>{outfits.length} 套搭配</Text>
      </View>

      <FlatList
        data={outfits}
        style={{ flex: 1 }}
        contentContainerStyle={S.list}
        renderItem={({ item }) => {
          const items = getOutfitItems(item);
          return (
            <Pressable
              style={({ pressed }) => [S.card, pressed && S.cardPressed]}
              onPress={() => router.push(`/outfits/${item.id}`)}
            >
              <OutfitPreview items={items} size={140} />
              <View style={S.cardInfo}>
                <Text style={S.name} numberOfLines={1}>{item.name || "未命名搭配"}</Text>
                <Text style={S.meta}>{items.length} 件衣物 · {new Date(item.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</Text>
              </View>
              <View style={S.arrow}>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </View>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="👔"
            title="还没有搭配"
            action={{ label: "创建搭配", onPress: () => router.push("/outfits/create") }}
          />
        }
      />

      <Pressable style={S.fab} onPress={() => router.push("/outfits/create")}>
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

  list: { paddingHorizontal: Spacing.xl, paddingBottom: 120, gap: Spacing.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardPressed: { opacity: PressedOpacity },
  cardInfo: { flex: 1, marginLeft: Spacing.lg },
  name: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  meta: { fontSize: FontSize.sm, color: Colors.textTertiary },
  arrow: { marginLeft: Spacing.sm },

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
