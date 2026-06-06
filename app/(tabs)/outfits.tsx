import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getOutfits } from "../../src/db/database";
import { Outfit } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

export default function OutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  useEffect(() => { (async () => setOutfits(await getOutfits()))(); }, []);

  return (
    <View style={S.container}>
      <FlatList
        data={outfits}
        numColumns={2}
        contentContainerStyle={S.grid}
        renderItem={({ item }) => (
          <Pressable style={S.card} onPress={() => router.push(`/outfits/${item.id}`)}>
            <View style={S.preview}><Ionicons name="layers" size={36} color={Colors.accentMuted} /></View>
            <Text style={S.name} numberOfLines={1}>{item.name || "搭配"}</Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={S.emptyIcon}>👔</Text>
            <Text style={S.emptyText}>还没有搭配</Text>
            <Pressable style={S.cta} onPress={() => router.push("/outfits/create")}>
              <Text style={S.ctaText}>创建搭配</Text>
            </Pressable>
          </View>
        }
      />
      <Pressable style={S.fab} onPress={() => router.push("/outfits/create")}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  grid: { padding: Spacing.md, paddingBottom: 100 },
  card: { flex: 1, margin: 4, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md },
  preview: { aspectRatio: 0.8, backgroundColor: Colors.bg, borderRadius: Radius.md, justifyContent: "center", alignItems: "center", marginBottom: Spacing.sm },
  name: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: "500" },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: Colors.textTertiary, marginBottom: Spacing.lg },
  cta: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, minHeight: TouchMin, justifyContent: "center" },
  ctaText: { color: Colors.textInverse, fontWeight: "600" },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, justifyContent: "center", alignItems: "center", elevation: 4, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
