import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../design/tokens";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ title, onPress, variant = "primary", size = "lg", disabled, loading, icon }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        S.base,
        S[size],
        S[variant],
        isDisabled && S.disabled,
        pressed && !isDisabled && S.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" || variant === "danger" ? Colors.textInverse : Colors.accent} />
      ) : (
        <>
          {icon}
          <Text style={[S.text, S[`${variant}Text`]]}>{title}</Text>
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
    gap: 8,
    borderRadius: Radius.full,
    alignSelf: "stretch",
  },
  md: { paddingVertical: 10, paddingHorizontal: 20, minHeight: TouchMin },
  lg: { paddingVertical: 14, paddingHorizontal: 24, minHeight: TouchMin + 8 },

  primary: { backgroundColor: Colors.accent },
  secondary: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: Colors.danger },

  disabled: { opacity: 0.4 },
  pressed: { opacity: PressedOpacity },

  text: { fontSize: FontSize.base, fontWeight: "600" },
  primaryText: { color: Colors.textInverse },
  secondaryText: { color: Colors.accent },
  ghostText: { color: Colors.accent },
  dangerText: { color: Colors.textInverse },
});
