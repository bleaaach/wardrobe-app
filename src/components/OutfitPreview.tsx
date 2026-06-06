import { View, StyleSheet } from "react-native";
import { AsyncImage } from "./AsyncImage";
import { Clothing } from "../types";

export function OutfitPreview({ items, size = 120 }: { items: Clothing[]; size?: number }) {
  const validItems = items.slice(0, 4);
  if (validItems.length === 0) {
    return (
      <View style={[S.empty, { width: size, height: size }]}>
        <View style={S.emptyDot} />
      </View>
    );
  }

  if (validItems.length === 1) {
    return (
      <View style={{ width: size, height: size, borderRadius: 20, overflow: "hidden" }}>
        <AsyncImage uri={validItems[0].imageUri} style={{ width: size, height: size }} />
      </View>
    );
  }

  if (validItems.length === 2) {
    return (
      <View style={[S.wrap, { width: size, height: size }]}>
        <View style={{ flex: 1, marginRight: 2 }}>
          <AsyncImage uri={validItems[0].imageUri} style={{ width: "100%", height: "100%" }} />
        </View>
        <View style={{ flex: 1, marginLeft: 2 }}>
          <AsyncImage uri={validItems[1].imageUri} style={{ width: "100%", height: "100%" }} />
        </View>
      </View>
    );
  }

  if (validItems.length === 3) {
    return (
      <View style={[S.wrap, { width: size, height: size }]}>
        <View style={{ flex: 1, marginRight: 2 }}>
          <AsyncImage uri={validItems[0].imageUri} style={{ width: "100%", height: "100%" }} />
        </View>
        <View style={{ flex: 1, marginLeft: 2, gap: 4 }}>
          <View style={{ flex: 1 }}>
            <AsyncImage uri={validItems[1].imageUri} style={{ width: "100%", height: "100%" }} />
          </View>
          <View style={{ flex: 1 }}>
            <AsyncImage uri={validItems[2].imageUri} style={{ width: "100%", height: "100%" }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[S.wrap, { width: size, height: size, flexWrap: "wrap", gap: 3 }]}>
      {validItems.map((item, i) => (
        <View key={item.id + i} style={{ width: size / 2 - 2, height: size / 2 - 2 }}>
          <AsyncImage uri={item.imageUri} style={{ width: "100%", height: "100%" }} />
        </View>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
  },
  empty: {
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
