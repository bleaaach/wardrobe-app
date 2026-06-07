import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useClothingStore } from "../../src/store/clothingStore";
import { Header } from "../../src/components/ui/Header";
import { Colors, Spacing, Radius, FontSize } from "../../src/design/tokens";
import { parsePrice, formatCurrency } from "../../src/utils/currency";

const serifNum = Platform.OS === "ios" ? "Georgia" : "serif";

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

function getColorHex(colorName: string): string {
  const map: Record<string, string> = {
    白: "#1C1917",
    黑: "#78716C",
    米: "#E07A5F",
    棕: "#8B6F47",
    红: "#C45B4A",
    蓝: "#5B8FC4",
    绿: "#6B9B6F",
    黄: "#D4A853",
    粉: "#D48FB3",
    紫: "#B8A0D9",
    灰: "#A8A29E",
    橙: "#E07A5F",
  };
  for (const key of Object.keys(map)) {
    if (colorName.includes(key)) return map[key];
  }
  return Colors.textSecondary;
}

function DonutChart({
  percentage,
  color,
  size = 64,
  stroke = 10,
}: {
  percentage: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const half = size / 2;
  const inner = size - stroke * 2;
  const deg = (percentage / 100) * 360;

  const renderSlice = () => {
    if (deg <= 180) {
      return (
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: half,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: size / 2,
              height: size,
              left: half,
              top: 0,
              backgroundColor: color,
              transform: [
                { rotate: `${deg}deg` },
                { translateX: -size / 4 },
              ],
            }}
          />
        </View>
      );
    }
    return (
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: half,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: size / 2,
            height: size,
            left: half,
            top: 0,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: size / 2,
            height: size,
            left: half,
            top: 0,
            backgroundColor: color,
            transform: [
              { rotate: `${deg - 180}deg` },
              { translateX: -size / 4 },
            ],
          }}
        />
      </View>
    );
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: stroke,
          borderColor: Colors.divider,
        }}
      />
      {renderSlice()}
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: Colors.surface,
        }}
      />
    </View>
  );
}

