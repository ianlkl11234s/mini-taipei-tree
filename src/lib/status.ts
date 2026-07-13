/**
 * 三狀態語彙 + 配色（沿用 mini-taiwan-pulse 已驗證的深底三色點）。
 * 「消失」一律不寫「被砍」——資料只能說「從清冊消失」。
 */
export type TreeStatus = "persisted" | "disappeared" | "appeared";

export const STATUS_ORDER: TreeStatus[] = ["disappeared", "appeared", "persisted"];

export const STATUS_META: Record<
  TreeStatus,
  { label: string; color: string; glyph: string; blurb: string }
> = {
  disappeared: {
    label: "消失",
    color: "#e53935",
    glyph: "●",
    blurb: "上一時點在冊、這一時點從清冊消失",
  },
  appeared: {
    label: "新增",
    color: "#9ccc65",
    glyph: "●",
    blurb: "上一時點不在、這一時點新入清冊",
  },
  persisted: {
    label: "維持",
    color: "#2e7d32",
    glyph: "●",
    blurb: "兩個時點都在清冊上",
  },
};
