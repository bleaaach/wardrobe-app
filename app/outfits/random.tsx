import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getAllClothing, getCategories, addOutfit } from "../../src/db/database";
import { Clothing, Category } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function RandomOutfitScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Clothing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Clothing[]>([]);

  const load = useCallback(async () => {
    const [allClothing, allCategories] = await Promise.all([getAllClothing(), getCategories()]);
    setItems(allClothing);
    setCategories(allCategories);
    generateOutfit(allClothing, allCategories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getParentName = (categoryId: string, cats: Category[]): string | undefined => {
    const cat = cats.find((c) => c.id === categoryId);
    if (!cat) return undefined;
    if (!cat.parentId) return cat.name;
    const parent = cats.find((c) => c.id === cat.parentId);
    return parent?.name;
  };

  const generateOutfit = (allClothing?: Clothing[], allCategories?: Category[]) => {
    const clothing = allClothing ?? items;
    const cats = allCategories ?? categories;
    if (clothing.length === 0) {
      setSelected([]);
      return;
    }

    const season = getCurrentSeason();
    let pool = clothing.filter((c) => {
      if (!c.season) return true;
      return c.season.includes(season);
    });
    if (pool.length === 0) pool = clothing;

    const byParent = (parentName: string) =>
      pool.filter((c) => getParentName(c.categoryId, cats) === parentName);

    const tops = byParent("上装");
    const bottoms = byParent("下装");
    const dresses = byParent("连体服装");
    const shoes = byParent("鞋子");
    const outerwear = byParent("外套");
    const bags = byParent("包袋");
    const accessories = byParent("配饰");

    const result: Clothing[] = [];

    const top = pickRandom(tops);
    if (top) result.push(top);

    const bottom = pickRandom(bottoms);
    const dress = pickRandom(dresses);
    if (bottom && dress) {
      result.push(Math.random() > 0.5 ? bottom : dress);
    } else if (bottom) {
      result.push(bottom);
    } else if (dress) {
      result.push(dress);
    }

    const shoe = pickRandom(shoes);
    if (shoe) result.push(shoe);

    if (Math.random() > 0.6) {
      const outer = pickRandom(outerwear);
      if (outer) result.push(outer);
    }

    if (Math.random() > 0.5) {
      const accessory = pickRandom([...bags, ...accessories]);
      if (accessory) result.push(accessory);
    }

    setSelected(result);
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      Alert.alert("没有可保存的衣物");
      return;
    }
    const dateStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
    const name = `随机搭配 ${dateStr}`;
    await addOutfit({
      name,
      clothingIds: JSON.stringify(selected.map((c) => c.id)),
      notes: "",
    });
    Alert.alert("保存成功", `"${name}" 已保存到搭配库`, [{ text: "确定", onPress: () => router.back() }]);
  };

  const renderCollage = () => {
    const display = selected.slice(0, 4);
    if (display.length === 0) {
      return (
        <View style={S.collageEmpty}>
          <Ionicons name="shuffle-outline" size={48} color={Colors.textTertiary} />
          <Text style={S.emptyText}>暂无可用衣物</Text>
        </View>
      );
    }

    if (display.length === 1) {
      return (
        <View style={S.collage}>
          <AsyncImage uri={display[0].imageUri} style={{ width: "100%", height: "100%" }} />
        </View>
      );
    }

    if (display.length === 2) {
      return (
        <View style={[S.collage, { flexDirection: "row", gap: 3 }]}>
          <View style={{ flex: 1 }}>
            <AsyncImage uri={display[0].imageUri} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={{ flex: 1 }}>
            <AsyncImage uri={display[1].imageUri} style={{ width: "100%", height: "100%" }} />
          </View>
        </View>
      );
    }

    if (display.length === 3) {
      return (
        <View style={[S.collage, { flexDirection: "row", gap: 3 }]}>
          <View style={{ flex: 1 }}>
            <AsyncImage uri={display[0].imageUri} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flex: 1 }}>
              <AsyncImage uri={display[1].imageUri} style={{ width: "100%", height: "100%" }} />
            </View>
            <View style={{ flex: 1 }}>
              <AsyncImage uri={display[2].imageUri} style={{ width: "100%", height: "100%" }} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[S.collage, { flexDirection: "row", flexWrap: "wrap", gap: 3 }]}>
        {display.map((item) => (
          <View key={item.id} style={{ width: "48%", height: "48%", borderRadius: Radius.lg, overflow: "hidden" }}>
            <AsyncImage uri={item.imageUri} style={{ width: "100%", height: "100%" }} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={S.header}>
          <Pressable style={S.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={S.headerTitle}>随机搭配</Text>
          <View style={S.backBtn} />
        </View>

        {/* Preview */}
        <View style={S.previewWrap}>{renderCollage()}</View>

        {/* Items List */}
        {selected.length > 0 && (
          <View style={S.list}>
            <Text style={S.section}>搭配单品 ({selected.length})</Text>
            {selected.map((item) => (
              <View key={item.id} style={S.row}>
                <View style={S.thumb}>
                  <AsyncImage uri={item.imageUri} style={S.thumbImage} />
                </View>
                <View style={S.rowInfo}>
                  <Text style={S.rowName}>{item.name || "未命名"}</Text>
                  <Text style={S.rowMeta}>
                    {getParentName(item.categoryId, categories) || "未知分类"}
                    {item.season ? ` · ${item.season}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={S.actionRow}>
        <Pressable
          style={({ pressed }) => [S.regenBtn, pressed && S.pressed]}
          onPress={() => generateOutfit()}
        >
          <Ionicons name="shuffle-outline" size={18} color={Colors.accent} />
          <Text style={S.regenText}>重新生成</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            S.saveBtn,
            selected.length === 0 && S.saveBtnDisabled,
            pressed && selected.length > 0 && S.pressed,
          ]}
          onPress={handleSave}
          disabled={selected.length === 0}
        >
          <Ionicons name="bookmark-outline" size={18} color={Colors.textInverse} />
          <Text style={S.saveBtnText}>保存搭配</Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: 48, paddingHorizontal: Spacing.xl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },

  previewWrap: { marginBottom: Spacing.xl },
  collage: {
    width: "100%",
    height: 340,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  collageEmpty: {
    width: "100%",
    height: 340,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: FontSize.base, color: Colors.textTertiary, marginTop: Spacing.md },

  section: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  list: { gap: Spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: Radius.md, overflow: "hidden", backgroundColor: Colors.surface },
  thumbImage: { width: "100%", height: "100%" },
  rowInfo: { marginLeft: Spacing.md, flex: 1 },
  rowName: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary },
  rowMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.bg,
  },
  regenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    minHeight: TouchMin,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regenText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1.5,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    minHeight: TouchMin,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },
  pressed: { opacity: PressedOpacity },
});
