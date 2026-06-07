import { OutfitLayoutItem } from "../types";

export function generateInitialLayout(
  items: { id: string }[],
  initialLayout?: OutfitLayoutItem[],
  prevLayout?: Record<string, OutfitLayoutItem>
): Record<string, OutfitLayoutItem> {
  const map: Record<string, OutfitLayoutItem> = {};
  let maxZ = 0;

  if (prevLayout) {
    for (const l of Object.values(prevLayout)) {
      map[l.clothingId] = l;
      maxZ = Math.max(maxZ, l.zIndex);
    }
  } else if (initialLayout) {
    for (const l of initialLayout) {
      map[l.clothingId] = l;
      maxZ = Math.max(maxZ, l.zIndex);
    }
  }

  let idx = 0;
  for (const item of items) {
    if (!map[item.id]) {
      const angle = idx * 1.2;
      const radius = Math.min(40 + idx * 12, 120);
      map[item.id] = {
        clothingId: item.id,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        scale: 1,
        zIndex: prevLayout ? maxZ + 1 + idx : idx,
      };
    }
    idx++;
  }

  if (prevLayout) {
    const ids = new Set(items.map((i) => i.id));
    for (const key of Object.keys(map)) {
      if (!ids.has(key)) {
        delete map[key];
      }
    }
  }

  return map;
}
