import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
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
  const [editParent, setEditParent] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState<string | null>(null);

  useEffect(() => { loadCategories(); }, []);

  const { parents, subsByParent } = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    const subsByParent = new Map<string, typeof categories>();
    for (const p of parents) {
      subsByParent.set(p.id, categories.filter((c) => c.parentId === p.id).sort((a, b) => a.sortOrder - b.sortOrder));
    }
    return { parents, subsByParent };
  }, [categories]);

  const startEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditParent(cat.parentId || null);
  };

  const saveEdit = async (id: string) => {
    await updateCat(id, { name: editName, parentId: editParent });
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    const hasChildren = categories.some((c) => c.parentId === id);
    if (hasChildren) {
      Alert.alert("无法删除", "该分类下还有子分类，请先删除子分类。");
      return;
    }
    const count = items.filter((i) => i.categoryId === id).length;
    const msg = count > 0
      ? `该分类下有 ${count} 件衣物，删除后这些衣物将变为"未分类"状态。确定删除吗？`
      : "确定删除此分类吗？";
    Alert.alert("删除分类", msg, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => { await deleteCat(id); } },
    ]);
  };

  const renderCat = (cat: typeof categories[0], level: number) => {
    const isEditing = editingId === cat.id;
    const count = items.filter((i) => i.categoryId === cat.id).length;
    const childrenCount = categories.filter((c) => c.parentId === cat.id).length;
    return (
      <View key={cat.id} style={[S.card, level === 1 && { marginLeft: Spacing.xl }]}>
        {isEditing ? (
          <View style={S.editRow}>
            <TextInput style={[S.input, { flex: 1 }]} value={editName} onChangeText={setEditName} />
            {!cat.parentId && (
              <Pressable style={[S.badge, editParent === null && S.badgeActive]} onPress={() => setEditParent(null)}>
                <Text style={S.badgeText}>一级</Text>
              </Pressable>
            )}
            {cat.parentId && parents.map((p) => (
              <Pressable key={p.id} style={[S.badge, editParent === p.id && S.badgeActive]} onPress={() => setEditParent(p.id)}>
                <Text style={S.badgeText}>{p.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => saveEdit(cat.id)} style={S.editAction}>
              <Ionicons name="checkmark" size={22} color={Colors.accent} />
            </Pressable>
          </View>
        ) : (
          <View style={S.row}>
            <View style={{ flex: 1 }}>
              <Text style={[S.name, level === 0 && { fontWeight: "800", fontSize: FontSize.md }]}>{cat.name}</Text>
              <Text style={S.count}>
                {cat.parentId ? `${count} 件衣物` : `${childrenCount} 个子分类`}
              </Text>
            </View>
            <Pressable onPress={() => startEdit(cat)} style={S.actionBtn}>
              <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleDelete(cat.id, cat.name)} style={S.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const allCats = parents.flatMap((p) => [p, ...(subsByParent.get(p.id) || [])]);

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
        data={allCats}
        contentContainerStyle={S.list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderCat(item, item.parentId ? 1 : 0)}
      />

      {/* Add New */}
      {adding ? (
        <View style={S.addCard}>
          <TextInput style={S.input} value={newName} onChangeText={setNewName} placeholder="新分类名称" placeholderTextColor={Colors.textTertiary} />
          <Text style={{ fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm, marginBottom: Spacing.sm }}>选择所属一级分类（留空则为一级分类）</Text>
          <View style={S.chips}>
            <Pressable style={[S.badge, newParent === null && S.badgeActive]} onPress={() => setNewParent(null)}>
              <Text style={S.badgeText}>一级分类</Text>
            </Pressable>
            {parents.map((p) => (
              <Pressable key={p.id} style={[S.badge, newParent === p.id && S.badgeActive]} onPress={() => setNewParent(p.id)}>
                <Text style={S.badgeText}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md }}>
            <Pressable style={S.cancelBtn} onPress={() => { setAdding(false); setNewName(""); setNewParent(null); }}>
              <Text style={S.cancelText}>取消</Text>
            </Pressable>
            <Pressable
              style={[S.saveBtn, !newName && { opacity: 0.45 }]}
              onPress={async () => {
                if (!newName) return;
                const sortOrder = newParent
                  ? (categories.filter((c) => c.parentId === newParent).length + 1)
                  : (parents.length + 1);
                await addCat({ name: newName, icon: "", sortOrder, parentId: newParent });
                setAdding(false);
                setNewName("");
                setNewParent(null);
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
  name: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary },
  count: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  actionBtn: { padding: 8, minHeight: TouchMin, justifyContent: "center" },

  editRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
  },
  editAction: { padding: 8 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  badgeText: { fontSize: FontSize.xs, color: Colors.textSecondary },

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
