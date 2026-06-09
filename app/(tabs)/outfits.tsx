import { View, Text, FlatList, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AsyncImage } from "../../src/components/AsyncImage";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { PageTransition } from "../../src/components/PageTransition";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getOutfits, getAllClothing } from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, Shadows } from "../../src/design/tokens";

function CollagePreview({ items }: { items: Clothing[] }) {
  const previews = items.slice(0, 4);
  const bgColors = ["#F5F2EE", "#EDE9E4", "#F0EEEC", "#E7E5E4"];
  return (
    <View style={S.collage}>
      {Array.from({ length: 4 }).map((_, i) => {
        const item = previews[i];
        return (
          <View key={i} style={[S.collagePart, { backgroundColor: item ? Colors.bg : bgColors[i] }]}>
            {item?.imageUri ? (
              <AsyncImage uri={item.imageUri} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Text style={S.collagePlaceholder}>?</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function OutfitsScreen() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(new Map());
  const isSerif = Platform.OS === "ios" ? "Georgia" : "serif";

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
    <PageTransition>
    <View style={S.container}>
      <View style={S.header}>
        <Text style={[S.headerTitle, { fontFamily: isSerif }]}>Outfits</Text>
        <Pressable style={S.addBtn} onPress={() => router.push("/outfits/create")}>
          <Text style={S.addBtnText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={outfits}
        numColumns={2}
        contentContainerStyle={S.list}
        renderItem={({ item }) => {
          const items = getOutfitItems(item);
          return (
            <Pressable style={S.card} onPress={() => router.push(`/outfits/${item.id}`)}>
              <CollagePreview items={items} />
              <Text style={S.name} numberOfLines={1}>{item.name || "????????"}</Text>
              <Text style={S.meta}>{items.length} ?????</Text>
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            icon="layers-outline"
            title="????????"
            action={{ label: "??????", onPress: () => router.push("/outfits/create") }}
          />
        }
      />
    </View>
    </PageTransition>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 56,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 42, fontStyle: "italic", fontWeight: "600", color: Colors.textPrimary, lineHeight: 48 },
  addBtn: { width: 48, height: 48, backgroundColor: Colors.textPrimary, borderRadius: 24, justifyContent: "center", alignItems: "center", marginTop: 4 },
  addBtnText: { color: "#fff", fontSize: 28, fontWeight: "300" },
  list: { paddingHorizontal: 14, paddingBottom: 120, gap: 4 },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    ...Shadows.sm,
  },
  collage: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  collagePart: {
    width: "47%",
    aspectRatio: 0.9,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  collagePlaceholder: { fontSize: 14, fontWeight: "700", color: Colors.textTertiary },
  name: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginBottom: 2 },
  meta: { fontSize: 12, color: Colors.textSecondary },
});
