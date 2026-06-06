import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useClothingStore } from "../src/store/clothingStore";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const loadCategories = useClothingStore((s) => s.loadCategories);

  useEffect(() => {
    async function init() {
      await loadCategories();
      await loadClothing();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 32 }}>👗</Text>
        <Text style={{ marginTop: 12, color: "#666" }}>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="closet/add" options={{ presentation: "modal", title: "添加衣物" }} />
        <Stack.Screen name="closet/[id]" options={{ presentation: "modal", title: "衣物详情" }} />
        <Stack.Screen name="outfits/create" options={{ presentation: "modal", title: "创建搭配" }} />
        <Stack.Screen name="outfits/[id]" options={{ presentation: "modal", title: "搭配详情" }} />
      </Stack>
    </>
  );
}
