import { useEffect, useState } from "react";
import { fmtInt, fmtPct } from "../lib/format";
import type { Overview } from "../lib/stats";

/**
 * Hero + 三大 KPI。數字接 public/data/stats/overview.json（2024→2026 段）。
 * 初值先用已知數字避免載入時版位跳動，overview 到位後覆寫。
 */
interface Kpi {
  label: string;
  value: number;
  delta: string | null;
  accent: string;
  foot: string;
}

const INITIAL_KPIS: Kpi[] = [
  { label: "現有行道樹", value: 92033, delta: null, accent: "var(--forest)", foot: "2026-07 台北市在冊逐棵行道樹" },
  { label: "2024 → 2026 消失", value: 7494, delta: "7.9%", accent: "var(--st-gone)", foot: "從清冊消失，不等於一定被砍除" },
  { label: "2024 → 2026 新增", value: 4029, delta: null, accent: "var(--st-new)", foot: "同期新入清冊的行道樹" },
];

export function Hero() {
  const [kpis, setKpis] = useState<Kpi[]>(INITIAL_KPIS);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/stats/overview.json`)
      .then((r) => r.json() as Promise<Overview>)
      .then((d) => {
        const now = d.epochs.find((e) => e.key === "2026")?.total ?? 92033;
        const seg = d.segments.find((s) => s.key === "2426");
        if (!seg) return;
        setKpis([
          { ...INITIAL_KPIS[0], value: now },
          { ...INITIAL_KPIS[1], value: seg.disappeared, delta: fmtPct(seg.removal_rate) },
          { ...INITIAL_KPIS[2], value: seg.appeared },
        ]);
      })
      .catch(() => {
        /* 保留初值 */
      });
  }, []);

  return (
    <section className="hero">
      <span className="hero-eyebrow">台北市 · 逐棵行道樹 · 三時點清冊</span>
      <h1>
        四年間，台北的行道樹<br />
        <span className="accent">悄悄換了一輪</span>
      </h1>
      <p className="lede">
        比對 2022、2024、2026 三個時點的官方行道樹清冊，看見每一棵樹的
        <em>維持、消失與新增</em>。哪裡的樹不見了、哪裡種了新樹、什麼樹種變動最劇烈——
        都在這張地圖上。
      </p>
      <p className="disclaimer">
        「消失」指的是<em style={{ fontStyle: "normal", fontWeight: 600 }}>從清冊上不見了</em>，
        可能是移除、也可能只是編號重整。<a href="#about">資料方法與限制 →</a>
      </p>

      <div className="kpi-row">
        {kpis.map((k) => (
          <div className="kpi" key={k.label} style={{ ["--kpi-accent" as string]: k.accent }}>
            <div className="kpi-label">
              <span className="kpi-dot" />
              {k.label}
            </div>
            <div className="kpi-value">
              <span className="num">{fmtInt(k.value)}</span>
              {k.delta && <span className="delta">{k.delta}</span>}
            </div>
            <div className="kpi-foot">{k.foot}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
