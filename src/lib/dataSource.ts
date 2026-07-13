/**
 * dataSource — 資料源 adapter（唯一換源點）
 * =============================================================
 * 前端一切 Mapbox expression 都透過 FIELDS 讀屬性名，不硬編欄名。
 * 現行來源：T1 產出的三期軌跡成品 street_trees_taipei_3epoch
 * （105,675 點，2022 / 2024 / 2026 三時點，小寫契約欄名）。
 *
 * ▶ 換源只需改本檔：SOURCE（url + sourceLayer）、FIELDS、SEGMENTS。
 *   其餘元件（篩選、圖層、popup）皆讀本檔匯出，不需改動。
 *   檔案底部保留「過渡期二期 diff」設定，供必要時回退。
 * =============================================================
 */

export interface FieldMap {
  treeId: string;
  species: string;
  dist: string;
  region: string;
  dbhCm: string;
  heightM: string;
  surveyDate: string;
  /** 各段狀態欄名（值域含 absent = 該段不參與）。 */
  status2224: string | null;
  status2426: string;
  /** 各段疑似重編號欄名（0/1 或 Boolean）。 */
  renumber2224: string | null;
  renumber2426: string;
  /** 三期軌跡碼（3 碼 {2022}{2024}{2026}）。 */
  traj: string | null;
}

export interface SegmentDef {
  key: SegmentKey;
  label: string;
  available: boolean;
  note?: string;
}

export type SegmentKey = "2224" | "2426" | "traj";

/** 現行資料源（三期軌跡 PMTiles）。 */
export const SOURCE = {
  id: "street-trees",
  url: "/data/street_trees_taipei_3epoch.pmtiles",
  sourceLayer: "street_trees_taipei_3epoch",
  speciesListUrl: "/data/species_list.json",
} as const;

/** 三期契約欄位對照（小寫欄名）。 */
export const FIELDS: FieldMap = {
  treeId: "tree_id",
  species: "species",
  dist: "dist",
  region: "region",
  dbhCm: "dbh_cm",
  heightM: "height_m",
  surveyDate: "survey_date",
  status2224: "status_2224", // ∈ persisted | disappeared | appeared | absent
  status2426: "status_2426",
  renumber2224: "renumber_2224",
  renumber2426: "renumber_2426",
  traj: "traj",
};

/** 時段切換選項。三期軌跡（traj）另需獨立配色模式，列為深化中。 */
export const SEGMENTS: SegmentDef[] = [
  { key: "2224", label: "2022 → 2024", available: true },
  { key: "2426", label: "2024 → 2026", available: true },
  { key: "traj", label: "三期軌跡", available: false, note: "深化中" },
];

export const DEFAULT_SEGMENT: SegmentKey = "2426";

/** 取某段的狀態欄名（不可用回 null）。 */
export function statusFieldFor(seg: SegmentKey): string | null {
  if (seg === "2224") return FIELDS.status2224;
  if (seg === "2426") return FIELDS.status2426;
  return null; // traj 走軌跡碼，非單一狀態欄
}

/** 取某段的疑似重編號欄名（不可用回 null）。 */
export function renumberFieldFor(seg: SegmentKey): string | null {
  if (seg === "2224") return FIELDS.renumber2224;
  if (seg === "2426") return FIELDS.renumber2426;
  return null;
}

/*
 * ▶ 回退到過渡期二期 diff（street_trees_taipei_diff）時改為：
 * SOURCE.url = "/data/street_trees_taipei_diff.pmtiles"
 * SOURCE.sourceLayer = "street_trees_taipei_diff"
 * FIELDS = {
 *   treeId:"TreeID", species:"TreeType", dist:"Dist", region:"Region",
 *   dbhCm:"Diameter", heightM:"TreeHeight", surveyDate:"SurveyDate",
 *   status2224:null, status2426:"status",
 *   renumber2224:null, renumber2426:"renumber_suspect", traj:null,
 * }
 * SEGMENTS：2224 → available:false, note:"資料準備中"
 */
