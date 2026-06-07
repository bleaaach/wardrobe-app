import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Switch,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { getSetting, setSetting } from "../../src/db/database";
import { useClothingStore } from "../../src/store/clothingStore";
import { importClosetData } from "../../src/services/importCloset";
import {
  syncToWebDAV,
  syncFromWebDAV,
  getWebDAVConfig,
  configureWebDAV,
  getAutoSync,
  setAutoSync,
  getLastSyncTime,
  isWebDAVConfigured,
} from "../../src/services/webdavSync";
import { Colors, Spacing, Radius, FontSize, Shadows } from "../../src/design/tokens";
import { getDb } from "../../src/db/sqlite";

/* ─── helpers ─── */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(ts: string | null): string {
  if (!ts) return "从未";
  const d = new Date(Number(ts));
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── sub-components ─── */
function SectionTitle({ title }: { title: string }) {
  return <Text style={S.sectionTitle}>{title}</Text>;
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[S.card, style]}>{children}</View>;
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  loading,
  iconColor,
  iconBg,
  danger,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  loading?: boolean;
  iconColor?: string;
  iconBg?: string;
  danger?: boolean;
}) {
  const bg = iconBg ?? (danger ? "rgba(196,91,74,0.12)" : Colors.accentLight);
  const color = iconColor ?? (danger ? Colors.danger : Colors.accent);
  return (
    <Pressable style={({ pressed }) => [S.row, pressed && S.rowPressed]} onPress={onPress} disabled={!onPress || loading}>
      <View style={[S.rowIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.rowText, danger && { color: Colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={S.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      )}
    </Pressable>
  );
}

/* ─── main screen ─── */
export default function BackupScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const loadClothing = useClothingStore((s) => s.loadClothing);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const [webdavUrl, setWebdavUrl] = useState("");
  const [webdavUser, setWebdavUser] = useState("");
  const [webdavPass, setWebdavPass] = useState("");
  const [webdavAutoSync, setWebdavAutoSync] = useState(false);
  const [webdavExpanded, setWebdavExpanded] = useState(false);
  const [webdavConfigured, setWebdavConfigured] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [syncUrl, setSyncUrl] = useState("http://8.162.26.192/sync");
  const [token, setToken] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setWebdavConfigured(await isWebDAVConfigured());
      const wConfig = await getWebDAVConfig();
      if (wConfig) {
        setWebdavUrl(wConfig.url);
        setWebdavUser(wConfig.username);
        setWebdavPass(wConfig.password);
      }
      setWebdavAutoSync(await getAutoSync());
      setLastSync(await getLastSyncTime());

      const u = await getSetting("syncUrl");
      const t = await getSetting("token");
      if (u) setSyncUrl(u);
      if (t) setToken(t);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const estimatedSize = total * 85 * 1024; // rough estimate
    return { total, estimatedSize };
  }, [items]);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (Platform.OS === "web") {
        const raw = localStorage.getItem("@wardrobe/clothing") || "[]";
        const blob = new Blob([raw], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wardrobe_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const dbPath = (FileSystem as any).documentDirectory + "SQLite/wardrobe.db";
        await Sharing.shareAsync(dbPath, { dialogTitle: "保存备份" });
      }
    } catch (e) {
      Alert.alert("导出失败", String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleRestore = async (buffer: ArrayBuffer) => {
    setImporting(true);
    setImportMsg("正在恢复数据...");
    try {
      const result = await importClosetData(buffer, (p) => {
        setImportMsg(`恢复 ${p.current}/${p.total}`);
      });
      await loadClothing();
      Alert.alert("恢复完成", `成功恢复 ${result.clothing} 件衣物`);
    } catch (err: any) {
      Alert.alert("恢复失败", err.message);
    } finally {
      setImporting(false);
      setImportMsg("");
    }
  };

  const saveWebDAV = async () => {
    const ok = await configureWebDAV(webdavUrl, webdavUser, webdavPass);
    if (!ok) {
      Alert.alert("连接失败", "无法连接到 WebDAV 服务器，请检查地址和账号密码");
      return;
    }
    await setAutoSync(webdavAutoSync);
    setWebdavConfigured(true);
    Alert.alert("保存成功", "WebDAV 配置已保存");
  };

  const handleWebDAVUpload = async () => {
    setSyncing(true);
    setSyncMsg("正在上传...");
    try {
      await syncToWebDAV();
      const now = Date.now().toString();
      setLastSync(now);
      Alert.alert("同步成功", "数据已上传到 WebDAV");
    } catch (e: any) {
      Alert.alert("上传失败", e.message);
    } finally {
      setSyncing(false);
      setSyncMsg("");
    }
  };

  const handleWebDAVRestore = async () => {
    setSyncing(true);
    setSyncMsg("正在下载...");
    try {
      await syncFromWebDAV();
      await loadClothing();
      const now = Date.now().toString();
      setLastSync(now);
      Alert.alert("恢复成功", "已从 WebDAV 恢复数据");
    } catch (e: any) {
      Alert.alert("恢复失败", e.message);
    } finally {
      setSyncing(false);
      setSyncMsg("");
    }
  };

  const handleClear = () => {
    Alert.alert(
      "清空衣橱",
      "确定要删除所有衣物数据吗？此操作不可恢复。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "清空",
          style: "destructive",
          onPress: async () => {
            try {
              if (Platform.OS === "web") {
                localStorage.removeItem("@wardrobe/clothing");
                localStorage.removeItem("@wardrobe/outfits");
                localStorage.removeItem("@wardrobe/dailyLogs");
              } else {
                const db = getDb();
                await db.runAsync(`DELETE FROM clothing`);
                await db.runAsync(`DELETE FROM outfits`);
                await db.runAsync(`DELETE FROM daily_logs`);
              }
              await loadClothing();
              Alert.alert("已清空", "所有数据已删除");
            } catch (e) {
              Alert.alert("清空失败", String(e));
            }
          },
        },
      ]
    );
  };

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
    <View style={S.container}>
      {/* ── Header ── */}
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
        </Pressable>
        <Text style={S.headerTitle}>备份与恢复</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 120 }}
      >
        {/* ── Data Overview ── */}
        <View style={S.statsRow}>
          <View style={[S.statCard, { backgroundColor: Colors.textPrimary }]}>
            <Text style={[S.statValue, { color: Colors.textInverse }]}>{stats.total}</Text>
            <Text style={[S.statLabel, { color: "rgba(255,255,255,0.7)" }]}>衣物</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statValue}>{formatSize(stats.estimatedSize)}</Text>
            <Text style={S.statLabel}>数据量</Text>
          </View>
        </View>

        {/* ── Local Backup ── */}
        <SectionTitle title="本地备份" />
        <Card>
          <ActionRow
            icon="download-outline"
            title="导出备份"
            subtitle="将数据导出为 .json 文件"
            onPress={handleExport}
            loading={exporting}
            iconColor={Colors.catBag}
            iconBg="rgba(143,200,212,0.15)"
          />
          <View style={S.divider} />
          <ActionRow
            icon="push-outline"
            title="恢复备份"
            subtitle="从 .zip 或 .json 文件恢复"
            onPress={() => {
              if (Platform.OS === "web" && restoreRef.current) {
                restoreRef.current.click();
              } else {
                Alert.alert("提示", "请在网页版使用此功能");
              }
            }}
            loading={importing}
            iconColor={Colors.catBag}
            iconBg="rgba(143,200,212,0.15)"
          />
          <View style={S.divider} />
          <ActionRow
            icon="document-outline"
            title="导入衣橱 ZIP"
            subtitle={importing ? importMsg : "支持 Closet+ 导出的 .zip"}
            onPress={() => {
              if (Platform.OS === "web" && fileRef.current) {
                fileRef.current.click();
              } else {
                Alert.alert("提示", "请在网页版使用此功能");
              }
            }}
            loading={importing}
            iconColor={Colors.success}
            iconBg="rgba(107,155,111,0.15)"
          />
        </Card>

        {/* ── Server Sync ── */}
        <SectionTitle title="服务器同步" />
        <Card>
          <View style={{ padding: Spacing.lg, gap: 12 }}>
            <View style={S.inputRowHeader}>
              <Ionicons name="link-outline" size={16} color={Colors.textSecondary} />
              <Text style={S.inputLabel}>服务器地址</Text>
            </View>
            <TextInput
              style={[S.input, focusedInput === "syncUrl" && { borderColor: Colors.accentMuted }]}
              value={syncUrl}
              onChangeText={setSyncUrl}
              onFocus={() => setFocusedInput("syncUrl")}
              onBlur={() => { setFocusedInput(null); setSetting("syncUrl", syncUrl); }}
              placeholder="http://8.162.26.192/sync"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
            />
            <View style={S.inputRowHeader}>
              <Ionicons name="key-outline" size={16} color={Colors.textSecondary} />
              <Text style={S.inputLabel}>Token</Text>
            </View>
            <TextInput
              style={[S.input, focusedInput === "token" && { borderColor: Colors.accentMuted }]}
              value={token}
              onChangeText={setToken}
              onFocus={() => setFocusedInput("token")}
              onBlur={() => { setFocusedInput(null); setSetting("token", token); }}
              secureTextEntry
              placeholder="登录后获取"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
            />
          </View>
        </Card>

        {/* ── Cloud Sync ── */}
        <SectionTitle title="云同步" />
        <Card>
          <Pressable style={({ pressed }) => [S.row, pressed && S.rowPressed]} onPress={() => setWebdavExpanded(!webdavExpanded)}>
            <View style={[S.rowIcon, { backgroundColor: Colors.accentLight }]}>
              <Ionicons name="cloud-done-outline" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.rowText}>WebDAV 同步</Text>
              <Text style={S.rowSubtitle}>
                {webdavConfigured ? `上次同步: ${formatDate(lastSync)}` : "未配置"}
              </Text>
            </View>
            <Ionicons name={webdavExpanded ? "chevron-up" : "chevron-forward"} size={16} color={Colors.textTertiary} />
          </Pressable>

          {webdavExpanded && (
            <View style={{ padding: Spacing.lg, gap: 12 }}>
              <TextInput
                style={S.input}
                value={webdavUrl}
                onChangeText={setWebdavUrl}
                placeholder="https://dav.jianguoyun.com/dav/"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
              />
              <TextInput
                style={S.input}
                value={webdavUser}
                onChangeText={setWebdavUser}
                placeholder="用户名 / 邮箱"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
              />
              <TextInput
                style={S.input}
                value={webdavPass}
                onChangeText={setWebdavPass}
                placeholder="应用密码"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
              />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ fontSize: FontSize.base, color: Colors.textPrimary }}>自动同步</Text>
                <SwitchControl value={webdavAutoSync} onChange={setWebdavAutoSync} />
              </View>
              <Pressable style={S.saveBtn} onPress={saveWebDAV}>
                <Text style={S.saveBtnText}>保存配置</Text>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <Pressable style={[S.actionBtn, { flex: 1 }]} onPress={handleWebDAVUpload} disabled={syncing}>
                  {syncing && syncMsg.startsWith("上传") ? (
                    <ActivityIndicator size="small" color={Colors.textPrimary} />
                  ) : (
                    <Text style={S.actionBtnText}>上传</Text>
                  )}
                </Pressable>
                <Pressable style={[S.actionBtn, { flex: 1 }]} onPress={handleWebDAVRestore} disabled={syncing}>
                  {syncing && syncMsg.startsWith("下载") ? (
                    <ActivityIndicator size="small" color={Colors.textPrimary} />
                  ) : (
                    <Text style={S.actionBtnText}>恢复</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </Card>

        {/* ── Danger Zone ── */}
        <SectionTitle title="危险操作" />
        <Card>
          <ActionRow
            icon="trash-outline"
            title="清空所有数据"
            subtitle="删除所有衣物、搭配和日志，不可恢复"
            danger
            onPress={handleClear}
          />
        </Card>

        <Text style={S.footer}>WARDROBE &middot; BACKUP</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Hidden file inputs for web */}
      {Platform.OS === "web" && (
        <>
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
          <input
            ref={restoreRef as any}
            type="file"
            accept=".zip,.json"
            style={{ display: "none" }}
            onChange={async (e: any) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const buffer = await file.arrayBuffer();
              await handleRestore(buffer);
            }}
          />
        </>
      )}
    </View>
  );
}

/* ─── styles ─── */
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  headerTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    ...Shadows.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xxl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    ...Shadows.sm,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    minHeight: 64,
  },
  rowPressed: { backgroundColor: Colors.surfaceHighlight },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  rowText: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: "500" },
  rowSubtitle: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 56,
  },

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
