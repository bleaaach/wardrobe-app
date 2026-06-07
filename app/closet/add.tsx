import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  TouchMin,
  PressedOpacity,
  Shadows,
} from "../../src/design/tokens";
import { API_BASE_URL } from "../../src/config/api";
import { SEASONS, COLORS } from "../../src/constants/app";
import { analyzeImage } from "../../src/services/aiService";
import storage from "../../src/utils/storage";

const BG_API = `${API_BASE_URL}/upload/remove-bg`;

export default function AddClothingScreen() {
  const router = useRouter();
  const categories = useClothingStore((s) => s.categories);
  const addItem = useClothingStore((s) => s.addItem);

  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgDone, setBgDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [color, setColor] = useState("");
  const [detectedCategory, setDetectedCategory] = useState("");

  // additional fields
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [favorite, setFavorite] = useState(false);

  // category selection
  const parents = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const [parentId, setParentId] = useState(parents[0]?.id || "");
  const children = categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const [catId, setCatId] = useState(children[0]?.id || "");

  const pickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.85,
          aspect: [3, 4],
        })
      : await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.85,
          aspect: [3, 4],
        });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setColor("");
      setDetectedCategory("");
      setBgDone(false);
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === "web") {
      // Web 端 Alert.alert 不会弹出，直接打开文件选择器
      pickImage(false);
      return;
    }
    Alert.alert("选择照片", undefined, [
      { text: "拍照", onPress: () => pickImage(true) },
      { text: "从相册选择", onPress: () => pickImage(false) },
      { text: "取消", style: "cancel" },
    ]);
  };

  const removeBg = async () => {
    if (!image) return;
    setRemovingBg(true);
    try {
      const blob = await fetch(image).then((r) => r.blob());
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const token = await storage.getItem("auth_token");
      const res = await fetch(BG_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ data: base64 }),
      });
      const json = await res.json();
      if (json.data) {
        setImage(json.data);
        setBgDone(true);
      } else throw new Error(json.error || "Failed");
    } catch (e: unknown) {
      Alert.alert("抠图失败", e instanceof Error ? e.message : String(e));
    } finally {
      setRemovingBg(false);
    }
  };

  const aiAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const blob = await fetch(image).then((r) => r.blob());
      const reader = new FileReader();
      const base64: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const result = await analyzeImage(base64);
      setColor(result.color);
      setDetectedCategory(result.category);
      const matched = categories.find(
        (c) => c.name === result.category && c.parentId
      );
      if (matched) {
        setParentId(matched.parentId || "");
        setCatId(matched.id);
      }
    } catch (e: unknown) {
      Alert.alert("识别失败", e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!image) {
      Alert.alert("请拍照");
      return;
    }
    setSaving(true);
    await addItem({
      categoryId: catId,
      name: name || "未命名",
      imageUri: image,
      season,
      brand,
      color,
      location,
      clothingSize: "",
      shoeSize: "",
      price,
      purchaseLink: "",
      tags: "[]",
      wearCount: 0,
      notes,
    });
    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Clothing</Text>
        <Pressable
          style={[styles.headerSaveBtn, (!image || saving) && { opacity: 0.45 }]}
          onPress={save}
          disabled={saving || !image}
        >
          <Text style={styles.headerSaveText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* Photo Area */}
      <Pressable
        style={styles.photoArea}
        onPress={showImagePickerOptions}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.photoImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={48} color={Colors.textTertiary} />
            <Text style={styles.photoHint}>
              Tap to take photo or choose from album
            </Text>
            <Text style={styles.photoSubHint}>
              Auto-remove background on upload
            </Text>
          </View>
        )}
      </Pressable>

      {/* Detected badges */}
      {image && (color || detectedCategory) && (
        <View style={styles.detectedRow}>
          {color && (
            <View style={styles.detectedItem}>
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      color === "白"
                        ? "#F5F5F5"
                        : color === "黑"
                        ? "#333"
                        : undefined,
                  },
                ]}
              />
              <Text style={styles.detectedText}>{color}</Text>
            </View>
          )}
          {detectedCategory && (
            <View style={styles.detectedItem}>
              <Ionicons
                name="pricetag-outline"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.detectedText}>{detectedCategory}</Text>
            </View>
          )}
        </View>
      )}

      {/* Basic Info */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. White Linen Shirt"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.chipRow}>
            {parents.map((p) => {
              const active = parentId === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setParentId(p.id);
                    const firstChild = categories
                      .filter((c) => c.parentId === p.id)
                      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
                    setCatId(firstChild?.id || "");
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipActiveText,
                    ]}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Sub-category</Text>
          <View style={styles.chipRow}>
            {children.map((cat) => {
              const active = catId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCatId(cat.id)}
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
      </View>

      {/* Details */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Uniqlo"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Color</Text>
          <View style={styles.chipRow}>
            {COLORS.map((c) => {
              const active = color === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setColor(active ? "" : c)}
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
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Season</Text>
          <View style={styles.chipRow}>
            {SEASONS.map((s) => {
              const active = season === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSeason(active ? "" : s)}
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
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Size</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. M / 38"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Price</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Wardrobe A - Shelf 2"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Add to favorites</Text>
          <Switch
            value={favorite}
            onValueChange={setFavorite}
            trackColor={{ false: Colors.border, true: Colors.textPrimary }}
            thumbColor={Colors.surface}
            ios_backgroundColor={Colors.border}
          />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.formSection}>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={styles.textarea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this item..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Save */}
      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          pressed && styles.pressed,
          saving && { opacity: 0.45 },
        ]}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <Text style={styles.actionBtnText}>Save to Closet</Text>
        )}
      </Pressable>

      {/* Remove Background */}
      {image && !bgDone && (
        <Pressable
          style={({ pressed }) => [
            styles.actionBtnSecondary,
            pressed && styles.pressed,
          ]}
          onPress={removeBg}
          disabled={removingBg}
        >
          {removingBg ? (
            <ActivityIndicator size="small" color={Colors.textPrimary} />
          ) : (
            <Text style={styles.actionBtnSecondaryText}>
              Remove Background Preview
            </Text>
          )}
        </Pressable>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingBottom: 16,
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
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: FontSize.xl,
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

  photoArea: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    overflow: "hidden",
    ...Shadows.sm,
  },
  photoImage: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  photoHint: { fontSize: FontSize.base, color: Colors.textSecondary },
  photoSubHint: { fontSize: FontSize.xs, color: Colors.textTertiary },

  formSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: 12,
  },

  formGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 6,
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
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabel: {
    fontSize: FontSize.base,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  actionBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    marginBottom: 12,
    minHeight: TouchMin,
    justifyContent: "center",
  },
  actionBtnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: "600",
  },

  actionBtnSecondary: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginBottom: 12,
    minHeight: TouchMin,
    justifyContent: "center",
  },
  actionBtnSecondaryText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: "600",
  },

  detectedRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  detectedText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  pressed: { opacity: PressedOpacity },
});
