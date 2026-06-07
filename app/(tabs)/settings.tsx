import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  Animated,
} from "react-native";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getOutfits, getDailyLogs } from "../../src/db/database";
import { useClothingStore } from "../../src/store/clothingStore";
import { DailyLog } from "../../src/types";
import { PageTransition } from "../../src/components/PageTransition";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

/* ─── helpers ─── */
function parsePrice(p: string): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatCurrency(n: number): string {
  return "¥" + Math.round(n).toLocaleString();
}

function calculateStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const uniqueDates = Array.from(new Set(logs.map((l) => l.date))).sort(
    (a, b) => b.localeCompare(a)
  );
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let checkDate = uniqueDates[0];
  if (checkDate !== today && checkDate !== yesterday) return 0;
  let streak = 0;
  let d = new Date(checkDate + "T00:00:00");
  for (const dateStr of uniqueDates) {
    const current = d.toISOString().slice(0, 10);
    if (dateStr === current) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* ─── sub-components ─── */
function StatItem({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={{ alignItems: "center" }} onPress={onPress}>
      <Text style={S.statBig}>{value}</Text>
      <Text style={S.statSmall}>{label}</Text>
    </Pressable>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  rightElement,
  danger,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  rightElement?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [S.row, pressed && S.rowPressed]} onPress={onPress} disabled={!onPress}>
      <View style={S.rowIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.rowText, danger && { color: Colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={S.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={S.rowValue}>{value}</Text> : null}
      {rightElement}
      {!rightElement && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </Pressable>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[S.card, style]}>{children}</View>;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={S.sectionTitle}>{title}</Text>;
}

/* ─── floating item with animation ─── */
function FloatItem({
  style,
  children,
  delay,
}: {
  style?: any;
  children: React.ReactNode;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "2deg"],
  });

  return (
    <Animated.View
      style={[
        S.floatItem,
        style,
        { transform: [{ translateY }, { rotate }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ─── main screen ─── */
export default function SettingsScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);

  const [showPrice, setShowPrice] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);

  // Extra stats
  const [outfitCount, setOutfitCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const outfits = await getOutfits();
      setOutfitCount(outfits.length);
      const logs = await getDailyLogs();
      setStreak(calculateStreak(logs));
    })();
  }, []);

  const summary = useMemo(() => {
    const total = items.length;
    const totalPrice = items.reduce((sum, i) => sum + parsePrice(i.price), 0);
    const brands = new Set(items.map((i) => i.brand).filter(Boolean)).size;
    return { total, totalPrice, brands };
  }, [items]);

  const SwitchControl = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: Colors.surfaceHighlight, true: Colors.accentMuted }}
      thumbColor={value ? Colors.accent : Colors.textTertiary}
      ios_backgroundColor={Colors.surfaceHighlight}
    />
  );

  return (
    <PageTransition>
    <ScrollView style={S.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* ── Floating Items + Brand ── */}
      <View style={S.meHeader}>
        <View style={S.floatingItems}>
          <FloatItem style={{ top: 10, left: 30 }} delay={0}>
            <Ionicons name="shirt" size={28} color={Colors.textSecondary} />
          </FloatItem>
          <FloatItem style={{ top: 40, left: 110, width: 56, height: 56 }} delay={1500}>
            <Ionicons name="footsteps" size={24} color={Colors.textSecondary} />
          </FloatItem>
          <FloatItem style={{ top: 15, right: 40 }} delay={3000}>
            <Ionicons name="bag" size={28} color={Colors.textSecondary} />
          </FloatItem>
          <FloatItem style={{ top: 75, left: 60, width: 52, height: 52 }} delay={2000}>
            <Ionicons name="glasses" size={22} color={Colors.textSecondary} />
          </FloatItem>
          <FloatItem style={{ top: 70, right: 70, width: 48, height: 48 }} delay={4500}>
            <Ionicons name="watch" size={20} color={Colors.textSecondary} />
          </FloatItem>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Text style={S.brandName}>Wardrobe</Text>
          <Ionicons name="star" size={20} color={Colors.accent} />
        </View>
        <Text style={S.brandSub}>Curating since {new Date().getFullYear()}</Text>
      </View>

      {/* ── Stats Row ── */}
      <View style={S.statsRow}>
        <StatItem value={String(summary.total)} label="Items" onPress={() => router.push("/settings/statistics")} />
        <StatItem value={String(outfitCount)} label="Outfits" onPress={() => router.push("/settings/statistics")} />
        <StatItem value={String(streak)} label="Streak" onPress={() => router.push("/settings/statistics")} />
      </View>

      {/* ── Backup ── */}
      <SectionTitle title="Backup" />
      <SectionCard>
        <SettingRow icon="save-outline" title="备份与恢复" subtitle="导出、导入、云同步、清空数据" onPress={() => router.push("/settings/backup")} />
      </SectionCard>

      {/* ── Stats ── */}
      <SectionTitle title="Stats" />
      <SectionCard>
        <SettingRow icon="bar-chart-outline" title="统计信息" subtitle="查看衣橱数据洞察" value="查看" onPress={() => router.push("/settings/statistics")} />
      </SectionCard>

      {/* ── Manage ── */}
      <SectionTitle title="Manage" />
      <SectionCard>
        <SettingRow icon="folder-open-outline" title="分类管理" subtitle="管理衣物分类与标签" onPress={() => router.push("/settings/categories")} />
        <SettingRow icon="archive-outline" title="回收站" subtitle="查看已删除的衣物" onPress={() => router.push("/settings/archive")} />
      </SectionCard>

      {/* ── Preferences ── */}
      <SectionTitle title="Preferences" />
      <SectionCard>
        <SettingRow icon="cash-outline" title="显示价格" subtitle="在衣物列表中展示价格" rightElement={<SwitchControl value={showPrice} onChange={setShowPrice} />} />
        <SettingRow icon="notifications-outline" title="每日提醒" subtitle="每日推送穿搭建议" rightElement={<SwitchControl value={dailyReminder} onChange={setDailyReminder} />} />
      </SectionCard>

      {/* ── About ── */}
      <SectionTitle title="About" />
      <SectionCard>
        <SettingRow icon="information-circle-outline" title="版本" value="v1.0" />
        <SettingRow icon="document-text-outline" title="开源许可" subtitle="第三方库许可证" onPress={() => Alert.alert("开源许可", "开发中")} />
      </SectionCard>

      <Text style={S.footer}>WARDROBE &middot; V1.0</Text>
      <View style={{ height: 60 }} />
    </ScrollView>
    </PageTransition>
  );
}

