import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useClothingStore } from "../../src/store/clothingStore";
import { Clothing } from "../../src/types";
import { AsyncImage } from "../../src/components/AsyncImage";
import { ModalHandle } from "../../src/components/ui/ModalHandle";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Spacing, Radius, FontSize, TouchMin, PressedOpacity, ThemeColors } from "../../src/design/tokens";
import { tryOn } from "../../src/services/aiService";
import { getImageUrl } from "../../src/utils/imageStorage";

export default function TryOnScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const items = useClothingStore((s) => s.items);
  const colors = useThemeColors();

  const [selectedId, setSelectedId] = useState<string | null>(id || null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<"success" | "mock" | null>(null);
  const [resultMessage, setResultMessage] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId);

  const pickSelfie = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85, aspect: [3, 4] })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85, aspect: [3, 4] });
    if (!result.canceled) {
      setSelfieUri(result.assets[0].uri);
      setResultImage(null);
      setResultStatus(null);
    }
  };

  const uriToBase64 = async (uri: string): Promise<string> => {
    if (uri.startsWith("data:")) return uri;
    let resolvedUri = uri;
    if (uri.startsWith("idx://")) {
      const url = await getImageUrl(uri.replace("idx://", ""));
      if (!url) throw new Error("图片不存在或无法加载");
      resolvedUri = url;
    }
    if (Platform.OS === "web") {
      const blob = await fetch(resolvedUri).then((r) => r.blob());
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    const base64 = await FileSystem.readAsStringAsync(resolvedUri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/jpeg;base64,${base64}`;
  };

  const handleGenerate = async () => {
    if (!selectedItem) { Alert.alert("提示", "请先选择一件衣物"); return; }
    if (!selfieUri) { Alert.alert("提示", "请先上传或拍摄自拍照片"); return; }

    setLoading(true);
    try {
      const [personImage, clothingImage] = await Promise.all([
        uriToBase64(selfieUri),
        uriToBase64(selectedItem.imageUri),
      ]);
      const res = await tryOn(personImage, clothingImage, selectedItem.id);
      setResultImage(res.resultImage || selectedItem.imageUri);
      setResultStatus(res.status);
      setResultMessage(res.message || "");
    } catch (err: unknown) {
      Alert.alert("生成失败", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resultImage) return;
    setSaving(true);
    try {
      let uri = resultImage;
      if (resultImage.startsWith("data:")) {
        const base64 = resultImage.replace(/^data:image\/\w+;base64,/, "");
        const tempUri = FileSystem.cacheDirectory + `tryon_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        uri = tempUri;
      }

      let saved = false;
      try {
        // optional dependency fallback
        const MediaLibrary = require("expo-media-library");
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          await MediaLibrary.createAssetAsync(uri);
          saved = true;
          Alert.alert("已保存", "试穿结果已保存到相册");
        }
      } catch {
        // fallback to sharing
      }

      if (!saved) {
        await Sharing.shareAsync(uri, { dialogTitle: "保存试穿结果" });
      }
    } catch (err: unknown) {
      Alert.alert("保存失败", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const renderClothingGrid = () => (
    <View style={S(colors).grid}>
      {items.map((item) => {
        const active = selectedId === item.id;
        return (
          <Pressable
            key={item.id}
            style={[S(colors).gridItem, active && S(colors).gridItemActive]}
            onPress={() => {
              setSelectedId(item.id);
              setResultImage(null);
              setResultStatus(null);
            }}
          >
            <AsyncImage uri={item.imageUri} style={S(colors).gridImage} />
            {active && (
              <View style={S(colors).checkOverlay}>
                <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={S(colors).container} showsVerticalScrollIndicator={false}>
      <ModalHandle />
      <View style={S(colors).header}>
        <Text style={S(colors).title}>AI 虚拟试衣</Text>
        <Text style={S(colors).subtitle}>选择衣物并上传自拍，生成试穿效果</Text>
      </View>

      {/* Step 1: Select Clothing */}
      <View style={S(colors).section}>
        <Text style={S(colors).stepLabel}>1. 选择衣物</Text>
        {selectedItem ? (
          <View style={S(colors).selectedCard}>
            <AsyncImage uri={selectedItem.imageUri} style={S(colors).selectedImage} />
            <View style={{ flex: 1 }}>
              <Text style={S(colors).selectedName}>{selectedItem.name || "未命名"}</Text>
              <Pressable onPress={() => setSelectedId(null)}>
                <Text style={S(colors).changeText}>更换衣物</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          renderClothingGrid()
        )}
      </View>

      {/* Step 2: Selfie */}
      <View style={S(colors).section}>
        <Text style={S(colors).stepLabel}>2. 上传自拍</Text>
        {selfieUri ? (
          <View style={S(colors).selfieWrap}>
            <Image source={{ uri: selfieUri }} style={S(colors).selfieImage} />
            <Pressable style={S(colors).changeSelfieBtn} onPress={() => setSelfieUri(null)}>
              <Ionicons name="camera-outline" size={16} color={colors.textInverse} />
              <Text style={S(colors).changeSelfieText}>重新拍摄</Text>
            </Pressable>
          </View>
        ) : (
          <View style={S(colors).photoBtns}>
            <Pressable style={({ pressed }) => [S(colors).photoBtn, pressed && S(colors).pressed]} onPress={() => pickSelfie(true)}>
              <Ionicons name="camera" size={20} color={colors.accent} />
              <Text style={S(colors).photoBtnText}>拍照</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [S(colors).photoBtn, pressed && S(colors).pressed]} onPress={() => pickSelfie(false)}>
              <Ionicons name="images" size={20} color={colors.accent} />
              <Text style={S(colors).photoBtnText}>相册</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Step 3: Generate */}
      <View style={S(colors).section}>
        <Pressable
          style={({ pressed }) => [
            S(colors).generateBtn,
            (!selectedItem || !selfieUri || loading) && S(colors).generateBtnDisabled,
            pressed && selectedItem && selfieUri && !loading && S(colors).pressed,
          ]}
          onPress={handleGenerate}
          disabled={!selectedItem || !selfieUri || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={colors.textInverse} />
              <Text style={S(colors).generateText}>生成试穿效果</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Result */}
      {resultImage && (
        <View style={S(colors).section}>
          <Text style={S(colors).stepLabel}>试穿结果</Text>
          <View style={S(colors).resultWrap}>
            <AsyncImage uri={resultImage} style={S(colors).resultImage} />
            {resultStatus === "mock" && (
              <View style={S(colors).mockBanner}>
                <Ionicons name="information-circle" size={14} color={colors.textInverse} />
                <Text style={S(colors).mockText}>{resultMessage || "AI 试衣演示模式"}</Text>
              </View>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              S(colors).saveBtn,
              saving && S(colors).saveBtnDisabled,
              pressed && !saving && S(colors).pressed,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.accent} />
                <Text style={S(colors).saveText}>保存结果</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const S = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingTop: 48, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
    title: { fontSize: FontSize.xxl, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
    subtitle: { fontSize: FontSize.sm, color: colors.textTertiary, marginTop: Spacing.xs },

    section: { marginBottom: Spacing.xxl, paddingHorizontal: Spacing.xl },
    stepLabel: { fontSize: FontSize.sm, fontWeight: "600", color: colors.textSecondary, marginBottom: Spacing.md },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
    gridItem: {
      width: "31%",
      aspectRatio: 0.85,
      borderRadius: Radius.lg,
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
    },
    gridItemActive: { borderColor: colors.accent },
    gridImage: { width: "100%", height: "100%" },
    checkOverlay: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
    },

    selectedCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedImage: { width: 80, height: 100, borderRadius: Radius.lg, backgroundColor: colors.surface },
    selectedName: { fontSize: FontSize.base, fontWeight: "600", color: colors.textPrimary },
    changeText: { fontSize: FontSize.sm, color: colors.accent, marginTop: Spacing.sm },

    photoBtns: { flexDirection: "row", justifyContent: "center", gap: Spacing.xl },
    photoBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    photoBtnText: { color: colors.accent, fontSize: FontSize.base, fontWeight: "600" },
    pressed: { opacity: PressedOpacity },

    selfieWrap: { position: "relative", alignItems: "center" },
    selfieImage: { width: "100%", height: 360, borderRadius: Radius.xl, backgroundColor: colors.surface },
    changeSelfieBtn: {
      position: "absolute",
      bottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Radius.full,
    },
    changeSelfieText: { color: colors.textInverse, fontSize: FontSize.sm },

    generateBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: Radius.xl,
      paddingVertical: 16,
      minHeight: TouchMin + 8,
    },
    generateBtnDisabled: { opacity: 0.45 },
    generateText: { color: colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },

    resultWrap: { position: "relative", borderRadius: Radius.xl, overflow: "hidden", marginBottom: Spacing.lg },
    resultImage: { width: "100%", height: 420, backgroundColor: colors.surface },
    mockBanner: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "rgba(224,122,95,0.9)",
      paddingVertical: 10,
    },
    mockText: { color: colors.textInverse, fontSize: FontSize.sm, fontWeight: "600" },

    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.xl,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: TouchMin,
    },
    saveBtnDisabled: { opacity: 0.45 },
    saveText: { color: colors.accent, fontSize: FontSize.base, fontWeight: "600" },
  });
