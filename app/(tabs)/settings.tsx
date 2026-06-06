import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getDatabase } from "../../src/db/database";
import { SyncSettings } from "../../src/types";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SyncSettings>({
    serverUrl: "http://8.162.26.192:3001",
    token: "",
    webdavUrl: "",
    webdavUser: "",
    webdavPass: "",
    autoSync: false,
  });

  useEffect(() => { loadSettings(); }, []);
  const loadSettings = async () => {
    const db = await getDatabase();
    try {
      const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT * FROM settings");
      const map: Record<string, string> = {};
      rows.forEach((r) => (map[r.key] = r.value));
      if (Object.keys(map).length > 0) {
        setSettings({ ...settings, ...map, autoSync: map.autoSync === "true" } as any);
      }
    } catch {}
  };
  const saveSetting = async (key: string, value: string) => {
    const db = await getDatabase();
    await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  };

  const handleBackup = async () => {
    const dbPath = FileSystem.documentDirectory + "SQLite/wardrobe.db";
    const backupPath = FileSystem.documentDirectory + "wardrobe_backup.db";
    try {
      await FileSystem.copyAsync({ from: dbPath, to: backupPath });
      await Sharing.shareAsync(backupPath, { dialogTitle: "保存备份" });
    } catch (e: any) {
      Alert.alert("备份失败", e.message);
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle?: string; onPress?: () => void }) => (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>💾 数据管理</Text>
      <View style={styles.card}>
        <MenuItem icon="📤" title="导出备份" subtitle="将数据备份为文件" onPress={handleBackup} />
        <MenuItem icon="📥" title="恢复备份" subtitle="从备份文件恢复数据" onPress={() => Alert.alert("提示", "功能开发中")} />
        <MenuItem icon="🗑" title="清除所有数据" subtitle="不可恢复" onPress={() => Alert.alert("提示", "功能开发中")} />
      </View>

      <Text style={styles.section}>☁️ 云同步</Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>服务器地址</Text>
          <TextInput style={styles.input} value={settings.serverUrl} onChangeText={(v) => { setSettings({ ...settings, serverUrl: v }); saveSetting("serverUrl", v); }} placeholder="http://8.162.26.192:3001" />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Token</Text>
          <TextInput style={styles.input} value={settings.token} onChangeText={(v) => { setSettings({ ...settings, token: v }); saveSetting("token", v); }} placeholder="同步密钥" secureTextEntry />
        </View>
        <Pressable style={styles.syncBtn} onPress={() => Alert.alert("提示", "同步功能开发中")}>
          <Ionicons name="sync" size={20} color="#fff" />
          <Text style={styles.syncBtnText}>立即同步</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>🌐 WebDAV</Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>WebDAV 地址</Text>
          <TextInput style={styles.input} value={settings.webdavUrl} onChangeText={(v) => { setSettings({ ...settings, webdavUrl: v }); saveSetting("webdavUrl", v); }} placeholder="https://dav.jianguoyun.com/dav/" />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>用户名</Text>
          <TextInput style={styles.input} value={settings.webdavUser} onChangeText={(v) => { setSettings({ ...settings, webdavUser: v }); saveSetting("webdavUser", v); }} placeholder="WebDAV 用户名" />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>密码</Text>
          <TextInput style={styles.input} value={settings.webdavPass} onChangeText={(v) => { setSettings({ ...settings, webdavPass: v }); saveSetting("webdavPass", v); }} placeholder="WebDAV 密码" secureTextEntry />
        </View>
      </View>

      <Text style={styles.section}>ℹ️ 关于</Text>
      <View style={styles.card}>
        <MenuItem icon="👗" title="智能衣橱 v1.0" subtitle="React Native + Expo" />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16 },
  section: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginTop: 20, marginBottom: 8, marginLeft: 4, textTransform: "uppercase" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  menuIcon: { fontSize: 24, marginRight: 12 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, color: "#111827" },
  menuSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  inputRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  inputLabel: { fontSize: 13, color: "#6b7280", marginBottom: 6 },
  input: { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 10, fontSize: 14 },
  syncBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, backgroundColor: "#6366f1", paddingVertical: 12, borderRadius: 12 },
  syncBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
