import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, PressedOpacity } from "../../design/tokens";

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  bg?: string;
  onPress?: () => void;
  style?: any;
}

export function IconButton({ name, size = 22, color = Colors.textPrimary, bg = Colors.surfaceElevated, onPress, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [S.btn, { backgroundColor: bg }, pressed && S.pressed, style]}
      onPress={onPress}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const S = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: PressedOpacity,
  },
});
