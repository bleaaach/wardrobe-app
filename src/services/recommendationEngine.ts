import { Clothing, Outfit, Category } from "../types";

export interface RecommendationContext {
  occasion?: string;
  weather?: string;
  mood?: string;
  season?: string;
}

export interface RecommendationResult {
  outfitId?: string;
  name: string;
  clothingIds: string[];
  score: number;
  reason: string;
  items: Clothing[];
}

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function getParentName(categoryId: string, categories: Category[]): string | undefined {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return undefined;
  if (!cat.parentId) return cat.name;
  const parent = categories.find((c) => c.id === cat.parentId);
  return parent?.name;
}

function getCategoryName(categoryId: string, categories: Category[]): string | undefined {
  return categories.find((c) => c.id === categoryId)?.name;
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ========== 季节过滤 ==========
function matchesSeason(item: Clothing, season: string): boolean {
  if (!item.season || item.season.trim() === "") return true;
  return item.season.includes(season);
}

function candidateMatchesSeason(candidate: { items: Clothing[] }, season: string): boolean {
  if (candidate.items.length === 0) return false;
  return candidate.items.every((item) => matchesSeason(item, season));
}

// ========== 颜色和谐度 ==========
const NEUTRAL_COLORS = new Set(["黑", "白", "灰", "棕", "银", "金", "米", "驼", "杏", "裸"]);
const COOL_COLORS = new Set(["蓝", "绿", "紫", "青", "藏青", "天蓝", "湖蓝"]);
const WARM_COLORS = new Set(["红", "橙", "黄", "粉", "玫红", "橘", "朱红"]);

function colorGroup(color: string): "neutral" | "cool" | "warm" | "unknown" {
  const c = color.trim();
  if (NEUTRAL_COLORS.has(c)) return "neutral";
  if (COOL_COLORS.has(c)) return "cool";
  if (WARM_COLORS.has(c)) return "warm";
  if (c.includes("黑") || c.includes("白") || c.includes("灰") || c.includes("棕") || c.includes("米") || c.includes("驼")) return "neutral";
  if (c.includes("蓝") || c.includes("绿") || c.includes("紫") || c.includes("青")) return "cool";
  if (c.includes("红") || c.includes("橙") || c.includes("黄") || c.includes("粉") || c.includes("橘")) return "warm";
  return "unknown";
}

function scoreColorHarmony(items: Clothing[]): number {
  const colors = items.map((i) => i.color).filter(Boolean);
  if (colors.length < 2) return 5;

  const groups = colors.map(colorGroup);
  const neutralCount = groups.filter((g) => g === "neutral").length;

  // 全是中性色：经典搭配
  if (neutralCount === groups.length) return 8;

  // 有中性色作为调和：很好
  if (neutralCount >= 1) {
    const nonNeutral = groups.filter((g) => g !== "neutral" && g !== "unknown");
    if (nonNeutral.length <= 1) return 8;
    // 多个非中性色但同一色调
    if (nonNeutral.every((g) => g === nonNeutral[0])) return 7;
    // 冷暖混搭略微扣分
    return 5;
  }

  // 没有中性色
  const nonNeutral = groups.filter((g) => g !== "unknown");
  if (nonNeutral.length <= 1) return 6;
  if (nonNeutral.every((g) => g === nonNeutral[0])) return 6;
  // 冷暖冲突
  const hasCool = nonNeutral.some((g) => g === "cool");
  const hasWarm = nonNeutral.some((g) => g === "warm");
  if (hasCool && hasWarm) return 3;
  return 5;
}

function getColorReason(items: Clothing[]): string {
  const colors = items.map((i) => i.color).filter(Boolean);
  if (colors.length < 2) return "";
  const unique = Array.from(new Set(colors));
  const neutralCount = unique.filter((c) => colorGroup(c) === "neutral").length;
  if (neutralCount === unique.length) return "经典中性色系";
  if (neutralCount >= 1 && unique.length - neutralCount <= 1) return "色彩协调，百搭不出错";
  const groups = unique.map(colorGroup).filter((g) => g !== "unknown");
  if (groups.length > 1 && groups.every((g) => g === groups[0])) return "同色系搭配，层次分明";
  return "色彩对比鲜明";
}

// ========== 场合匹配 ==========
function scoreOccasion(items: Clothing[], categories: Category[], occasion?: string): number {
  if (!occasion) return 5;
  const parentNames = items.map((i) => getParentName(i.categoryId, categories)).filter(Boolean) as string[];
  const catNames = items.map((i) => getCategoryName(i.categoryId, categories)).filter(Boolean) as string[];

  switch (occasion) {
    case "通勤": {
      const hasFormal = catNames.some((n) => n.includes("衬衫") || n.includes("西装") || n.includes("西裤") || n.includes("公文包"));
      const hasCasual = catNames.some((n) => n.includes("T恤") || n.includes("拖鞋") || n.includes("卫衣"));
      return hasFormal ? 8 : hasCasual ? 4 : 6;
    }
    case "运动": {
      const hasSport = catNames.some((n) => n.includes("运动鞋") || n.includes("短裤") || n.includes("背心") || n.includes("紧身裤"));
      const hasFormal = catNames.some((n) => n.includes("西装") || n.includes("高跟鞋") || n.includes("衬衫"));
      return hasSport ? 8 : hasFormal ? 3 : 5;
    }
    case "聚会": {
      const hasDress = parentNames.includes("连体服装") || catNames.some((n) => n.includes("连衣裙") || n.includes("高跟鞋") || n.includes("手拿包"));
      return hasDress ? 8 : 6;
    }
    case "居家": {
      const hasHome = catNames.some((n) => n.includes("T恤") || n.includes("卫衣") || n.includes("短裤") || n.includes("拖鞋"));
      const hasFormal = catNames.some((n) => n.includes("西装") || n.includes("高跟鞋") || n.includes("衬衫"));
      return hasHome ? 8 : hasFormal ? 3 : 5;
    }
    case "旅行": {
      const hasComfort = parentNames.includes("上装") && parentNames.includes("下装") && parentNames.includes("鞋子");
      const hasHeels = catNames.some((n) => n.includes("高跟鞋"));
      return hasComfort && !hasHeels ? 8 : hasComfort ? 6 : 5;
    }
    case "约会": {
      const hasDress = parentNames.includes("连体服装");
      const hasSmart = catNames.some((n) => n.includes("衬衫") || n.includes("连衣裙") || n.includes("高跟鞋") || n.includes("单肩包"));
      return hasDress || hasSmart ? 8 : 6;
    }
    default:
      return 5;
  }
}

function getOccasionReason(occasion?: string): string {
  if (!occasion) return "";
  const map: Record<string, string> = {
    通勤: "得体大方，适合职场",
    运动: "活力动感，运动首选",
    聚会: "时尚亮眼，聚会焦点",
    居家: "舒适自在，居家必备",
    旅行: "轻便实用，旅行良伴",
    约会: "温柔精致，约会加分",
  };
  return map[occasion] || "适合多种场合";
}

// ========== 天气匹配 ==========
function scoreWeather(items: Clothing[], categories: Category[], weather?: string): number {
  if (!weather) return 5;
  const parentNames = items.map((i) => getParentName(i.categoryId, categories)).filter(Boolean) as string[];
  const catNames = items.map((i) => getCategoryName(i.categoryId, categories)).filter(Boolean) as string[];

  switch (weather) {
    case "晴":
      return 7;
    case "多云":
      return 6;
    case "雨": {
      const hasOuter = parentNames.includes("外套");
      const hasSandals = catNames.some((n) => n.includes("凉鞋") || n.includes("拖鞋"));
      return hasOuter && !hasSandals ? 8 : hasOuter ? 6 : hasSandals ? 3 : 5;
    }
    case "雪": {
      const hasWarm = parentNames.includes("外套") || catNames.some((n) => n.includes("毛衣") || n.includes("羽绒") || n.includes("靴"));
      const hasCool = catNames.some((n) => n.includes("短袖") || n.includes("短裤") || n.includes("凉鞋") || n.includes("裙子"));
      return hasWarm && !hasCool ? 8 : hasWarm ? 6 : hasCool ? 2 : 5;
    }
    case "寒冷": {
      const hasWarm = parentNames.includes("外套") || catNames.some((n) => n.includes("毛衣") || n.includes("羽绒") || n.includes("长袖") || n.includes("靴"));
      const hasCool = catNames.some((n) => n.includes("短袖") || n.includes("短裤") || n.includes("凉鞋") || n.includes("裙子"));
      return hasWarm && !hasCool ? 9 : hasWarm ? 7 : hasCool ? 2 : 5;
    }
    case "炎热": {
      const hasCool = catNames.some((n) => n.includes("短袖") || n.includes("T恤") || n.includes("裙子") || n.includes("短裤") || n.includes("凉鞋"));
      const hasWarm = parentNames.includes("外套") || catNames.some((n) => n.includes("毛衣") || n.includes("羽绒") || n.includes("长袖") || n.includes("靴"));
      return hasCool && !hasWarm ? 9 : hasCool ? 7 : hasWarm ? 2 : 5;
    }
    default:
      return 5;
  }
}

function getWeatherReason(weather?: string): string {
  if (!weather) return "";
  const map: Record<string, string> = {
    晴: "阳光明媚，轻松自在",
    多云: "温和舒适，百搭选择",
    雨: "防雨保暖，实用为主",
    雪: "保暖防寒，温暖出行",
    寒冷: "层层保暖，抵御寒风",
    炎热: "清爽透气，清凉一夏",
  };
  return map[weather] || "适应多种天气";
}

// ========== 心情匹配 ==========
function scoreMood(items: Clothing[], categories: Category[], mood?: string): number {
  if (!mood) return 5;
  const catNames = items.map((i) => getCategoryName(i.categoryId, categories)).filter(Boolean) as string[];

  switch (mood) {
    case "开心":
      return 6;
    case "正式": {
      const hasFormal = catNames.some((n) => n.includes("衬衫") || n.includes("西装") || n.includes("西裤") || n.includes("高跟鞋"));
      return hasFormal ? 8 : 4;
    }
    case "休闲": {
      const hasCasual = catNames.some((n) => n.includes("T恤") || n.includes("卫衣") || n.includes("牛仔裤") || n.includes("短裤") || n.includes("运动鞋") || n.includes("平底鞋"));
      return hasCasual ? 8 : 5;
    }
    case "活力": {
      const hasActive = catNames.some((n) => n.includes("运动鞋") || n.includes("短裤") || n.includes("T恤") || n.includes("背心") || n.includes("卫衣"));
      return hasActive ? 8 : 5;
    }
    default:
      return 5;
  }
}

function getMoodReason(mood?: string): string {
  if (!mood) return "";
  const map: Record<string, string> = {
    开心: "明快活泼，心情加分",
    正式: "端庄得体，仪式感满满",
    休闲: "轻松随性，无拘无束",
    活力: "动感十足，元气满满",
  };
  return map[mood] || "契合当下心情";
}

// ========== 穿着频率与收藏 ==========
function scoreWearAndFavorite(items: Clothing[]): number {
  let score = 5;
  for (const item of items) {
    if (item.wearCount > 30) score -= 1.5;
    else if (item.wearCount > 15) score -= 0.5;
    else if (item.wearCount < 3) score += 0.5;
    if (item.favorite === 1) score += 0.5;
  }
  return Math.max(0, Math.min(10, score));
}

// ========== 生成搭配组合 ==========
function generateOutfitCandidates(
  clothing: Clothing[],
  categories: Category[],
  count: number
): { items: Clothing[]; name: string; clothingIds: string[] }[] {
  if (clothing.length < 2) return [];

  const byParent = (parentName: string) =>
    clothing.filter((c) => getParentName(c.categoryId, categories) === parentName);

  const tops = byParent("上装");
  const bottoms = byParent("下装");
  const dresses = byParent("连体服装");
  const shoes = byParent("鞋子");
  const outerwear = byParent("外套");
  const bags = byParent("包袋");
  const accessories = byParent("配饰");

  const results: { items: Clothing[]; name: string; clothingIds: string[] }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < count * 3; i++) {
    if (results.length >= count) break;
    const items: Clothing[] = [];

    const top = pickRandom(tops);
    const dress = pickRandom(dresses);

    if (top && dress) {
      if (Math.random() > 0.4) {
        items.push(top);
        const bottom = pickRandom(bottoms);
        if (bottom) items.push(bottom);
      } else {
        items.push(dress);
      }
    } else if (top) {
      items.push(top);
      const bottom = pickRandom(bottoms);
      if (bottom) items.push(bottom);
    } else if (dress) {
      items.push(dress);
    }

    if (items.length === 0) continue;

    const shoe = pickRandom(shoes);
    if (shoe) items.push(shoe);

    if (Math.random() > 0.5) {
      const outer = pickRandom(outerwear);
      if (outer) items.push(outer);
    }

    if (Math.random() > 0.6) {
      const accessory = pickRandom([...bags, ...accessories]);
      if (accessory) items.push(accessory);
    }

    if (items.length < 2 || items.length > 4) continue;

    const key = items.map((c) => c.id).sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    const names = items.map((c) => c.name || getCategoryName(c.categoryId, categories) || "衣物");
    results.push({
      items,
      name: `智能推荐 ${names.slice(0, 2).join("+")}`,
      clothingIds: items.map((c) => c.id),
    });
  }

  return results;
}

