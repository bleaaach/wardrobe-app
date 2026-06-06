import { View, StyleSheet, ViewProps } from "react-native";
import { Colors, Spacing, Radius, Shadows } from "../../design/tokens";

interface Props extends ViewProps {
  children: React.ReactNode;
  shadow?: "none" | "sm" | "md";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, style, shadow = "none", padding = "lg", ...rest }: Props) {
  return (
    <View
      style={[
        S.base,
        S[shadow],
        S[`p${padding}`],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const S = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  none: {},
  sm: Shadows.sm,
  md: Shadows.md,
  pnone: {},
  psm: { padding: Spacing.sm },
  pmd: { padding: Spacing.md },
  plg: { padding: Spacing.lg },
});
