import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Platform } from "react-native";
import { useEffect, useState, useRef } from "react";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { getSetting, setSetting } from "../../src/db/database";
import { useClothingStore } from "../../src/store/clothingStore";
import { importClosetData } from "../../src/services/importCloset";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function SettingsScreen() {
  const [syncUrl, setSyncUrl] = useState("http://8.162.26.192/sync");
  const [token, setToken] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const u = await getSetting("syncUrl");
      const t = await getSetting("token");
      if (u) setSyncUrl(u);
      if (t) setToken(t);
    })();
  }, []);

  const Row = ({ icon, title, onPress, danger }: { icon: string; title: string; onPress?: () => void; danger?: boolean }) => (
    <Pressable style={({ pressed }) => [S.row, pressed && S.rowPressed]} onPress={onPress}>
      <View style={[S.rowIcon, danger && { backgroundColor: "rgba(224,122,95,0.15)" }]}>
        <Ionicons name={icon as any} size={18} color={danger ? Colors.danger : Colors.accent} />
      </View>
      <Text style={[S.rowText, danger && { color: Colors.danger }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </Pressable>
  );

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Magazine Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Settings</Text>
        <Text style={S.headerSub}>管理你的衣橱数据</Text>
      </View>

      {/* Data Section */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>数据</Text>
        <View style={S.card}>
          <Row icon="share-outline" title="导出备份" onPress={async () => {
            try {
              const dbPath = (FileSystem as any).documentDirectory + "SQLite/wardrobe.db";
              await Sharing.shareAsync(dbPath, { dialogTitle: "保存备份" });
            } catch { Alert.alert("提示", "备份功能开发中"); }
          }} />
          <Row icon="cloud-download-outline" title="恢复备份" onPress={() => Alert.alert("提示", "开发中")} />
        </View>
      </View>

      {/* Import Section */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>导入</Text>
        <View style={S.card}>
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
            <View style={S.importIcon}>
              <Ionicons name="cloud-download" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.importTitle}>从备份文件导入</Text>
              <Text style={S.importDesc}>{importing ? importMsg : "支持 .zip 格式的衣橱备份"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
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
        </View>
      </View>

      {/* Sync Section */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>同步设置</Text>
        <View style={S.card}>
          <View style={S.inputRow}>
            <Text style={S.inputLabel}>服务器地址</Text>
            <TextInput style={S.input} value={syncUrl} onChangeText={setSyncUrl} onBlur={() => setSetting("syncUrl", syncUrl)} placeholder="http://8.162.26.192/sync" placeholderTextColor={Colors.textTertiary} />
          </View>
          <View style={S.inputRow}>
            <Text style={S.inputLabel}>Token</Text>
            <TextInput style={S.input} value={token} onChangeText={setToken} onBlur={() => setSetting("token", token)} secureTextEntry placeholder="登录后获取" placeholderTextColor={Colors.textTertiary} />
          </View>
        </View>
      </View>

      {/* Danger Section */}
      <View style={S.section}>
        <Text style={S.sectionLabel}>危险操作</Text>
        <View style={S.card}>
          <Row icon="trash-outline" title="清空衣橱" danger onPress={() => {
            if (typeof window !== "undefined" && window.confirm) {
              if (window.confirm("确定要删除所有衣物数据吗？此操作不可恢复")) {
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
          }} />
        </View>
      </View>

      <Text style={S.footer}>智能衣橱 v1.0</Text>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  headerTitle: { fontSize: 42, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -1.5, lineHeight: 48 },
  headerSub: { fontSize: FontSize.base, color: Colors.textTertiary, marginTop: Spacing.xs },

  section: { marginBottom: Spacing.xxl, paddingHorizontal: Spacing.xl },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm, paddingLeft: 4 },

  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
    minHeight: TouchMin,
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
  rowText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: "500" },

  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    minHeight: TouchMin,
  },
  importBtnPressed: { backgroundColor: Colors.surfaceHighlight },
  importIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  importTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: "500" },
  importDesc: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  inputRow: { padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.divider },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  footer: { textAlign: "center", color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: Spacing.xxxl },
});
