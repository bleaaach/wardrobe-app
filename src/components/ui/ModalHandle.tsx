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
    paddingTop: 8,
    paddingBottom: 12,
  },
  bar: {
    width: 36,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.divider,
  },
});
