/**
 * charts — 手刻 SVG 圖表原件（標本簿質感，走站內 design tokens）
 * =============================================================
 * 全部以 CSS var 上色 → 亮暗雙主題自動切換。
 * 三狀態語意配色與地圖一致：消失=紅、新增=綠、維持/量值=森林綠。
 * 每個 mark 以 <title> 附完整數字（滑鼠懸停 / 螢幕報讀）。
 * =============================================================
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { fmtInt, fmtSigned } from "../lib/format";

/** ResizeObserver 量測容器寬度（給需要水平空間的圖用）。 */
function useMeasure<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(560);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      for (const e of es) setW(Math.max(240, e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const C = {
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  ink3: "var(--ink-3)",
  line: "var(--line)",
  track: "var(--surface-3)",
  gone: "var(--st-gone)",
  grow: "var(--st-new)",
  stay: "var(--forest)",
};

/* ============================================================
   HBarChart — 水平長條排行（樹種消失率、行政區）
   ============================================================ */
export interface HBarRow {
  key: string;
  label: string;
  value: number; // 已是「要畫的量值」（比率或絕對值皆可）
  title?: string;
  highlight?: boolean;
  note?: string; // 值下方的次要註記（如淨變化）
  noteColor?: string;
}
interface HBarProps {
  rows: HBarRow[];
  max: number;
  color?: string;
  fmtValue: (v: number) => string;
  labelW?: number;
  rowH?: number;
  valueW?: number;
}
export function HBarChart({
  rows,
  max,
  color = C.gone,
  fmtValue,
  labelW = 96,
  rowH = 30,
  valueW = 60,
}: HBarProps) {
  const [ref, w] = useMeasure<HTMLDivElement>();
  const padT = 6;
  const h = rows.length * rowH + padT * 2;
  const x0 = labelW;
  const x1 = w - valueW;
  const trackW = Math.max(20, x1 - x0);
  return (
    <div ref={ref} className="chart">
      <svg width={w} height={h} role="img" style={{ display: "block" }}>
        {rows.map((r, i) => {
          const cy = padT + i * rowH + rowH / 2;
          const bw = Math.max(3, (Math.min(r.value, max) / max) * trackW);
          const fill = r.highlight ? color : `color-mix(in srgb, ${color} 78%, transparent)`;
          return (
            <g key={r.key}>
              <title>{r.title ?? `${r.label}：${fmtValue(r.value)}`}</title>
              <text
                x={x0 - 8}
                y={cy}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={12.5}
                fill={r.highlight ? C.ink : C.ink2}
                fontWeight={r.highlight ? 700 : 500}
              >
                {r.label}
              </text>
              <rect x={x0} y={cy - 8} width={trackW} height={16} rx={5} fill={C.track} />
              <rect x={x0} y={cy - 8} width={bw} height={16} rx={5} fill={fill} />
              <text
                x={x1 + valueW - 2}
                y={r.note ? cy - 5 : cy}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={12.5}
                fontWeight={700}
                fill={C.ink}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtValue(r.value)}
              </text>
              {r.note && (
                <text
                  x={x1 + valueW - 2}
                  y={cy + 8}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={600}
                  fill={r.noteColor ?? C.ink3}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {r.note}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   DivergingBars — 淨流失 / 淨增 雙向條（以 0 為中軸）
   方向（左負右正）＋直接標值＝色盲安全的次要編碼
   ============================================================ */
export interface DivRow {
  key: string;
  label: string;
  net: number;
  title?: string;
}
export function DivergingBars({ rows, max }: { rows: DivRow[]; max: number }) {
  const [ref, w] = useMeasure<HTMLDivElement>();
  const rowH = 28;
  const padT = 8;
  const h = rows.length * rowH + padT * 2;
  const cx = w / 2;
  const gutter = 46; // 兩側留給數值/標籤
  const half = Math.max(30, w / 2 - gutter);
  return (
    <div ref={ref} className="chart">
      <svg width={w} height={h} role="img" style={{ display: "block" }}>
        <line x1={cx} x2={cx} y1={padT - 2} y2={h - padT + 2} stroke={C.line} strokeWidth={1} />
        {rows.map((r, i) => {
          const cy = padT + i * rowH + rowH / 2;
          const bw = Math.max(2, (Math.abs(r.net) / max) * half);
          const loss = r.net < 0;
          const fill = loss ? C.gone : C.grow;
          const barX = loss ? cx - bw : cx;
          const labelX = loss ? cx + 6 : cx - 6;
          const labelAnchor = loss ? "start" : "end";
          const valX = loss ? cx - bw - 5 : cx + bw + 5;
          const valAnchor = loss ? "end" : "start";
          return (
            <g key={r.key}>
              <title>{r.title ?? `${r.label}：淨變化 ${fmtSigned(r.net)}`}</title>
              <rect x={barX} y={cy - 8} width={bw} height={16} rx={5} fill={fill} />
              <text
                x={labelX}
                y={cy}
                textAnchor={labelAnchor}
                dominantBaseline="central"
                fontSize={12.5}
                fontWeight={600}
                fill={C.ink}
              >
                {r.label}
              </text>
              <text
                x={valX}
                y={cy}
                textAnchor={valAnchor}
                dominantBaseline="central"
                fontSize={12}
                fontWeight={700}
                fill={loss ? C.gone : C.stay}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmtSigned(r.net)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   BinBarChart — 分級距消失率（垂直柱）
   ============================================================ */
export interface Bin {
  label: string;
  rate: number;
  n: number;
}
export function BinBarChart({
  bins,
  max,
  unit,
  color = C.gone,
}: {
  bins: Bin[];
  max: number;
  unit: string;
  color?: string;
}) {
  const [ref, w] = useMeasure<HTMLDivElement>();
  const h = 210;
  const pad = { l: 30, r: 8, t: 22, b: 40 };
  const plotW = Math.max(60, w - pad.l - pad.r);
  const plotH = h - pad.t - pad.b;
  const groupW = plotW / bins.length;
  const barW = Math.min(46, groupW * 0.56);
  const ticks = 3;
  return (
    <div ref={ref} className="chart">
      <svg width={w} height={h} role="img" style={{ display: "block" }}>
        {/* 網格 + y 軸刻度 */}
        {Array.from({ length: ticks + 1 }, (_, t) => {
          const y = pad.t + (plotH * t) / ticks;
          const v = max - (max * t) / ticks;
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={C.line} strokeWidth={1} opacity={0.7} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize={10} fill={C.ink3}>
                {(v * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
        {bins.map((b, i) => {
          const gx = pad.l + groupW * i + groupW / 2;
          const bh = Math.max(2, (b.rate / max) * plotH);
          const by = pad.t + plotH - bh;
          return (
            <g key={b.label}>
              <title>{`${b.label} ${unit}：消失率 ${(b.rate * 100).toFixed(1)}%（基數 ${fmtInt(b.n)}）`}</title>
              <rect x={gx - barW / 2} y={by} width={barW} height={bh} rx={4} fill={color} />
              <text x={gx} y={by - 6} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={C.ink}>
                {(b.rate * 100).toFixed(1)}%
              </text>
              <text x={gx} y={h - pad.b + 15} textAnchor="middle" fontSize={11} fill={C.ink2}>
                {b.label}
              </text>
              <text x={gx} y={h - pad.b + 29} textAnchor="middle" fontSize={9.5} fill={C.ink3}>
                n={fmtInt(b.n)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   TotalWaterfall — 三時點總量 waterfall（含各段消失/新增分解）
   ============================================================ */
export interface WFBar {
  key: string;
  caption: string;
  from: number;
  to: number;
  kind: "anchor" | "up" | "down";
}
export function TotalWaterfall({ bars, yMax }: { bars: WFBar[]; yMax: number }) {
  const [ref, w] = useMeasure<HTMLDivElement>();
  const h = 290;
  const pad = { l: 10, r: 10, t: 26, b: 46 };
  const plotW = Math.max(120, w - pad.l - pad.r);
  const plotH = h - pad.t - pad.b;
  const slot = plotW / bars.length;
  const barW = Math.min(58, slot * 0.62);
  const y = (v: number) => pad.t + (1 - v / yMax) * plotH;
  const colorOf = (k: WFBar["kind"]) => (k === "anchor" ? C.stay : k === "up" ? C.grow : C.gone);

  return (
    <div ref={ref} className="chart">
      <svg width={w} height={h} role="img" style={{ display: "block" }}>
        <line x1={pad.l} x2={w - pad.r} y1={pad.t + plotH} y2={pad.t + plotH} stroke={C.line} strokeWidth={1} />
        {bars.map((b, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const top = y(Math.max(b.from, b.to));
          const bot = b.kind === "anchor" ? pad.t + plotH : y(Math.min(b.from, b.to));
          const bh = Math.max(2, bot - top);
          const isAnchor = b.kind === "anchor";
          const val = isAnchor ? b.to : b.to - b.from;
          // 連接線到下一根
          const next = bars[i + 1];
          const connectY = y(b.to);
          return (
            <g key={b.key}>
              <title>{`${b.caption}：${isAnchor ? fmtInt(b.to) + " 棵" : fmtSigned(val) + " 棵"}`}</title>
              {next && (
                <line
                  x1={cx}
                  x2={pad.l + slot * (i + 1) + slot / 2}
                  y1={connectY}
                  y2={connectY}
                  stroke={C.ink3}
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.6}
                />
              )}
              <rect
                x={cx - barW / 2}
                y={top}
                width={barW}
                height={bh}
                rx={isAnchor ? 4 : 3}
                fill={colorOf(b.kind)}
                opacity={isAnchor ? 1 : 0.92}
              />
              <text
                x={cx}
                y={top - 7}
                textAnchor="middle"
                fontSize={isAnchor ? 12.5 : 11}
                fontWeight={700}
                fill={isAnchor ? C.ink : b.kind === "up" ? C.stay : C.gone}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {isAnchor ? fmtInt(val) : fmtSigned(val)}
              </text>
              <text x={cx} y={h - pad.b + 16} textAnchor="middle" fontSize={10.5} fill={C.ink2}>
                {b.caption.split("\n").map((ln, k) => (
                  <tspan key={k} x={cx} dy={k === 0 ? 0 : 12}>
                    {ln}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
