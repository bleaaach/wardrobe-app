import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Alert, Platform } from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getDailyLogs,
  getOutfits,
  getAllClothing,
  deleteDailyLog,
  getDailyLogByDate,
} from "../../src/db/database";
import { DailyLog, Outfit, Clothing } from "../../src/types";
import { AsyncImage } from "../../src/components/AsyncImage";
import { PageTransition } from "../../src/components/PageTransition";
import { Colors, Radius, PressedOpacity, Shadows } from "../../src/design/tokens";

const SCREEN_W = Dimensions.get("window").width;
const PAD = 20;
const GAP = 8;
const DAY_SIZE = (SCREEN_W - PAD * 2 - GAP * 6) / 7;

const isSerif = Platform.OS === "ios" ? "Georgia" : "serif";

export default function CalendarScreen() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(now.toISOString().slice(0, 10));
  const today = now.toISOString().slice(0, 10);
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("month");

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(new Map());

  const load = useCallback(async () => {
    const [logs, os, all] = await Promise.all([getDailyLogs(), getOutfits(), getAllClothing()]);
    setDailyLogs(logs);
    setOutfits(os);
    const map = new Map<string, Clothing>();
    for (const c of all) map.set(c.id, c);
    setClothingMap(map);
  }, []);

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const weekLabels = ["M","T","W","T","F","S","S"];

  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const log of dailyLogs) map.set(log.date, log);
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

  const getLogClothingItems = (log: DailyLog | undefined) => {
    if (!log?.clothingIds) return [];
    try {
      const parsed = JSON.parse(log.clothingIds);
      if (!Array.isArray(parsed)) return [];
      const ids: string[] = parsed.map((entry: string | { id: string }) => typeof entry === "string" ? entry : entry.id);
      return ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
    } catch {
      return [];
    }
  };

  const selectedLog = logMap.get(selected);
  const selectedOutfit = selectedLog?.outfitId ? outfitMap.get(selectedLog.outfitId) : undefined;
  const selectedOutfitItems = selectedOutfit ? getOutfitItems(selectedOutfit) : [];
  const selectedLogItems = getLogClothingItems(selectedLog);
  const selectedItems = [...selectedOutfitItems, ...selectedLogItems];
  const hasLogContent = !!(selectedLog && (selectedItems.length > 0 || selectedLog.imageUri));

  const monthLogs = useMemo(() => dailyLogs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  }), [dailyLogs, year, month]);

  const monthOutfits = monthLogs.filter((l) => l.outfitId).length;
  const monthItems = monthLogs.reduce((sum, l) => {
    try { return sum + (l.clothingIds ? JSON.parse(l.clothingIds).length : 0); } catch { return sum; }
  }, 0);

  const handleDeleteLog = async () => {
    const log = await getDailyLogByDate(selected);
    if (!log) return;
    Alert.alert("鍒犻櫎璁板綍", "纭畾瑕佸垹闄よ繖澶╃殑绌挎惌璁板綍鍚楋紵", [
      { text: "鍙栨秷", style: "cancel" },
      { text: "鍒犻櫎", style: "destructive", onPress: async () => {
        await deleteDailyLog(log.id);
        await load();
      }},
    ]);
  };

  const selectedDateObj = new Date(selected + "T00:00:00");
  const selectedDayLabel = selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  return (
    <PageTransition>
    <ScrollView style={S.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.yearLabel}>{year}</Text>
        <View style={S.monthRow}>
          <Text style={[S.month, { fontFamily: isSerif }]}>{monthNames[month]}</Text>
          <View style={S.monthNav}>
            <Pressable style={({ pressed }) => [S.navBtn, pressed && { opacity: PressedOpacity }]} onPress={() => setMonth((m) => (m === 0 ? 11 : m - 1))}>
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Pressable style={({ pressed }) => [S.navBtn, pressed && { opacity: PressedOpacity }]} onPress={() => setMonth((m) => (m === 11 ? 0 : m + 1))}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* View Toggle */}
      <View style={S.viewToggle}>
        {(["week","month","year"] as const).map((mode) => (
          <Pressable key={mode} style={({ pressed }) => [S.toggleBtn, viewMode === mode ? S.toggleActive : S.toggleInactive, pressed && { opacity: PressedOpacity }]} onPress={() => setViewMode(mode)}>
            <Text style={[S.toggleText, viewMode === mode && { color: Colors.textInverse }]}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={S.gridWrap}>
        <View style={S.weekRow}>
          {weekLabels.map((d, i) => <Text key={i} style={S.weekLabel}>{d}</Text>)}
        </View>
        <View style={S.grid}>
          {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
            <View key={`e-${i}`} style={[S.day, { width: DAY_SIZE, height: DAY_SIZE }, S.dayEmpty]} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = ds === today;
            const isSel = ds === selected;
            const log = logMap.get(ds);
            const outfit = log?.outfitId ? outfitMap.get(log.outfitId) : undefined;
            const outfitItems = outfit ? getOutfitItems(outfit) : [];
            const logItems = getLogClothingItems(log);
            const allItems = [...outfitItems, ...logItems];
            const hasContent = allItems.length > 0 || !!log?.imageUri;
            const thumbUri = log?.imageUri ?? allItems[0]?.imageUri;

            return (
              <Pressable key={d} style={({ pressed }) => [
                S.day,
                { width: DAY_SIZE, height: DAY_SIZE },
                hasContent && S.dayHasOutfit,
                isSel && S.daySelected,
                pressed && { opacity: PressedOpacity }
              ]} onPress={() => setSelected(ds)}>
                {hasContent && thumbUri ? (
                  <>
                    <View style={S.dayThumb}>
                      <AsyncImage uri={thumbUri} style={{ width: 36, height: 36, borderRadius: 10 }} />
                    </View>
                    <Text style={[S.dayNumSmall, isToday && S.dayNumToday]}>{d}</Text>
                  </>
                ) : (
                  <Text style={[S.dayNum, isToday && S.dayNumToday]}>{d}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Day Detail */}
      <View style={S.detailSection}>
        <View style={S.detailHeader}>
          <Text style={S.dayLabel}>{selectedDayLabel}</Text>
          {hasLogContent && (
            <Pressable onPress={handleDeleteLog} style={({ pressed }) => [{ opacity: pressed ? PressedOpacity : 1 }]}>
              <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {hasLogContent ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: PAD }}>
              {selectedItems.map((item) => (
                <Pressable key={item.id} style={({ pressed }) => [S.card, pressed && { opacity: PressedOpacity }]} onPress={() => router.push(`/closet/${item.id}`)}>
                  <View style={S.cardThumb}>
                    {item.imageUri ? <AsyncImage uri={item.imageUri} style={{ width: 116, height: 100 }} /> : <Ionicons name="shirt" size={32} color={Colors.textTertiary} />}
                  </View>
                  <Text style={S.cardCat}>{item.categoryId?.toUpperCase() || "ITEM"}</Text>
                  <Text style={S.cardName} numberOfLines={1}>{item.name || "Unnamed"}</Text>
                </Pressable>
              ))}
              {selectedLog?.imageUri && (
                <View style={S.card}>
                  <View style={S.cardThumb}>
                    <AsyncImage uri={selectedLog.imageUri} style={{ width: 116, height: 100 }} />
                  </View>
                  <Text style={S.cardCat}>PHOTO</Text>
                  <Text style={S.cardName} numberOfLines={1}>Look of the day</Text>
                </View>
              )}
            </ScrollView>
            <Pressable style={({ pressed }) => [S.editLogBtn, pressed && { opacity: PressedOpacity }]} onPress={() => router.push(`/calendar/log?date=${selected}`)}>
              <Ionicons name="create-outline" size={14} color={Colors.textInverse} />
              <Text style={S.editLogBtnText}>缂栬緫璁板綍</Text>
            </Pressable>
          </>
        ) : (
          <View style={S.emptyDay}>
            <Text style={S.emptyDayText}>鏆傛棤璁板綍</Text>
            <Pressable style={({ pressed }) => [S.addPhotoBtn, pressed && { opacity: PressedOpacity }]} onPress={() => router.push(`/calendar/log?date=${selected}`)}>
              <Ionicons name="add" size={16} color={Colors.textInverse} />
              <Text style={S.addPhotoBtnText}>娣诲姞璁板綍</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={S.statsSection}>
        <Text style={S.statsLabel}>{monthNames[month].toUpperCase()} IN NUMBERS</Text>
        <View style={S.statsGrid}>
          <View style={S.statCard}>
            <Text style={[S.statNum, { fontFamily: isSerif }]}>{monthLogs.length}</Text>
            <Text style={S.statLabel}>Days</Text>
          </View>
          <View style={S.statCard}>
            <Text style={[S.statNum, { fontFamily: isSerif }]}>{monthItems}</Text>
            <Text style={S.statLabel}>Items</Text>
          </View>
          <View style={S.statCard}>
            <Text style={[S.statNum, { fontFamily: isSerif }]}>{monthOutfits}</Text>
            <Text style={S.statLabel}>Outfits</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </PageTransition>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingTop: 56, paddingHorizontal: PAD, marginBottom: 20 },
  yearLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500", marginBottom: 2 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  month: { fontSize: 42, fontStyle: "italic", fontWeight: "600", color: Colors.textPrimary },
  monthNav: { flexDirection: "row", gap: 16, alignItems: "center" },
  navBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },

  viewToggle: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20, paddingHorizontal: PAD },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  toggleActive: { backgroundColor: Colors.textPrimary },
  toggleInactive: { backgroundColor: "transparent" },
  toggleText: { fontSize: 14, fontWeight: "500", color: Colors.textSecondary },

  gridWrap: { paddingHorizontal: PAD },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekLabel: { width: DAY_SIZE, textAlign: "center", fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1, color: Colors.textSecondary, paddingVertical: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  day: { width: DAY_SIZE, height: DAY_SIZE, borderRadius: 14, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  dayEmpty: { pointerEvents: "none" },
  dayHasOutfit: { backgroundColor: Colors.surface, ...Shadows.sm },
  daySelected: { borderWidth: 2, borderColor: Colors.textPrimary },
  dayNum: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  dayNumSmall: { fontSize: 10, fontWeight: "500", color: Colors.textSecondary, marginTop: 2 },
  dayNumToday: { color: Colors.accent, fontWeight: "700" },
  dayThumb: { width: 36, height: 36, borderRadius: 10, overflow: "hidden", justifyContent: "center", alignItems: "center" },

  detailSection: { marginTop: 24, paddingHorizontal: PAD, marginBottom: 24 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  dayLabel: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 3, color: Colors.textSecondary },
  card: { minWidth: 140, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 12, ...Shadows.sm },
  cardThumb: { width: "100%", height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  cardCat: { fontSize: 10, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1.5, color: Colors.textSecondary, marginBottom: 2 },
  cardName: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  emptyDay: { alignItems: "center", paddingVertical: 24, backgroundColor: Colors.surface, borderRadius: Radius.lg, ...Shadows.sm },
  emptyDayText: { fontSize: 14, color: Colors.textTertiary, marginBottom: 12 },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.textPrimary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addPhotoBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  editLogBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.textPrimary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 16, alignSelf: "center" },
  editLogBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  statsSection: { marginBottom: 24, paddingHorizontal: PAD },
  statsLabel: { fontSize: 12, fontWeight: "500", textTransform: "uppercase", letterSpacing: 3, color: Colors.textSecondary, marginBottom: 12 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center", ...Shadows.sm },
  statNum: { fontSize: 32, fontWeight: "600", color: Colors.textPrimary, lineHeight: 34, marginBottom: 6 },
  statLabel: { fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 1.5, color: Colors.textSecondary },
});
