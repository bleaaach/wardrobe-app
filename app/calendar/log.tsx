import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  getOutfits,
  getAllClothing,
  addDailyLog,
  getDailyLogByDate,
} from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import {
  Spacing,
  Radius,
  FontSize,
  PressedOpacity,
  Colors,
  Shadows,
} from "../../src/design/tokens";

type LogOption = "outfit" | "closet" | "photo" | "yesterday";

const SERIF = Platform.OS === "ios" ? "Georgia" : "serif";

const LOG_OPTIONS: {
  key: LogOption;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  name: string;
  desc: string;
}[] = [
  { key: "outfit", icon: "layers-outline", name: "From Outfit", desc: "Pick a saved combo" },
  { key: "closet", icon: "grid-outline", name: "From Closet", desc: "Select items" },
  { key: "photo", icon: "camera-outline", name: "Take Photo", desc: "Capture outfit" },
  { key: "yesterday", icon: "refresh-outline", name: "Copy Yesterday", desc: "Duplicate last entry" },
];

const MOOD_OPTIONS = [
  { label: "开心", value: "开心", icon: "happy-outline" as const },
  { label: "一般", value: "一般", icon: "remove-outline" as const },
  { label: "低落", value: "低落", icon: "sad-outline" as const },
  { label: "超棒", value: "超棒", icon: "heart-outline" as const },
  { label: "疲惫", value: "疲惫", icon: "battery-dead-outline" as const },
];

const WEATHER_OPTIONS = [
  { label: "晴", value: "晴", icon: "sunny-outline" as const },
  { label: "多云", value: "多云", icon: "partly-sunny-outline" as const },
  { label: "雨", value: "雨", icon: "rainy-outline" as const },
  { label: "雪", value: "雪", icon: "snow-outline" as const },
  { label: "雾", value: "雾", icon: "cloud-outline" as const },
];

const OCCASION_OPTIONS = [
  { label: "通勤", value: "通勤", icon: "briefcase-outline" as const },
  { label: "运动", value: "运动", icon: "fitness-outline" as const },
  { label: "聚会", value: "聚会", icon: "people-outline" as const },
  { label: "居家", value: "居家", icon: "home-outline" as const },
  { label: "旅行", value: "旅行", icon: "airplane-outline" as const },
];

