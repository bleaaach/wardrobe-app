import { create } from "zustand";
import { Appearance } from "react-native";
import { getSetting, setSetting } from "../db/database";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeMode;
  effectiveTheme: "light" | "dark";
  setTheme: (t: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  init: () => Promise<void>;
}

function getEffectiveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  effectiveTheme: getEffectiveTheme("system"),

  setTheme: async (t) => {
    await setSetting("theme", t);
    set({ theme: t, effectiveTheme: getEffectiveTheme(t) });
  },

  toggleTheme: async () => {
    const current = get().effectiveTheme;
    const next = current === "dark" ? "light" : "dark";
    await setSetting("theme", next);
    set({ theme: next, effectiveTheme: next });
  },

  init: async () => {
    const saved = await getSetting("theme");
    const theme: ThemeMode =
      saved === "light" || saved === "dark" || saved === "system"
        ? saved
        : "system";
    set({ theme, effectiveTheme: getEffectiveTheme(theme) });
  },
}));

let appearanceListener: ReturnType<typeof Appearance.addChangeListener> | null = null;

export function startThemeListener() {
  if (appearanceListener) return;
  appearanceListener = Appearance.addChangeListener(({ colorScheme }) => {
    const store = useThemeStore.getState();
    if (store.theme === "system") {
      store.setTheme("system");
    }
  });
}

export function stopThemeListener() {
  if (appearanceListener) {
    appearanceListener.remove();
    appearanceListener = null;
  }
}
