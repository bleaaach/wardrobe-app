import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useClothingStore } from "../src/store/clothingStore";
import { Colors, FontSize } from "../src/design/tokens";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const loadCategories = useClothingStore((s) => s.loadCategories);

  useEffect(() => {
    (async () => { await loadCategories(); await loadClothing(); setReady(true); })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg }}>
        <Text style={{ fontSize: 40 }}>👗</Text>
        <ActivityIndicator style={{ marginTop: 16 }} size="small" color={Colors.textTertiary} />
        <Text style={{ marginTop: 8, color: Colors.textSecondary, fontSize: FontSize.sm }}>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="closet/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="closet/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/create" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
