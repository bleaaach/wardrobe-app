import { View, Text, Pressable, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { IconButton } from "../../src/components/ui/IconButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

const COLORS = ["红","橙","黄","绿","蓝","紫","黑","白","灰","棕","粉","银","金"];
const SEASONS = ["春","夏","秋","冬"];

export default function ClothingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useClothingStore((s) => s.items.find((i) => i.id === id));
  const categories = useClothingStore((s) => s.categories);
  const updateItem = useClothingStore((s) => s.updateItem);
  const deleteItem = useClothingStore((s) => s.deleteItem);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) { setName(item.name||""); setCatId(item.categoryId||""); setBrand(item.brand||""); setColor(item.color||""); setSeason(item.season||""); setNotes(item.notes||""); }
  }, [item?.id]);

  if (!item) return <View style={S.centered}><Text style={{color:Colors.textTertiary}}>不存在</Text></View>;

  const cat = categories.find((c) => c.id === catId);

  const save = async () => {
    await updateItem(id!, { name, categoryId: catId, brand, color, season, notes });
    setEditing(false);
  };

  const seasonToggle = (s: string) => {
    const parts = season ? season.split("/") : [];
    setSeason(parts.includes(s) ? parts.filter(p=>p!==s).join("/") : [...parts, s].join("/"));
  };

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
      <View style={S.imageWrap}>
        <AsyncImage uri={item.imageUri} style={S.image} />
        <View style={S.overlayActions}>
          <IconButton name="close" onPress={() => router.back()} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <IconButton
              name={item.favorite ? "heart" : "heart-outline"}
              color={item.favorite ? Colors.danger : Colors.textPrimary}
              onPress={() => updateItem(id!, { favorite: item.favorite ? 0 : 1 })}
            />
            <IconButton
              name={editing ? "checkmark" : "create-outline"}
              color={editing ? Colors.accent : Colors.textPrimary}
              onPress={() => editing ? save() : setEditing(true)}
            />
          </View>
        </View>
      </View>

      <View style={S.info}>
        {/* Name */}
        {editing ? (
          <TextInput style={S.input} value={name} onChangeText={setName} placeholder="名称" placeholderTextColor={Colors.textTertiary} />
        ) : (
          <Text style={S.name}>{name || "未命名"}</Text>
        )}
        {!editing && <Text style={S.cat}>{cat?.icon} {cat?.name}</Text>}

        {/* Category (edit only) */}
        {editing && (
          <>
            <Text style={S.label}>分类</Text>
            <View style={S.chips}>
              {categories.map((c) => (
                <Pressable key={c.id} style={[S.chip, catId===c.id&&S.chipActive]} onPress={()=>setCatId(c.id)}>
                  <Text style={[S.chipText, catId===c.id&&S.chipActiveText]}>{c.icon} {c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Brand */}
        <Text style={S.label}>品牌</Text>
        {editing ? (
          <TextInput style={S.input} value={brand} onChangeText={setBrand} placeholder="如：Nike" placeholderTextColor={Colors.textTertiary} />
        ) : (
          <Text style={S.value}>{brand || "未设置"}</Text>
        )}

        {/* Color */}
        <Text style={S.label}>颜色</Text>
        {editing ? (
          <View style={S.chips}>
            {COLORS.map((c) => (
              <Pressable key={c} style={[S.chip, color===c&&S.chipActive]} onPress={()=>setColor(color===c?"":c)}>
                <Text style={[S.chipText, color===c&&S.chipActiveText]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={S.value}>{color || "未设置"}</Text>
        )}

        {/* Season */}
        <Text style={S.label}>季节</Text>
        {editing ? (
          <View style={S.chips}>
            {SEASONS.map((s) => (
              <Pressable key={s} style={[S.chip, season.includes(s)&&S.chipActive]} onPress={()=>seasonToggle(s)}>
                <Text style={[S.chipText, season.includes(s)&&S.chipActiveText]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={S.value}>{season || "未设置"}</Text>
        )}

        {/* Notes */}
        <Text style={S.label}>备注</Text>
        {editing ? (
          <TextInput style={[S.input, S.notesInput]} value={notes} onChangeText={setNotes} placeholder="备注信息" placeholderTextColor={Colors.textTertiary} multiline />
        ) : (
          <Text style={S.notesText}>{notes || "无"}</Text>
        )}

        {/* Delete */}
        <Pressable style={({pressed})=>[S.deleteBtn, pressed&&S.pressed]} onPress={() => {
          Alert.alert("删除", "确定删除？", [
            { text: "取消", style: "cancel" },
            { text: "删除", style: "destructive", onPress: async () => { await deleteItem(id!); router.back(); } },
          ]);
        }}>
          <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
          <Text style={S.deleteText}>删除</Text>
        </Pressable>
        <View style={{height:40}}/>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },
  imageWrap: { position: "relative", width: "100%", height: 340 },
  image: { width: "100%", height: "100%", backgroundColor: Colors.surface },
  overlayActions: { position: "absolute", top: 48, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  info: { padding: Spacing.xl, paddingTop: Spacing.lg },
  name: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 2 },
  cat: { fontSize: FontSize.sm, color: Colors.accent, marginBottom: Spacing.lg, fontWeight: "500" },
  label: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  value: { fontSize: FontSize.base, color: Colors.textPrimary },
  notesText: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  input: { fontSize: FontSize.base, paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.divider, color: Colors.textPrimary, marginBottom: Spacing.sm },
  notesInput: { height: 80, textAlignVertical: "top", marginTop: Spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface, minHeight: TouchMin, justifyContent: "center", borderWidth: 1, borderColor: Colors.divider },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipActiveText: { color: Colors.textInverse, fontWeight: "600" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, minHeight: TouchMin, borderRadius: Radius.lg, backgroundColor: Colors.surface, marginTop: Spacing.xxl },
  pressed: { opacity: PressedOpacity },
  deleteText: { color: Colors.textTertiary, fontSize: FontSize.base, fontWeight: "500" },
});
