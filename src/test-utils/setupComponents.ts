import { vi } from "vitest";

// Polyfill localStorage for Node.js test environment
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key of Object.keys(store)) delete store[key]; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    length: 0,
  } as Storage;
  Object.defineProperty(globalThis.localStorage, "length", {
    get: () => Object.keys(store).length,
  });
}

vi.mock("react-native", () => ({
  View: ({ children, style, ...props }: any) => {
    const React = require("react");
    return React.createElement("div", { ...props, "data-testid": "View", style: JSON.stringify(style) }, children);
  },
  Text: ({ children, style, ...props }: any) => {
    const React = require("react");
    return React.createElement("span", { ...props, "data-testid": "Text", style: JSON.stringify(style) }, children);
  },
  Image: ({ source, style, ...props }: any) => {
    const React = require("react");
    return React.createElement("img", { ...props, "data-testid": "Image", src: source?.uri, style: JSON.stringify(style) });
  },
  Pressable: ({ children, onPress, style, ...props }: any) => {
    const React = require("react");
    const resolvedStyle = typeof style === "function" ? style({ pressed: false }) : style;
    return React.createElement("button", { ...props, "data-testid": "Pressable", onClick: onPress, style: JSON.stringify(resolvedStyle) }, children);
  },
  ActivityIndicator: ({ ...props }: any) => {
    const React = require("react");
    return React.createElement("span", { ...props, "data-testid": "ActivityIndicator" }, "loading");
  },
  StyleSheet: {
    create: (s: any) => s,
    flatten: (s: any) => s,
  },
  Dimensions: {
    get: () => ({ width: 400, height: 800 }),
  },
  Platform: {
    OS: "ios",
    select: (obj: any) => obj.ios || obj.default,
  },
}));

vi.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, size, color }: any) => {
    const React = require("react");
    return React.createElement("span", { "data-testid": `Ionicons-${name}`, "data-size": size, "data-color": color });
  },
}));

vi.mock("react-native-reanimated", () => ({
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  runOnJS: (fn: any) => fn,
  default: {
    View: ({ children, style }: any) => {
      const React = require("react");
      return React.createElement("div", { "data-testid": "AnimatedView", style: JSON.stringify(style) }, children);
    },
  },
}));

vi.mock("react-native-gesture-handler", () => ({
  Gesture: {
    Pan: () => ({
      enabled: () => ({
        onBegin: () => ({
          onUpdate: () => ({
            onEnd: () => ({}),
          }),
        }),
      }),
    }),
  },
  GestureDetector: ({ children }: any) => children,
}));

vi.mock("../../hooks/useThemeColors", () => ({
  useThemeColors: () => ({
    textPrimary: "#FAF8F5",
    textSecondary: "#A8A29E",
    textTertiary: "#78716C",
    textInverse: "#1C1917",
    accent: "#E07A5F",
    danger: "#E07A5F",
    surface: "#141414",
    surfaceElevated: "#292524",
    surfaceHighlight: "#44403C",
    border: "rgba(255,255,255,0.08)",
  }),
}));

vi.mock("../hooks/useThemeColors", () => ({
  useThemeColors: () => ({
    textPrimary: "#FAF8F5",
    textSecondary: "#A8A29E",
    textTertiary: "#78716C",
    textInverse: "#1C1917",
    accent: "#E07A5F",
    danger: "#E07A5F",
    surface: "#141414",
    surfaceElevated: "#292524",
    surfaceHighlight: "#44403C",
    border: "rgba(255,255,255,0.08)",
  }),
}));
