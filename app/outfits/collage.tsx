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
import { Clothing, Outfit, OutfitLayoutItem } from "../../src/types";
import { getAllClothing, getOutfits, addOutfit, updateOutfit } from "../../src/db/database";
import { CollageCanvas } from "../../src/components/CollageCanvas";
import { AsyncImage } from "../../src/components/AsyncImage";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

const SCREEN = Dimensions.get("window");

export default function CollageEditorScreen() {
  const router = useRouter();
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
            } catch {
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
      <View style={S.centered}>
        <Text style={{ color: Colors.textTertiary }}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Pressable style={({ pressed }) => [S.iconBtn, pressed && S.pressed]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={S.headerTitle}>{isEditing ? "编辑搭配" : "搭配拼图"}</Text>
        <Pressable style={({ pressed }) => [S.saveHeaderBtn, pressed && S.pressed]} onPress={handleSave}>
          <Text style={S.saveHeaderText}>保存</Text>
        </Pressable>
      </View>

      {/* Name Input */}
      <View style={S.inputWrap}>
        <TextInput
          style={S.input}
          value={name}
          onChangeText={setName}
          placeholder="给这套搭配起个名字"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Collage Canvas */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S.canvasWrap}
        showsVerticalScrollIndicator={false}
      >
        {selectedItems.length === 0 ? (
          <View style={S.emptyCanvas}>
            <Ionicons name="images-outline" size={48} color={Colors.textTertiary} />
            <Text style={S.emptyText}>从下方选择衣物开始拼图</Text>
          </View>
        ) : (
          <CollageCanvas
            items={selectedItems}
            initialLayout={layout}
            onLayoutChange={setLayout}
          />
        )}
      </ScrollView>

      {/* Clothing Selector */}
      <View style={S.selectorWrap}>
        <Text style={S.selectorTitle}>衣橱单品</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.selectorList}
        >
          {allClothing.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  S.selectorItem,
                  isSelected && S.selectorItemSelected,
                  pressed && S.pressed,
                ]}
                onPress={() => toggleItem(item.id)}
              >
                <AsyncImage
                  uri={item.imageNoBgUri || item.imageUri}
                  style={S.selectorImage}
                />
                {isSelected && (
                  <View style={S.selectorCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
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

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },

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
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  saveHeaderBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    minHeight: 36,
    justifyContent: "center",
  },
  saveHeaderText: { color: Colors.textInverse, fontWeight: "600", fontSize: FontSize.base },
  pressed: { opacity: PressedOpacity },

  inputWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  canvasWrap: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    minHeight: SCREEN.width,
  },
  emptyCanvas: {
    width: SCREEN.width - 40,
    height: SCREEN.width - 40,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  emptyText: { marginTop: Spacing.md, color: Colors.textTertiary, fontSize: FontSize.base },

  selectorWrap: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  selectorTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  selectorItemSelected: {
    borderColor: Colors.accent,
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
