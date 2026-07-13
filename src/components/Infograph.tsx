import { useState, type ReactNode } from "react";
import {
  useStats,
  pickRate,
  pickBase,
  SEG_META,
  type SegKey,
  type SpeciesRow,
  type Overview,
} from "../lib/stats";
import { fmtInt, fmtPct, fmtSigned } from "../lib/format";
import {
  HBarChart,
  DivergingBars,
  BinBarChart,
  TotalWaterfall,
  type HBarRow,
  type DivRow,
  type Bin,
  type WFBar,
} from "./charts";

interface InfographProps {
  /** 點擊消失熱點卡片 → 飛到地圖對應位置（App 提供，對接 T2 地圖）。 */
  onFlyTo?: (center: [number, number], zoom?: number) => void;
}

/** 統計區塊外殼：序號 + 標題 + 圖 + 一句 insight + 資料範圍註記。 */
function Block({
  n,
  title,
  hint,
  insight,
  note,
  children,
}: {
  n: string;
  title: string;
  hint?: string;
  insight: ReactNode;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="stat-block">
      <div className="sb-head">
        <span className="sb-n">{n}</span>
        <div>
          <h3 className="sb-title">{title}</h3>
          {hint && <p className="sb-hint">{hint}</p>}
        </div>
      </div>
      <div className="sb-chart">{children}</div>
      <p className="sb-insight">{insight}</p>
      <p className="sb-note">{note}</p>
    </div>
  );
}

/** 圖表用小圖例。 */
function ChartLegend({ items }: { items: { c: string; t: string }[] }) {
  return (
    <div className="chart-legend">
      {items.map((it) => (
        <span key={it.t}>
          <span className="d" style={{ background: it.c }} />
          {it.t}
        </span>
      ))}
    </div>
  );
}

/** 「排除公園」不適用該圖時的固定說明。 */
const ALL_ONLY = "全部（含公園綠地）";

const PARK_RE = /公園|綠地|綠帶|綠道/;
const isPark = (road: string) => PARK_RE.test(road);

