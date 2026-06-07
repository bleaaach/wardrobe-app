import { View, Text, FlatList, Pressable, StyleSheet, Platform, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AsyncImage } from "../../src/components/AsyncImage";
import { PageTransition } from "../../src/components/PageTransition";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useClothingStore } from "../../src/store/clothingStore";
import { Colors, Radius } from "../../src/design/tokens";
import { searchClothing } from "../../src/db/database";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ClosetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(items);
  const isSerif = Platform.OS === "ios" ? "Georgia" : "serif";

  const filtered = selectedCat ? results.filter(i => i.categoryId === selectedCat) : results;

  useEffect(() => {
    setResults(items);
  }, [items]);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults(items);
      return;
    }
    const r = await searchClothing(text);
    setResults(r);
  }, [items]);

  useFocusEffect(
    useCallback(() => {
      setQuery("");
      setResults(items);
      setSelectedCat(null);
    }, [items])
  );

  return (
    <PageTransition>
    <View style={S.container}>
      {/* Search */}
      <View style={[S.searchWrap, { marginTop: insets.top + 8 }]}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={S.searchInput}
          placeholder="搜索衣物..."
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
        />
        {query.length > 0 && (
          <Pressable onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <View style={S.catListWrap}>
        <FlatList
          horizontal
          data={[{id:null,name:"ALL",icon:""} as any, ...categories]}
          showsHorizontalScrollIndicator={false}
          style={S.catList}
          contentContainerStyle={{paddingHorizontal:20,gap:8,alignItems:"center"}}
          renderItem={({item}) => {
            const a = selectedCat === item.id;
            return <Pressable style={[S.chip, a&&S.chipActive]} onPress={() => setSelectedCat(a?null:item.id)}>
              <Text style={[S.chipText, a&&S.chipTextActive]}>{item.name}</Text>
            </Pressable>;
          }}
          keyExtractor={item => item.id||"all"}
        />
      </View>
      <View style={S.countRow}>
        <Text style={[S.countNum,{fontFamily:isSerif}]}>{filtered.length}</Text>
        <Text style={S.countLabel}>ITEMS</Text>
      </View>
      <FlatList
        data={filtered} numColumns={3} style={{flex:1}} contentContainerStyle={S.grid}
        renderItem={({item}) => (
          <Pressable style={S.item} onPress={() => router.push(`/closet/${item.id}`)}>
            <AsyncImage uri={item.imageUri} style={S.itemImg} />
            <Text style={S.itemName} numberOfLines={1}>{item.name || "未命名"}</Text>
          </Pressable>
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={S.empty}>
            <Ionicons name="shirt-outline" size={48} color={Colors.textTertiary} />
            <Text style={S.emptyText}>{query ? "未找到匹配的衣物" : "衣橱空空"}</Text>
            {!query && <Pressable style={S.emptyBtn} onPress={() => router.push("/closet/add")}><Text style={S.emptyBtnText}>+ 添加</Text></Pressable>}
          </View>
        }
      />
    </View>
    </PageTransition>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },
  catListWrap: { height: 38, marginTop: 0, marginBottom: 8 },
  catList: { flex: 1 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  chipActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  chipText: { fontSize: 13, color: Colors.textSecondary }, chipTextActive: { color: "#fff", fontWeight: "600" },
  countRow: { paddingHorizontal: 20, flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 8 },
  countNum: { fontSize: 32, fontWeight: "600", fontStyle: "italic", color: Colors.textPrimary },
  countLabel: { fontSize: 11, fontWeight: "500", letterSpacing: 2, color: Colors.textSecondary },
  grid: { paddingHorizontal: 12, paddingBottom: 120 },
  item: { flex: 1, margin: 6, backgroundColor: Colors.surface, borderRadius: 14, overflow: "hidden" },
  itemImg: { width: "100%", aspectRatio: 0.8, backgroundColor: Colors.bg },
  itemName: { fontSize: 11, color: Colors.textSecondary, padding: 8, textAlign: "center" },
  empty: { alignItems: "center", paddingTop: 80 }, emptyText: { fontSize: 15, color: Colors.textTertiary, marginTop: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: Colors.textPrimary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: "#fff", fontWeight: "600" },
});
