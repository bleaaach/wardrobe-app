import { View, Text, StyleSheet, Platform } from "react-native";
import { Colors, Spacing, FontSize } from "../../design/tokens";

interface Props {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: Props) {
  return (
    <View style={S.container}>
      <Text style={S.title}>{title}</Text>
      {subtitle && <Text style={S.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
