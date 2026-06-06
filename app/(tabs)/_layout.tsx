import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { Colors, FontSize, Shadows } from "../../src/design/tokens";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.85)" : Colors.surface,
          borderTopColor: Colors.divider,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 6,
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: Colors.shadowMd,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: "500" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "首页", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size - 2} color={color} /> }} />
      <Tabs.Screen name="closet" options={{ title: "衣橱", tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size - 2} color={color} /> }} />
      <Tabs.Screen name="outfits" options={{ title: "搭配", tabBarIcon: ({ color, size }) => <Ionicons name="layers" size={size - 2} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: "日历", tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size - 2} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "设置", tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size - 2} color={color} /> }} />
    </Tabs>
  );
}
