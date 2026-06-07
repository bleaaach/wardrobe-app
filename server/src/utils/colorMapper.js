/**
 * Map RGB/HEX color to nearest Chinese color name.
 */

const COLOR_MAP = [
  { name: "黑", r: 0, g: 0, b: 0 },
  { name: "白", r: 255, g: 255, b: 255 },
  { name: "灰", r: 128, g: 128, b: 128 },
  { name: "红", r: 255, g: 0, b: 0 },
  { name: "橙", r: 255, g: 165, b: 0 },
  { name: "黄", r: 255, g: 255, b: 0 },
  { name: "绿", r: 0, g: 128, b: 0 },
  { name: "青", r: 0, g: 255, b: 255 },
  { name: "蓝", r: 0, g: 0, b: 255 },
  { name: "紫", r: 128, g: 0, b: 128 },
  { name: "粉", r: 255, g: 192, b: 203 },
  { name: "棕", r: 165, g: 42, b: 42 },
  { name: "米", r: 245, g: 245, b: 220 },
  { name: "驼", r: 193, g: 154, b: 107 },
  { name: "杏", r: 251, g: 206, b: 177 },
  { name: "银", r: 192, g: 192, b: 192 },
  { name: "金", r: 255, g: 215, b: 0 },
];

function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

export function mapHexToChineseColor(hex) {
  if (!hex || typeof hex !== "string") return "";
  const rgb = hexToRgb(hex);
  let nearest = COLOR_MAP[0];
  let minDist = Infinity;
  for (const c of COLOR_MAP) {
    const dist = colorDistance(rgb, c);
    if (dist < minDist) {
      minDist = dist;
      nearest = c;
    }
  }
  return nearest.name;
}
