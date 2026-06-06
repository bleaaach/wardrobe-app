import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { Header } from "../../src/components/ui/Header";
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
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <Header title="穿搭日历" />

      <View style={S.nav}>
        <Pressable onPress={() => setMonth((m) => (m === 0 ? 11 : m - 1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={S.month}>{year}年 {months[month]}</Text>
        <Pressable onPress={() => setMonth((m) => (m === 11 ? 0 : m + 1))} hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
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

      <View style={S.card}>
        <Text style={S.cardTitle}>{selected}</Text>
        <Text style={S.cardSub}>暂无穿搭记录</Text>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xxl },
  month: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary },
  weekRow: { flexDirection: "row", marginBottom: Spacing.sm },
  weekDay: { flex: 1, textAlign: "center", fontSize: FontSize.xs, color: Colors.textTertiary, paddingVertical: Spacing.sm, fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: Radius.full },
  daySel: { backgroundColor: Colors.accent },
  dayToday: { backgroundColor: Colors.accentLight },
  dayText: { fontSize: FontSize.base, color: Colors.textPrimary },
  dayTextSel: { color: Colors.textInverse, fontWeight: "600" },
  dayTextToday: { color: Colors.accent, fontWeight: "600" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, position: "absolute", bottom: 6 },
  dotWhite: { backgroundColor: Colors.textInverse },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, marginTop: Spacing.xxl, alignItems: "center" },
  cardTitle: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.sm },
});