export function Infograph({ onFlyTo }: InfographProps) {
  const stats = useStats();
  const [seg, setSeg] = useState<SegKey>("2426");
  const [street, setStreet] = useState(false); // false = 全部含公園

  if (!stats) {
    return (
      <section id="stats" className="section-band">
        <div className="section-kicker">
          <span className="idx">02</span>
          <span className="rule" />
        </div>
        <h2 className="section-title">數字背後的故事</h2>
        <p className="section-sub">載入統計資料中…</p>
      </section>
    );
  }

  const { overview, species, dbh, height, districts, clusters } = stats;
  const segLabel = SEG_META[seg].label;
  const scopeNote = (allOnly = false) =>
    `${segLabel} · ${allOnly || !street ? ALL_ONLY : "僅道路行道樹"}`;

  return (
    <section id="stats" className="section-band">
      <div className="section-kicker">
        <span className="idx">02</span>
        <span className="rule" />
      </div>
      <h2 className="section-title">清冊數據摘要</h2>
      <p className="section-sub">
        以下統計皆來自三時點清冊的比對結果。「消失」一律指
        <em style={{ fontStyle: "normal", fontWeight: 600 }}>該編號在下一時點的清冊中不再出現</em>，原因可能包含移除、枯死或編號重整。
      </p>

      {/* ① 三時點總量 waterfall（全景，恆含公園） */}
      <Block
        n="①"
        title="三時點在冊總量變化"
        insight={<Overview1Insight overview={overview} />}
        note="2022 / 2024 / 2026 三時點 · 全部（含公園綠地）· 深綠＝各時點在冊總量，綠＝新增、紅＝消失"
      >
        <ChartLegend
          items={[
            { c: "var(--forest)", t: "在冊總量" },
            { c: "var(--st-new)", t: "新增" },
            { c: "var(--st-gone)", t: "消失" },
          ]}
        />
        <TotalWaterfall {...buildWaterfall(overview)} />
      </Block>

      {/* 控制列：以下各圖套用 */}
      <div className="stat-controls">
        <div className="sc-label">以下各圖套用</div>
        <div className="seg-switch" role="tablist" aria-label="時段切換">
          {(["2224", "2426"] as SegKey[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={seg === k}
              className={seg === k ? "on" : ""}
              onClick={() => setSeg(k)}
            >
              {SEG_META[k].label}
            </button>
          ))}
        </div>
        <button
          className={`park-switch${street ? " on" : ""}`}
          onClick={() => setStreet((v) => !v)}
          aria-pressed={street}
          title="濾掉公園、綠地、廣場的樹，只留道路旁行道樹"
        >
          <span className="sw" />
          只看道路行道樹
        </button>
      </div>

      <div className="stat-grid">
        {/* ② 樹種消失率排行 */}
        <Block
          n="②"
          title="各樹種離冊率排行"
          hint="基數 ≥ 100 的樹種才入榜，避免小樣本雜訊"
          insight={<SpeciesRateInsight seg={seg} street={street} species={species} />}
          note={`${scopeNote()} · 分母為該段起點在冊數 · 依消失率排序取前 10`}
        >
          <HBarChart {...buildSpeciesRate(species.segments[seg], street)} />
        </Block>

        {/* ③ 淨流失 vs 淨增 */}
        <Block
          n="③"
          title="各樹種淨變化"
          hint="淨變化 = 新增 − 消失，正為淨增、負為淨流失"
          insight={<NetInsight seg={seg} species={species} />}
          note={`${segLabel} · ${ALL_ONLY} · 消失樹屬性取自舊期、新增取自新期`}
        >
          <ChartLegend
            items={[
              { c: "var(--st-gone)", t: "淨流失" },
              { c: "var(--st-new)", t: "淨增" },
            ]}
          />
          <DivergingBars {...buildNet(species.segments[seg])} />
        </Block>
      </div>

      {/* ④ 胸徑 / 樹高分級距 */}
      <Block
        n="④"
        title="尺寸與離冊率的關係"
        hint="樹高與離冊率呈單調遞減，胸徑則否"
        insight={<BinsInsight seg={seg} street={street} height={height.segments[seg]} />}
        note={`${scopeNote()} · 縱軸為消失率 · 兩圖共用縱軸刻度以利對照 · n＝各級距基數`}
      >
        <div className="bin-pair">
          <div className="bin-panel">
            <div className="bin-cap">樹高（公尺）</div>
            <BinBarChart {...buildBins(height.segments[seg], dbh.segments[seg], "height", street)} />
          </div>
          <div className="bin-panel">
            <div className="bin-cap">胸徑（公分）</div>
            <BinBarChart {...buildBins(height.segments[seg], dbh.segments[seg], "dbh", street)} />
          </div>
        </div>
      </Block>

      {/* ⑤ 12 行政區 */}
      <Block
        n="⑤"
        title="12 行政區離冊率分布"
        hint="條末小字為該區淨變化（紅＝淨減、綠＝淨增）"
        insight={<DistrictInsight street={street} districts={districts.segments[seg]} />}
        note={`${scopeNote()} · 依消失率排序`}
      >
        <HBarChart {...buildDistricts(districts.segments[seg], street)} />
      </Block>

      {/* ⑥ 整排消失熱點 */}
      <Block
        n="⑥"
        title="整排一起從清冊消失的熱點"
        hint="叢集 = 同一路段鄰近同時消失 ≥ 10 棵 · 點卡片飛到地圖位置"
        insight={<ClusterInsight seg={seg} clusters={clusters} street={street} />}
        note={`${scopeNote()} · 依規模（棵數）排序取前 10`}
      >
        <div className="cluster-cards">
          {clusters
            .filter((c) => c.segment === seg && (!street || !isPark(c.road)))
            .sort((a, b) => b.size - a.size)
            .slice(0, 10)
            .map((c) => (
              <button
                key={`${c.segment}-${c.cluster_id}`}
                className="cl-card"
                onClick={() => onFlyTo?.(c.centroid, 16)}
                title="飛到地圖此位置"
              >
                <div className="cl-size">
                  <b>{fmtInt(c.size)}</b> 棵
                </div>
                <div className="cl-road">{c.road}</div>
                <div className="cl-meta">
                  {c.dist} · 主要為 {c.species_top}
                </div>
              </button>
            ))}
        </div>
      </Block>
    </section>
  );
}

/* ============================================================
   資料整形
   ============================================================ */
function buildWaterfall(ov: Overview): { bars: WFBar[]; yMax: number } {
  const e = (k: string) => ov.epochs.find((x) => x.key === k)!.total;
  const s = (k: SegKey) => ov.segments.find((x) => x.key === k)!;
  const t2022 = e("2022");
  const s24 = s("2224");
  const s26 = s("2426");
  const afterApp24 = t2022 + s24.appeared;
  const t2024 = e("2024");
  const afterApp26 = t2024 + s26.appeared;
  const t2026 = e("2026");
  const bars: WFBar[] = [
    { key: "e22", caption: "2022", from: 0, to: t2022, kind: "anchor" },
    { key: "a24", caption: "新增\n22→24", from: t2022, to: afterApp24, kind: "up" },
    { key: "d24", caption: "消失\n22→24", from: afterApp24, to: t2024, kind: "down" },
    { key: "e24", caption: "2024", from: 0, to: t2024, kind: "anchor" },
    { key: "a26", caption: "新增\n24→26", from: t2024, to: afterApp26, kind: "up" },
    { key: "d26", caption: "消失\n24→26", from: afterApp26, to: t2026, kind: "down" },
    { key: "e26", caption: "2026", from: 0, to: t2026, kind: "anchor" },
  ];
  const yMax = Math.ceil((afterApp24 * 1.04) / 5000) * 5000;
  return { bars, yMax };
}

