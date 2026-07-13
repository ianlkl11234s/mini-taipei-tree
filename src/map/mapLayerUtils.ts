import type { Map as MapboxMap } from "mapbox-gl";

/**
 * 底圖第一個 symbol（地名 label）圖層 id。
 * 樹點 circle 層以此為 beforeId 插入 → 落在地名 label 之下，
 * 樹點不會蓋掉路名/地名文字。
 */
export function firstSymbolLayerId(map: MapboxMap): string | undefined {
  const layers = map.getStyle()?.layers ?? [];
  for (const l of layers) {
    if (l.type === "symbol") return l.id;
  }
  return undefined;
}
