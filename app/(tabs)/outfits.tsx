import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getOutfits } from "../../src/db/database";
import { Outfit } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity, Shadows } from "../../src/design/tokens";

export default function OutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  useEffect(() => { (async () => setOutfits(await getOutfits()))(); }, []);

  return (
    <View style={S.container}>
      <View style={S.header}>
        <Text style={S.headerTitle}>搭配方案</Text>
        <Text style={S.headerSub}>{outfits.length} 个搭配</Text>
      </View>

      <FlatList
        data={outfits}
        numColumns={2}
        contentContainerStyle={S.grid}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [S.card, pressed && S.cardPressed]} onPress={() => router.push(`/outfits/${item.id}`)}>
            <View style={S.preview}>
              <Ionicons name="layers" size={40} color={Colors.accentMuted} />
            </View>
            <View style={S.cardContent}>
              <Text style={S.name} numberOfLines={1}>{item.name || "搭配"}</Text>
              <Text style={S.date}>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</Text>
            </View>
          </Pressable>
        )}
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
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: FontSize.base, color: Colors.textTertiary, marginTop: 4 },

  grid: { padding: Spacing.md, paddingBottom: 120 },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardPressed: { opacity: PressedOpacity },
  preview: { aspectRatio: 1, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" },
  cardContent: { padding: Spacing.md },
  name: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: "600" },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },

  fab: {
    position: "absolute",
    bottom: 24,
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
