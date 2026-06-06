import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getDailyLogs,
  getOutfits,
  getAllClothing,
  deleteDailyLog,
} from "../../src/db/database";
import { DailyLog, Outfit, Clothing } from "../../src/types";
import { OutfitPreview } from "../../src/components/OutfitPreview";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  PressedOpacity,
} from "../../src/design/tokens";

const SCREEN_W = Dimensions.get("window").width;
const DAY_SIZE = (SCREEN_W - Spacing.xl * 2 - Spacing.xl * 2) / 7;

export default function CalendarScreen() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(
    now.toISOString().slice(0, 10)
  );
  const today = now.toISOString().slice(0, 10);

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(
    new Map()
  );

  const load = useCallback(async () => {
    const [logs, os, all] = await Promise.all([
      getDailyLogs(),
      getOutfits(),
      getAllClothing(),
    ]);
    setDailyLogs(logs);
    setOutfits(os);
    const map = new Map<string, Clothing>();
    for (const c of all) map.set(c.id, c);
    setClothingMap(map);
  }, []);

  useEffect(() => {
    load();
  }, []);

  // 聚焦时刷新
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const months = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  const weeks = ["日", "一", "二", "三", "四", "五", "六"];

  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const log of dailyLogs) {
      map.set(log.date, log);
    }
    return map;
  }, [dailyLogs]);

  const outfitMap = useMemo(() => {
    const map = new Map<string, Outfit>();
    for (const o of outfits) map.set(o.id, o);
    return map;
  }, [outfits]);

  const getOutfitItems = (o: Outfit | undefined) => {
    if (!o) return [];
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    return ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
  };

  const selectedLog = logMap.get(selected);
  const selectedOutfit = selectedLog?.outfitId
    ? outfitMap.get(selectedLog.outfitId)
    : undefined;
  const selectedItems = getOutfitItems(selectedOutfit);

  const handleDeleteLog = () => {
    if (!selectedLog) return;
    Alert.alert("删除记录", "确定要删除这天的穿搭记录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteDailyLog(selectedLog.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Magazine Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Calendar</Text>
        <Text style={S.headerSub}>{year}年 · 记录每一天的穿搭</Text>
      </View>

      {/* Month Navigation Card */}
      <View style={S.monthCard}>
        {/* Year */}
        <View style={S.yearNav}>
          <Pressable
            style={S.navBtn}
            onPress={() => setYear((y) => y - 1)}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={Colors.textTertiary}
            />
          </Pressable>
          <Text style={S.yearText}>{year}年</Text>
          <Pressable
            style={S.navBtn}
            onPress={() => setYear((y) => y + 1)}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textTertiary}
            />
          </Pressable>
        </View>

        <View style={S.nav}>
          <Pressable
            style={S.navBtn}
            onPress={() =>
              setMonth((m) => (m === 0 ? 11 : m - 1))
            }
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={Colors.textPrimary}
            />
          </Pressable>
          <Text style={S.month}>{months[month]}</Text>
          <Pressable
            style={S.navBtn}
            onPress={() =>
              setMonth((m) => (m === 11 ? 0 : m + 1))
            }
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textPrimary}
            />
          </Pressable>
        </View>

        <View style={S.weekRow}>
          {weeks.map((d) => (
            <Text key={d} style={S.weekDay}>
              {d}
            </Text>
          ))}
        </View>

        <View style={S.grid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`e-${i}`} style={[S.day, { width: DAY_SIZE }]} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = ds === today;
            const isSel = ds === selected;
            const log = logMap.get(ds);
            const outfit = log?.outfitId
              ? outfitMap.get(log.outfitId)
              : undefined;
            const items = getOutfitItems(outfit);
            const hasPhoto = items.length > 0;

            return (
              <Pressable
                key={d}
                style={[
                  S.day,
                  { width: DAY_SIZE },
                  isSel && S.daySel,
                  isToday && !isSel && S.dayToday,
                ]}
                onPress={() => setSelected(ds)}
              >
                {hasPhoto ? (
                  <View
                    style={[
                      S.dayPhoto,
                      isSel && S.dayPhotoSel,
                    ]}
                  >
                    <OutfitPreview items={items} size={DAY_SIZE - 4} />
                  </View>
                ) : null}
                <View
                  style={[
                    S.dayLabel,
                    hasPhoto && S.dayLabelOnPhoto,
                  ]}
                >
                  <Text
                    style={[
                      S.dayText,
                      isSel && S.dayTextSel,
                      isToday && !isSel && S.dayTextToday,
                      hasPhoto && S.dayTextOnPhoto,
                    ]}
                  >
                    {d}
                  </Text>
                </View>
                {isToday && !hasPhoto && (
                  <View style={[S.dot, isSel && S.dotWhite]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Day Card */}
      <View style={S.detailCard}>
        <View style={S.detailHeader}>
          <Text style={S.detailDate}>
            {new Date(selected + "T00:00:00").toLocaleDateString("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </Text>
          {selected === today && (
            <View style={S.todayBadge}>
              <Text style={S.todayText}>今天</Text>
            </View>
          )}
        </View>
        <View style={S.divider} />

        {selectedLog && selectedOutfit ? (
          <View>
            {/* Outfit Preview */}
            <Pressable
              style={S.outfitPreviewWrap}
              onPress={() =>
                router.push(`/outfits/${selectedOutfit.id}`)
              }
            >
              <OutfitPreview items={selectedItems} size={280} />
            </Pressable>

            <View style={S.outfitInfo}>
              <Text style={S.outfitName}>
                {selectedOutfit.name || "未命名搭配"}
              </Text>
              <Text style={S.outfitMeta}>
                {selectedItems.length} 件衣物
              </Text>
              {selectedLog.notes ? (
                <Text style={S.outfitNote}>{selectedLog.notes}</Text>
              ) : null}
            </View>

            {/* Items */}
            <View style={S.itemsRow}>
              {selectedItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    S.itemCard,
                    pressed && S.pressed,
                  ]}
                  onPress={() =>
                    router.push(`/closet/${item.id}`)
                  }
                >
                  <View style={S.itemImageWrap}>
                    <OutfitPreview items={[item]} size={64} />
                  </View>
                  <Text style={S.itemName} numberOfLines={1}>
                    {item.name || "未命名"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <View style={S.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  S.actionBtn,
                  S.actionBtnPrimary,
                  pressed && S.pressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/calendar/log",
                    params: { date: selected },
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={Colors.textInverse}
                />
                <Text style={S.actionBtnPrimaryText}>修改</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  S.actionBtn,
                  S.actionBtnDanger,
                  pressed && S.pressed,
                ]}
                onPress={handleDeleteLog}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={Colors.danger}
                />
                <Text style={S.actionBtnDangerText}>删除</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={S.emptyDay}>
            <Ionicons
              name="shirt-outline"
              size={32}
              color={Colors.textTertiary}
            />
            <Text style={S.emptyText}>暂无穿搭记录</Text>
            <Text style={S.emptyHint}>选择日期记录当日穿搭</Text>
            <Pressable
              style={({ pressed }) => [
                S.addBtn,
                pressed && S.pressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/calendar/log",
                  params: { date: selected },
                })
              }
            >
              <Ionicons
                name="add"
                size={20}
                color={Colors.textInverse}
              />
              <Text style={S.addBtnText}>记录穿搭</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  headerSub: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },

  monthCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  yearNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  yearText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },

  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  month: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  weekRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekDay: {
    width: DAY_SIZE,
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    paddingVertical: Spacing.sm,
    fontWeight: "500",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
    marginBottom: 2,
    position: "relative",
    overflow: "hidden",
  },
  daySel: {
    backgroundColor: Colors.accent,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  dayPhoto: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: Radius.sm,
    overflow: "hidden",
    opacity: 0.9,
  },
  dayPhotoSel: {
    opacity: 1,
  },
  dayLabel: {
    position: "absolute",
    top: 4,
    left: 4,
    zIndex: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  dayLabelOnPhoto: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dayText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  dayTextSel: {
    color: Colors.textInverse,
    fontWeight: "700",
  },
  dayTextToday: {
    color: Colors.accent,
    fontWeight: "700",
  },
  dayTextOnPhoto: {
    color: Colors.textInverse,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    position: "absolute",
    bottom: 6,
  },
  dotWhite: {
    backgroundColor: Colors.textInverse,
  },

  detailCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailDate: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  todayText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.xl,
  },

  emptyDay: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  addBtnText: {
    color: Colors.textInverse,
    fontWeight: "600",
    fontSize: FontSize.base,
  },

  outfitPreviewWrap: {
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  outfitInfo: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  outfitName: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  outfitMeta: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  outfitNote: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },

  itemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  itemCard: {
    width: 80,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    paddingBottom: 8,
  },
  itemImageWrap: {
    width: 80,
    height: 80,
    marginBottom: 6,
  },
  itemName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    paddingHorizontal: 6,
    textAlign: "center",
  },

  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    minHeight: 44,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  actionBtnPrimaryText: {
    color: Colors.textInverse,
    fontWeight: "600",
    fontSize: FontSize.base,
  },
  actionBtnDanger: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  actionBtnDangerText: {
    color: Colors.danger,
    fontWeight: "600",
    fontSize: FontSize.base,
  },

  pressed: { opacity: PressedOpacity },
});
