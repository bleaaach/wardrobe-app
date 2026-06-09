import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin } from "../../src/design/tokens";

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
  const [quickAddName, setQuickAddName] = useState<Record<string, string>>({});

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
      Alert.alert("??????", "??????????????????????????Äù");
      return;
    }
    const count = items.filter((i) => i.categoryId === id).length;
    const msg = count > 0
      ? `???????ù ${count} ?????????????????????"????ù"??Ä?Ä?ë????????
      : "?????????????ù";
    Alert.alert("??????", msg, [
      { text: "???", style: "cancel" },
      { text: "???", style: "destructive", onPress: async () => { await deleteCat(id); } },
    ]);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const sortOrder = newParent
      ? (categories.filter((c) => c.parentId === newParent).length + 1)
      : (parents.length + 1);
    await addCat({ name: newName.trim(), icon: "", sortOrder, parentId: newParent });
    setNewName("");
    setNewParent(null);
    setAdding(false);
  };

  const handleQuickAdd = async (parentId: string) => {
    const name = (quickAddName[parentId] || "").trim();
    if (!name) return;
    const sortOrder = categories.filter((c) => c.parentId === parentId).length + 1;
    await addCat({ name, icon: "", sortOrder, parentId });
    setQuickAddName((prev) => ({ ...prev, [parentId]: "" }));
  };

  const serifFont = Platform.OS === "ios" ? "Georgia" : "serif";

  return (
    <View style={styles.container}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: serifFont }]}>Categories</Text>
        <Pressable onPress={() => setAdding((v) => !v)} style={styles.headerAddBtn}>
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add new category card */}
        {adding && (
          <View style={styles.catGroup}>
            <View style={styles.catHeader}>
              <Text style={styles.catHeaderName}>NEW CATEGORY</Text>
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Category name..."
                placeholderTextColor={Colors.textTertiary}
              />
              <Pressable style={[styles.addButton, !newName.trim() && { opacity: 0.45 }]} onPress={handleAdd}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
            <View style={styles.chipsRow}>
              <Pressable
                style={[styles.chip, newParent === null && styles.chipActive]}
                onPress={() => setNewParent(null)}
              >
                <Text style={[styles.chipText, newParent === null && styles.chipTextActive]}>?Ä????ù</Text>
              </Pressable>
              {parents.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.chip, newParent === p.id && styles.chipActive]}
                  onPress={() => setNewParent(p.id)}
                >
                  <Text style={[styles.chipText, newParent === p.id && styles.chipTextActive]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Category groups */}
        {parents.map((parent) => {
          const subs = subsByParent.get(parent.id) || [];
          const isEditingParent = editingId === parent.id;
          return (
            <View key={parent.id} style={styles.catGroup}>
              {/* Group header */}
              <View style={styles.catHeader}>
                {isEditingParent ? (
                  <View style={styles.editHeaderRow}>
                    <TextInput
                      style={styles.editHeaderInput}
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <View style={styles.editHeaderActions}>
                      <Pressable
                        style={[styles.chip, editParent === null && styles.chipActive]}
                        onPress={() => setEditParent(null)}
                      >
                        <Text style={[styles.chipText, editParent === null && styles.chipTextActive]}>?Ä?ù</Text>
                      </Pressable>
                      {parents.filter((p) => p.id !== parent.id).map((p) => (
                        <Pressable
                          key={p.id}
                          style={[styles.chip, editParent === p.id && styles.chipActive]}
                          onPress={() => setEditParent(p.id)}
                        >
                          <Text style={[styles.chipText, editParent === p.id && styles.chipTextActive]}>{p.name}</Text>
                        </Pressable>
                      ))}
                      <Pressable onPress={() => saveEdit(parent.id)} style={styles.editSaveBtn}>
                        <Ionicons name="checkmark" size={20} color={Colors.accent} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.catHeaderName}>{parent.name}</Text>
                    <View style={styles.catHeaderActions}>
                      <Pressable onPress={() => startEdit(parent)} style={styles.catActionBtn}>
                        <Text style={styles.catActionText}>Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDelete(parent.id, parent.name)} style={styles.catActionBtn}>
                        <Text style={styles.catActionText}>Delete</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>

              {/* Sub list */}
              <View style={styles.subList}>
                {subs.map((sub) => {
                  const isEditing = editingId === sub.id;
                  const count = items.filter((i) => i.categoryId === sub.id).length;
                  return (
                    <View key={sub.id} style={styles.subItem}>
                      {isEditing ? (
                        <View style={styles.subEditRow}>
                          <TextInput
                            style={styles.subEditInput}
                            value={editName}
                            onChangeText={setEditName}
                          />
                          <View style={styles.subEditActions}>
                            {parents.map((p) => (
                              <Pressable
                                key={p.id}
                                style={[styles.chip, editParent === p.id && styles.chipActive]}
                                onPress={() => setEditParent(p.id)}
                              >
                                <Text style={[styles.chipText, editParent === p.id && styles.chipTextActive]}>{p.name}</Text>
                              </Pressable>
                            ))}
                            <Pressable onPress={() => saveEdit(sub.id)} style={styles.editSaveBtn}>
                              <Ionicons name="checkmark" size={20} color={Colors.accent} />
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={styles.subInfo}>
                            <View style={styles.dragHandle}>
                              <View style={styles.dragLine} />
                              <View style={styles.dragLine} />
                              <View style={styles.dragLine} />
                            </View>
                            <Text style={styles.subName}>{sub.name}</Text>
                          </View>
                          <View style={styles.subActions}>
                            <Text style={styles.subCount}>{count} ????ù</Text>
                            <Pressable onPress={() => startEdit(sub)} style={styles.subActionBtn}>
                              <Text style={styles.subActionText}>Edit</Text>
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Quick add row */}
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  value={quickAddName[parent.id] || ""}
                  onChangeText={(text) => setQuickAddName((prev) => ({ ...prev, [parent.id]: text }))}
                  placeholder="Add sub-category..."
                  placeholderTextColor={Colors.textTertiary}
                />
                <Pressable
                  style={[styles.addButton, !(quickAddName[parent.id] || "").trim() && { opacity: 0.45 }]}
                  onPress={() => handleQuickAdd(parent.id)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },

  catGroup: {
    marginBottom: 20,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  catHeaderName: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: Colors.textPrimary,
  },
  catHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  catActionBtn: {
    paddingHorizontal: 4,
    minHeight: TouchMin,
    justifyContent: "center",
  },
  catActionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  subList: {
    gap: 8,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  subInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dragHandle: {
    width: 16,
    gap: 3,
  },
  dragLine: {
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  subName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  subActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  subActionBtn: {
    minHeight: TouchMin,
    justifyContent: "center",
  },
  subActionText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  addRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  addInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.textPrimary,
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textInverse,
  },

  subEditRow: {
    flex: 1,
    gap: Spacing.sm,
  },
  subEditInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subEditActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
  },

  editHeaderRow: {
    flex: 1,
    gap: Spacing.sm,
  },
  editHeaderInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editHeaderActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
  },
  editSaveBtn: {
    padding: 8,
    minHeight: TouchMin,
    justifyContent: "center",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
});
