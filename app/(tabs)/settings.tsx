import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getSetting, setSetting } from "../../src/db/database";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

export default function SettingsScreen() {
  const [syncUrl, setSyncUrl] = useState("http://8.162.26.192/sync");
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      const u = await getSetting("syncUrl");
      const t = await getSetting("token");
      if (u) setSyncUrl(u);
      if (t) setToken(t);
    })();
  }, []);

  const Row = ({ icon, title, onPress }: { icon: string; title: string; onPress?: () => void }) => (
    <Pressable style={S.row} onPress={onPress}>
      <Text style={S.rowIcon}>{icon}</Text>
      <Text style={S.rowText}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </Pressable>
  );

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <Text style={S.title}>设置</Text>

      <View style={S.card}>
        <Row icon="📤" title="导出备份" onPress={async () => {
          try {
            const dbPath = FileSystem.documentDirectory + "SQLite/wardrobe.db";
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

      <Text style={styles.footer}>智能衣橱 v1.0</Text>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginTop: 60, marginBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.xl, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.divider, minHeight: TouchMin },
  rowIcon: { fontSize: 20, marginRight: Spacing.md },
  rowText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm, paddingLeft: 4 },
  inputRow: { padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.divider },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: 12, fontSize: FontSize.base, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  footer: { textAlign: "center", color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: Spacing.xxxl },
});
