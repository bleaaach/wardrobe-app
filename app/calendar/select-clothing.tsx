import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getAllClothing, addDailyLog, getDailyLogByDate } from "../../src/db/database";
import { Clothing } from "../../src/types";
import { AsyncImage } from "../../src/components/AsyncImage";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  PressedOpacity,
} from "../../src/design/tokens";

export default function SelectClothingScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [items, setItems] = useState<Clothing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await getAllClothing();
      setItems(all);

      // 如果已有记录且包含 clothingIds，预选中
      if (date) {
        const existing = await getDailyLogByDate(date);
        if (existing?.clothingIds) {
          try {
            const ids: string[] = JSON.parse(existing.clothingIds);
            setSelected(new Set(ids));
          } catch { /* ignore */ }
        }
      }
    })();
  }, [date]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      Alert.alert("提示", "请至少选择一件衣物");
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
        clothingIds: JSON.stringify(Array.from(selected)),
      });
      router.back();
    } catch (e) {
      Alert.alert("保存失败", String(e));
    } finally {
      setLoading(false);
    }
  };

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : "";

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Pressable style={S.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{displayDate}</Text>
          <Text style={S.headerSub}>从物品库选择当日穿搭</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Selected count */}
      {selected.size > 0 && (
        <View style={S.countBar}>
          <Text style={S.countText}>已选择 {selected.size} 件</Text>
          <Pressable onPress={() => setSelected(new Set())}>
            <Text style={S.clearText}>清空</Text>
          </Pressable>
        </View>
      )}

      {/* Grid */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.grid}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={S.empty}>
            <Ionicons
              name="shirt-outline"
              size={40}
              color={Colors.textTertiary}
            />
            <Text style={S.emptyText}>衣橱空空</Text>
            <Text style={S.emptySub}>先添加一些衣物吧</Text>
          </View>
        ) : (
          items.map((item) => {
            const isSel = selected.has(item.id);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  S.card,
                  isSel && S.cardActive,
                  pressed && S.cardPressed,
                ]}
                onPress={() => toggle(item.id)}
              >
                <AsyncImage uri={item.imageUri} style={S.image} />
                {isSel && (
                  <View style={S.checkOverlay}>
                    <View style={S.checkCircle}>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={Colors.textInverse}
                      />
                    </View>
                  </View>
                )}
                <View style={S.info}>
                  <Text style={S.name} numberOfLines={1}>
                    {item.name || "未命名"}
                  </Text>
                  <Text style={S.meta} numberOfLines={1}>
                    {item.brand || item.color || ""}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={S.footer}>
        <Pressable
          style={({ pressed }) => [
            S.saveBtn,
            (selected.size === 0 || loading) && S.saveBtnDisabled,
            pressed && selected.size > 0 && !loading && S.pressed,
          ]}
          onPress={handleSave}
          disabled={selected.size === 0 || loading}
        >
          <Text style={S.saveBtnText}>
            {loading ? "保存中..." : `保存记录 (${selected.size})`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingTop: 48,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  countBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accentLight,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
  },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "600",
  },
  clearText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    justifyContent: "space-between",
  },

  card: {
    width: "47%",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardActive: {
    borderColor: Colors.accent,
  },
  cardPressed: {
    opacity: PressedOpacity,
  },
  image: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  checkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: Spacing.md,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    width: "100%",
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  saveBtnText: {
    color: Colors.textInverse,
    fontWeight: "700",
    fontSize: FontSize.md,
  },

  pressed: { opacity: PressedOpacity },
});
