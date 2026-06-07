import { useThemeStore } from "../store/themeStore";
import { getColors } from "../design/tokens";

export function useThemeColors() {
  const effectiveTheme = useThemeStore((s) => s.effectiveTheme);
  return getColors(effectiveTheme);
}
