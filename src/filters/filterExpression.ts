import type { ExpressionSpecification, FilterSpecification } from "mapbox-gl";
import { FIELDS, statusFieldFor } from "../lib/dataSource";
import { STATUS_META, STATUS_ORDER, type TreeStatus } from "../lib/status";
import { DBH_MAX_CAP, PARK_KEYWORDS, type FilterState } from "./types";

/**
 * 由 FilterState 組出 map.setFilter 用的組合式 expression。
 * 時段 × 狀態 × 樹種 × 胸徑 × 只看道路 × 行政區，全部 AND 疊加。
 */
export function buildFilter(f: FilterState): FilterSpecification {
  const conds: unknown[] = ["all"];
  const statusField = statusFieldFor(f.segment);

  // 狀態：永遠只顯示被勾選的三態之一（自動排除 absent = 該段不參與的點）；
  // 全關 → 恆假（清空地圖）。
  if (statusField) {
    const active = STATUS_ORDER.filter((s) => f.statuses[s]);
    if (active.length === 0) {
      conds.push(["==", ["literal", 1], ["literal", 0]]);
    } else {
      conds.push(["in", ["get", statusField], ["literal", active as string[]]]);
    }
  }

  // 樹種
  if (f.species.size > 0) {
    conds.push(["in", ["get", FIELDS.species], ["literal", [...f.species]]]);
  }

  // 胸徑（下界永遠套；上界達 cap 視為開放）
  const [lo, hi] = f.dbhRange;
  const dbhVal: unknown = ["to-number", ["get", FIELDS.dbhCm], 0];
  if (lo > 0) conds.push([">=", dbhVal, lo]);
  if (hi < DBH_MAX_CAP) conds.push(["<=", dbhVal, hi]);

  // 只看道路：region 不含 公園/綠地/廣場（index-of，需 mapbox-gl v2.10+）
  if (f.streetOnly) {
    const region: unknown = ["coalesce", ["get", FIELDS.region], ""];
    for (const kw of PARK_KEYWORDS) {
      conds.push(["==", ["index-of", kw, region], -1]);
    }
  }

  // 行政區
  if (f.districts.size > 0) {
    conds.push(["in", ["get", FIELDS.dist], ["literal", [...f.districts]]]);
  }

  return conds as unknown as FilterSpecification;
}

/** 依當前時段的狀態欄組 circle-color（三色分染）。 */
export function buildColorExpr(segStatusField: string): ExpressionSpecification {
  const expr: unknown[] = ["match", ["get", segStatusField]];
  for (const s of ["disappeared", "appeared", "persisted"] as TreeStatus[]) {
    expr.push(s, STATUS_META[s].color);
  }
  expr.push("#8d99a6"); // fallback（不應命中）
  return expr as unknown as ExpressionSpecification;
}

/** 疑似重編號點降透明度（相容 Boolean 與 0/1 兩種欄型，供換源後沿用）。 */
export function buildOpacityExpr(renumberField: string): ExpressionSpecification {
  return [
    "case",
    ["any", ["==", ["get", renumberField], true], ["==", ["get", renumberField], 1]],
    0.32,
    0.85,
  ] as unknown as ExpressionSpecification;
}

/** circle-radius 隨 zoom 內插（拉遠仍看得到、拉近可點），可乘以 scale 倍率。 */
export function radiusExpr(scale = 1): ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    9,
    1.4 * scale,
    12,
    2.6 * scale,
    14,
    4.2 * scale,
    16,
    6.5 * scale,
    18,
    9 * scale,
  ] as unknown as ExpressionSpecification;
}
