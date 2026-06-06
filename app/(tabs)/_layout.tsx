import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { backgroundColor: "#fff", borderTopWidth: 0, elevation: 8, height: Platform.OS === "ios" ? 88 : 64, paddingBottom: Platform.OS === "ios" ? 28 : 8 },
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", color: "#111827" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "今日穿搭", tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="closet" options={{ title: "衣橱", tabBarIcon: ({ color, size }) => <Ionicons name="shirt-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="outfits" options={{ title: "搭配", tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: "日历", tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "设置", tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
