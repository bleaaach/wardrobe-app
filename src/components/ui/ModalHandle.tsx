import { View, StyleSheet } from "react-native";
import { Colors, Radius } from "../../design/tokens";

export function ModalHandle() {
  return (
    <View style={S.container}>
      <View style={S.bar} />
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 14,
  },
  bar: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.textTertiary,
  },
});
