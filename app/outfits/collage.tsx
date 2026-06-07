import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getAllClothing, getOutfits, addOutfit, updateOutfit, updateClothing } from "../../src/db/database";
import { Clothing, Outfit, OutfitLayoutItem } from "../../src/types";
import { CollageCanvas } from "../../src/components/CollageCanvas";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Spacing, Radius, FontSize, TouchMin, PressedOpacity, ThemeColors } from "../../src/design/tokens";

const SCREEN = Dimensions.get("window");

export default function CollageEditorScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { ids, outfitId, name: initialName } = useLocalSearchParams<{
    ids?: string;
    outfitId?: string;
    name?: string;
  }>();

  const [allClothing, setAllClothing] = useState<Clothing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState(initialName || "");
  const [layout, setLayout] = useState<OutfitLayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // 加载数据
  useEffect(() => {
    (async () => {
      const all = await getAllClothing();
      setAllClothing(all);

      if (outfitId) {
        // 编辑模式
        setIsEditing(true);
        const outfits = await getOutfits();
        const outfit = outfits.find((o) => o.id === outfitId);
        if (outfit) {
          setName(outfit.name || "");
          const cids: string[] = JSON.parse(outfit.clothingIds || "[]");
          setSelectedIds(new Set(cids));
          if (outfit.layout) {
            try {
              setLayout(JSON.parse(outfit.layout));
            } catch (e) {
              console.error("Parse outfit layout error:", e);
              setLayout([]);
            }
          }
        }
      } else if (ids) {
        // 新建模式（从 create.tsx 过来）
        const cids = ids.split(",").filter(Boolean);
        setSelectedIds(new Set(cids));
      }
      setLoading(false);
    })();
  }, [ids, outfitId]);

  const selectedItems = allClothing.filter((c) => selectedIds.has(c.id));

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("请至少选择一件衣物");
      return;
    }
    const clothingIds = JSON.stringify(Array.from(selectedIds));
    const layoutJson = layout.length > 0 ? JSON.stringify(layout) : undefined;

    if (isEditing && outfitId) {
      await updateOutfit(outfitId, {
        name,
        clothingIds,
        layout: layoutJson,
      });
    } else {
      await addOutfit({
        name,
        clothingIds,
        notes: "",
        layout: layoutJson,
      });
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={S(colors).centered}>
        <Text style={{ color: colors.textTertiary }}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={S(colors).container}>
      {/* Header */}
      <View style={S(colors).header}>
        <Pressable style={({ pressed }) => [S(colors).iconBtn, pressed && S(colors).pressed]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={S(colors).headerTitle}>{isEditing ? "编辑搭配" : "搭配拼图"}</Text>
        <Pressable style={({ pressed }) => [S(colors).saveHeaderBtn, pressed && S(colors).pressed]} onPress={handleSave}>
          <Text style={S(colors).saveHeaderText}>保存</Text>
        </Pressable>
      </View>

      {/* Name Input */}
      <View style={S(colors).inputWrap}>
        <TextInput
          style={S(colors).input}
          value={name}
          onChangeText={setName}
          placeholder="给这套搭配起个名字"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Collage Canvas */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S(colors).canvasWrap}
        showsVerticalScrollIndicator={false}
      >
        {selectedItems.length === 0 ? (
          <View style={S(colors).emptyCanvas}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={S(colors).emptyText}>从下方选择衣物开始拼图</Text>
          </View>
        ) : (
          <CollageCanvas
            items={selectedItems}
            initialLayout={layout}
            onLayoutChange={setLayout}
            onItemImageCropped={async (clothingId, newUri) => {
              const item = allClothing.find((c) => c.id === clothingId);
              if (!item) return;
              setAllClothing((prev) =>
                prev.map((c) => {
                  if (c.id !== clothingId) return c;
                  if (c.imageNoBgUri) {
                    return { ...c, imageNoBgUri: newUri };
                  }
                  return { ...c, imageUri: newUri };
                })
              );
              await updateClothing(clothingId, item.imageNoBgUri ? { imageNoBgUri: newUri } : { imageUri: newUri });
            }}
          />
        )}
      </ScrollView>

      {/* Clothing Selector */}
      <View style={S(colors).selectorWrap}>
        <Text style={S(colors).selectorTitle}>衣橱单品</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S(colors).selectorList}
        >
          {allClothing.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  S(colors).selectorItem,
                  isSelected && S(colors).selectorItemSelected,
                  pressed && S(colors).pressed,
                ]}
                onPress={() => toggleItem(item.id)}
              >
                <AsyncImage
                  uri={item.imageNoBgUri || item.imageUri}
                  style={S(colors).selectorImage}
                />
                {isSelected && (
                  <View style={S(colors).selectorCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const S = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: colors.textPrimary },
  saveHeaderBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    minHeight: 36,
    justifyContent: "center",
  },
  saveHeaderText: { color: colors.textInverse, fontWeight: "600", fontSize: FontSize.base },
  pressed: { opacity: PressedOpacity },

  inputWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  canvasWrap: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    minHeight: SCREEN.width,
  },
  emptyCanvas: {
    width: SCREEN.width - 40,
    height: SCREEN.width - 40,
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  emptyText: { marginTop: Spacing.md, color: colors.textTertiary, fontSize: FontSize.base },

  selectorWrap: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  selectorTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  selectorList: {
    paddingHorizontal: Spacing.xl,
    gap: 10,
    flexDirection: "row",
  },
  selectorItem: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  selectorItemSelected: {
    borderColor: colors.accent,
  },
  selectorImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  selectorCheck: {
    position: "absolute",
    top: 2,
    right: 2,
  },
});
