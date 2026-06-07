import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../design/tokens";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
  size?: "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Button({ title, onPress, variant = "primary", size = "lg", disabled, loading, icon }: Props) {
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: S.primary,
    secondary: S.secondary,
    ghost: S.ghost,
    danger: S.danger,
    glass: S.glass,
  };

  const textStyles = {
    primary: S.primaryText,
    secondary: S.secondaryText,
    ghost: S.ghostText,
    danger: S.dangerText,
    glass: S.glassText,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        S.base,
        S[size],
        variantStyles[variant],
        isDisabled && S.disabled,
        pressed && !isDisabled && S.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? Colors.textInverse : Colors.accent}
        />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={textStyles[variant].color as string} style={{ marginRight: 6 }} />}
          <Text style={[S.text, textStyles[variant]]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const S = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: Radius.full,
    alignSelf: "stretch",
  },
  md: { paddingVertical: 10, paddingHorizontal: 20, minHeight: TouchMin },
  lg: { paddingVertical: 14, paddingHorizontal: 24, minHeight: TouchMin + 8 },

  primary: { backgroundColor: Colors.textPrimary },
  secondary: { backgroundColor: Colors.surfaceElevated },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: Colors.danger },
  glass: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  disabled: { opacity: 0.4 },
  pressed: { opacity: PressedOpacity },

  text: { fontSize: FontSize.base, fontWeight: "600" },
  primaryText: { color: Colors.textInverse },
  secondaryText: { color: Colors.accent },
  ghostText: { color: Colors.accent },
  dangerText: { color: Colors.textInverse },
  glassText: { color: Colors.textPrimary },
});
