import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useClothingStore } from "../src/store/clothingStore";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadClothing = useClothingStore((s) => s.loadClothing);
  const loadCategories = useClothingStore((s) => s.loadCategories);
  const colors = useThemeColors();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    (async () => {
      await loadCategories();
      await loadClothing();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surfaceElevated, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="shirt" size={32} color={colors.accent} />
        </View>
        <ActivityIndicator size="small" color={colors.textTertiary} style={{ marginBottom: 12 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Wardrobe</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="closet/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="closet/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="closet/categories" options={{ presentation: "modal" }} />
        <Stack.Screen name="closet/try-on" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/create" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/collage" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/random" options={{ presentation: "modal" }} />
        <Stack.Screen name="outfits/recommend" options={{ presentation: "modal" }} />
        <Stack.Screen name="calendar/log" options={{ presentation: "modal" }} />
        <Stack.Screen name="calendar/select-clothing" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings/categories" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings/archive" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings/statistics" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
