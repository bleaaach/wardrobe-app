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

      <View style={S.form}>
        <Text style={S.label}>搭配名称</Text>
        <TextInput
          style={S.input}
          value={name}
          onChangeText={setName}
          placeholder="如：约会装、通勤装"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <Text style={S.sectionTitle}>选择衣物 ({selected.size}件)</Text>
      <FlatList
        data={items}
        numColumns={3}
        contentContainerStyle={S.grid}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [S.item, selected.has(item.id) && S.itemSelected, pressed && S.pressed]} onPress={() => toggleItem(item.id)}>
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

      <Pressable
        style={({ pressed }) => [S.saveBtn, selected.size === 0 && S.saveBtnDisabled, pressed && selected.size > 0 && S.pressed]}
        onPress={async () => {
          if (selected.size === 0) { Alert.alert("请至少选择一件衣物"); return; }
          await addOutfit({ name, clothingIds: JSON.stringify([...selected]), notes: "" });
          router.back();
        }}
      >
        <Text style={S.saveBtnText}>保存搭配</Text>
      </Pressable>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  form: { padding: Spacing.xl, backgroundColor: Colors.surface, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary },
  sectionTitle: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  grid: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  item: { flex: 1, margin: 4, backgroundColor: Colors.surface, borderRadius: Radius.md, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  itemSelected: { borderColor: Colors.accent },
  pressed: { opacity: PressedOpacity },
  itemImage: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.border },
  check: { position: "absolute", top: 6, right: 6 },
  saveBtn: { margin: Spacing.xl, backgroundColor: Colors.accent, borderRadius: Radius.xl, paddingVertical: 16, alignItems: "center", minHeight: TouchMin },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.textInverse, fontSize: FontSize.md, fontWeight: "600" },
});
