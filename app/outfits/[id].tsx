import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getOutfits,
  getAllClothing,
  getCategories,
  deleteOutfit,
  addDailyLog,
} from "../../src/db/database";
import { Outfit, Clothing, Category } from "../../src/types";
import { AsyncImage } from "../../src/components/AsyncImage";
import { Colors, Spacing, Radius, FontSize, Shadows } from "../../src/design/tokens";

export default function OutfitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [items, setItems] = useState<Clothing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const serif = Platform.OS === "ios" ? "Georgia" : "serif";

  useEffect(() => {
    (async () => {
      const [outfits, allClothing, cats] = await Promise.all([
        getOutfits(),
        getAllClothing(),
        getCategories(),
      ]);
      const found = outfits.find((o) => o.id === id) || null;
      setOutfit(found);
      if (found) {
        const ids: string[] = JSON.parse(found.clothingIds || "[]");
        const map = new Map(allClothing.map((c) => [c.id, c]));
        setItems(ids.map((cid) => map.get(cid)).filter(Boolean) as Clothing[]);
      }
      setCategories(cats);
      setLoading(false);
    })();
  }, [id]);

  const getCategoryName = useCallback(
    (clothing: Clothing) => {
      const cat = categories.find((c) => c.id === clothing.categoryId);
      if (!cat) return "";
      if (cat.parentId) {
        const parent = categories.find((c) => c.id === cat.parentId);
        return parent ? `${parent.name} · ${cat.name}` : cat.name;
      }
      return cat.name;
    },
    [categories]
  );

  const handleWearToday = async () => {
    if (!outfit) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await addDailyLog({
        date: today,
        outfitId: outfit.id,
      });
      Alert.alert("已记录", "今日穿搭已记录");
    } catch (e) {
      Alert.alert("记录失败", String(e));
    }
  };

  const handleDelete = () => {
    if (!outfit) return;
    Alert.alert(
      "确认删除",
      `确定要删除搭配「${outfit.name || "未命名搭配"}」吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            await deleteOutfit(outfit.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleEditOutfit = () => {
    if (!outfit) return;
    router.push({
      pathname: "/outfits/collage",
      params: { outfitId: outfit.id, name: outfit.name || "" },
    });
  };

  const handleItemPress = (item: Clothing) => {
    router.push(`/closet/${item.id}`);
  };

  if (loading) {
    return (
      <View style={S.container}>
        <View style={S.centered}>
          <Text style={{ color: Colors.textTertiary }}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!outfit) {
    return (
      <View style={S.container}>
        <View style={S.centered}>
          <Text style={{ color: Colors.textTertiary }}>搭配不存在</Text>
          <Pressable style={S.wearBtn} onPress={() => router.back()}>
            <Text style={S.wearBtnText}>返回</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const previews = items.slice(0, 4);
  const bgColors = ["#F5F2EE", "#EDE9E4", "#F0EEEC", "#E7E5E4"];

  const createdDate = outfit.createdAt
    ? new Date(outfit.createdAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
      })
    : "";

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero Collage */}
        <View style={S.collagePreview}>
          <View style={S.heroOverlay}>
            <Pressable style={S.overlayBtn} onPress={() => router.back()}>
              <Ionicons
                name="chevron-back"
                size={20}
                color={Colors.textPrimary}
              />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable style={S.overlayBtn} onPress={handleEditOutfit}>
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={Colors.textPrimary}
                />
              </Pressable>
              <Pressable style={S.overlayBtn} onPress={handleEditOutfit}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color={Colors.textPrimary}
                />
              </Pressable>
            </View>
          </View>

          {Array.from({ length: 4 }).map((_, i) => {
            const item = previews[i];
            return (
              <View
                key={i}
                style={[
                  S.collagePart,
                  { backgroundColor: item ? Colors.bg : bgColors[i] },
                ]}
              >
                {item?.imageUri ? (
                  <AsyncImage
                    uri={item.imageUri}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Text style={S.collagePlaceholder}>?</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Detail Body */}
        <View style={S.detailBody}>
          <View style={S.detailHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[S.detailName, { fontFamily: serif }]}>
                {outfit.name || "未命名搭配"}
              </Text>
              <Text style={S.detailMeta}>
                {items.length} 件衣物{createdDate ? ` · Created ${createdDate}` : ""}
              </Text>
            </View>
            <Pressable style={S.wearBtn} onPress={handleWearToday}>
              <Text style={S.wearBtnText}>Wear Today</Text>
            </Pressable>
          </View>

          <View style={S.section}>
            <Text style={S.sectionTitle}>Items in this Outfit</Text>
            <View style={S.itemList}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  style={S.itemRow}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={S.itemThumb}>
                    {item.imageUri ? (
                      <AsyncImage
                        uri={item.imageUri}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <Text style={S.collagePlaceholder}>?</Text>
                    )}
                  </View>
                  <View style={S.itemInfo}>
                    <Text style={S.itemName} numberOfLines={1}>
                      {item.name || "未命名衣物"}
                    </Text>
                    <Text style={S.itemCat}>{getCategoryName(item)}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.textTertiary}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={S.actionRow}>
          <Pressable
            style={[S.actionBtn, S.editBtn]}
            onPress={handleEditOutfit}
          >
            <Text style={S.editBtnText}>Edit Outfit</Text>
          </Pressable>
          <Pressable
            style={[S.actionBtn, S.deleteBtn]}
            onPress={handleDelete}
          >
            <Text style={S.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 120,
  },
  // Hero
  collagePreview: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 16,
  },
  overlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  collagePart: {
    width: "47%",
    aspectRatio: 0.95,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  collagePlaceholder: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textTertiary,
  },
  // Detail Body
  detailBody: { padding: 20 },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  detailName: {
    fontSize: 28,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  detailMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  wearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.textPrimary,
    alignSelf: "flex-start",
  },
  wearBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  itemList: { gap: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    ...Shadows.sm,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  itemCat: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  editBtn: { backgroundColor: Colors.textPrimary },
  editBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  deleteBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteBtnText: { color: Colors.danger, fontSize: 15, fontWeight: "600" },
});
