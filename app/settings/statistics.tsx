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
import { Colors, Spacing, Radius, FontSize, PressedOpacity } from "../../src/design/tokens";

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
  value?: number;
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

    const brandAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = i.brand.trim() || "未设置";
      if (!brandAgg[label]) brandAgg[label] = { label, count: 0 };
      brandAgg[label].count += 1;
    }
    const brandItems = Object.values(brandAgg).sort((a, b) => b.count - a.count);

    const colorAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = i.color.trim() || "未设置";
      if (!colorAgg[label]) colorAgg[label] = { label, count: 0 };
      colorAgg[label].count += 1;
    }
    const colorItems = Object.values(colorAgg).sort((a, b) => b.count - a.count);

    const locAgg: Record<string, StatItem> = {};
    for (const i of items) {
      const label = i.location.trim() || "未设置";
      if (!locAgg[label]) locAgg[label] = { label, count: 0 };
      locAgg[label].count += 1;
    }
    const locItems = Object.values(locAgg).sort((a, b) => b.count - a.count);

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

  const overviewData = [
    {
      label: "总件数",
      value: String(summary.total),
      icon: "shirt-outline" as const,
      color: Colors.accent,
    },
    {
      label: "总价值",
      value: formatCurrency(summary.totalPrice),
      icon: "wallet-outline" as const,
      color: Colors.success,
    },
    {
      label: "品牌数",
      value: String(summary.brands),
      icon: "pricetag-outline" as const,
      color: Colors.catShoes,
    },
    {
      label: "颜色数",
      value: String(summary.colors),
      icon: "color-palette-outline" as const,
      color: Colors.catDress,
    },
  ];

  return (
    <ScrollView style={S.container} showsVerticalScrollIndicator={false}>
      <Header title="统计信息" subtitle="洞察你的衣橱数据" />

      {/* Overview Cards */}
      <View style={S.overviewGrid}>
        {overviewData.map((o, i) => (
          <View key={i} style={S.overviewCard}>
            <View
              style={[
                S.overviewIcon,
                { backgroundColor: o.color + "22" },
              ]}
            >
              <Ionicons name={o.icon} size={20} color={o.color} />
            </View>
            <Text style={[S.overviewValue, { color: o.color }]}>
              {o.value}
            </Text>
            <Text style={S.overviewLabel}>{o.label}</Text>
          </View>
        ))}
      </View>

      {/* Highlight: Top Wear */}
      {summary.topItem && (
        <View style={S.highlightCard}>
          <View style={S.highlightLeft}>
            <View style={S.highlightBadge}>
              <Ionicons name="flame" size={14} color={Colors.accent} />
              <Text style={S.highlightBadgeText}>最常穿</Text>
            </View>
            <Text style={S.highlightName}>{summary.topItem.name}</Text>
          </View>
          <View style={S.highlightRight}>
            <Text style={S.highlightNum}>{summary.maxWear}</Text>
            <Text style={S.highlightUnit}>次穿着</Text>
          </View>
        </View>
      )}

      {/* Section Cards Grid */}
      <View style={S.sectionGrid}>
        {sections.map((sec) => {
          const isOpen = !!expanded[sec.title];
          return (
            <Pressable
              key={sec.title}
              style={({ pressed }) => [
                S.sectionCard,
                pressed && { opacity: PressedOpacity },
              ]}
              onPress={() => toggle(sec.title)}
            >
              <View style={S.cardHeader}>
                <View style={S.cardIconWrap}>
                  <Ionicons
                    name={sec.icon as any}
                    size={16}
                    color={Colors.accent}
                  />
                </View>
                <Text style={S.cardTitle}>{sec.title}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.textTertiary}
                />
              </View>

              <Text style={S.cardBigNum}>
                {sec.items.length}
                <Text style={S.cardBigUnit}> 项</Text>
              </Text>

              <View style={S.previewList}>
                {sec.items.slice(0, 3).map((it, idx) => {
                  const pct = (it.count / sec.max) * 100;
                  return (
                    <View key={idx} style={S.previewRow}>
                      <Text style={S.previewLabel} numberOfLines={1}>
                        {it.label}
                      </Text>
                      <View style={S.previewTrack}>
                        <View
                          style={[
                            S.previewFill,
                            { width: `${Math.max(4, pct)}%` },
                          ]}
                        />
                      </View>
                      <Text style={S.previewCount}>{it.count}</Text>
                    </View>
                  );
                })}
                {sec.items.length > 3 && (
                  <Text style={S.previewMore}>
                    +{sec.items.length - 3} 更多
                  </Text>
                )}
              </View>

              {isOpen && (
                <View style={S.detailList}>
                  {sec.items.map((it, idx) => {
                    const pct = (it.count / sec.max) * 100;
                    return (
                      <View key={idx} style={S.detailRow}>
                        <View style={S.detailTop}>
                          <Text style={S.detailLabel} numberOfLines={1}>
                            {it.label}
                          </Text>
                          <Text style={S.detailCount}>
                            {it.count}
                            {sec.unit || "件"}
                          </Text>
                        </View>
                        <View style={S.detailTrack}>
                          <View
                            style={[
                              S.detailFill,
                              { width: `${Math.max(4, pct)}%` },
                            ]}
                          />
                        </View>
                        {sec.showPrice && (
                          <View style={S.priceRow}>
                            <Text style={S.priceText}>
                              总价 {formatCurrency(it.totalPrice || 0)}
                            </Text>
                            <Text style={S.priceText}>
                              均价 {formatCurrency(it.avgPrice || 0)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Overview
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  overviewCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  overviewValue: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  overviewLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Highlight
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  highlightLeft: { flex: 1 },
  highlightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  highlightBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  highlightName: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  highlightRight: { alignItems: "flex-end" },
  highlightNum: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.accent,
  },
  highlightUnit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Grid
  sectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  sectionCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  cardBigNum: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  cardBigUnit: {
    fontSize: FontSize.sm,
    fontWeight: "400",
    color: Colors.textSecondary,
  },

  // Preview
  previewList: { gap: 6 },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 56,
  },
  previewTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  previewFill: {
    height: "100%",
    backgroundColor: Colors.accentMuted,
    borderRadius: 2,
  },
  previewCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    width: 22,
    textAlign: "right",
  },
  previewMore: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Detail
  detailList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  detailRow: { gap: 4 },
  detailTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
    marginRight: Spacing.sm,
  },
  detailCount: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "700",
  },
  detailTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  detailFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
    opacity: 0.9,
  },
  priceRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 2,
  },
  priceText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});