// ========== 评分与排序 ==========
function scoreCandidate(
  candidate: { items: Clothing[] },
  context: RecommendationContext,
  categories: Category[]
): { score: number; reasons: string[] } {
  const scores: number[] = [];
  const reasons: string[] = [];

  const occScore = scoreOccasion(candidate.items, categories, context.occasion);
  scores.push(occScore);
  const occReason = getOccasionReason(context.occasion);
  if (occReason) reasons.push(occReason);

  const weatherScore = scoreWeather(candidate.items, categories, context.weather);
  scores.push(weatherScore);
  const weatherReason = getWeatherReason(context.weather);
  if (weatherReason) reasons.push(weatherReason);

  const moodScore = scoreMood(candidate.items, categories, context.mood);
  scores.push(moodScore);
  const moodReason = getMoodReason(context.mood);
  if (moodReason) reasons.push(moodReason);

  const colorScore = scoreColorHarmony(candidate.items);
  scores.push(colorScore);
  const colorReason = getColorReason(candidate.items);
  if (colorReason) reasons.push(colorReason);

  const wfScore = scoreWearAndFavorite(candidate.items);
  scores.push(wfScore);

  // 加权平均
  const weights = [0.25, 0.25, 0.15, 0.2, 0.15];
  let totalWeight = 0;
  let weightedSum = 0;
  for (let i = 0; i < scores.length; i++) {
    weightedSum += scores[i] * weights[i];
    totalWeight += weights[i];
  }
  const baseScore = weightedSum / totalWeight;

  // 加入轻微随机扰动，避免每次结果完全一样
  const jitter = (Math.random() - 0.5) * 0.5;
  const finalScore = Math.max(0, Math.min(10, baseScore + jitter));

  // 穿着频率原因
  const favCount = candidate.items.filter((i) => i.favorite === 1).length;
  if (favCount > 0) reasons.push("包含心爱单品");

  const lowWear = candidate.items.filter((i) => i.wearCount < 3).length;
  if (lowWear > 0) reasons.push("发掘少穿宝藏");

  return { score: parseFloat(finalScore.toFixed(1)), reasons };
}

