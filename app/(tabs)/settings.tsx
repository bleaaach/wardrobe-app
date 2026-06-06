import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { getSetting, setSetting } from "../../src/db/database";
import { useClothingStore } from "../../src/store/clothingStore";
import { importClosetData } from "../../src/services/importCloset";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  TouchMin,
} from "../../src/design/tokens";

/* ─── helpers ─── */
function parsePrice(p: string): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatCurrency(n: number): string {
  return "¥" + Math.round(n).toLocaleString();
}

/* ─── sub-components ─── */

function StatCard({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [S.statCard, pressed && S.statCardPressed]}
      onPress={onPress}
    >
      <Text style={S.statValue}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
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
  iconColor,
  iconBg,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  rightElement?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
  iconColor?: string;
  iconBg?: string;
}) {
  const bg = iconBg ?? (danger ? "rgba(224,122,95,0.15)" : Colors.accentLight);
  const color = iconColor ?? (danger ? Colors.danger : Colors.accent);

  return (
    <Pressable
      style={({ pressed }) => [S.row, pressed && S.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[S.rowIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.rowText, danger && { color: Colors.danger }]}>
          {title}
        </Text>
        {subtitle ? <Text style={S.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={S.rowValue}>{value}</Text> : null}
      {rightElement}
      {!rightElement && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      )}
    </Pressable>
  );
}

function SectionCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[S.card, style]}>{children}</View>;
}

