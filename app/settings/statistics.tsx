import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClothingStore } from "../../src/store/clothingStore";
import { Header } from "../../src/components/ui/Header";
import { Colors, Spacing, Radius, FontSize } from "../../src/design/tokens";

function parsePrice(p: string): number {
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatCurrency(n: number): string {
  return "¥" + Math.round(n).toLocaleString();
}

function getPriceLabel(n: number): string {
  if (n < 100) return "0-100";
  if (n < 300) return "100-300";
  if (n < 500) return "300-500";
  if (n < 1000) return "500-1000";
  return "1000+";
}

function getWearLabel(n: number): string {
  if (n === 0) return "0次";
  if (n <= 5) return "1-5次";
  if (n <= 10) return "6-10次";
  return "10+次";
}

interface StatItem {
  label: string;
  count: number;
  value?: number; // 用于价格汇总
  avgPrice?: number;
  totalPrice?: number;
}

interface SectionData {
  title: string;
  icon: string;
  items: StatItem[];
  max: number;
  unit?: string;
  showPrice?: boolean;
}

export default function StatisticsScreen() {
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "类别统计": true,
  });

  const catMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) {
      map[c.id] = c.name;
    }
    return map;
  }, [categories]);

  const parentCatName = (catId: string): string => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return "未知";
    if (cat.parentId) {
      const parent = categories.find((c) => c.id === cat.parentId);
      return parent ? `${parent.name} / ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  const summary = useMemo(() => {
    const total = items.length;
    const totalPrice = items.reduce((sum, i) => sum + parsePrice(i.price), 0);
    const brands = new Set(items.map((i) => i.brand).filter(Boolean)).size;
    const colors = new Set(items.map((i) => i.color).filter(Boolean)).size;
    const maxWear = items.reduce(
      (max, i) => Math.max(max, i.wearCount || 0),
      0
    );
    const topItem = items.find((i) => (i.wearCount || 0) === maxWear && maxWear > 0);
    return { total, totalPrice, brands, colors, maxWear, topItem };
  }, [items]);

  const sections: SectionData[] = useMemo(() => {
    // 1. 类别
    const catAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = parentCatName(i.categoryId);
      if (!catAgg[label]) {
        catAgg[label] = { label, count: 0, totalPrice: 0, avgPrice: 0 };
      }
      catAgg[label].count += 1;
      catAgg[label].totalPrice! += parsePrice(i.price);
    }
    const catItems = Object.values(catAgg).map((x) => ({
      ...x,
      avgPrice: Math.round((x.totalPrice || 0) / x.count),
    }));
    catItems.sort((a, b) => b.count - a.count);

    // 2. 品牌
    const brandAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = i.brand.trim() || "未设置";
      if (!brandAgg[label]) brandAgg[label] = { label, count: 0 };
      brandAgg[label].count += 1;
    }
    const brandItems = Object.values(brandAgg).sort((a, b) => b.count - a.count);

    // 3. 颜色
    const colorAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = i.color.trim() || "未设置";
      if (!colorAgg[label]) colorAgg[label] = { label, count: 0 };
      colorAgg[label].count += 1;
    }
    const colorItems = Object.values(colorAgg).sort((a, b) => b.count - a.count);

    // 4. 位置
    const locAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = i.location.trim() || "未设置";
      if (!locAgg[label]) locAgg[label] = { label, count: 0 };
      locAgg[label].count += 1;
    }
    const locItems = Object.values(locAgg).sort((a, b) => b.count - a.count);

    // 5. 价格区间
    const priceAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const p = parsePrice(i.price);
      if (p <= 0) continue;
      const label = getPriceLabel(p);
      if (!priceAgg[label]) priceAgg[label] = { label, count: 0 };
      priceAgg[label].count += 1;
    }
    const priceItems = Object.values(priceAgg).sort((a, b) => {
      const order = ["0-100", "100-300", "300-500", "500-1000", "1000+"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });

    // 6. 穿着频率
    const wearAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = getWearLabel(i.wearCount || 0);
      if (!wearAgg[label]) wearAgg[label] = { label, count: 0 };
      wearAgg[label].count += 1;
    }
    const wearItems = Object.values(wearAgg).sort((a, b) => {
      const order = ["0次", "1-5次", "6-10次", "10+次"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });

    return [
      {
        title: "类别统计",
        icon: "layers-outline",
        items: catItems,
        max: Math.max(1, ...catItems.map((i) => i.count)),
        showPrice: true,
      },
      {
        title: "品牌统计",
        icon: "pricetag-outline",
        items: brandItems,
        max: Math.max(1, ...brandItems.map((i) => i.count)),
      },
      {
        title: "颜色统计",
        icon: "color-palette-outline",
        items: colorItems,
        max: Math.max(1, ...colorItems.map((i) => i.count)),
      },
      {
        title: "位置统计",
        icon: "location-outline",
        items: locItems,
        max: Math.max(1, ...locItems.map((i) => i.count)),
      },
      {
        title: "价格分布",
        icon: "cash-outline",
        items: priceItems,
        max: Math.max(1, ...priceItems.map((i) => i.count)),
        unit: "件",
      },
      {
        title: "使用情况",
        icon: "footsteps-outline",
        items: wearItems,
        max: Math.max(1, ...wearItems.map((i) => i.count)),
        unit: "件",
      },
    ];
  }, [items, catMap]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      <Header title="统计信息" subtitle="洞察你的衣橱数据" />

      {/* Summary Cards */}
      <View style={S.summaryRow}>
        <View style={[S.summaryCard, { flex: 1 }]}>
          <Text style={S.summaryNum}>{summary.total}</Text>
          <Text style={S.summaryLabel}>总件数</Text>
        </View>
        <View style={[S.summaryCard, { flex: 1 }]}>
          <Text style={S.summaryNum}>{formatCurrency(summary.totalPrice)}</Text>
          <Text style={S.summaryLabel}>总价值</Text>
        </View>
      </View>
      <View style={S.summaryRow}>
        <View style={[S.summaryCard, { flex: 1 }]}>
          <Text style={S.summaryNum}>{summary.brands}</Text>
          <Text style={S.summaryLabel}>品牌数</Text>
        </View>
        <View style={[S.summaryCard, { flex: 1 }]}>
          <Text style={S.summaryNum}>{summary.colors}</Text>
          <Text style={S.summaryLabel}>颜色数</Text>
        </View>
      </View>
      {summary.topItem && (
        <View style={S.topWearCard}>
          <Ionicons name="flame" size={18} color={Colors.accent} />
          <Text style={S.topWearText}>
            最常穿：{summary.topItem.name}（{summary.maxWear}次）
          </Text>
        </View>
      )}

      {/* Sections */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: 40 }}>
        {sections.map((sec) => {
          const key = sec.title;
          const isOpen = expanded[key];
          return (
            <View key={key} style={S.sectionCard}>
              <Pressable
                style={({ pressed }) => [
                  S.sectionHeader,
                  pressed && { backgroundColor: Colors.surfaceHighlight },
                ]}
                onPress={() => toggle(key)}
              >
                <View style={S.sectionIcon}>
                  <Ionicons name={sec.icon as any} size={18} color={Colors.accent} />
                </View>
                <Text style={S.sectionTitle}>{key}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.textTertiary}
                />
              </Pressable>

              {isOpen && (
                <View style={S.sectionBody}>
                  {sec.items.length === 0 && (
                    <Text style={S.emptyText}>暂无数据</Text>
                  )}
                  {sec.items.map((it, idx) => {
                    const pct = (it.count / sec.max) * 100;
                    return (
                      <View key={idx} style={S.barRow}>
                        <View style={S.barLabelRow}>
                          <Text style={S.barLabel} numberOfLines={1}>
                            {it.label}
                          </Text>
                          <Text style={S.barCount}>
                            {it.count}
                            {sec.unit || "件"}
                          </Text>
                        </View>
                        <View style={S.barTrack}>
                          <View
                            style={[
                              S.barFill,
                              { width: `${Math.max(4, pct)}%` },
                            ]}
                          />
                        </View>
                        {sec.showPrice && (
                          <View style={S.priceMetaRow}>
                            <Text style={S.priceMeta}>
                              总价 {formatCurrency(it.totalPrice || 0)}
                            </Text>
                            <Text style={S.priceMeta}>
                              均价 {formatCurrency(it.avgPrice || 0)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  summaryNum: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  topWearCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topWearText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: "600",
  },

  sectionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sectionBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.md,
  },

  barRow: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
    marginRight: Spacing.sm,
  },
  barCount: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "700",
  },
  barTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
    opacity: 0.9,
  },
  priceMetaRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 2,
  },
  priceMeta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});
