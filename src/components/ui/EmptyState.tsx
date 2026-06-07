import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, FontSize } from "../../design/tokens";
import { Button } from "./Button";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View style={S.container}>
      <View style={S.iconWrap}>
        <Ionicons name={icon} size={40} color={Colors.textTertiary} />
      </View>
      <Text style={S.title}>{title}</Text>
      {subtitle && <Text style={S.subtitle}>{subtitle}</Text>}
      {action && (
        <View style={S.action}>
          <Button title={action.label} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: { alignItems: "center", paddingTop: 100, paddingHorizontal: Spacing.xxxl },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 6, marginBottom: Spacing.xl, textAlign: "center" },
  action: { width: "100%", maxWidth: 240, marginTop: Spacing.md },
});
