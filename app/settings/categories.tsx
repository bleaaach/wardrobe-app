import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

export default function CategoriesScreen() {
  const router = useRouter();
  const categories = useClothingStore((s) => s.categories);
  const loadCategories = useClothingStore((s) => s.loadCategories);
  const addCat = useClothingStore((s) => s.addCat);
  const updateCat = useClothingStore((s) => s.updateCat);
  const deleteCat = useClothingStore((s) => s.deleteCat);
  const items = useClothingStore((s) => s.items);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("👕");

  useEffect(() => { loadCategories(); }, []);

  const startEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  };

  const saveEdit = async (id: string) => {
    await updateCat(id, { name: editName, icon: editIcon });
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    const count = items.filter((i) => i.categoryId === id).length;
    const msg = count > 0
      ? `该分类下有 ${count} 件衣物，删除后这些衣物将变为"未分类"状态。确定删除吗？`
      : "确定删除此分类吗？";
    Alert.alert("删除分类", msg, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => { await deleteCat(id); } },
    ]);
  };

  return (
    <View style={S.container}>
      <View style={S.header}>
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={S.headerTitle}>分类管理</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={categories}
        contentContainerStyle={S.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;
          const count = items.filter((i) => i.categoryId === item.id).length;
          return (
            <View style={S.card}>
              {isEditing ? (
                <View style={S.editRow}>
                  <TextInput style={[S.input, { width: 50 }]} value={editIcon} onChangeText={setEditIcon} />
                  <TextInput style={[S.input, { flex: 1 }]} value={editName} onChangeText={setEditName} />
                  <Pressable onPress={() => saveEdit(item.id)} style={S.editAction}>
                    <Ionicons name="checkmark" size={22} color={Colors.accent} />
                  </Pressable>
                </View>
              ) : (
                <View style={S.row}>
                  <View style={S.iconWrap}>
                    <Text style={S.icon}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.name}>{item.name}</Text>
                    <Text style={S.count}>{count} 件衣物</Text>
                  </View>
                  <Pressable onPress={() => startEdit(item)} style={S.actionBtn}>
                    <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id, item.name)} style={S.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Add New */}
      {adding ? (
        <View style={S.addCard}>
          <View style={S.editRow}>
            <TextInput style={[S.input, { width: 50 }]} value={newIcon} onChangeText={setNewIcon} />
            <TextInput style={[S.input, { flex: 1 }]} value={newName} onChangeText={setNewName} placeholder="新分类名称" placeholderTextColor={Colors.textTertiary} />
          </View>
          <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md }}>
            <Pressable style={S.cancelBtn} onPress={() => { setAdding(false); setNewName(""); }}>
              <Text style={S.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={[S.saveBtn, !newName && { opacity: 0.45 }]}
              onPress={async () => {
                if (!newName) return;
                await addCat({ name: newName, icon: newIcon, sortOrder: categories.length + 1 });
                setAdding(false);
                setNewName("");
              }}
            >
              <Text style={S.saveText}>添加</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={S.addBtn} onPress={() => setAdding(true)}>
          <Ionicons name="add" size={22} color={Colors.accent} />
          <Text style={S.addText}>添加新分类</Text>
        </Pressable>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },

  list: { paddingHorizontal: Spacing.xl, paddingBottom: 120, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 24 },
  name: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  count: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  actionBtn: { padding: 8, minHeight: TouchMin, justifyContent: "center" },

  editRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editAction: { padding: 8 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  addText: { fontSize: FontSize.base, color: Colors.accent, fontWeight: "600" },

  addCard: {
    margin: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { color: Colors.textSecondary, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  saveText: { color: Colors.textInverse, fontWeight: "600" },
});
