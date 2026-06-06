import { View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

const SEASONS = ["🌸春", "☀️夏", "🍂秋", "❄️冬"];

export default function AddClothingScreen() {
  const router = useRouter();
  const categories = useClothingStore((s) => s.categories);
  const addItem = useClothingStore((s) => s.addItem);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [catId, setCatId] = useState(categories[0]?.id || "");
  const [season, setSeason] = useState("");
  const [saving, setSaving] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85, aspect: [3, 4] })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85, aspect: [3, 4] });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const save = async () => {
    if (!image) { Alert.alert("请拍照"); return; }
    setSaving(true);
    await addItem({ categoryId: catId, name: name || "未命名", imageUri: image, season, brand: "", color: "", notes: "" });
    router.back();
  };

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled">
      {/* Image Picker */}
      <Pressable style={S.imageArea} onPress={() => pickImage(false)}>
        {image ? (
          <Image source={{ uri: image }} style={S.image} />
        ) : (
          <View style={S.imagePlaceholder}>
            <Ionicons name="camera" size={40} color={Colors.textTertiary} />
            <Text style={S.imageHint}>点击拍照或选择照片</Text>
          </View>
        )}
      </Pressable>

      {!image && (
        <View style={S.photoBtns}>
          <Pressable style={S.photoBtn} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={20} color={Colors.accent} /><Text style={S.photoBtnText}>拍照</Text>
          </Pressable>
          <Pressable style={S.photoBtn} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={20} color={Colors.accent} /><Text style={S.photoBtnText}>相册</Text>
          </Pressable>
        </View>
      )}

      {image && (
        <>
          {/* Name - minimal input */}
          <TextInput style={S.input} value={name} onChangeText={setName} placeholder="名称（选填）" placeholderTextColor={Colors.textTertiary} />

          {/* Category Pills */}
          <Text style={S.label}>分类</Text>
          <View style={S.chips}>
            {categories.map((cat) => (
              <Pressable key={cat.id} style={[S.chip, catId === cat.id && S.chipActive]} onPress={() => setCatId(cat.id)}>
                <Text style={[S.chipText, catId === cat.id && S.chipActiveText]}>{cat.icon} {cat.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* Season */}
          <Text style={S.label}>季节</Text>
          <View style={S.chips}>
            {SEASONS.map((s) => {
              const sKey = s.replace(/[^一-龥]/g, "");
              const active = season === sKey;
              return (
                <Pressable key={s} style={[S.chip, active && S.chipActive]} onPress={() => setSeason(active ? "" : sKey)}>
                  <Text style={[S.chipText, active && S.chipActiveText]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Save Button */}
          <Pressable style={[S.saveBtn, saving && S.saveBtnDisabled]} onPress={save} disabled={saving}>
            <Text style={S.saveText}>{saving ? "保存中..." : "保存"}</Text>
          </Pressable>
        </>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl },
  imageArea: { width: "100%", height: 300, backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: "hidden", marginBottom: Spacing.lg },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageHint: { color: Colors.textTertiary, fontSize: FontSize.base, marginTop: Spacing.sm },
  photoBtns: { flexDirection: "row", justifyContent: "center", gap: Spacing.xl, marginBottom: Spacing.xl },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: Colors.surface, borderRadius: Radius.full },
  photoBtnText: { color: Colors.accent, fontSize: FontSize.base, fontWeight: "600" },
  input: { fontSize: FontSize.lg, paddingVertical: 14, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: Colors.divider, marginBottom: Spacing.xl, color: Colors.textPrimary },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.surface, minHeight: TouchMin, justifyContent: "center" },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipActiveText: { color: Colors.textInverse, fontWeight: "600" },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.xl, paddingVertical: 16, alignItems: "center", marginTop: Spacing.xxxl, minHeight: TouchMin + 8, justifyContent: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },
});
