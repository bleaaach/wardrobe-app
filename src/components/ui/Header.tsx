import { View, Text, StyleSheet, Platform } from "react-native";
import { Colors, Spacing, FontSize } from "../../design/tokens";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, right }: Props) {
  return (
    <View style={S.container}>
      <View style={S.textWrap}>
        <Text style={S.title}>{title}</Text>
        {subtitle && <Text style={S.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
