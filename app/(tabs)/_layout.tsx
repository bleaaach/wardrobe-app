import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { Colors, FontSize, Shadows } from "../../src/design/tokens";

export default function TabLayout() {
  return (
    <Tabs
      sceneContainerStyle={{ flex: 1, backgroundColor: Colors.bg }}
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios" ? "rgba(10,10,10,0.92)" : Colors.bg,
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
      <Tabs.Screen name="index" options={{ title: "首页", tabBarIcon: ({ color, size, focused }) => (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "home" : "home-outline"} size={size - 2} color={color} />
          {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 2, shadowColor: Colors.accent, shadowRadius: 4, shadowOpacity: 0.8 }} />}
        </View>
      ) }} />
      <Tabs.Screen name="closet" options={{ title: "衣橱", tabBarIcon: ({ color, size, focused }) => (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "grid" : "grid-outline"} size={size - 2} color={color} />
          {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 2, shadowColor: Colors.accent, shadowRadius: 4, shadowOpacity: 0.8 }} />}
        </View>
      ) }} />
      <Tabs.Screen name="outfits" options={{ title: "搭配", tabBarIcon: ({ color, size, focused }) => (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "layers" : "layers-outline"} size={size - 2} color={color} />
          {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 2, shadowColor: Colors.accent, shadowRadius: 4, shadowOpacity: 0.8 }} />}
        </View>
      ) }} />
      <Tabs.Screen name="calendar" options={{ title: "日历", tabBarIcon: ({ color, size, focused }) => (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size - 2} color={color} />
          {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 2, shadowColor: Colors.accent, shadowRadius: 4, shadowOpacity: 0.8 }} />}
        </View>
      ) }} />
      <Tabs.Screen name="settings" options={{ title: "设置", tabBarIcon: ({ color, size, focused }) => (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "settings" : "settings-outline"} size={size - 2} color={color} />
          {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 2, shadowColor: Colors.accent, shadowRadius: 4, shadowOpacity: 0.8 }} />}
        </View>
      ) }} />
    </Tabs>
  );
}
