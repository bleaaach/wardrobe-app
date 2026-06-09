import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { Colors, FontSize, Shadows } from "../../src/design/tokens";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 6,
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: Colors.shadowMd,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
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
      <Tabs.Screen name="index" options={{ title: "棣栭〉", tabBarIcon: ({ color, size }) => (
        <Ionicons name="home-outline" size={size - 2} color={color} />
      ) }} />
      <Tabs.Screen name="closet" options={{ title: "琛ｆ┍", tabBarIcon: ({ color, size }) => (
        <Ionicons name="grid-outline" size={size - 2} color={color} />
      ) }} />
      <Tabs.Screen name="outfits" options={{ title: "鎼厤", tabBarIcon: ({ color, size }) => (
        <Ionicons name="layers-outline" size={size - 2} color={color} />
      ) }} />
      <Tabs.Screen name="calendar" options={{ title: "鏃ュ巻", tabBarIcon: ({ color, size }) => (
        <Ionicons name="calendar-outline" size={size - 2} color={color} />
      ) }} />
      <Tabs.Screen name="settings" options={{ title: "鎴戠殑", tabBarIcon: ({ color, size }) => (
        <Ionicons name="person-outline" size={size - 2} color={color} />
      ) }} />
    </Tabs>
  );
}