/* ─── main screen ─── */
export default function SettingsScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const loadClothing = useClothingStore((s) => s.loadClothing);

  const [syncUrl, setSyncUrl] = useState("http://8.162.26.192/sync");
  const [token, setToken] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const u = await getSetting("syncUrl");
      const t = await getSetting("token");
      if (u) setSyncUrl(u);
      if (t) setToken(t);
    })();
  }, []);

  const summary = useMemo(() => {
    const total = items.length;
    const totalPrice = items.reduce((sum, i) => sum + parsePrice(i.price), 0);
    const brands = new Set(items.map((i) => i.brand).filter(Boolean)).size;
    return { total, totalPrice, brands };
  }, [items]);

  const handleClear = () => {
    if (typeof window !== "undefined" && window.confirm) {
      if (
        window.confirm("确定要删除所有衣物数据吗？此操作不可恢复")
      ) {
        try {
          localStorage.removeItem("@wardrobe/clothing");
          localStorage.removeItem("@wardrobe/outfits");
          localStorage.removeItem("@wardrobe/dailyLogs");
          const store = useClothingStore.getState();
          store.items = [];
          store.loadClothing();
          window.alert("已清空衣橱，请刷新页面");
        } catch (e) {
          window.alert("清空失败: " + (e as any).message);
        }
      }
    }
  };

  const SwitchControl = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{
        false: Colors.surfaceHighlight,
        true: Colors.accentMuted,
      }}
      thumbColor={value ? Colors.accent : Colors.textTertiary}
      ios_backgroundColor={Colors.surfaceHighlight}
    />
  );

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* ── Profile + Stats Header ── */}
      <View style={S.header}>
        <Pressable
          style={({ pressed }) => [
            S.profileCard,
            pressed && S.profileCardPressed,
          ]}
          onPress={() => router.push("/settings/statistics")}
        >
          <View style={S.profileAccent} />
          <View style={S.profileIconWrap}>
            <Ionicons name="shirt-outline" size={28} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.profileTitle}>Wardrobe</Text>
            <Text style={S.profileSub}>
              {summary.total} 件衣物 · 智能衣橱
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.textTertiary}
          />
        </Pressable>

        <View style={S.statsRow}>
          <StatCard
            value={String(summary.total)}
            label="总件数"
            onPress={() => router.push("/settings/statistics")}
          />
          <StatCard
            value={formatCurrency(summary.totalPrice)}
            label="总价值"
            onPress={() => router.push("/settings/statistics")}
          />
          <StatCard
            value={String(summary.brands)}
            label="品牌数"
            onPress={() => router.push("/settings/statistics")}
          />
        </View>
      </View>

      {/* ── 数据管理 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>数据管理</Text>
        <SectionCard>
          <SettingRow
            icon="share-outline"
            title="导出备份"
            subtitle="将数据库保存到本地"
            iconColor={Colors.catBag}
            iconBg="rgba(143,200,212,0.15)"
            onPress={async () => {
              try {
                const dbPath =
                  (FileSystem as any).documentDirectory + "SQLite/wardrobe.db";
                await Sharing.shareAsync(dbPath, { dialogTitle: "保存备份" });
              } catch {
                Alert.alert("提示", "备份功能开发中");
              }
            }}
          />
          <SettingRow
            icon="cloud-upload-outline"
            title="恢复备份"
            subtitle="从本地文件恢复数据"
            iconColor={Colors.catBag}
            iconBg="rgba(143,200,212,0.15)"
            onPress={() => Alert.alert("提示", "开发中")}
          />
        </SectionCard>
      </View>

      {/* ── 导入 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>导入</Text>
        <SectionCard>
          <Pressable
            style={({ pressed }) => [S.importBtn, pressed && S.importBtnPressed]}
            onPress={() => {
              if (Platform.OS === "web" && fileRef.current) {
                fileRef.current.click();
              } else {
                Alert.alert("提示", "请在网页版使用此功能");
              }
            }}
            disabled={importing}
          >
            <View
              style={[
                S.rowIcon,
                { backgroundColor: "rgba(107,155,111,0.15)" },
              ]}
            >
              <Ionicons
                name="cloud-download"
                size={20}
                color={Colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.importTitle}>从备份文件导入</Text>
              <Text style={S.importDesc}>
                {importing ? importMsg : "支持 .zip 格式的衣橱备份"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.textTertiary}
            />
          </Pressable>
          {Platform.OS === "web" && (
            <input
              ref={fileRef as any}
              type="file"
              accept=".zip"
              style={{ display: "none" }}
              onChange={async (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                setImportMsg("正在读取文件...");
                try {
                  const buffer = await file.arrayBuffer();
                  const result = await importClosetData(buffer, (p) => {
                    setImportMsg(`导入衣物 ${p.current}/${p.total}`);
                  });
                  await loadClothing();
                  setImportMsg(`完成！导入 ${result.clothing} 件衣物`);
                  setImporting(false);
                  Alert.alert("导入完成", `成功导入 ${result.clothing} 件衣物`);
                } catch (err: any) {
                  setImporting(false);
                  setImportMsg("");
                  Alert.alert("导入失败", err.message);
                }
              }}
            />
          )}
        </SectionCard>
      </View>

      {/* ── 同步设置 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>同步设置</Text>
        <SectionCard>
          <View style={S.inputRow}>
            <View style={S.inputRowHeader}>
              <Ionicons
                name="link-outline"
                size={16}
                color={Colors.catOuter}
              />
              <Text style={S.inputLabel}>服务器地址</Text>
            </View>
            <TextInput
              style={[
                S.input,
                focusedInput === "syncUrl" && {
                  borderColor: Colors.accentMuted,
                },
              ]}
              value={syncUrl}
              onChangeText={setSyncUrl}
              onFocus={() => setFocusedInput("syncUrl")}
              onBlur={() => {
                setFocusedInput(null);
                setSetting("syncUrl", syncUrl);
              }}
              placeholder="http://8.162.26.192/sync"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={S.inputRow}>
            <View style={S.inputRowHeader}>
              <Ionicons
                name="key-outline"
                size={16}
                color={Colors.catOuter}
              />
              <Text style={S.inputLabel}>Token</Text>
            </View>
            <TextInput
              style={[
                S.input,
                focusedInput === "token" && {
                  borderColor: Colors.accentMuted,
                },
              ]}
              value={token}
              onChangeText={setToken}
              onFocus={() => setFocusedInput("token")}
              onBlur={() => {
                setFocusedInput(null);
                setSetting("token", token);
              }}
              secureTextEntry
              placeholder="登录后获取"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </SectionCard>
      </View>

      {/* ── 统计与分析 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>统计与分析</Text>
        <SectionCard>
          <SettingRow
            icon="bar-chart-outline"
            title="统计信息"
            subtitle="查看衣橱数据洞察"
            value="查看"
            iconColor={Colors.accent}
            iconBg={Colors.accentLight}
            onPress={() => router.push("/settings/statistics")}
          />
        </SectionCard>
      </View>

      {/* ── 管理 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>管理</Text>
        <SectionCard>
          <SettingRow
            icon="folder-open-outline"
            title="分类管理"
            subtitle="管理衣物分类与标签"
            iconColor={Colors.catShoes}
            iconBg="rgba(143,212,168,0.15)"
            onPress={() => router.push("/settings/categories")}
          />
          <SettingRow
            icon="archive-outline"
            title="回收站"
            subtitle="查看已删除的衣物"
            iconColor={Colors.catShoes}
            iconBg="rgba(143,212,168,0.15)"
            onPress={() => router.push("/settings/archive")}
          />
        </SectionCard>
      </View>

      {/* ── 偏好设置 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>偏好设置</Text>
        <SectionCard>
          <SettingRow
            icon="cash-outline"
            title="显示价格"
            subtitle="在衣物列表中展示价格"
            iconColor={Colors.catDress}
            iconBg="rgba(212,143,179,0.15)"
            rightElement={
              <SwitchControl value={showPrice} onChange={setShowPrice} />
            }
          />
          <SettingRow
            icon="notifications-outline"
            title="每日提醒"
            subtitle="每日推送穿搭建议"
            iconColor={Colors.catDress}
            iconBg="rgba(212,143,179,0.15)"
            rightElement={
              <SwitchControl value={dailyReminder} onChange={setDailyReminder} />
            }
          />
        </SectionCard>
      </View>

      {/* ── 关于 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>关于</Text>
        <SectionCard>
          <SettingRow
            icon="information-circle-outline"
            title="版本"
            value="v1.0"
            iconColor={Colors.textSecondary}
            iconBg="rgba(156,163,175,0.15)"
          />
          <SettingRow
            icon="document-text-outline"
            title="开源许可"
            subtitle="第三方库许可证"
            iconColor={Colors.textSecondary}
            iconBg="rgba(156,163,175,0.15)"
            onPress={() => Alert.alert("开源许可", "开发中")}
          />
        </SectionCard>
      </View>

      {/* ── 危险操作 ── */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>危险操作</Text>
        <SectionCard>
          <SettingRow
            icon="trash-outline"
            title="清空衣橱"
            subtitle="删除所有衣物数据，不可恢复"
            danger
            onPress={handleClear}
          />
        </SectionCard>
      </View>

      <Text style={S.footer}>© 2025 Wardrobe</Text>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

/* ─── styles ─── */
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  /* Header */
  header: { paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  profileCardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: Colors.surfaceHighlight,
  },
  profileAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.accent,
  },
  profileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  profileTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  profileSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statCardPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: Colors.surfaceHighlight,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  /* Section */
  section: { marginBottom: Spacing.xxl, paddingHorizontal: Spacing.xl },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },

  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
    minHeight: TouchMin,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceHighlight,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  rowText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  rowSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },

  /* Import */
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    minHeight: TouchMin,
  },
  importBtnPressed: {
    backgroundColor: Colors.surfaceHighlight,
  },
  importTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  importDesc: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  /* Input */
  inputRow: { padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.divider },
  inputRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Footer */
  footer: {
    textAlign: "center",
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    marginTop: Spacing.xxxl,
  },
});
