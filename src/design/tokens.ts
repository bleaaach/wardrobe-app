// ============================================================
// 设计系统 — 暗色画廊风 Dark Gallery
// 参考：精品买手店、高端时尚App、Stylebook
// 核心：深黑背景让服装图片成为绝对主角
// ============================================================

export type Theme = "light" | "dark";

export interface Colors {
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentLight: string;
  accentMuted: string;
  success: string;
  danger: string;
  warning: string;
  border: string;
  divider: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  glassBg: string;
  glassBorder: string;
  catBag: string;
  catOuter: string;
  catShoes: string;
  catDress: string;
}

const lightColors: Colors = {
  bg: "#FAF8F5",
  surface: "#FFFFFF",
  surfaceElevated: "#F5F2EE",
  surfaceHighlight: "#EDE9E4",
  textPrimary: "#1C1917",
  textSecondary: "#78716C",
  textTertiary: "#A8A29E",
  textInverse: "#FFFFFF",
  accent: "#B8925F",
  accentLight: "rgba(184,146,95,0.12)",
  accentMuted: "#D4B896",
  success: "#6B9B6F",
  danger: "#C45B4A",
  warning: "#D4A853",
  border: "#E7E5E4",
  divider: "#F0EEEC",
  shadow: "rgba(28, 25, 23, 0.06)",
  shadowMd: "rgba(28, 25, 23, 0.10)",
  shadowLg: "rgba(28, 25, 23, 0.14)",
  glassBg: "rgba(255,255,255,0.7)",
  glassBorder: "rgba(0,0,0,0.05)",
  catBag: "#8FC8D4",
  catOuter: "#B8A0D9",
  catShoes: "#8FD4A8",
  catDress: "#D48FB3",
};

// 暗色画廊风 — 核心主题
const darkColors: Colors = {
  bg: "#0A0A0A",
  surface: "#111111",
  surfaceElevated: "#1A1A1A",
  surfaceHighlight: "#252525",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textInverse: "#0A0A0A",
  accent: "#D4A853",
  accentLight: "rgba(212,168,83,0.15)",
  accentMuted: "#E8C87A",
  success: "#6B9B6F",
  danger: "#E07A5F",
  warning: "#D4A853",
  border: "rgba(255,255,255,0.06)",
  divider: "rgba(255,255,255,0.04)",
  shadow: "rgba(0,0,0,0.5)",
  shadowMd: "rgba(0,0,0,0.7)",
  shadowLg: "rgba(0,0,0,0.9)",
  glassBg: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(255,255,255,0.08)",
  catBag: "#8FC8D4",
  catOuter: "#B8A0D9",
  catShoes: "#8FD4A8",
  catDress: "#D48FB3",
};

export const Colors = lightColors;

export function getColors(theme: Theme): Colors {
  return theme === "dark" ? darkColors : lightColors;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 22,
  xl: 28,
  xxl: 36,
};

export const TouchMin = 44;
export const PressedOpacity = 0.7;

// 兼容旧代码的类型别名
export type ThemeColors = Colors;

// 字体配置（React Native 使用系统字体）
export const Fonts = {
  sans: "System",
  sansMedium: "System",
  sansSemiBold: "System",
  serif: "System",
};

// 统一的阴影样式
export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  lg: {
    shadowColor: Colors.shadowLg,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 48,
    elevation: 16,
  },
};

// Glassmorphism 卡片样式
export const Glass = {
  backgroundColor: Colors.glassBg,
  borderWidth: 1,
  borderColor: Colors.glassBorder,
};
