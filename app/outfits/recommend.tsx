import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  getAllClothing,
  getCategories,
  getOutfits,
  addOutfit,
  addDailyLog,
} from "../../src/db/database";
import { Clothing, Outfit, Category } from "../../src/types";
import { OutfitPreview } from "../../src/components/OutfitPreview";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import {
  Spacing,
  Radius,
  FontSize,
  TouchMin,
  PressedOpacity,
  ThemeColors,
} from "../../src/design/tokens";
import {
  getRecommendations,
  RecommendationContext,
  RecommendationResult,
} from "../../src/services/recommendationEngine";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function StarRating({ score, colors }: { score: number; colors: ThemeColors }) {
  const fullStars = Math.floor(score / 2);
  const halfStar = score / 2 - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={14} color={colors.warning} />
      ))}
      {halfStar && (
        <Ionicons name="star-half" size={14} color={colors.warning} />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Ionicons
          key={`e${i}`}
          name="star-outline"
          size={14}
          color={colors.textTertiary}
        />
      ))}
      <Text
        style={{
          fontSize: FontSize.sm,
          color: colors.textSecondary,
          marginLeft: 4,
          fontWeight: "600",
        }}
      >
        {score.toFixed(1)}
      </Text>
    </View>
  );
}

export default function RecommendScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [clothing, setClothing] = useState<Clothing[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);

  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [results, setResults] = useState<RecommendationResult[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allClothing, allCats, allOutfits] = await Promise.all([
        getAllClothing(),
        getCategories(),
        getOutfits(),
      ]);
      setClothing(allClothing);
      setCategories(allCats);
      setOutfits(allOutfits);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRecommend = () => {
    if (clothing.length === 0) return;
    const context: RecommendationContext = {
      occasion: occasion || undefined,
      weather: weather || undefined,
      mood: mood || undefined,
    };
    setRecommending(true);
    // 轻微延迟让 UI 有机会显示加载状态
    setTimeout(() => {
      const res = getRecommendations(context, outfits, clothing, categories);
      setResults(res);
      setRecommending(false);
    }, 50);
  };

  const handleSaveOutfit = async (result: RecommendationResult) => {
    try {
      if (result.outfitId) {
        Alert.alert("保存成功", "该搭配已存在于搭配库中");
        return;
      }
      const name = result.name || "智能推荐搭配";
      await addOutfit({
        name,
        clothingIds: JSON.stringify(result.clothingIds),
        notes: `推荐原因：${result.reason}`,
      });
      Alert.alert("保存成功", `"${name}" 已保存到搭配库`);
    } catch (e) {
      Alert.alert("保存失败", String(e));
    }
  };

  const handleLogCalendar = async (result: RecommendationResult) => {
    try {
      const today = formatDate(new Date());
      await addDailyLog({
        date: today,
        outfitId: result.outfitId || undefined,
        clothingIds: result.outfitId ? undefined : JSON.stringify(result.clothingIds),
        mood: mood || undefined,
        weather: weather || undefined,
        occasion: occasion || undefined,
        notes: `智能推荐：${result.reason}`,
      });
      Alert.alert("记录成功", `已记录到 ${today} 的穿搭日历`);
    } catch (e) {
      Alert.alert("记录失败", String(e));
    }
  };

  const occasionOptions = [
    { label: "💼 通勤", value: "通勤" },
    { label: "🏃 运动", value: "运动" },
    { label: "🎉 聚会", value: "聚会" },
    { label: "🏠 居家", value: "居家" },
    { label: "✈️ 旅行", value: "旅行" },
    { label: "❤️ 约会", value: "约会" },
  ];

  const weatherOptions = [
    { label: "☀️ 晴", value: "晴" },
    { label: "🌤️ 多云", value: "多云" },
    { label: "🌧️ 雨", value: "雨" },
    { label: "❄️ 雪", value: "雪" },
    { label: "🥶 寒冷", value: "寒冷" },
    { label: "🥵 炎热", value: "炎热" },
  ];

  const moodOptions = [
    { label: "😊 开心", value: "开心" },
    { label: "😐 正式", value: "正式" },
    { label: "😌 休闲", value: "休闲" },
    { label: "⚡ 活力", value: "活力" },
  ];

  if (loading) {
    return (
      <View style={[S(colors).container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (clothing.length === 0) {
    return (
      <View style={S(colors).container}>
        <View style={S(colors).header}>
          <Pressable style={S(colors).backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={S(colors).headerTitle}>智能推荐</Text>
          <View style={S(colors).backBtn} />
        </View>
        <View style={S(colors).emptyWrap}>
          <Ionicons name="shirt-outline" size={48} color={colors.textTertiary} />
          <Text style={S(colors).emptyTitle}>衣橱是空的</Text>
          <Text style={S(colors).emptySub}>先去添加衣物吧</Text>
          <Pressable
            style={({ pressed }) => [S(colors).emptyBtn, pressed && S(colors).pressed]}
            onPress={() => router.push("/closet/add")}
          >
            <Text style={S(colors).emptyBtnText}>去添加衣物</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={S(colors).container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S(colors).scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={S(colors).header}>
          <Pressable style={S(colors).backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={S(colors).headerTitle}>智能推荐</Text>
          <View style={S(colors).backBtn} />
        </View>

        {/* Filters */}
        <View style={S(colors).section}>
          <Text style={S(colors).sectionTitle}>场合</Text>
          <View style={S(colors).tagRow}>
            {occasionOptions.map((o) => (
              <Pressable
                key={o.value}
                style={({ pressed }) => [
                  S(colors).tag,
                  occasion === o.value && S(colors).tagActive,
                  pressed && S(colors).pressed,
                ]}
                onPress={() => setOccasion(occasion === o.value ? "" : o.value)}
              >
                <Text
                  style={[
                    S(colors).tagText,
                    occasion === o.value && S(colors).tagTextActive,
                  ]}
                >
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={S(colors).section}>
          <Text style={S(colors).sectionTitle}>天气</Text>
          <View style={S(colors).tagRow}>
            {weatherOptions.map((w) => (
              <Pressable
                key={w.value}
                style={({ pressed }) => [
                  S(colors).tag,
                  weather === w.value && S(colors).tagActive,
                  pressed && S(colors).pressed,
                ]}
                onPress={() => setWeather(weather === w.value ? "" : w.value)}
              >
                <Text
                  style={[
                    S(colors).tagText,
                    weather === w.value && S(colors).tagTextActive,
                  ]}
                >
                  {w.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={S(colors).section}>
          <Text style={S(colors).sectionTitle}>心情</Text>
          <View style={S(colors).tagRow}>
            {moodOptions.map((m) => (
              <Pressable
                key={m.value}
                style={({ pressed }) => [
                  S(colors).tag,
                  mood === m.value && S(colors).tagActive,
                  pressed && S(colors).pressed,
                ]}
                onPress={() => setMood(mood === m.value ? "" : m.value)}
              >
                <Text
                  style={[
                    S(colors).tagText,
                    mood === m.value && S(colors).tagTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recommend Button */}
        <Pressable
          style={({ pressed }) => [
            S(colors).recommendBtn,
            recommending && S(colors).recommendBtnDisabled,
            pressed && !recommending && S(colors).pressed,
          ]}
          onPress={handleRecommend}
          disabled={recommending}
        >
          {recommending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={colors.textInverse} />
              <Text style={S(colors).recommendBtnText}>获取推荐</Text>
            </>
          )}
        </Pressable>

        {/* Results */}
        {results.length > 0 && (
          <View style={S(colors).resultsSection}>
            <Text style={S(colors).resultsTitle}>
              为你推荐 ({results.length})
            </Text>
            <View style={S(colors).cards}>
              {results.map((result, index) => (
                <View key={`${result.clothingIds.join(",")}-${index}`} style={S(colors).card}>
                  <View style={S(colors).cardPreview}>
                    <OutfitPreview items={result.items} size={100} />
                  </View>
                  <View style={S(colors).cardInfo}>
                    <Text style={S(colors).cardName} numberOfLines={1}>
                      {result.name}
                    </Text>
                    <StarRating score={result.score} colors={colors} />
                    <Text style={S(colors).cardReason} numberOfLines={2}>
                      {result.reason}
                    </Text>
                    <View style={S(colors).cardActions}>
                      <Pressable
                        style={({ pressed }) => [
                          S(colors).actionBtn,
                          S(colors).saveBtn,
                          pressed && S(colors).pressed,
                        ]}
                        onPress={() => handleSaveOutfit(result)}
                      >
                        <Ionicons
                          name="bookmark-outline"
                          size={14}
                          color={colors.textInverse}
                        />
                        <Text style={S(colors).actionBtnText}>保存搭配</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          S(colors).actionBtn,
                          S(colors).logBtn,
                          pressed && S(colors).pressed,
                        ]}
                        onPress={() => handleLogCalendar(result)}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.accent}
                        />
                        <Text style={S(colors).logBtnText}>记录到日历</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const S = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingTop: 48, paddingHorizontal: Spacing.xl, paddingBottom: 20 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.xl,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: FontSize.xxl,
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },

    section: { marginBottom: Spacing.xl },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: Spacing.md,
    },

    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.md,
    },
    tag: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.lg,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accentMuted,
    },
    tagText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    tagTextActive: {
      color: colors.accent,
      fontWeight: "700",
    },

    recommendBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: Radius.xl,
      paddingVertical: 16,
      minHeight: TouchMin,
      marginBottom: Spacing.xl,
    },
    recommendBtnDisabled: { opacity: 0.6 },
    recommendBtnText: {
      color: colors.textInverse,
      fontSize: FontSize.md,
      fontWeight: "700",
    },

    resultsSection: { marginTop: Spacing.md },
    resultsTitle: {
      fontSize: FontSize.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: Spacing.lg,
    },
    cards: { gap: Spacing.lg },
    card: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    cardPreview: { marginRight: Spacing.lg },
    cardInfo: { flex: 1 },
    cardName: {
      fontSize: FontSize.md,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    cardReason: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    cardActions: {
      flexDirection: "row",
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: Radius.lg,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    saveBtn: {
      backgroundColor: colors.accent,
    },
    actionBtnText: {
      color: colors.textInverse,
      fontSize: FontSize.sm,
      fontWeight: "600",
    },
    logBtn: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logBtnText: {
      color: colors.accent,
      fontSize: FontSize.sm,
      fontWeight: "600",
    },

    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
      fontSize: FontSize.lg,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: Spacing.lg,
    },
    emptySub: {
      fontSize: FontSize.sm,
      color: colors.textTertiary,
      marginTop: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    emptyBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: Radius.lg,
    },
    emptyBtnText: {
      color: colors.textInverse,
      fontWeight: "600",
      fontSize: FontSize.base,
    },

    pressed: { opacity: PressedOpacity },
  });
