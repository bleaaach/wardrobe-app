import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  getOutfits,
  getAllClothing,
  addDailyLog,
  getDailyLogByDate,
} from "../../src/db/database";
import { Outfit, Clothing } from "../../src/types";
import { OutfitPreview } from "../../src/components/OutfitPreview";
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  PressedOpacity,
} from "../../src/design/tokens";

export default function DailyLogScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingMap, setClothingMap] = useState<Map<string, Clothing>>(
    new Map()
  );
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [os, all] = await Promise.all([
        getOutfits(),
        getAllClothing(),
      ]);
      setOutfits(os);
      const map = new Map<string, Clothing>();
      for (const c of all) map.set(c.id, c);
      setClothingMap(map);

      // 如果已有记录，预填充
      if (date) {
        const existing = await getDailyLogByDate(date);
        if (existing) {
          if (existing.outfitId) {
            setSelectedOutfitId(existing.outfitId);
          }
          if (existing.notes) {
            setNotes(existing.notes);
          }
        }
      }
    })();
  }, [date]);

  const getOutfitItems = (o: Outfit) => {
    const ids: string[] = JSON.parse(o.clothingIds || "[]");
    return ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
  };

  const handleSave = async () => {
    if (!selectedOutfitId) {
      Alert.alert("提示", "请选择一套搭配");
      return;
    }
    if (!date) {
      Alert.alert("错误", "日期无效");
      return;
    }
    setLoading(true);
    try {
      await addDailyLog({
        date,
        outfitId: selectedOutfitId,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert("保存失败", String(e));
    } finally {
      setLoading(false);
    }
  };

  const displayDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : "";

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Pressable style={S.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{displayDate}</Text>
          <Text style={S.headerSub}>记录当日穿搭</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Outfit Selector */}
        <Text style={S.section}>选择搭配</Text>
        {outfits.length === 0 ? (
          <View style={S.emptyOutfits}>
            <Ionicons
              name="layers-outline"
              size={32}
              color={Colors.textTertiary}
            />
            <Text style={S.emptyOutfitsText}>还没有搭配</Text>
            <Pressable
              style={({ pressed }) => [S.createBtn, pressed && S.pressed]}
              onPress={() => router.push("/outfits/create")}
            >
              <Text style={S.createBtnText}>去创建一套</Text>
            </Pressable>
          </View>
        ) : (
          <View style={S.outfitList}>
            {outfits.map((o) => {
              const items = getOutfitItems(o);
              const isSel = selectedOutfitId === o.id;
              return (
                <Pressable
                  key={o.id}
                  style={({ pressed }) => [
                    S.outfitCard,
                    isSel && S.outfitCardActive,
                    pressed && S.pressed,
                  ]}
                  onPress={() => setSelectedOutfitId(o.id)}
                >
                  <OutfitPreview items={items} size={100} />
                  <View style={S.outfitCardInfo}>
                    <Text
                      style={[
                        S.outfitCardName,
                        isSel && S.outfitCardNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {o.name || "未命名搭配"}
                    </Text>
                    <Text style={S.outfitCardMeta}>
                      {items.length} 件衣物
                    </Text>
                  </View>
                  {isSel && (
                    <View style={S.checkBadge}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={Colors.textInverse}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Notes */}
        <Text style={S.section}>备注</Text>
        <TextInput
          style={S.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="今天的心情、场合、天气..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          textAlignVertical="top"
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={S.footer}>
        <Pressable
          style={({ pressed }) => [
            S.saveBtn,
            (!selectedOutfitId || loading) && S.saveBtnDisabled,
            pressed && selectedOutfitId && !loading && S.pressed,
          ]}
          onPress={handleSave}
          disabled={!selectedOutfitId || loading}
        >
          <Text style={S.saveBtnText}>
            {loading ? "保存中..." : "保存记录"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingTop: 48,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },

  section: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },

  outfitList: {
    gap: Spacing.lg,
  },
  outfitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  outfitCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  outfitCardInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  outfitCardName: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  outfitCardNameActive: {
    color: Colors.accent,
  },
  outfitCardMeta: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyOutfits: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyOutfitsText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  createBtnText: {
    color: Colors.textInverse,
    fontWeight: "600",
    fontSize: FontSize.base,
  },

  notesInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: 100,
    lineHeight: 22,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  saveBtnText: {
    color: Colors.textInverse,
    fontWeight: "700",
    fontSize: FontSize.md,
  },

  pressed: { opacity: PressedOpacity },
});