/* ─── styles ─── */
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  /* Me Header */
  meHeader: { paddingTop: 20, paddingBottom: 28, alignItems: "center" },
  floatingItems: { position: "relative", width: 280, height: 140, marginBottom: 16 },
  floatItem: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  brandName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 32,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  brandSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, fontWeight: "400" },

  /* Stats */
  statsRow: { flexDirection: "row", justifyContent: "center", gap: 40, marginBottom: 28, paddingHorizontal: 20 },
  statBig: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 36,
    color: Colors.textPrimary,
    lineHeight: 40,
    marginBottom: 6,
  },
  statSmall: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: Colors.textSecondary,
  },

  /* Section */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginHorizontal: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: Colors.bg,
    minHeight: TouchMin,
    gap: 14,
  },
  rowPressed: { backgroundColor: Colors.surfaceHighlight },
  rowIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  rowText: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: "500" },
  rowSubtitle: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  rowValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: Spacing.sm },

  /* Input */
  inputRow: { padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.bg },
  inputRowHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "500" },
  input: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Buttons */
  saveBtn: {
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  actionBtn: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: { color: Colors.textPrimary, fontSize: 15, fontWeight: "600" },

  /* Footer */
  footer: {
    textAlign: "center",
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    marginTop: 32,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
});
