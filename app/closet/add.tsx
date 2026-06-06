import { View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useClothingStore } from "../../src/store/clothingStore";
import { ModalHandle } from "../../src/components/ui/ModalHandle";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

const BG_API = "http://8.162.26.192/sync/upload/remove-bg";

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
  const [removingBg, setRemovingBg] = useState(false);
  const [bgDone, setBgDone] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85, aspect: [3, 4] })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85, aspect: [3, 4] });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const save = async () => {
    if (!image) { Alert.alert("请拍照"); return; }
    setSaving(true);
    await addItem({
      categoryId: catId,
      name: name || "未命名",
      imageUri: image,
      season,
      brand: "",
      color: "",
      location: "",
      clothingSize: "",
      shoeSize: "",
      price: "",
      purchaseLink: "",
      tags: "[]",
      wearCount: 0,
      notes: "",
    });
    router.back();
  };

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled">
      <ModalHandle />

      {/* Image Picker - Dark Immersive */}
      <Pressable style={S.imageArea} onPress={() => pickImage(false)}>
        {image ? (
          <Image source={{ uri: image }} style={S.image} />
        ) : (
          <View style={S.imagePlaceholder}>
            <Ionicons name="camera" size={48} color={Colors.textTertiary} />
            <Text style={S.imageHint}>点击拍照或选择照片</Text>
          </View>
        )}
      </Pressable>

      {!image && (
        <View style={S.photoBtns}>
          <Pressable style={({ pressed }) => [S.photoBtn, pressed && S.pressed]} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={20} color={Colors.accent} /><Text style={S.photoBtnText}>拍照</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [S.photoBtn, pressed && S.pressed]} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={20} color={Colors.accent} /><Text style={S.photoBtnText}>相册</Text>
          </Pressable>
        </View>
      )}

      {image && (
        <>
          {!bgDone && (
            <Pressable
              style={({pressed})=>[S.bgBtn, pressed&&S.pressed]}
              onPress={async () => {
                setRemovingBg(true);
                try {
                  const blob = await fetch(image).then(r => r.blob());
                  const reader = new FileReader();
                  const base64: string = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                  const res = await fetch(BG_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: base64 }),
                  });
                  const json = await res.json();
                  if (json.data) { setImage(json.data); setBgDone(true); }
                  else throw new Error(json.error || "Failed");
                } catch (e: any) {
                  Alert.alert("抠图失败", e.message);
                } finally {
                  setRemovingBg(false);
                }
              }}
              disabled={removingBg}
            >
              {removingBg ? <ActivityIndicator size="small" color={Colors.accent} /> : <Ionicons name="cut-outline" size={20} color={Colors.accent} />}
              <Text style={S.bgText}>{removingBg ? "抠图中..." : "一键抠图"}</Text>
            </Pressable>
          )}

          <TextInput style={S.input} value={name} onChangeText={setName} placeholder="名称（选填）" placeholderTextColor={Colors.textTertiary} />

          <Text style={S.label}>分类</Text>
          {(() => {
            const parents = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
            return parents.map((p) => (
              <View key={p.id} style={{ marginBottom: Spacing.md }}>
                <Text style={S.parentLabel}>{p.name}</Text>
                <View style={S.chips}>
                  {categories
                    .filter((c) => c.parentId === p.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((cat) => (
                      <Pressable key={cat.id} style={[S.chip, catId === cat.id && S.chipActive]} onPress={() => setCatId(cat.id)}>
                        <Text style={[S.chipText, catId === cat.id && S.chipActiveText]}>{cat.name}</Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            ));
          })()}

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

          <Pressable style={({ pressed }) => [S.saveBtn, saving && S.saveBtnDisabled, pressed && !saving && S.pressed]} onPress={save} disabled={saving}>
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

  imageArea: {
    width: "100%",
    height: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageHint: { color: Colors.textTertiary, fontSize: FontSize.base, marginTop: Spacing.sm },

  photoBtns: { flexDirection: "row", justifyContent: "center", gap: Spacing.xl, marginBottom: Spacing.xl },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoBtnText: { color: Colors.accent, fontSize: FontSize.base, fontWeight: "600" },
  pressed: { opacity: PressedOpacity },

  input: {
    fontSize: FontSize.lg,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xl,
    color: Colors.textPrimary,
  },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  parentLabel: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textTertiary, marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    minHeight: TouchMin,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipActiveText: { color: Colors.textInverse, fontWeight: "600" },

  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.xxxl,
    minHeight: TouchMin + 8,
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },

  bgBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  bgText: { color: Colors.accent, fontSize: FontSize.base, fontWeight: "600" },
});
