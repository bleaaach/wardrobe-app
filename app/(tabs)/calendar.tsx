import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const today = new Date().toISOString().slice(0, 10);
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const prevMonth = () => setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
  const nextMonth = () => setCurrentMonth((m) => (m === 11 ? 0 : m + 1));

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <Pressable onPress={prevMonth}><Ionicons name="chevron-back" size={24} color="#6366f1" /></Pressable>
        <Text style={styles.monthTitle}>{currentYear}年 {monthNames[currentMonth]}</Text>
        <Pressable onPress={nextMonth}><Ionicons name="chevron-forward" size={24} color="#6366f1" /></Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekRow}>
        {weekDays.map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calGrid}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <Pressable key={day} style={[styles.dayCell, isSelected && styles.daySelected, isToday && styles.dayToday]} onPress={() => setSelectedDate(dateStr)}>
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isToday && styles.dayTextToday]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Date */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 {selectedDate}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyText}>这天还没有穿搭记录</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16 },
  monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  monthTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12, color: "#9ca3af", paddingVertical: 8 },
  calGrid: { flexDirection: "row", flexWrap: "wrap", backgroundColor: "#fff", borderRadius: 16, padding: 4 },
  dayCell: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center" },
  daySelected: { backgroundColor: "#6366f1", borderRadius: 12 },
  dayToday: { backgroundColor: "#eef2ff", borderRadius: 12 },
  dayText: { fontSize: 15, color: "#374151" },
  dayTextSelected: { color: "#fff", fontWeight: "600" },
  dayTextToday: { color: "#6366f1", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 20 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 24 },
  emptyText: { color: "#9ca3af", marginTop: 8 },
});
