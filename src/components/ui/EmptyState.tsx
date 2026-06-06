import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, FontSize } from "../../design/tokens";
import { Button } from "./Button";

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View style={S.container}>
      <Text style={S.icon}>{icon}</Text>
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
  container: { alignItems: "center", paddingTop: 80, paddingHorizontal: Spacing.xxxl },
  icon: { fontSize: 56, marginBottom: Spacing.lg, opacity: 0.6 },
  title: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 6, marginBottom: Spacing.xl, textAlign: "center" },
  action: { width: "100%", maxWidth: 240 },
});
