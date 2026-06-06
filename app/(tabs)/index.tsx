import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useClothingStore } from "../../src/store/clothingStore";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const [todayLog, setTodayLog] = useState<string[]>([]);

  const favorites = items.filter((i) => i.favorite === 1).slice(0, 6);
  const totalItems = items.length;
  const categories = [...new Set(items.map((i) => i.categoryId))].length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.greeting}>
        {new Date().getHours() < 12 ? "☀️ 早上好" : new Date().getHours() < 18 ? "🌤 下午好" : "🌙 晚上好"}
      </Text>
      <Text style={styles.date}>
        {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
      </Text>

      {/* Today's Outfit */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📸 今日穿搭</Text>
        {todayLog.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>还没有记录今天的穿搭</Text>
            <Pressable style={styles.addBtn} onPress={() => router.push("/outfits/create")}>
              <Text style={styles.addBtnText}>+ 记录今日穿搭</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.todayImages}>{/* Show today's outfit items */}</View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalItems}</Text>
          <Text style={styles.statLabel}>衣物总数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{categories}</Text>
          <Text style={styles.statLabel}>分类数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{favorites.length}</Text>
          <Text style={styles.statLabel}>收藏</Text>
        </View>
      </View>

      {/* Favorites */}
      {favorites.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⭐ 心爱之物</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {favorites.map((item) => (
              <Pressable key={item.id} style={styles.favItem} onPress={() => router.push(`/closet/${item.id}`)}>
                <Image source={{ uri: item.imageUri }} style={styles.favImage} />
                <Text style={styles.favName} numberOfLines={1}>{item.name || "未命名"}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ 快捷操作</Text>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/closet/add")}>
            <Ionicons name="add-circle-outline" size={28} color="#6366f1" />
            <Text style={styles.actionText}>添加衣物</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/outfits/create")}>
            <Ionicons name="layers-outline" size={28} color="#6366f1" />
            <Text style={styles.actionText}>创建搭配</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/calendar")}>
            <Ionicons name="calendar-outline" size={28} color="#6366f1" />
            <Text style={styles.actionText}>穿搭日历</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827", marginTop: 8 },
  date: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 24 },
  emptyText: { color: "#9ca3af", marginTop: 8, marginBottom: 12 },
  addBtn: { backgroundColor: "#6366f1", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16, alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "700", color: "#6366f1" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  hScroll: { marginTop: 4 },
  favItem: { marginRight: 12, alignItems: "center", width: 72 },
  favImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#f3f4f6" },
  favName: { fontSize: 11, color: "#6b7280", marginTop: 4, textAlign: "center" },
  actions: { flexDirection: "row", justifyContent: "space-around" },
  actionBtn: { alignItems: "center", paddingVertical: 8 },
  actionText: { fontSize: 12, color: "#4b5563", marginTop: 4 },
  todayImages: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
