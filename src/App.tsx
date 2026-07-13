import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import { Hero } from "./components/Hero";
import { MapExplorer } from "./components/MapExplorer";
import { Infograph } from "./components/Infograph";
import { About } from "./components/About";
import { SiteFooter } from "./components/Placeholders";
import { IconTree, IconSun, IconMoon } from "./components/icons";

type Theme = "light" | "dark";

function initTheme(): Theme {
  const saved = localStorage.getItem("mtt-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
            台北行道樹探索 <span className="sub">四年間的新增與消失</span>
          </span>
        </div>
        <nav className="header-nav">
          <a href="#explore">地圖探索</a>
          <a href="#stats">統計</a>
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
            <h2 className="section-title">在地圖上找你關心的那棵樹</h2>
            <p className="section-sub">
              深色底圖上，每一個點是一棵行道樹。用左側面板疊加時段、狀態、樹種、胸徑、行政區等條件；
              點任一棵樹看它的樹種、粗細與狀態。
            </p>
          </div>
          <MapExplorer onMap={(m) => (mapRef.current = m)} />
        </section>

        <Infograph onFlyTo={flyTo} />
        <About />
      </main>

      <SiteFooter />
    </>
  );
}
