import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { addOutfit } from "../../src/db/database";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity, Shadows } from "../../src/design/tokens";

export default function CreateOutfitScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const loadCategories = useClothingStore((s) => s.loadCategories);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleItem = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const removeItem = (id: string) => {
    const next = new Set(selected);
    next.delete(id);
    setSelected(next);
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      Alert.alert("请至少选择一件衣物");
      return;
    }
    await addOutfit({ name, clothingIds: JSON.stringify([...selected]), notes: "" });
    router.back();
  };

  const handleCreate = () => {
    if (selected.size === 0) {
      Alert.alert("请至少选择一件衣物");
      return;
    }
    router.push({
      pathname: "/outfits/collage",
      params: { ids: Array.from(selected).join(","), name },
    });
  };

  const filteredItems = activeCategory
    ? items.filter((i) => i.categoryId === activeCategory)
    : items;

  const allCategories = [{ id: "__all__", name: "All" }, ...categories];

  // 空衣橱
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Outfit</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="shirt-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>衣橱是空的</Text>
          <Text style={styles.emptySub}>先添加一些衣物，再来创建搭配</Text>
          <Pressable style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]} onPress={() => router.push("/closet/add")}>
            <Text style={styles.emptyBtnText}>去添加衣物</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Outfit</Text>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            selected.size === 0 && styles.saveBtnDisabled,
            pressed && selected.size > 0 && styles.pressed,
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      {/* Grid Content */}
      <FlatList
        data={filteredItems}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.filterEmptyWrap}>
            <Text style={styles.filterEmptyText}>该分类下没有衣物</Text>
          </View>
        }
        ListHeaderComponent={
          <View>
            {/* Name Input */}
            <TextInput
              style={[
                styles.nameInput,
                inputFocused && { borderColor: Colors.textPrimary },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Outfit name..."
              placeholderTextColor={Colors.textTertiary}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />

            {/* Selected Preview */}
            {selected.size > 0 ? (
              <View style={styles.selectedPreview}>
                {Array.from(selected).map((id) => {
                  const item = items.find((i) => i.id === id);
                  if (!item) return null;
                  return (
                    <View key={id} style={styles.selItem}>
                      <AsyncImage uri={item.imageUri} style={styles.selItemImage} />
                      <Pressable style={styles.removeBadge} onPress={() => removeItem(id)}>
                        <Ionicons name="close" size={12} color={Colors.textInverse} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.selectedPreview}>
                <Text style={styles.placeholderText}>还没有选择任何衣物</Text>
              </View>
            )}

            {/* Section Title */}
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Select from Closet</Text>
              <Text style={styles.countText}>{filteredItems.length} items</Text>
            </View>

            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {allCategories.map((cat) => {
                const isActive =
                  cat.id === "__all__"
                    ? activeCategory === null
                    : activeCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                    ]}
                    onPress={() =>
                      setActiveCategory(cat.id === "__all__" ? null : cat.id)
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <Pressable
              style={styles.item}
              onPress={() => toggleItem(item.id)}
            >
              <View style={[
                styles.itemThumb,
                isSelected && styles.itemThumbSelected,
              ]}>
                <AsyncImage uri={item.imageUri} style={styles.itemImage} />
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                  </View>
                )}
              </View>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.createBtn,
            selected.size === 0 && styles.createBtnDisabled,
            pressed && selected.size > 0 && styles.pressed,
          ]}
          onPress={handleCreate}
        >
          <Text style={styles.createBtnText}>
            Create Outfit ({selected.size})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pressed: { opacity: PressedOpacity },

  // Nav Header
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Colors.textPrimary,
    minHeight: TouchMin,
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: "600",
  },

  // Name Input
  nameInput: {
    marginHorizontal: Spacing.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 20,
  },

  // Selected Preview
  selectedPreview: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    minHeight: 140,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignContent: "flex-start",
    ...Shadows.sm,
  },
  selItem: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
    position: "relative",
  },
  selItemImage: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    width: "100%",
    textAlign: "center",
    color: Colors.textTertiary,
    fontSize: 14,
    paddingVertical: 40,
  },

  // Section Title
  sectionTitle: {
    marginHorizontal: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
  },
  countText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Category Chips
  chipsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },

  // Grid
  gridContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.xl,
    gap: 12,
    marginBottom: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  itemThumb: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    ...Shadows.sm,
  },
  itemThumbSelected: {
    borderColor: Colors.textPrimary,
  },
  itemImage: { width: "100%", height: "100%" },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  filterEmptyWrap: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 40,
    alignItems: "center",
  },
  filterEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    paddingBottom: 28,
  },
  createBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: TouchMin,
  },
  createBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  createBtnText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },

  // Empty
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emptyBtn: {
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    minHeight: TouchMin,
    justifyContent: "center",
  },
  emptyBtnText: {
    color: Colors.textInverse,
    fontWeight: "600",
    fontSize: FontSize.base,
  },
});