export default function StatisticsScreen() {
  const items = useClothingStore((s) => s.items);
  const categories = useClothingStore((s) => s.categories);

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
    const topItem = items.find(
      (i) => (i.wearCount || 0) === maxWear && maxWear > 0
    );
    return { total, totalPrice, brands, colors, maxWear, topItem };
  }, [items]);

  const categoryStats = useMemo(() => {
    const agg: Record<
      string,
      { label: string; count: number; totalPrice: number }
    > = {};
    for (const i of items) {
      const label = parentCatName(i.categoryId);
      if (!agg[label]) {
        agg[label] = { label, count: 0, totalPrice: 0 };
      }
      agg[label].count += 1;
      agg[label].totalPrice += parsePrice(i.price);
    }
    const list = Object.values(agg).map((x) => ({
      ...x,
      avgPrice: Math.round(x.totalPrice / x.count),
    }));
    list.sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...list.map((i) => i.count));
    return { items: list, max };
  }, [items, catMap]);

  const colorStats = useMemo(() => {
    const agg: Record<string, { label: string; count: number }> = {};
    for (const i of items) {
      const label = i.color.trim() || "未设置";
      if (!agg[label]) agg[label] = { label, count: 0 };
      agg[label].count += 1;
    }
    const list = Object.values(agg).sort((a, b) => b.count - a.count);
    const total = Math.max(1, items.length);
    return { items: list, total };
  }, [items]);

  const mostWorn = useMemo(() => {
    const list = [...items]
      .filter((i) => (i.wearCount || 0) > 0)
      .sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0))
      .slice(0, 5);
    return list;
  }, [items]);

  const priceStats = useMemo(() => {
    const agg: Record<string, { label: string; count: number }> = {};
    for (const i of items) {
      const p = parsePrice(i.price);
      if (p <= 0) continue;
      const label = getPriceLabel(p);
      if (!agg[label]) agg[label] = { label, count: 0 };
      agg[label].count += 1;
    }
    const list = Object.values(agg).sort((a, b) => {
      const order = ["0-100", "100-300", "300-500", "500-1000", "1000+"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });
    const max = Math.max(1, ...list.map((i) => i.count));
    return { items: list, max };
  }, [items]);

  const wearStats = useMemo(() => {
    const agg: Record<string, { label: string; count: number }> = {};
    for (const i of items) {
      const label = getWearLabel(i.wearCount || 0);
      if (!agg[label]) agg[label] = { label, count: 0 };
      agg[label].count += 1;
    }
    return Object.values(agg).sort((a, b) => {
      const order = ["0次", "1-5次", "6-10次", "10+次"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });
  }, [items]);

  const brandStats = useMemo(() => {
    const agg: Record<string, { label: string; count: number }> = {};
    for (const i of items) {
      const label = i.brand.trim() || "未设置";
      if (!agg[label]) agg[label] = { label, count: 0 };
      agg[label].count += 1;
    }
    return Object.values(agg).sort((a, b) => b.count - a.count);
  }, [items]);

  const locationStats = useMemo(() => {
    const agg: Record<string, { label: string; count: number }> = {};
    for (const i of items) {
      const label = i.location.trim() || "未设置";
      if (!agg[label]) agg[label] = { label, count: 0 };
      agg[label].count += 1;
    }
    return Object.values(agg).sort((a, b) => b.count - a.count);
  }, [items]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Statistics" subtitle="洞察你的衣橱数据" />

      {/* Hero Grid */}
      <View style={styles.heroGrid}>
        <View style={[styles.heroCard, styles.heroCardAccent]}>
          <Text style={[styles.heroNum, styles.heroNumInverse]}>
            {summary.total}
          </Text>
          <Text style={[styles.heroLabel, styles.heroLabelInverse]}>
            Total Items
          </Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroNum}>
            {formatCurrency(summary.totalPrice)}
          </Text>
          <Text style={styles.heroLabel}>Total Value</Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroNum}>{summary.brands}</Text>
          <Text style={styles.heroLabel}>Brands</Text>
        </View>
        <View style={styles.heroCard}>
          <Text style={styles.heroNum}>{summary.colors}</Text>
          <Text style={styles.heroLabel}>Colors</Text>
        </View>
      </View>

      {/* By Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Category</Text>
        <View style={styles.barChart}>
          {categoryStats.items.map((it, idx) => {
            const pct = (it.count / categoryStats.max) * 100;
            return (
              <View key={idx} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {it.label}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(4, pct)}%` },
                    ]}
                  >
                    <Text style={styles.barFillText}>{it.count}</Text>
                  </View>
                </View>
                <Text style={styles.barValue}>{it.count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* By Color */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Color</Text>
        <View style={styles.donutGrid}>
          {colorStats.items.slice(0, 3).map((it, idx) => {
            const pct = Math.round((it.count / colorStats.total) * 100);
            return (
              <View key={idx} style={styles.donutCard}>
                <DonutChart
                  percentage={pct}
                  color={getColorHex(it.label)}
                />
                <Text style={styles.donutLabel}>{it.label}</Text>
                <Text style={styles.donutMeta}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Most Worn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Worn</Text>
        <View style={styles.topList}>
          {mostWorn.map((it, idx) => {
            const initials = it.name.slice(0, 2).toUpperCase();
            const catName = parentCatName(it.categoryId);
            return (
              <View key={it.id} style={styles.topItem}>
                <View
                  style={[styles.rank, idx === 0 && styles.rankFirst]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      idx === 0 && styles.rankTextFirst,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <View style={styles.thumb}>
                  <Text style={styles.thumbText}>{initials}</Text>
                </View>
                <View style={styles.topInfo}>
                  <Text style={styles.topName} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={styles.topMeta}>{catName}</Text>
                </View>
                <Text style={styles.topCount}>
                  {it.wearCount || 0}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Price Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Range</Text>
        <View style={styles.barChart}>
          {priceStats.items.map((it, idx) => {
            const pct = (it.count / priceStats.max) * 100;
            return (
              <View key={idx} style={styles.barRow}>
                <Text style={styles.barLabel}>{it.label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFillAccent,
                      { width: `${Math.max(4, pct)}%` },
                    ]}
                  >
                    <Text style={styles.barFillText}>{it.count}</Text>
                  </View>
                </View>
                <Text style={styles.barValue}>{it.count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Additional stats preserved: brand, location, wear, price meta */}
      {categoryStats.items.length > 0 && (
        <View style={[styles.section, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Category Details</Text>
          {categoryStats.items.map((it, idx) => (
            <View key={idx} style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={1}>
                {it.label}
              </Text>
              <Text style={styles.metaValue}>
                总价 {formatCurrency(it.totalPrice)} · 均价{" "}
                {formatCurrency(it.avgPrice || 0)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {brandStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Brand</Text>
          {brandStats.slice(0, 5).map((it, idx) => (
            <View key={idx} style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={1}>
                {it.label}
              </Text>
              <Text style={styles.metaValue}>{it.count} 件</Text>
            </View>
          ))}
        </View>
      )}

      {locationStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Location</Text>
          {locationStats.slice(0, 5).map((it, idx) => (
            <View key={idx} style={styles.metaRow}>
              <Text style={styles.metaLabel} numberOfLines={1}>
                {it.label}
              </Text>
              <Text style={styles.metaValue}>{it.count} 件</Text>
            </View>
          ))}
        </View>
      )}

      {wearStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wear Frequency</Text>
          {wearStats.map((it, idx) => (
            <View key={idx} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{it.label}</Text>
              <Text style={styles.metaValue}>{it.count} 件</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  heroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  heroCard: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardAccent: {
    backgroundColor: Colors.textPrimary,
  },
  heroNum: {
    fontFamily: serifNum,
    fontSize: FontSize.xxl,
    fontWeight: "600",
    lineHeight: FontSize.xxl,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  heroNumInverse: {
    color: Colors.textInverse,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  heroLabelInverse: {
    color: "rgba(255,255,255,0.7)",
  },

  section: {
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  barChart: {
    gap: Spacing.md,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  barLabel: {
    width: 60,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "right",
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 28,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: Radius.sm,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 8,
    minWidth: 4,
  },
  barFillAccent: {
    height: "100%",
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: 8,
    minWidth: 4,
  },
  barFillText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textInverse,
  },
  barValue: {
    width: 32,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 0,
    color: Colors.textPrimary,
  },

  donutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  donutCard: {
    flex: 1,
    minWidth: "28%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  donutLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 10,
  },
  donutMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  topList: {
    gap: Spacing.md,
  },
  topItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  rankFirst: {
    backgroundColor: Colors.textPrimary,
  },
  rankText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  rankTextFirst: {
    color: Colors.textInverse,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  thumbText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  topInfo: {
    flex: 1,
  },
  topName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  topMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topCount: {
    fontFamily: serifNum,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    flexShrink: 0,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  metaLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
    marginRight: Spacing.sm,
  },
  metaValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
