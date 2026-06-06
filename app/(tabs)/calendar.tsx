import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, PressedOpacity } from "../../src/design/tokens";

export default function CalendarScreen() {
  const date = new Date();
  const [month, setMonth] = useState(date.getMonth());
  const [year] = useState(date.getFullYear());
  const [selected, setSelected] = useState(date.toISOString().slice(0, 10));
  const today = date.toISOString().slice(0, 10);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const months = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const weeks = ["日","一","二","三","四","五","六"];

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Magazine Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Calendar</Text>
        <Text style={S.headerSub}>{year}年 · 记录每一天的穿搭</Text>
      </View>

      {/* Month Navigation Card */}
      <View style={S.monthCard}>
        <View style={S.nav}>
          <Pressable style={S.navBtn} onPress={() => setMonth((m) => (m === 0 ? 11 : m - 1))}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={S.month}>{months[month]}</Text>
          <Pressable style={S.navBtn} onPress={() => setMonth((m) => (m === 11 ? 0 : m + 1))}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <View style={S.weekRow}>{weeks.map((d) => <Text key={d} style={S.weekDay}>{d}</Text>)}</View>

        <View style={S.grid}>
          {Array.from({ length: firstDay }).map((_, i) => <View key={`e-${i}`} style={S.day} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = ds === today;
            const isSel = ds === selected;
            return (
              <Pressable key={d} style={[S.day, isSel && S.daySel, isToday && !isSel && S.dayToday]} onPress={() => setSelected(ds)}>
                <Text style={[S.dayText, isSel && S.dayTextSel, isToday && !isSel && S.dayTextToday]}>{d}</Text>
                {isToday && <View style={[S.dot, isSel && S.dotWhite]} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Day Card */}
      <View style={S.detailCard}>
        <View style={S.detailHeader}>
          <Text style={S.detailDate}>{selected}</Text>
          {selected === today && <View style={S.todayBadge}><Text style={S.todayText}>今天</Text></View>}
        </View>
        <View style={S.divider} />
        <View style={S.emptyDay}>
          <Ionicons name="shirt-outline" size={32} color={Colors.textTertiary} />
          <Text style={S.emptyText}>暂无穿搭记录</Text>
          <Text style={S.emptyHint}>选择日期记录当日穿搭</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  headerTitle: { fontSize: 42, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -1.5, lineHeight: 48 },
  headerSub: { fontSize: FontSize.base, color: Colors.textTertiary, marginTop: Spacing.xs },

  monthCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  month: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },

  weekRow: { flexDirection: "row", marginBottom: Spacing.sm },
  weekDay: { flex: 1, textAlign: "center", fontSize: FontSize.xs, color: Colors.textTertiary, paddingVertical: Spacing.sm, fontWeight: "500" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: Radius.full },
  daySel: { backgroundColor: Colors.accent },
  dayToday: { backgroundColor: Colors.accentLight, borderWidth: 1, borderColor: Colors.accent },
  dayText: { fontSize: FontSize.base, color: Colors.textPrimary },
  dayTextSel: { color: Colors.textInverse, fontWeight: "700" },
  dayTextToday: { color: Colors.accent, fontWeight: "700" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, position: "absolute", bottom: 6 },
  dotWhite: { backgroundColor: Colors.textInverse },

  detailCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  detailDate: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  todayBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  todayText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: "600" },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: Spacing.xl },
  emptyDay: { alignItems: "center", paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
});