function buildSpeciesRate(rows: SpeciesRow[], street: boolean): {
  rows: HBarRow[];
  max: number;
  fmtValue: (v: number) => string;
  color: string;
} {
  const picked = rows
    .filter((r) => r.species !== "其他" && pickBase(r, street) >= 100)
    .sort((a, b) => pickRate(b, street) - pickRate(a, street))
    .slice(0, 10);
  const max = Math.max(0.01, ...picked.map((r) => pickRate(r, street)));
  return {
    rows: picked.map((r, i) => {
      const base = pickBase(r, street);
      const rate = pickRate(r, street);
      return {
        key: r.species,
        label: r.species,
        value: rate,
        highlight: i === 0,
        title: `${r.species}：消失率 ${fmtPct(rate)}（基數 ${fmtInt(base)} 棵）`,
      };
    }),
    max,
    fmtValue: (v) => fmtPct(v),
    color: "var(--st-gone)",
  };
}

function buildNet(rows: SpeciesRow[]): { rows: DivRow[]; max: number } {
  const list = rows.filter((r) => r.species !== "其他");
  const losses = [...list].sort((a, b) => a.net - b.net).slice(0, 6);
  const gains = [...list].sort((a, b) => b.net - a.net).slice(0, 6);
  const merged = [...losses, ...gains];
  const max = Math.max(1, ...merged.map((r) => Math.abs(r.net)));
  return {
    rows: merged.map((r) => ({
      key: r.species,
      label: r.species,
      net: r.net,
      title: `${r.species}：淨變化 ${fmtSigned(r.net)}（消失 ${fmtInt(r.disappeared)}、新增 ${fmtInt(r.appeared)}）`,
    })),
    max,
  };
}

function buildBins(
  heightRows: { bin: string; base: number; removal_rate: number; removal_rate_street: number }[],
  dbhRows: { bin: string; base: number; removal_rate: number; removal_rate_street: number }[],
  which: "height" | "dbh",
  street: boolean,
): { bins: Bin[]; max: number; unit: string; color: string } {
  const src = which === "height" ? heightRows : dbhRows;
  const allRates = [...heightRows, ...dbhRows].map((r) => pickRate(r, street));
  const rawMax = Math.max(0.01, ...allRates);
  const max = Math.ceil((rawMax * 1.12) / 0.02) * 0.02;
  return {
    // 分級距 JSON 無 base_street，n 一律用整體基數作為母體規模參考
    bins: src.map((r) => ({ label: r.bin, rate: pickRate(r, street), n: r.base })),
    max,
    unit: which === "height" ? "m" : "cm",
    color: "var(--st-gone)",
  };
}

function buildDistricts(
  rows: { dist: string; net: number; removal_rate: number; removal_rate_street: number }[],
  street: boolean,
): { rows: HBarRow[]; max: number; fmtValue: (v: number) => string; color: string; rowH: number; valueW: number; labelW: number } {
  const sorted = [...rows].sort((a, b) => pickRate(b, street) - pickRate(a, street));
  const max = Math.max(0.01, ...sorted.map((r) => pickRate(r, street)));
  return {
    rows: sorted.map((r, i) => {
      const rate = pickRate(r, street);
      return {
        key: r.dist,
        label: r.dist,
        value: rate,
        highlight: i === 0,
        note: fmtSigned(r.net),
        noteColor: r.net < 0 ? "var(--st-gone)" : "var(--forest)",
        title: `${r.dist}：消失率 ${fmtPct(rate)} · 淨變化 ${fmtSigned(r.net)}`,
      };
    }),
    max,
    fmtValue: (v) => fmtPct(v),
    color: "var(--st-gone)",
    rowH: 34,
    valueW: 68,
    labelW: 68,
  };
}

/* ============================================================
   Insight 文案（由當前資料切片動態產生）
   ============================================================ */
function Overview1Insight({ overview }: { overview: NonNullable<ReturnType<typeof useStats>>["overview"] }) {
  const s24 = overview.segments.find((x) => x.key === "2224")!;
  const s26 = overview.segments.find((x) => x.key === "2426")!;
  return (
    <>
      三時點總量變化：2022→2024 淨變化 <b>{fmtSigned(s24.net)}</b> 棵，2024→2026 淨變化{" "}
      <b>{fmtSigned(s26.net)}</b> 棵。每一段皆同時有新入冊與離冊紀錄，
      <b>總量接近不代表個別樹木未異動</b>。
    </>
  );
}

