import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { ModalHandle } from "../../src/components/ui/ModalHandle";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { addOutfit } from "../../src/db/database";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function CreateOutfitScreen() {
  const router = useRouter();
  const items = useClothingStore((s) => s.items);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  const toggleItem = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <View style={S.container}>
      <ModalHandle />

      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>新建搭配</Text>
        <Text style={S.headerSub}>已选 {selected.size} 件</Text>
      </View>

      {/* Name Input */}
      <View style={S.inputWrap}>
        <TextInput
          style={S.input}
          value={name}
          onChangeText={setName}
          placeholder="给这套搭配起个名字"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Selected Preview */}
      {selected.size > 0 && (
        <View style={S.previewRow}>
          {Array.from(selected).slice(0, 5).map((id) => {
            const item = items.find((i) => i.id === id);
            if (!item) return null;
            return (
              <Pressable key={id} style={S.previewThumb} onPress={() => toggleItem(id)}>
                <AsyncImage uri={item.imageUri} style={S.previewImage} />
                <View style={S.removeBadge}>
                  <Ionicons name="close" size={12} color={Colors.textPrimary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <View style={S.emptyWrap}>
          <Ionicons name="shirt-outline" size={40} color={Colors.textTertiary} />
          <Text style={S.emptyTitle}>衣橱是空的</Text>
          <Text style={S.emptySub}>先添加一些衣物，再来创建搭配</Text>
          <Pressable style={({ pressed }) => [S.emptyBtn, pressed && S.pressed]} onPress={() => router.push("/closet/add")}>
            <Text style={S.emptyBtnText}>去添加衣物</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={3}
          style={{ flex: 1 }}
          contentContainerStyle={S.grid}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                S.item,
                selected.has(item.id) && S.itemSelected,
                pressed && S.pressed,
              ]}
              onPress={() => toggleItem(item.id)}
            >
              <AsyncImage uri={item.imageUri} style={S.itemImage} />
              {selected.has(item.id) && (
                <View style={S.check}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                </View>
              )}
            </Pressable>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {/* Action Buttons */}
      <View style={S.actionRow}>
        <Pressable
          style={({ pressed }) => [
            S.saveBtn,
            selected.size === 0 && S.saveBtnDisabled,
            pressed && selected.size > 0 && S.pressed,
          ]}
          onPress={async () => {
            if (selected.size === 0) { Alert.alert("请至少选择一件衣物"); return; }
            await addOutfit({ name, clothingIds: JSON.stringify([...selected]), notes: "" });
            router.back();
          }}
        >
          <Text style={S.saveBtnText}>直接保存</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            S.collageBtn,
            selected.size === 0 && S.saveBtnDisabled,
            pressed && selected.size > 0 && S.pressed,
          ]}
          onPress={() => {
            if (selected.size === 0) { Alert.alert("请至少选择一件衣物"); return; }
            router.push({
              pathname: "/outfits/collage",
              params: { ids: Array.from(selected).join(","), name },
            });
          }}
        >
          <Ionicons name="images-outline" size={18} color={Colors.textInverse} />
          <Text style={S.collageBtnText}>拼图编辑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: { paddingTop: 24, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },

  inputWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  previewRow: { flexDirection: "row", gap: 8, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  previewThumb: { width: 56, height: 56, borderRadius: Radius.md, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  grid: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  item: {
    flex: 1,
    margin: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemSelected: { borderColor: Colors.accent },
  pressed: { opacity: PressedOpacity },
  itemImage: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.surfaceHighlight },
  check: { position: "absolute", top: 6, right: 6 },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    margin: Spacing.xl,
    marginTop: 0,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: TouchMin,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },
  collageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: TouchMin,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  collageBtnText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "600" },

  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  emptyBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  emptyBtnText: { color: Colors.textInverse, fontWeight: "600", fontSize: FontSize.base },
});
