import { View, Text, Pressable, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import { AsyncImage } from "../../src/components/AsyncImage";
import { OutfitPreview } from "../../src/components/OutfitPreview";
import { IconButton } from "../../src/components/ui/IconButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Ionicons } from "@expo/vector-icons";
import { Outfit, Clothing } from "../../src/types";
import { Colors, Spacing, Radius, FontSize, TouchMin, PressedOpacity } from "../../src/design/tokens";

const COLORS = ["红","橙","黄","绿","蓝","紫","黑","白","灰","棕","粉","银","金"];
const SEASONS = ["春","夏","秋","冬"];
const SIZES = ["XXS","XS","S","M","L","XL","XXL","XXXL"];
const SHOE_SIZES = Array.from({length:20},(_,i)=>String(35+i));

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
  const [location, setLocation] = useState("");
  const [clothingSize, setClothingSize] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseLink, setPurchaseLink] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [notes, setNotes] = useState("");
  const [relatedOutfits, setRelatedOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(new Map());

  useEffect(() => {
    if (!item) return;
    setName(item.name||""); setCatId(item.categoryId||""); setBrand(item.brand||"");
    setColor(item.color||""); setSeason(item.season||""); setLocation(item.location||"");
    setClothingSize(item.clothingSize||""); setShoeSize(item.shoeSize||""); setPrice(item.price||"");
    setPurchaseLink(item.purchaseLink||""); setTagsStr(item.tags||"[]"); setNotes(item.notes||"");
    (async () => {
      const outfits = await useClothingStore.getState().getRelatedOutfits(item.id);
      setRelatedOutfits(outfits);
      const all = useClothingStore.getState().items;
      const map = new Map<string, Clothing>();
      for (const c of all) map.set(c.id, c);
      setClothingMap(map);
    })();
  }, [item?.id]);

  if (!item) return <View style={S.centered}><Text style={{color:Colors.textTertiary}}>不存在</Text></View>;

  const cat = categories.find((c) => c.id === catId);
  const wearCount = item.wearCount || 0;
  const costPerWear = price && wearCount > 0 ? (parseFloat(price)/wearCount).toFixed(2) : "-";

  const save = async () => {
    await updateItem(id!, { name, categoryId: catId, brand, color, season, location, clothingSize, shoeSize, price, purchaseLink, tags: tagsStr, notes });
    setEditing(false);
  };

  const getOutfitItems = (o: Outfit) => {
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    return ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
  };

  const seasonToggle = (s: string) => {
    const parts = season ? season.split("/") : [];
    setSeason(parts.includes(s) ? parts.filter(p=>p!==s).join("/") : [...parts, s].join("/"));
  };

  const Field = ({ label, value, children }: {label:string, value?:string, children?:any}) => (
    <View style={S.fieldWrap}>
      <Text style={S.fieldLabel}>{label}</Text>
      {editing && children ? children : <Text style={S.value}>{value || "未设置"}</Text>}
    </View>
  );

  const ChipGroup = ({ options, selected, onToggle }: {options:string[], selected:string, onToggle:(v:string)=>void}) => (
    <View style={S.chips}>
      {options.map((o) => (
        <Pressable key={o} style={[S.chip, selected.includes(o)&&S.chipActive]} onPress={()=>onToggle(o)}>
          <Text style={[S.chipText, selected.includes(o)&&S.chipActiveText]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image */}
      <View style={S.imageWrap}>
        <AsyncImage uri={item.imageUri} style={S.image} />
        <View style={S.imageGradient} />
        <View style={S.overlayActions}>
          <IconButton name="close" color={Colors.textPrimary} onPress={() => router.back()} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <IconButton name={item.favorite ? "heart" : "heart-outline"} color={item.favorite ? Colors.danger : Colors.textPrimary} onPress={() => updateItem(id!, { favorite: item.favorite ? 0 : 1 })} />
            <IconButton name={editing ? "checkmark" : "create-outline"} color={editing ? Colors.accent : Colors.textPrimary} onPress={() => editing ? save() : setEditing(true)} />
          </View>
        </View>
      </View>

      <View style={S.info}>
        {/* Name & Category */}
        {editing ? (
          <TextInput style={S.nameInput} value={name} onChangeText={setName} placeholder="名称" placeholderTextColor={Colors.textTertiary} />
        ) : (
          <>
            <Text style={S.name}>{name || "未命名"}</Text>
            <View style={S.catBadge}>
              <Text style={S.catText}>{cat?.icon} {cat?.name}</Text>
            </View>
          </>
        )}

        {/* Stats Cards */}
        {!editing && (
          <View style={S.statsRow}>
            <View style={S.statBox}>
              <Ionicons name="sync-outline" size={18} color={Colors.accent} />
              <Text style={S.statNum}>{wearCount}</Text>
              <Text style={S.statLabel}>穿着次数</Text>
            </View>
            <View style={S.statBox}>
              <Ionicons name="cash-outline" size={18} color={Colors.accent} />
              <Text style={S.statNum}>¥{costPerWear}</Text>
              <Text style={S.statLabel}>单次成本</Text>
            </View>
            {item.price ? (
              <View style={S.statBox}>
                <Ionicons name="pricetag-outline" size={18} color={Colors.accent} />
                <Text style={S.statNum}>¥{item.price}</Text>
                <Text style={S.statLabel}>购入价格</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Category (edit) */}
        {editing && <><Text style={S.fieldLabel}>分类</Text><View style={S.chips}>{categories.map((c)=>{
          const isActive = catId === c.id;
          return (
            <Pressable key={c.id} style={[S.chip, isActive&&S.chipActive]} onPress={()=>setCatId(c.id)}>
              <Text style={[S.chipText, isActive&&S.chipActiveText]}>{c.icon} {c.name}</Text>
            </Pressable>
          );
        })}</View></>}

        {/* Info Card */}
        <View style={S.infoCard}>
          <Field label="品牌">{editing && <TextInput style={S.input} value={brand} onChangeText={setBrand} placeholder="Nike" placeholderTextColor={Colors.textTertiary} />}</Field>

          <Field label="颜色">{editing && <ChipGroup options={COLORS} selected={color} onToggle={(c)=>setColor(color===c?"":c)} />}</Field>
          {!editing && <Field label="颜色" value={color} />}

          <Field label="季节">{editing && <ChipGroup options={SEASONS} selected={season} onToggle={seasonToggle} />}</Field>
          {!editing && <Field label="季节" value={season} />}

          <Field label="存放位置">{editing && <TextInput style={S.input} value={location} onChangeText={setLocation} placeholder="衣柜上层" placeholderTextColor={Colors.textTertiary} />}</Field>
          {!editing && <Field label="存放位置" value={location} />}

          <Field label="服装尺码">{editing && <ChipGroup options={SIZES} selected={clothingSize} onToggle={(s)=>setClothingSize(clothingSize===s?"":s)} />}</Field>
          {!editing && <Field label="服装尺码" value={clothingSize} />}

          <Field label="鞋码">{editing && <ChipGroup options={SHOE_SIZES} selected={shoeSize} onToggle={(s)=>setShoeSize(shoeSize===s?"":s)} />}</Field>
          {!editing && <Field label="鞋码" value={shoeSize} />}

          <Field label="价格 (¥)">{editing && <TextInput style={S.input} value={price} onChangeText={setPrice} placeholder="299" keyboardType="decimal-pad" placeholderTextColor={Colors.textTertiary} />}</Field>
          {!editing && <Field label="价格" value={price ? `¥${price}` : "未设置"} />}

          <Field label="购买链接">{editing && <TextInput style={S.input} value={purchaseLink} onChangeText={setPurchaseLink} placeholder="https://..." placeholderTextColor={Colors.textTertiary} />}</Field>

          <Field label="备注">{editing && <TextInput style={[S.input, S.notesInput]} value={notes} onChangeText={setNotes} placeholder="备注信息" placeholderTextColor={Colors.textTertiary} multiline />}</Field>
          {!editing && <Field label="备注" value={notes} />}
        </View>

        {/* Related Outfits */}
        {!editing && relatedOutfits.length > 0 && (
          <View style={{ marginTop: Spacing.xxl }}>
            <Text style={S.section}>相关搭配 ({relatedOutfits.length})</Text>
            <View style={{ gap: Spacing.md }}>
              {relatedOutfits.map((o) => {
                const items = getOutfitItems(o);
                return (
                  <Pressable
                    key={o.id}
                    style={({ pressed }) => [S.outfitCard, pressed && S.pressed]}
                    onPress={() => router.push(`/outfits/${o.id}`)}
                  >
                    <OutfitPreview items={items} size={80} />
                    <View style={{ marginLeft: Spacing.lg, flex: 1 }}>
                      <Text style={S.outfitName}>{o.name || "未命名搭配"}</Text>
                      <Text style={S.outfitMeta}>{items.length} 件衣物</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Delete */}
        <Pressable style={({pressed})=>[S.deleteBtn, pressed&&S.pressed]} onPress={() => {
          Alert.alert("删除", "确定删除？", [{ text: "取消", style: "cancel" }, { text: "删除", style: "destructive", onPress: async () => { await deleteItem(id!); router.back(); } }]);
        }}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={S.deleteText}>删除衣物</Text>
        </Pressable>
        <View style={{height:60}} />
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.bg },

  imageWrap: { position: "relative", width: "100%", height: 420 },
  image: { width: "100%", height: "100%", backgroundColor: Colors.surface },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "rgba(10,10,10,0.7)",
  },
  overlayActions: { position: "absolute", top: 48, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },

  info: { padding: Spacing.xl, paddingTop: 0, marginTop: -50 },
  name: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, letterSpacing: -0.5 },
  nameInput: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  catBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  catText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },

  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldWrap: { marginTop: Spacing.lg },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginBottom: Spacing.sm },
  value: { fontSize: FontSize.base, color: Colors.textPrimary },

  input: {
    fontSize: FontSize.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  notesInput: { height: 80, textAlignVertical: "top" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    minHeight: TouchMin,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipActiveText: { color: Colors.textInverse, fontWeight: "600" },

  section: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  outfitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outfitName: { fontSize: FontSize.base, fontWeight: "600", color: Colors.textPrimary },
  outfitMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    minHeight: TouchMin,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    marginTop: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: { opacity: PressedOpacity },
  deleteText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: "500" },
});