export function getRecommendations(
  context: RecommendationContext,
  outfits: Outfit[],
  clothingItems: Clothing[],
  categories: Category[]
): RecommendationResult[] {
  const season = context.season || getCurrentSeason();
  const candidates: {
    outfitId?: string;
    name: string;
    clothingIds: string[];
    items: Clothing[];
  }[] = [];

  // 1. 从已有搭配中提取候选
  const clothingMap = new Map<string, Clothing>();
  for (const c of clothingItems) clothingMap.set(c.id, c);

  for (const outfit of outfits) {
    try {
      const ids: string[] = JSON.parse(outfit.clothingIds || "[]");
      const items = ids.map((id) => clothingMap.get(id)).filter(Boolean) as Clothing[];
      if (items.length >= 2 && items.length <= 6) {
        candidates.push({
          outfitId: outfit.id,
          name: outfit.name || "未命名搭配",
          clothingIds: ids,
          items,
        });
      }
    } catch {
      // ignore parse error
    }
  }

  // 2. 生成新的组合候选
  const generated = generateOutfitCandidates(clothingItems, categories, 24);
  for (const g of generated) {
    candidates.push({
      name: g.name,
      clothingIds: g.clothingIds,
      items: g.items,
    });
  }

  // 3. 季节过滤
  const seasonFiltered = candidates.filter((c) => candidateMatchesSeason(c, season));

  // 如果季节过滤后太少，放宽条件
  const finalCandidates = seasonFiltered.length >= 5 ? seasonFiltered : candidates;

  // 4. 评分
  const scored = finalCandidates.map((c) => {
    const { score, reasons } = scoreCandidate(c, context, categories);
    return {
      ...c,
      score,
      reason: reasons.length > 0 ? reasons.join(" · ") : "综合评分优选",
    };
  });

  // 5. 排序并取前 5
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  // 去重：按 clothingIds 集合去重
  const seenIds = new Set<string>();
  const unique: RecommendationResult[] = [];
  for (const item of top) {
    const key = [...item.clothingIds].sort().join(",");
    if (seenIds.has(key)) continue;
    seenIds.add(key);
    unique.push(item);
  }

  return unique.slice(0, 5);
}
