/**
 * Map ImageNet labels (from Xenova/transformers image-classification)
 * to wardrobe-app Chinese categories.
 */

const LABEL_MAP = {
  // 上装
  "jersey, T-shirt, tee shirt": "T恤",
  "sweatshirt": "卫衣",
  "cardigan": "开衫",
  "wool, woolen, woollen": "毛衣",
  "sweater": "毛衣",
  "vestment": "马甲",
  "poncho": "夹克",
  "bulletproof vest": "马甲",
  "apron": "其他",
  "bib": "背心",
  "brassiere, bra, bandeau": "背心",
  "bikini, two-piece": "背心",
  "maillot": "连衣裙",
  "maillot, tank suit": "连衣裙",
  "dumbbell": "其他",

  // 外套
  "suit, suit of clothes": "西装外套",
  "overcoat, greatcoat, topcoat": "大衣",
  "trench coat": "大衣",
  "jacket": "夹克",
  "raincoat, waterproof": "大衣",
  "academic gown, academic robe, judge's robe": "其他",
  "abaya": "大衣",
  "fur coat": "大衣",

  // 连衣裙/裙子
  "gown": "连衣裙",
  "bridal gown, wedding gown": "连衣裙",
  "ball gown": "连衣裙",
  "hoopskirt, crinoline": "裙子",
  "miniskirt, mini": "裙子",
  "sarong": "裙子",

  // 裤子
  "jean, blue jean, denim": "牛仔裤",
  "trouser, pant": "长裤",
  "pajama, pyjama, pj's, jammies": "长裤",
  "swimming trunks, bathing trunks": "短裤",

  // 鞋子
  "running shoe": "运动鞋",
  "loafer": "平底鞋",
  "sandal": "凉鞋",
  "slipper": "拖鞋",
  "clog, geta, patten, sabot": "拖鞋",
  "high heel": "高跟鞋",
  "boot": "靴子",
  "sneaker": "运动鞋",
  "wing tip": "运动鞋",
  "pump": "高跟鞋",

  // 包袋
  "backpack, back pack, knapsack, packsack, rucksack, haversack": "背包",
  "purse": "手提包",
  "mailbag, postbag": "背包",
  "shopping bag": "手提包",
  "plastic bag": "其他",
  "wallet, billfold, notecase, pocketbook": "其他",
  "briefcase": "公文包",

  // 配饰
  "sunglasses, dark glasses, shades": "墨镜",
  "sunglass": "墨镜",
  "eyeglass": "眼镜",
  "bow tie, bow-tie, bowtie": "配饰",
  "Windsor tie": "领带",
  "stole": "围巾",
  "mitten": "手套",
  "glove": "手套",
  "sock": "配饰",
  "stocking": "配饰",
  "watch": "手表",
  "handkerchief, hankie, hanky, hankey": "配饰",
  "hat, chapeau, lid": "帽子",
  "sombrero": "帽子",
  "cowboy hat, ten-gallon hat": "帽子",
  "beret": "帽子",
  "mortarboard": "帽子",
  "bathing cap, swimming cap": "帽子",
  "bonnet, poke bonnet": "帽子",
  "shower cap": "帽子",
  "wool, woolen, woollen": "围巾",

  // 其他（默认映射）
  "default": "其他",
};

/**
 * App category groups for parent mapping.
 */
export const CATEGORY_PARENTS = {
  "T恤": "parent_上装",
  "polo衫": "parent_上装",
  "衬衫": "parent_上装",
  "卫衣": "parent_上装",
  "毛衣": "parent_上装",
  "开衫": "parent_上装",
  "背心": "parent_上装",
  "吊带": "parent_上装",
  "马甲": "parent_上装",
  "女衬衫": "parent_上装",
  "牛仔裤": "parent_下装",
  "休闲裤": "parent_下装",
  "短裤": "parent_下装",
  "运动裤": "parent_下装",
  "直筒裤": "parent_下装",
  "阔腿裤": "parent_下装",
  "紧身裤": "parent_下装",
  "束脚裤": "parent_下装",
  "工装裤": "parent_下装",
  "西裤": "parent_下装",
  "长裤": "parent_下装",
  "连衣裙": "parent_连衣裙/裙",
  "半身裙": "parent_连衣裙/裙",
  "连体裤": "parent_连衣裙/裙",
  "短裙": "parent_连衣裙/裙",
  "百褶裙": "parent_连衣裙/裙",
  "A字裙": "parent_连衣裙/裙",
  "长裙": "parent_连衣裙/裙",
  "裙子": "parent_连衣裙/裙",
  "羽绒服": "parent_外套",
  "棉服": "parent_外套",
  "大衣": "parent_外套",
  "风衣": "parent_外套",
  "夹克": "parent_外套",
  "西装外套": "parent_外套",
  "连帽衫": "parent_外套",
  "冲锋衣": "parent_外套",
  "派克服": "parent_外套",
  "牛仔外套": "parent_外套",
  "棒球服": "parent_外套",
  "运动鞋": "parent_鞋子",
  "靴子": "parent_鞋子",
  "板鞋": "parent_鞋子",
  "帆布鞋": "parent_鞋子",
  "乐福鞋": "parent_鞋子",
  "高跟鞋": "parent_鞋子",
  "凉鞋": "parent_鞋子",
  "拖鞋": "parent_鞋子",
  "平底鞋": "parent_鞋子",
  "德比鞋": "parent_鞋子",
  "帽子": "parent_配饰",
  "围巾": "parent_配饰",
  "手套": "parent_配饰",
  "袜子": "parent_配饰",
  "眼镜": "parent_配饰",
  "墨镜": "parent_配饰",
  "领带": "parent_配饰",
  "皮带": "parent_配饰",
  "腰带": "parent_配饰",
  "手表": "parent_配饰",
  "手镯": "parent_配饰",
  "戒指": "parent_配饰",
  "胸针": "parent_配饰",
  "耳环": "parent_配饰",
  "双肩包": "parent_包袋",
  "单肩包": "parent_包袋",
  "手拿包": "parent_包袋",
  "手提包": "parent_包袋",
  "腰包": "parent_包袋",
  "公文包": "parent_包袋",
  "背包": "parent_包袋",
  "其他": "parent_其他",
};

export function mapImageNetLabelToCategory(label) {
  if (!label) return "其他";
  const lower = label.toLowerCase().trim();

  // Exact match first
  if (LABEL_MAP[lower]) return LABEL_MAP[lower];

  // Partial match
  for (const [key, value] of Object.entries(LABEL_MAP)) {
    const keyLower = key.toLowerCase();
    if (lower.includes(keyLower) || keyLower.includes(lower)) {
      return value;
    }
  }

  return "其他";
}