function getInitials(name: string) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function DailyLogScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(
    new Map()
  );
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<string>("");
  const [weather, setWeather] = useState<string>("");
  const [occasion, setOccasion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeOption, setActiveOption] = useState<LogOption>("outfit");
  const [photoUri, setPhotoUri] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [os, all] = await Promise.all([
        getOutfits(),
        getAllClothing(),
      ]);
      setOutfits(os);
      const map = new Map<string, Clothing>();
      for (const c of all) map.set(c.id, c);
      setClothingMap(map);

      if (date) {
        const existing = await getDailyLogByDate(date);
        if (existing) {
          if (existing.outfitId) {
            setSelectedOutfitId(existing.outfitId);
            setActiveOption("outfit");
          }
          if (existing.imageUri) {
            setPhotoUri(existing.imageUri);
            setActiveOption("photo");
          }
          if (existing.notes) setNotes(existing.notes);
          if (existing.mood) setMood(existing.mood);
          if (existing.weather) setWeather(existing.weather);
          if (existing.occasion) setOccasion(existing.occasion);
        }
      }
    })();
  }, [date]);

  const getOutfitItems = (o: Outfit) => {
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    return ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
  };

  const handleSave = async () => {
    if (activeOption === "outfit" && !selectedOutfitId) {
      Alert.alert("提示", "请选择一套搭配");
      return;
    }
    if (activeOption === "photo" && !photoUri) {
      Alert.alert("提示", "请拍照或选择照片");
      return;
    }
    if (!date) {
      Alert.alert("错误", "日期无效");
      return;
    }
    setLoading(true);
    try {
      await addDailyLog({
        date,
        outfitId: activeOption === "outfit" ? selectedOutfitId : undefined,
        imageUri: activeOption === "photo" ? photoUri : undefined,
        notes: notes.trim() || undefined,
        mood: mood || undefined,
        weather: weather || undefined,
        occasion: occasion || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert("保存失败", String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleOptionPress = (key: LogOption) => {
    if (key === "closet") {
      router.push(`/calendar/select-clothing?date=${date}`);
      return;
    }
    if (key === "yesterday") {
      handleCopyYesterday();
      return;
    }
    setActiveOption(key);
  };

  const handleCopyYesterday = async () => {
    if (!date) {
      Alert.alert("错误", "日期无效");
      return;
    }
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const yDate = d.toISOString().split("T")[0];
    const yLog = await getDailyLogByDate(yDate);
    if (!yLog) {
      Alert.alert("提示", "昨天没有记录");
      return;
    }
    if (yLog.outfitId) {
      setSelectedOutfitId(yLog.outfitId);
      setActiveOption("outfit");
    } else if (yLog.imageUri) {
      setPhotoUri(yLog.imageUri);
      setActiveOption("photo");
    }
    if (yLog.notes) setNotes(yLog.notes);
    if (yLog.mood) setMood(yLog.mood);
    if (yLog.weather) setWeather(yLog.weather);
    if (yLog.occasion) setOccasion(yLog.occasion);
    Alert.alert("已复制", "昨天的记录已填充到当前表单");
  };

  const showPhotoOptions = () => {
    Alert.alert("选择照片", undefined, [
      { text: "拍照", onPress: () => pickPhoto(true) },
      { text: "从相册选择", onPress: () => pickPhoto(false) },
      { text: "取消", style: "cancel" },
    ]);
  };

  const pickPhoto = async (useCamera: boolean) => {
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
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "";

  const canSave =
    activeOption === "outfit"
      ? !!selectedOutfitId
      : activeOption === "photo"
      ? !!photoUri
      : activeOption === "yesterday"
      ? !!selectedOutfitId || !!photoUri || !!notes || !!mood || !!weather || !!occasion
      : false;

  return (
    <View style={styles.container}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.dateLabel}>{displayDate}</Text>
        <Pressable
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || loading}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Log Options Grid */}
        <View style={styles.logOptions}>
          {LOG_OPTIONS.map((opt) => {
            const isActive = activeOption === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [
                  styles.logOption,
                  isActive && styles.logOptionSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleOptionPress(opt.key)}
              >
                <Ionicons
                  name={opt.icon}
                  size={28}
                  color={Colors.textPrimary}
                  style={styles.optIcon}
                />
                <Text style={styles.optName}>{opt.name}</Text>
                <Text style={styles.optDesc}>{opt.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Outfit List */}
        {activeOption === "outfit" && (
          <>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Choose Outfit</Text>
              <Text style={styles.count}>{outfits.length} sets</Text>
            </View>

            {outfits.length === 0 ? (
              <View style={styles.emptyOutfits}>
                <Ionicons
                  name="layers-outline"
                  size={32}
                  color={Colors.textTertiary}
                />
                <Text style={styles.emptyOutfitsText}>还没有搭配</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.createBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => router.push("/outfits/create")}
                >
                  <Text style={styles.createBtnText}>去创建一套</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.outfitList}>
                {outfits.map((o) => {
                  const items = getOutfitItems(o);
                  const isSel = selectedOutfitId === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      style={({ pressed }) => [
                        styles.outfitRow,
                        isSel && styles.outfitRowSelected,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => setSelectedOutfitId(o.id)}
                    >
                      <View style={styles.thumb}>
                        <Text style={styles.thumbText}>
                          {getInitials(o.name || "未命名")}
                        </Text>
                      </View>
                      <View style={styles.outfitInfo}>
                        <Text style={styles.outfitName} numberOfLines={1}>
                          {o.name || "未命名搭配"}
                        </Text>
                        <Text style={styles.outfitMeta}>
                          {items.length} items
                        </Text>
                      </View>
                      {isSel && (
                        <View style={styles.checkBadge}>
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={Colors.textInverse}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Photo Area */}
        {activeOption === "photo" && (
          <Pressable
            style={({ pressed }) => [
              styles.photoArea,
              pressed && styles.pressed,
            ]}
            onPress={showPhotoOptions}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <>
                <Ionicons
                  name="camera"
                  size={40}
                  color={Colors.textTertiary}
                />
                <Text style={styles.photoHint}>Tap to take photo or choose from album</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Mood */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Mood</Text>
        </View>
        <View style={styles.tagRow}>
          {MOOD_OPTIONS.map((t) => (
            <Pressable
              key={t.value}
              style={({ pressed }) => [
                styles.tag,
                mood === t.value && styles.tagActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setMood(mood === t.value ? "" : t.value)}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={mood === t.value ? Colors.textPrimary : Colors.textSecondary}
                style={styles.tagIcon}
              />
              <Text
                style={[
                  styles.tagText,
                  mood === t.value && styles.tagTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Weather */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Weather</Text>
        </View>
        <View style={styles.tagRow}>
          {WEATHER_OPTIONS.map((t) => (
            <Pressable
              key={t.value}
              style={({ pressed }) => [
                styles.tag,
                weather === t.value && styles.tagActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setWeather(weather === t.value ? "" : t.value)}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={weather === t.value ? Colors.textPrimary : Colors.textSecondary}
                style={styles.tagIcon}
              />
              <Text
                style={[
                  styles.tagText,
                  weather === t.value && styles.tagTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Occasion */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Occasion</Text>
        </View>
        <View style={styles.tagRow}>
          {OCCASION_OPTIONS.map((t) => (
            <Pressable
              key={t.value}
              style={({ pressed }) => [
                styles.tag,
                occasion === t.value && styles.tagActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setOccasion(occasion === t.value ? "" : t.value)}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={occasion === t.value ? Colors.textPrimary : Colors.textSecondary}
                style={styles.tagIcon}
              />
              <Text
                style={[
                  styles.tagText,
                  occasion === t.value && styles.tagTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Notes</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="今天的心情、场合、天气..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          textAlignVertical="top"
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.logBtn,
            !canSave && styles.logBtnDisabled,
            pressed && canSave && !loading && styles.pressed,
          ]}
          onPress={handleSave}
          disabled={!canSave || loading}
        >
          <Text style={styles.logBtnText}>
            {loading ? "保存中..." : `Log Outfit for ${displayDate}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Nav Header
  navHeader: {
    paddingTop: 48,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  dateLabel: {
    fontFamily: SERIF,
    fontSize: 22,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.textPrimary,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textInverse,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },

  // Log Options
  logOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: Spacing.xxl,
  },
  logOption: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...Shadows.sm,
  },
  logOptionSelected: {
    borderColor: Colors.textPrimary,
  },
  optIcon: {
    marginBottom: 10,
  },
  optName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Section Title
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
  },
  count: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Outfit List
  outfitList: {
    gap: 10,
    paddingBottom: 12,
  },
  outfitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
    ...Shadows.sm,
  },
  outfitRowSelected: {
    borderColor: Colors.textPrimary,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  thumbText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  outfitInfo: {
    flex: 1,
  },
  outfitName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  outfitMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  emptyOutfits: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  emptyOutfitsText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createBtn: {
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  createBtnText: {
    color: Colors.textInverse,
    fontWeight: "600",
    fontSize: FontSize.base,
  },

  // Photo Area
  photoArea: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    minHeight: 180,
    ...Shadows.sm,
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: Radius.md,
    resizeMode: "cover",
  },
  photoHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },

  // Tags
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  tagActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.textPrimary,
  },
  tagIcon: {
    marginRight: 6,
  },
  tagText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tagTextActive: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },

  // Notes
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: 100,
    lineHeight: 22,
    ...Shadows.sm,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 28,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.bg,
  },
  logBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
  },
  logBtnDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  logBtnText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },

  pressed: { opacity: PressedOpacity },
});
