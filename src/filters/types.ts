import type { SegmentKey } from "../lib/dataSource";
import type { TreeStatus } from "../lib/status";

export type MapViewMode = "points" | "heatmap" | "h3";

/** 胸徑上限：滑桿最大值代表「> 60cm（開放上界）」。 */
export const DBH_MAX_CAP = 60;

/** 台北 12 行政區（固定順序，供篩選 chip）。 */
export const DISTRICTS = [
  "中正區",
  "大同區",
  "中山區",
  "松山區",
  "大安區",
  "萬華區",
  "信義區",
  "士林區",
  "北投區",
  "內湖區",
  "南港區",
  "文山區",
] as const;

/** region 判定為公園/綠地/廣場的關鍵字（「只看道路行道樹」會排除）。 */
export const PARK_KEYWORDS = ["公園", "綠地", "廣場"] as const;

export interface FilterState {
  segment: SegmentKey;
  /** 各狀態是否顯示（獨立開關）。 */
  statuses: Record<TreeStatus, boolean>;
  /** 選定樹種（空 = 全部）。 */
  species: Set<string>;
  /** 胸徑範圍 [min, max]；max === DBH_MAX_CAP 代表開放上界。 */
  dbhRange: [number, number];
  /** 只看道路行道樹（排除公園/綠地/廣場）。 */
  streetOnly: boolean;
  /** 選定行政區（空 = 全部）。 */
  districts: Set<string>;
  /** 點位大小倍率（0.5–2.0，預設 1.0）。 */
  circleScale: number;
  /** 地圖視圖模式。 */
  mapView: MapViewMode;
}

export function defaultFilterState(): FilterState {
  return {
    segment: "2426",
    statuses: { disappeared: true, appeared: true, persisted: true },
    species: new Set(),
    dbhRange: [0, DBH_MAX_CAP],
    streetOnly: false,
    districts: new Set(),
    circleScale: 1.0,
    mapView: "points",
  };
}
