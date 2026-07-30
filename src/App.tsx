import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import { Hero } from "./components/Hero";
import { MapExplorer } from "./components/MapExplorer";
import { Infograph } from "./components/Infograph";
import { AdvancedAnalysis } from "./components/AdvancedAnalysis";
import { About } from "./components/About";
import { SiteFooter } from "./components/Placeholders";
import { IconTree, IconSun, IconMoon } from "./components/icons";

type Theme = "light" | "dark";

function initTheme(): Theme {
  const saved = localStorage.getItem("mtt-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initTheme);
  const mapRef = useRef<MapboxMap | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mtt-theme", theme);
  }, [theme]);

  // 消失熱點卡片 → 捲到地圖並飛到叢集位置（對接 T2 地圖，經 mapRef）。
  const flyTo = useCallback((center: [number, number], zoom = 15.5) => {
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
    mapRef.current?.flyTo({ center, zoom, duration: 1800, essential: true });
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">
            <IconTree size={20} />
          </span>
          <span>
            台北行道樹探索 <span className="sub">四時點清冊比對</span>
          </span>
        </div>
        <nav className="header-nav">
          <a href="#explore">地圖探索</a>
          <a href="#stats">統計</a>
          <a href="#advanced">進階分析</a>
          <a href="#about">關於資料</a>
        </nav>
        <button
          className="theme-btn"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          aria-label={theme === "light" ? "切換深色介面" : "切換淺色介面"}
          title={theme === "light" ? "切換深色介面" : "切換淺色介面"}
        >
          {theme === "light" ? <IconMoon /> : <IconSun />}
        </button>
      </header>

      <main>
        <Hero />

        <section id="explore" className="section-band" style={{ maxWidth: "none" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div className="section-kicker">
              <span className="idx">01</span>
              <span className="rule" />
            </div>
            <h2 className="section-title">公園處整理的行道樹清冊地圖</h2>
            <p className="section-sub">
              地圖上每一個點代表一棵在冊行道樹。可透過左側面板依時段、狀態、樹種、胸徑、行政區等條件篩選；
              點選任一棵樹可查看其樹種、胸徑與清冊狀態。
            </p>
          </div>
          <MapExplorer onMap={(m) => (mapRef.current = m)} />
        </section>

        <Infograph onFlyTo={flyTo} />
        <AdvancedAnalysis />
        <About />
      </main>

      <SiteFooter />
    </>
  );
}
