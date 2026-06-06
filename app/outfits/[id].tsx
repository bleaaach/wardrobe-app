import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getOutfits, deleteOutfit, getAllClothing } from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [items, setItems] = useState<Clothing[]>([]);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const all = await getOutfits();
    const o = all.find((x) => x.id === id);
    if (!o) return;
    setOutfit(o);
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    const allClothing = await getAllClothing();
    setItems(allClothing.filter((c) => ids.includes(c.id)));
  };

  if (!outfit) return <View style={S.centered}><Text style={{ color: Colors.textTertiary }}>搭配不存在</Text></View>;

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Hero Collage */}
      <View style={S.hero}>
        <View style={S.collage}>
          {items.slice(0, 4).map((item, i) => (
            <View key={item.id + i} style={[S.collageItem, i === 0 && S.collageItemLarge]}>
              <AsyncImage uri={item.imageUri} style={S.collageImage} />
            </View>
          ))}
          {items.length === 0 && (
            <View style={S.collageEmpty}>
              <Ionicons name="layers" size={48} color={Colors.textTertiary} />
            </View>
          )}
        </View>
        <View style={S.heroOverlay} />
        <Pressable style={S.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Info */}
      <View style={S.info}>
        <Text style={S.name}>{outfit.name || "未命名搭配"}</Text>
        <Text style={S.date}>{new Date(outfit.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</Text>

        {outfit.notes ? (
          <View style={S.noteCard}>
            <Text style={S.noteText}>{outfit.notes}</Text>
          </View>
        ) : null}

        <Text style={S.section}>搭配单品 ({items.length})</Text>
        <View style={S.itemsRow}>
          {items.map((item) => (
            <Pressable key={item.id} style={({ pressed }) => [S.itemCard, pressed && S.pressed]} onPress={() => router.push(`/closet/${item.id}`)}>
              <AsyncImage uri={item.imageUri} style={S.itemImage} />
              <Text style={S.itemName} numberOfLines={1}>{item.name || "未命名"}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [S.deleteBtn, pressed && S.pressed]}
          onPress={() => {
            Alert.alert("删除搭配", "确定要删除吗？", [
              { text: "取消", style: "cancel" },
              { text: "删除", style: "destructive", onPress: async () => { await deleteOutfit(id!); router.back(); } },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={S.deleteText}>删除搭配</Text>
        </Pressable>
        <View style={{ height: 60 }} />
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },

  hero: { position: "relative", width: "100%", height: 380 },
  collage: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    height: "100%",
    gap: 3,
    padding: Spacing.xl,
    paddingTop: 60,
  },
  collageItem: { width: "48%", height: "48%", borderRadius: Radius.lg, overflow: "hidden" },
  collageItemLarge: { width: "100%", height: "48%" },
  collageImage: { width: "100%", height: "100%" },
  collageEmpty: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(10,10,10,0.7)",
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  info: { padding: Spacing.xl, paddingTop: 0, marginTop: -40 },
  name: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },
  date: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4, marginBottom: Spacing.xl },

  noteCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },

  section: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  itemCard: { width: "30%", backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  pressed: { opacity: PressedOpacity },
  itemImage: { width: "100%", aspectRatio: 0.8 },
  itemName: { fontSize: FontSize.xs, color: Colors.textSecondary, padding: 8, textAlign: "center" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.xxxl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    minHeight: TouchMin,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: "500" },
});
