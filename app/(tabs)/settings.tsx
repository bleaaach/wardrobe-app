import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Platform } from "react-native";
import { useEffect, useState, useRef } from "react";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Header } from "../../src/components/ui/Header";
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
      <Text style={S.rowIcon}>{icon}</Text>
      <Text style={[S.rowText, danger && { color: Colors.danger }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </Pressable>
  );

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <Header title="设置" />

      <Text style={S.sectionTitle}>数据</Text>
      <View style={S.card}>
        <Row icon="📤" title="导出备份" onPress={async () => {
          try {
            const dbPath = (FileSystem as any).documentDirectory + "SQLite/wardrobe.db";
            await Sharing.shareAsync(dbPath, { dialogTitle: "保存备份" });
          } catch { Alert.alert("提示", "备份功能开发中"); }
        }} />
        <Row icon="📥" title="恢复备份" onPress={() => Alert.alert("提示", "开发中")} />
      </View>

      <Text style={S.sectionTitle}>同步设置</Text>
      <View style={S.card}>
        <View style={S.inputRow}>
          <Text style={S.label}>服务器地址</Text>
          <TextInput style={S.input} value={syncUrl} onChangeText={setSyncUrl} onBlur={() => setSetting("syncUrl", syncUrl)} placeholder="http://8.162.26.192/sync" />
        </View>
        <View style={S.inputRow}>
          <Text style={S.label}>Token</Text>
          <TextInput style={S.input} value={token} onChangeText={setToken} onBlur={() => setSetting("token", token)} secureTextEntry placeholder="登录后获取" />
        </View>
      </View>

      <Text style={S.sectionTitle}>数据管理</Text>
      <View style={S.card}>
        <Row icon="🗑️" title="清空衣橱" danger onPress={() => {
          Alert.alert("清空衣橱", "确定要删除所有衣物吗？此操作不可恢复", [
            { text: "取消", style: "cancel" },
            { text: "清空", style: "destructive", onPress: async () => {
              const store = useClothingStore.getState();
              for (const item of store.items) await store.deleteItem(item.id);
              Alert.alert("完成", "已清空衣橱");
            } },
          ]);
        }} />
      </View>

      <Text style={S.sectionTitle}>数据导入</Text>
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
          <Ionicons name="cloud-download" size={20} color={importing ? Colors.textTertiary : Colors.accent} />
          <Text style={[S.importText, importing && { color: Colors.textTertiary }]}>
            {importing ? importMsg : "从备份文件导入 (.zip)"}
          </Text>
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
                setImportMsg(`✅ 完成！导入 ${result.clothing} 件衣物`);
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

      <Text style={S.footer}>智能衣橱 v1.0</Text>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.xl, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.divider, minHeight: TouchMin },
  rowPressed: { backgroundColor: Colors.surfaceHover },
  rowIcon: { fontSize: 20, marginRight: Spacing.md },
  rowText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm, paddingLeft: 4 },
  inputRow: { padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.divider },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: 12, fontSize: FontSize.base, color: Colors.textPrimary },
  importBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: Spacing.lg, minHeight: TouchMin },
  importBtnPressed: { backgroundColor: Colors.surfaceHover },
  importText: { fontSize: FontSize.base, color: Colors.accent },
  footer: { textAlign: "center", color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: Spacing.xxxl },
});