function SpeciesRateInsight({
  seg,
  street,
  species,
}: {
  seg: SegKey;
  street: boolean;
  species: NonNullable<ReturnType<typeof useStats>>["species"];
}) {
  const picked = species.segments[seg]
    .filter((r) => r.species !== "其他" && pickBase(r, street) >= 100)
    .sort((a, b) => pickRate(b, street) - pickRate(a, street));
  const t = picked.slice(0, 3);
  if (t.length === 0) return <>此範圍沒有基數 ≥ 100 的樹種。</>;
  return (
    <>
      離冊率前三：<b>{t[0].species} {fmtPct(pickRate(t[0], street))}</b>
      {t[1] && <>、{t[1].species} {fmtPct(pickRate(t[1], street))}</>}
      {t[2] && <>、{t[2].species} {fmtPct(pickRate(t[2], street))}</>}。基數較小的樹種排名波動較大，
      可切換「只看道路」觀察是否集中於特定公園。
    </>
  );
}

function NetInsight({ seg, species }: { seg: SegKey; species: NonNullable<ReturnType<typeof useStats>>["species"] }) {
  const list = species.segments[seg].filter((r) => r.species !== "其他");
  const loss0 = [...list].sort((a, b) => a.net - b.net)[0];
  const gain0 = [...list].sort((a, b) => b.net - a.net)[0];
  if (seg === "2426") {
    return (
      <>
        淨減最多的「<b>{loss0.species}</b>」離冊 {Math.abs(loss0.net)} 棵，淨增最多的「
        <b>{gain0.species}</b>」新入冊 {gain0.net} 棵。離冊數量與新入冊數量之間存在落差。
      </>
    );
  }
  return (
    <>
      這一段整體是擴張期：多數樹種淨增（<b>{gain0.species} {fmtSigned(gain0.net)}</b>、其後為樟樹、楓香），
      只有少數如「{loss0.species}」（{fmtSigned(loss0.net)}，多在線形公園）淨減。
    </>
  );
}

function BinsInsight({
  seg,
  street,
  height,
}: {
  seg: SegKey;
  street: boolean;
  height: NonNullable<ReturnType<typeof useStats>>["height"]["segments"][SegKey];
}) {
  const h = height;
  const first = pickRate(h[0], street);
  const last = pickRate(h[h.length - 1], street);
  if (seg === "2426") {
    return (
      <>
        樹高與離冊率呈單調遞減：從 &lt;5m 的 {fmtPct(first)} 降至 &gt;20m 的 {fmtPct(last)}。
        胸徑則無此規律——最細與最粗的級距離冊率皆偏高，呈 <b>U 型</b>分布。
      </>
    );
  }
  return (
    <>
      這一段的樣態相反：高樹（&gt;20m）消失率反而偏高（{fmtPct(last)}），但該級距僅約數百棵、
      代表性有限；胸徑同樣看不出「越粗越容易消失」的單調關係。跨段別直接外推需謹慎。
    </>
  );
}

function DistrictInsight({
  street,
  districts,
}: {
  street: boolean;
  districts: NonNullable<ReturnType<typeof useStats>>["districts"]["segments"][SegKey];
}) {
  const sorted = [...districts].sort((a, b) => pickRate(b, street) - pickRate(a, street));
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  return (
    <>
      各區離冊率差異：<b>{hi.dist}</b> 離冊率最高（{fmtPct(pickRate(hi, street))}），
      <b>{lo.dist}</b> 最低（{fmtPct(pickRate(lo, street))}）。各行政區之間的離冊率分布不均。
    </>
  );
}

function ClusterInsight({
  seg,
  clusters,
  street,
}: {
  seg: SegKey;
  clusters: NonNullable<ReturnType<typeof useStats>>["clusters"];
  street: boolean;
}) {
  const top = clusters
    .filter((c) => c.segment === seg && (!street || !isPark(c.road)))
    .sort((a, b) => b.size - a.size)[0];
  if (!top) return <>此段沒有規模 ≥ 10 棵的整排消失叢集。</>;
  if (seg === "2426") {
    return (
      <>
        同一路段集中離冊最多的地點：<b>{top.road}</b>（{top.dist}），共 <b>{fmtInt(top.size)} 棵</b>，
        主要樹種為{top.species_top}。
      </>
    );
  }
  return (
    <>
      這一段最大的整排消失叢集在 <b>{top.road}</b>（{top.dist}），達 <b>{fmtInt(top.size)} 棵</b>，多為{top.species_top}。
      早期時段的叢集多落在線形公園等綠帶。
    </>
  );
}
