import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function SubCategoriesScreen() {
  const router = useRouter();
  const { parentId } = useLocalSearchParams<{ parentId: string }>();
  const categories = useClothingStore((s) => s.categories);
  const items = useClothingStore((s) => s.items);

  const parent = categories.find((c) => c.id === parentId);
  const subs = useMemo(() => {
    return categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, parentId]);

  const countFor = (catId: string) => items.filter((i) => i.categoryId === catId).length;

  return (
    <View style={S.container}>
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={S.headerTitle}>{parent?.name || "分类"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={subs}
        contentContainerStyle={S.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const count = countFor(item.id);
          return (
            <Pressable
              style={({ pressed }) => [S.card, pressed && S.pressed]}
              onPress={() => {
                router.push({ pathname: "/(tabs)/closet", params: { subCat: item.id } });
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={S.name}>{item.name}</Text>
                <Text style={S.count}>{count} 件衣物</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </Pressable>
          );
        }}
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

  list: { paddingHorizontal: Spacing.xl, paddingBottom: 120, gap: Spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchMin,
  },
  pressed: { opacity: PressedOpacity },
  name: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  count: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
});
