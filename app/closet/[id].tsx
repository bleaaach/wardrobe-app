import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Share,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useClothingStore } from "../../src/store/clothingStore";
import { Clothing, Outfit } from "../../src/types";
import { AsyncImage } from "../../src/components/AsyncImage";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  TouchMin,
  PressedOpacity,
  Shadows,
} from "../../src/design/tokens";
import { SEASONS, COLORS, SIZES, SHOE_SIZES } from "../../src/constants/app";
import { getOutfitsByClothingId } from "../../src/db/database";

const SERIF = Platform.OS === "ios" ? "Georgia" : "serif";

export default function ClothingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const updateItem = useClothingStore((s) => s.updateItem);
  const deleteItem = useClothingStore((s) => s.deleteItem);
  const allItems = useClothingStore((s) => s.items);

  const item = items.find((i) => i.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Clothing>>({});
  const [tagsInput, setTagsInput] = useState("");
  const [relatedOutfits, setRelatedOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    if (!id) return;
    getOutfitsByClothingId(id).then(setRelatedOutfits);
  }, [id]);

  const category = categories.find((c) => c.id === item?.categoryId);
  const parentCategory = categories.find((c) => c.id === category?.parentId);
  const categoryDisplay = parentCategory
    ? `${parentCategory.name} · ${category?.name}`
    : category?.name || "-";

  const tags: string[] = (() => {
    if (!item) return [];
    try {
      const arr = JSON.parse(item.tags || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  const startEditing = () => {
    if (!item) return;
    setForm({ ...item });
    try {
      const arr = JSON.parse(item.tags || "[]");
      setTagsInput(Array.isArray(arr) ? arr.join(", ") : "");
    } catch {
      setTagsInput("");
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setForm({});
    setTagsInput("");
  };

  const saveEditing = async () => {
    if (!item || !id) return;
    const parsedTags = tagsInput
      .split(/,|，/)
      .map((s) => s.trim())
      .filter(Boolean);
    await updateItem(id, {
      ...form,
      tags: JSON.stringify(parsedTags),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteItem(id);
          router.back();
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `Check out ${item.name} in my wardrobe!`,
        url: item.purchaseLink || undefined,
      });
    } catch {
      // ignore
    }
  };

  const handleMore = () => {
    if (!item) return;
    Alert.alert(item.name, undefined, [
      { text: "Edit", onPress: startEditing },
      { text: "Delete", style: "destructive", onPress: handleDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const toggleFavorite = () => {
    if (!item || !id) return;
    updateItem(id, { favorite: item.favorite ? 0 : 1 });
  };

  const handleWearToday = () => {
    if (!item || !id) return;
    updateItem(id, { wearCount: (item.wearCount || 0) + 1 });
  };

  const getOutfitThumbnails = (outfit: Outfit): Clothing[] => {
    try {
      const ids: string[] = JSON.parse(outfit.clothingIds || "[]");
      return ids
        .slice(0, 3)
        .map((cid) => allItems.find((i) => i.id === cid))
        .filter(Boolean) as Clothing[];
    } catch {
      return [];
    }
  };

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.textSecondary }}>Item not found</Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={cancelEditing}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Item</Text>
          <Pressable style={styles.headerSaveBtn} onPress={saveEditing}>
            <Text style={styles.headerSaveText}>Save</Text>
          </Pressable>
        </View>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name || ""}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            placeholder="e.g. White Linen Shirt"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={styles.inputLabel}>Category</Text>
          {(() => {
            const parents = categories
              .filter((c) => !c.parentId)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            return parents.map((p) => (
              <View key={p.id} style={{ marginBottom: Spacing.md }}>
                <Text style={styles.parentLabel}>{p.name}</Text>
                <View style={styles.chipRow}>
                  {categories
                    .filter((c) => c.parentId === p.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((cat) => {
                      const active = form.categoryId === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() =>
                            setForm((f) => ({
                              ...f,
                              categoryId: active ? "" : cat.id,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipActiveText,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
            ));
          })()}
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            value={form.brand || ""}
            onChangeText={(t) => setForm((f) => ({ ...f, brand: t }))}
            placeholder="e.g. Uniqlo"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={styles.inputLabel}>Color</Text>
          <View style={styles.chipRow}>
            {COLORS.map((c) => {
              const active = form.color === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setForm((f) => ({ ...f, color: active ? "" : c }))
                  }
                >
                  <Text
                    style={[styles.chipText, active && styles.chipActiveText]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Season</Text>
          <View style={styles.chipRow}>
            {SEASONS.map((s) => {
              const active = form.season === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setForm((f) => ({ ...f, season: active ? "" : s }))
                  }
                >
                  <Text
                    style={[styles.chipText, active && styles.chipActiveText]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Clothing Size</Text>
          <View style={styles.chipRow}>
            {SIZES.map((s) => {
              const active = form.clothingSize === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      clothingSize: active ? "" : s,
                    }))
                  }
                >
                  <Text
                    style={[styles.chipText, active && styles.chipActiveText]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Shoe Size</Text>
          <View style={[styles.chipRow, { marginBottom: Spacing.lg }]}>
            {SHOE_SIZES.map((s) => {
              const active = form.shoeSize === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setForm((f) => ({ ...f, shoeSize: active ? "" : s }))
                  }
                >
                  <Text
                    style={[styles.chipText, active && styles.chipActiveText]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Price</Text>
          <TextInput
            style={styles.input}
            value={form.price || ""}
            onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
            placeholder="0.00"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
          />

          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={form.location || ""}
            onChangeText={(t) => setForm((f) => ({ ...f, location: t }))}
            placeholder="e.g. Wardrobe A - Shelf 2"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={styles.inputLabel}>Purchase Link</Text>
          <TextInput
            style={styles.input}
            value={form.purchaseLink || ""}
            onChangeText={(t) => setForm((f) => ({ ...f, purchaseLink: t }))}
            placeholder="https://..."
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Tags */}
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={tagsInput}
            onChangeText={setTagsInput}
            placeholder="Oversized, Casual, Work"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
          <TextInput
            style={styles.textarea}
            value={form.notes || ""}
            onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
            placeholder="Add any notes about this item..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Wear Count (read-only in edit) */}
        <Text style={styles.sectionTitle}>Wear Count</Text>
        <View style={styles.wearBar}>
          <View>
            <Text style={styles.wearCount}>{item.wearCount || 0}</Text>
            <Text style={styles.wearLabel}>Times worn this year</Text>
          </View>
          <Pressable style={styles.wearBtn} onPress={handleWearToday}>
            <Text style={styles.wearBtnText}>+ Wear Today</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Image */}
      <View style={styles.hero}>
        <AsyncImage uri={item.imageUri} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Pressable style={styles.overlayBtn} onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={20}
              color={Colors.textPrimary}
            />
          </Pressable>
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <Pressable style={styles.overlayBtn} onPress={handleShare}>
              <Ionicons
                name="share-outline"
                size={18}
                color={Colors.textPrimary}
              />
            </Pressable>
            <Pressable style={styles.overlayBtn} onPress={handleMore}>
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={Colors.textPrimary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Detail Body */}
      <View style={styles.detailBody}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoryLabel}>{categoryDisplay}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.name || "Untitled"}
            </Text>
          </View>
          <Pressable
            style={[styles.favoriteBtn, item.favorite ? { borderColor: Colors.accent } : {}]}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={item.favorite ? "heart" : "heart-outline"}
              size={20}
              color={item.favorite ? Colors.accent : Colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Meta Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Brand</Text>
            <Text style={styles.metaValue}>{item.brand || "-"}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Color</Text>
            <Text style={styles.metaValue}>{item.color || "-"}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Season</Text>
            <Text style={styles.metaValue}>{item.season || "-"}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Size</Text>
            <Text style={styles.metaValue}>
              {item.clothingSize || item.shoeSize || "-"}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Price</Text>
            <Text style={[styles.metaValue, { color: Colors.accent }]}>
              {item.price || "-"}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{item.location || "-"}</Text>
          </View>
          {item.purchaseLink ? (
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Purchase</Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(item.purchaseLink).catch(() => {})
                }
              >
                <Text
                  style={[styles.metaValue, { color: Colors.accent }]}
                  numberOfLines={1}
                >
                  Open Link
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {tags.length > 0 ? (
              tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No tags</Text>
            )}
          </View>
        </View>

        {/* Wear Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wear Count</Text>
          <View style={styles.wearBar}>
            <View>
              <Text style={styles.wearCount}>{item.wearCount || 0}</Text>
              <Text style={styles.wearLabel}>Times worn this year</Text>
            </View>
            <Pressable style={styles.wearBtn} onPress={handleWearToday}>
              <Text style={styles.wearBtnText}>+ Wear Today</Text>
            </Pressable>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              {item.notes || "No notes added."}
            </Text>
          </View>
        </View>

        {/* Related Outfits */}
        {relatedOutfits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Outfits</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outfitRow}
            >
              {relatedOutfits.map((outfit) => {
                const thumbs = getOutfitThumbnails(outfit);
                return (
                  <Pressable
                    key={outfit.id}
                    style={styles.outfitCard}
                    onPress={() => router.push(`/outfits/${outfit.id}`)}
                  >
                    <View style={styles.outfitThumbs}>
                      {thumbs.length > 0 ? (
                        thumbs.map((t, idx) => (
                          <AsyncImage
                            key={t.id + idx}
                            uri={t.imageUri}
                            style={styles.outfitThumb}
                          />
                        ))
                      ) : (
                        <View style={styles.outfitThumbPlaceholder}>
                          <Ionicons
                            name="shirt-outline"
                            size={20}
                            color={Colors.textTertiary}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.outfitName} numberOfLines={1}>
                      {outfit.name || "Untitled"}
                    </Text>
                    <Text style={styles.outfitMeta}>
                      {(() => {
                        try {
                          const ids: string[] = JSON.parse(
                            outfit.clothingIds || "[]"
                          );
                          return `${ids.length} items`;
                        } catch {
                          return "0 items";
                        }
                      })()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* AI Try-On */}
        <Pressable
          style={({ pressed }) => [
            styles.tryOnBtn,
            pressed && { opacity: PressedOpacity },
          ]}
          onPress={() => router.push(`/closet/try-on?id=${item.id}`)}
        >
          <Ionicons name="sparkles" size={18} color={Colors.textPrimary} />
          <Text style={styles.tryOnBtnText}>AI Try-On</Text>
        </Pressable>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable
          style={({ pressed }) => [
            styles.editBtn,
            pressed && { opacity: PressedOpacity },
          ]}
          onPress={startEditing}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && { opacity: PressedOpacity },
          ]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },

  // Header (edit mode)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === "ios" ? Spacing.xxl + 8 : Spacing.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: SERIF,
    fontSize: FontSize.lg,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Colors.textPrimary,
  },
  headerSaveText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },

  // Hero
  hero: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 48 : 24,
    paddingBottom: Spacing.lg,
  },
  overlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Detail Body
  detailBody: {
    padding: Spacing.xl,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  categoryLabel: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  name: {
    fontFamily: SERIF,
    fontSize: FontSize.xl,
    fontStyle: "italic",
    fontWeight: "600",
    lineHeight: FontSize.xl * 1.2,
    color: Colors.textPrimary,
  },
  favoriteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },

  // Meta Grid
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
    width: "47%",
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // Tags
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },

  // Wear Bar
  wearBar: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wearCount: {
    fontFamily: SERIF,
    fontSize: 32,
    fontWeight: "600",
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  wearLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  wearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.textPrimary,
  },
  wearBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },

  // Notes
  noteBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  noteText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.6,
  },

  // Related Outfits
  outfitRow: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  outfitCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    width: 140,
  },
  outfitThumbs: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  outfitThumb: {
    width: 36,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,
  },
  outfitThumbPlaceholder: {
    width: 36,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  outfitMeta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },

  // Try-On
  tryOnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  tryOnBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: "600",
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 28,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    minHeight: TouchMin,
    justifyContent: "center",
  },
  editBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    minHeight: TouchMin,
    justifyContent: "center",
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: "600",
  },

  // Edit mode inputs
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  textarea: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
    minHeight: TouchMin,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  chipActiveText: {
    color: Colors.textInverse,
    fontWeight: "600",
  },
  parentLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
