import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AsyncImage } from "../../src/components/AsyncImage";
import { PageTransition } from "../../src/components/PageTransition";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { Colors, Spacing, Radius } from "../../src/design/tokens";
import { useState, useEffect } from "react";
import { Clothing, Category, DailyLog } from "../../src/types";
import {
  getDailyLogByDate,
  addDailyLog,
  updateDailyLog,
} from "../../src/db/database";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const PARENT_EN_MAP: Record<string, string> = {
  ???: "TOPS",
  ???: "BOTTOMS",
  ??????: "DRESS",
  ???: "OUTER",
  ???: "SHOES",
  ???: "BAGS",
  ???: "ACCESSORIES",
};

const PARENT_ABBR_MAP: Record<string, string> = {
  ???: "TO",
  ???: "BT",
  ??????: "DR",
  ???: "CO",
  ???: "SH",
  ???: "BG",
  ???: "AC",
};

interface DailyClothingEntry {
  id: string;
  time?: string;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function parseDailyClothingIds(clothingIds?: string): DailyClothingEntry[] {
  if (!clothingIds) return [];
  try {
    const parsed = JSON.parse(clothingIds);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === "string") {
        return parsed.map((id: string) => ({ id }));
      }
      return parsed as DailyClothingEntry[];
    }
  } catch {}
  return [];
}

function getParentCategoryName(
  categoryId: string,
  categories: Category[]
): string | undefined {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return undefined;
  const parent = categories.find((c) => c.id === cat.parentId);
  return parent?.name;
}

