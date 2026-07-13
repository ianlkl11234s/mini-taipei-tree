/**
 * stats — infograph 統計資料型別 + 載入 hook
 * =============================================================
 * 對應 public/data/stats/*.json 六份檔案（T1 產出，真資料）。
 * 型別以「檔案實際內容」為準（讀檔驗證於 2026-07-13）。
 * 所有比率欄位皆同時提供全部（含公園）與 _street（排除公園綠地）兩組。
 * =============================================================
 */
import { useEffect, useState } from "react";

/** 段代碼：2022→2024 / 2024→2026。 */
export type SegKey = "2224" | "2426";

export const SEG_META: Record<SegKey, { label: string; from: string; to: string }> = {
  "2224": { label: "2022 → 2024", from: "2022-10", to: "2024-11" },
  "2426": { label: "2024 → 2026", from: "2024-11", to: "2026-07" },
};

// ---- overview.json ----
export interface Epoch {
  key: string;
  date: string;
  total: number;
  total_street: number;
}
export interface OverviewSeg {
  key: SegKey;
  base: number;
  disappeared: number;
  appeared: number;
  persisted: number;
  net: number;
  renumber_suspect: number;
  removal_rate: number;
  removal_rate_norenumber: number;
  base_street: number;
  disappeared_street: number;
  appeared_street: number;
  persisted_street: number;
  net_street: number;
  removal_rate_street: number;
}
export interface Overview {
  epochs: Epoch[];
  segments: OverviewSeg[];
  species_count: number;
  generated_at: string;
}

// ---- species.json ----
export interface SpeciesRow {
  species: string;
  base: number;
  disappeared: number;
  appeared: number;
  net: number;
  removal_rate: number;
  base_street: number;
  removal_rate_street: number;
}
export interface SpeciesStats {
  segments: Record<SegKey, SpeciesRow[]>;
  epoch_top20: { species: string; count_2026: number }[];
}

// ---- dbh_bins.json / height_bins.json ----
export interface BinRow {
  bin: string;
  base: number;
  disappeared: number;
  appeared: number;
  removal_rate: number;
  removal_rate_street: number;
}
export interface BinStats {
  field: string;
  bins: string[];
  segments: Record<SegKey, BinRow[]>;
}

// ---- districts.json ----
export interface DistrictRow {
  dist: string;
  base: number;
  disappeared: number;
  appeared: number;
  net: number;
  removal_rate: number;
  removal_rate_street: number;
}
export interface DistrictStats {
  segments: Record<SegKey, DistrictRow[]>;
  total_2026: Record<string, number>;
}

// ---- clusters.json ----
export interface Cluster {
  segment: SegKey;
  cluster_id: number;
  road: string;
  dist: string;
  size: number;
  centroid: [number, number];
  species_top: string;
}

export interface AllStats {
  overview: Overview;
  species: SpeciesStats;
  dbh: BinStats;
  height: BinStats;
  districts: DistrictStats;
  clusters: Cluster[];
}

/** 一次載入六份統計檔。回傳 null 代表仍載入中或失敗。 */
export function useStats(): AllStats | null {
  const [stats, setStats] = useState<AllStats | null>(null);
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const get = <T,>(name: string) =>
      fetch(`${base}data/stats/${name}.json`).then((r) => r.json() as Promise<T>);
    Promise.all([
      get<Overview>("overview"),
      get<SpeciesStats>("species"),
      get<BinStats>("dbh_bins"),
      get<BinStats>("height_bins"),
      get<DistrictStats>("districts"),
      get<Cluster[]>("clusters"),
    ])
      .then(([overview, species, dbh, height, districts, clusters]) =>
        setStats({ overview, species, dbh, height, districts, clusters }),
      )
      .catch((e) => {
        console.error("[stats] 載入失敗", e);
        setStats(null);
      });
  }, []);
  return stats;
}

/** 依「是否排除公園」取比率 / 基數 / 淨變化欄位（street=排除公園）。 */
export const pickRate = (r: { removal_rate: number; removal_rate_street: number }, street: boolean) =>
  street ? r.removal_rate_street : r.removal_rate;
export const pickBase = (r: { base: number; base_street: number }, street: boolean) =>
  street ? r.base_street : r.base;
