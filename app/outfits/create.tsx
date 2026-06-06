import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { addOutfit } from "../../src/db/database";
import { Ionicons } from "@expo/vector-icons";

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
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>搭配名称</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="如：约会装、通勤装" />
      </View>
      <Text style={styles.sectionTitle}>选择衣物 ({selected.size}件)</Text>
      <FlatList
        data={items}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable style={[styles.item, selected.has(item.id) && styles.itemSelected]} onPress={() => toggleItem(item.id)}>
            <AsyncImage uri={item.imageUri} style={styles.itemImage} />
            {selected.has(item.id) && <View style={styles.check}><Ionicons name="checkmark-circle" size={24} color="#6366f1" /></View>}
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
      <Pressable
        style={[styles.saveBtn, selected.size === 0 && styles.saveBtnDisabled]}
        onPress={async () => {
          if (selected.size === 0) { Alert.alert("请至少选择一件衣物"); return; }
          await addOutfit({ name, clothingIds: JSON.stringify([...selected]), notes: "" });
          router.back();
        }}
      >
        <Text style={styles.saveBtnText}>保存搭配</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  form: { padding: 16, backgroundColor: "#fff", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { backgroundColor: "#f3f4f6", borderRadius: 12, padding: 12, fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#374151", padding: 16, paddingBottom: 8 },
  grid: { paddingHorizontal: 8 },
  item: { flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  itemSelected: { borderColor: "#6366f1" },
  itemImage: { width: "100%", aspectRatio: 0.8, backgroundColor: "#f3f4f6" },
  check: { position: "absolute", top: 6, right: 6 },
  saveBtn: { margin: 16, backgroundColor: "#6366f1", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