export default function HomeScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const now = new Date();
  const isSerif = Platform.OS === "ios" ? "Georgia" : "serif";

  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerFilter, setPickerFilter] = useState("ALL");

  const todayStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    getDailyLogByDate(todayStr).then(setDailyLog);
  }, [items, todayStr]);

  const todayEntries = parseDailyClothingIds(dailyLog?.clothingIds);
  const todayItems = todayEntries
    .map((entry) => {
      const item = items.find((i) => i.id === entry.id);
      return { entry, item };
    })
    .filter(
      (d): d is { entry: DailyClothingEntry; item: Clothing } => !!d.item
    );

  const entryCount = todayItems.length;

  const addToToday = async (clothingId: string) => {
    const existing = await getDailyLogByDate(todayStr);
    const time = formatTime(new Date());
    if (existing) {
      const entries = parseDailyClothingIds(existing.clothingIds);
      if (entries.find((e) => e.id === clothingId)) {
        setShowPicker(false);
        return;
      }
      entries.push({ id: clothingId, time });
      await updateDailyLog(existing.id, {
        clothingIds: JSON.stringify(entries),
      });
      setDailyLog({ ...existing, clothingIds: JSON.stringify(entries) });
    } else {
      const log = await addDailyLog({
        date: todayStr,
        clothingIds: JSON.stringify([{ id: clothingId, time }]),
      });
      setDailyLog(log);
    }
    setShowPicker(false);
  };

  const removeFromToday = async (clothingId: string) => {
    if (!dailyLog) return;
    const entries = parseDailyClothingIds(dailyLog.clothingIds).filter(
      (e) => e.id !== clothingId
    );
    await updateDailyLog(dailyLog.id, {
      clothingIds: JSON.stringify(entries),
    });
    setDailyLog({ ...dailyLog, clothingIds: JSON.stringify(entries) });
  };

  const parentCategories = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const allFilterOptions = [
    "ALL",
    ...parentCategories.map(
      (c) => PARENT_EN_MAP[c.name] || c.name.toUpperCase()
    ),
  ];

  const pickerItems = items.filter((item) => {
    if (pickerFilter === "ALL") return true;
    const parentName = getParentCategoryName(item.categoryId, categories);
    return PARENT_EN_MAP[parentName || ""] === pickerFilter;
  });

  return (
    <PageTransition>
    <View style={S.container}>
      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scrollContent}
      >
        {/* Header */}
        <View style={S.header}>
          <Text style={S.weekday}>{WEEKDAYS[now.getDay()]}</Text>
          <View style={S.dateRow}>
            <Text style={[S.date, { fontFamily: isSerif }]}>
              {MONTHS[now.getMonth()]} {now.getDate()}
            </Text>
            <Pressable
              style={S.addBtn}
              onPress={() => setShowPicker(true)}
            >
              <Text style={S.addBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Section Title */}
        <View style={S.sectionTitleRow}>
          <Text style={S.sectionTitle}>TODAY'S OUTFIT</Text>
          <Text style={S.sectionCount}>{entryCount} entries</Text>
        </View>

        {/* Outfit List */}
        {entryCount === 0 ? (
          <View style={S.empty}>
            <Text style={S.emptyText}>No outfits logged for today</Text>
            <Pressable
              style={S.emptyCTA}
              onPress={() => setShowPicker(true)}
            >
              <Text style={S.emptyCTAText}>+ Add your first item</Text>
            </Pressable>
          </View>
        ) : (
          <View style={S.outfitList}>
            {todayItems.map(({ entry, item }) => {
              const parentName = getParentCategoryName(
                item.categoryId,
                categories
              );
              const categoryLabel =
                PARENT_EN_MAP[parentName || ""] || parentName || "";
              const abbr =
                PARENT_ABBR_MAP[parentName || ""] ||
                categoryLabel.slice(0, 2).toUpperCase();
              return (
                <Pressable
                  key={item.id}
                  style={S.outfitItem}
                  onPress={() => router.push(`/closet/${item.id}`)}
                  onLongPress={() => removeFromToday(item.id)}
                >
                  <View style={S.outfitThumb}>
                    {item.imageUri ? (
                      <AsyncImage
                        uri={item.imageUri}
                        style={S.outfitThumbImg}
                      />
                    ) : (
                      <Text style={S.outfitThumbText}>{abbr}</Text>
                    )}
                  </View>
                  <View style={S.outfitInfo}>
                    <View style={S.outfitMeta}>
                      <Text style={S.outfitMetaText}>{categoryLabel}</Text>
                      {entry.time ? (
                        <>
                          <View style={S.outfitMetaDot} />
                          <Text style={S.outfitMetaText}>{entry.time}</Text>
                        </>
                      ) : null}
                    </View>
                    <Text style={S.outfitName}>
                      {item.name || "?????"}
                    </Text>
                    {item.notes ? (
                      <Text style={S.outfitDesc} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Picker Modal */}
      {showPicker && (
        <View style={S.pickerOverlay}>
          <Pressable
            style={S.pickerBackdrop}
            onPress={() => setShowPicker(false)}
          />
          <View style={S.pickerSheet}>
            <View style={S.pickerHeader}>
              <Text style={S.pickerTitle}>Add to Today's Outfit</Text>
              <Pressable onPress={() => setShowPicker(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={Colors.textPrimary}
                />
              </Pressable>
            </View>

            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={S.chipScroll}
            >
              <View style={S.chipRow}>
                {allFilterOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      S.chip,
                      pickerFilter === opt && S.chipActive,
                    ]}
                    onPress={() => setPickerFilter(opt)}
                  >
                    <Text
                      style={[
                        S.chipText,
                        pickerFilter === opt && S.chipActiveText,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Clothing Grid */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={S.pickerScroll}
            >
              <View style={S.pickerGrid}>
                {pickerItems.map((item) => {
                  const parentName = getParentCategoryName(
                    item.categoryId,
                    categories
                  );
                  const abbr = PARENT_ABBR_MAP[parentName || ""] || "";
                  return (
                    <Pressable
                      key={item.id}
                      style={S.pickerGridItem}
                      onPress={() => addToToday(item.id)}
                    >
                      <View style={S.pickerGridThumb}>
                        {item.imageUri ? (
                          <AsyncImage
                            uri={item.imageUri}
                            style={S.pickerGridImg}
                          />
                        ) : (
                          <Text style={S.pickerGridAbbr}>{abbr}</Text>
                        )}
                      </View>
                      <Text
                        style={S.pickerGridLabel}
                        numberOfLines={1}
                      >
                        {item.name || "?????"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
    </PageTransition>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  header: { marginBottom: 24 },
  weekday: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  date: {
    fontSize: 52,
    fontStyle: "italic",
    fontWeight: "600",
    lineHeight: 57,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: Colors.textPrimary,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: { color: "#fff", fontSize: 28, fontWeight: "300" },

  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "400",
  },

  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, marginBottom: 16 },
  emptyCTA: {
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyCTAText: { color: Colors.textInverse, fontSize: 15, fontWeight: "600" },

  outfitList: { gap: 16 },
  outfitItem: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  outfitThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    overflow: "hidden",
    flexShrink: 0,
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitThumbImg: { width: "100%", height: "100%" },
  outfitThumbText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  outfitInfo: { flex: 1, paddingTop: 2 },
  outfitMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  outfitMetaText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: Colors.textSecondary,
  },
  outfitMetaDot: {
    width: 3,
    height: 3,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1.5,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 3,
    lineHeight: 23,
  },
  outfitDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Picker
  pickerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  pickerBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  pickerSheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "85%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  chipScroll: { marginHorizontal: -20, marginBottom: 16 },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
  },
  chipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  chipText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  chipActiveText: { color: Colors.textInverse, fontWeight: "600" },
  pickerScroll: { maxHeight: 400 },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  pickerGridItem: {
    width: "33.333%",
    padding: 6,
  },
  pickerGridThumb: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pickerGridImg: { width: "100%", height: "100%" },
  pickerGridAbbr: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  pickerGridLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
});
