// 设计系统 — 暗色画廊风：深色背景，琥珀金强调，图片主角
export const Colors = {
  // 背景 - 极深黑系列
  bg: "#0A0A0A",
  surface: "#141414",
  surfaceElevated: "#1E1E1E",
  surfaceHighlight: "#2A2A2A",

  // 文字 - 层次分明
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",
  textInverse: "#0A0A0A",

  // 强调色 - 琥珀金
  accent: "#E8B86D",
  accentLight: "rgba(232, 184, 109, 0.15)",
  accentMuted: "rgba(232, 184, 109, 0.5)",

  // 功能色
  success: "#6B9B6F",
  danger: "#E07A5F",
  warning: "#D4A853",

  // 分类颜色（暗色版）
  catTop: "#E8B86D",
  catBottom: "#8FA8D9",
  catDress: "#D48FB3",
  catOuter: "#B8A0D9",
  catShoes: "#8FD4A8",
  catAccessory: "#D4C88F",
  catBag: "#8FC8D4",

  // 边框/分割线
  border: "rgba(255, 255, 255, 0.08)",
  divider: "rgba(255, 255, 255, 0.06)",

  // 阴影（暗色更微妙）
  shadow: "rgba(0, 0, 0, 0.4)",
  shadowMd: "rgba(0, 0, 0, 0.5)",
  shadowLg: "rgba(0, 0, 0, 0.6)",

  // 发光效果
  glow: "rgba(232, 184, 109, 0.3)",
};

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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const TouchMin = 44;
export const PressedOpacity = 0.7;

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadowMd,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadowLg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
};
