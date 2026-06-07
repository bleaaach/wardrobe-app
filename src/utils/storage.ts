/*
 * @Author: Bleaach008
 * @Date: 2026-06-07 12:42:16
 * @LastEditTime: 2026-06-07 12:53:11
 * @FilePath: \wardrobe-app\src\utils\storage.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by 008, All Rights Reserved. 
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function safeLocalStorage(method: "getItem" | "setItem" | "removeItem", key: string, value?: string): string | null | void {
  try {
    if (typeof localStorage === "undefined") return method === "getItem" ? null : undefined;
    if (method === "getItem") return localStorage.getItem(key);
    if (method === "setItem" && value !== undefined) return localStorage.setItem(key, value);
    if (method === "removeItem") return localStorage.removeItem(key);
  } catch {
    return method === "getItem" ? null : undefined;
  }
}

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return safeLocalStorage("getItem", key) as string | null;
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error("Storage getItem error:", e);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        safeLocalStorage("setItem", key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error("Storage setItem error:", e);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        safeLocalStorage("removeItem", key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error("Storage removeItem error:", e);
    }
  },
};

export default storage;
