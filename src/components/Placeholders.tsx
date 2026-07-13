/**
 * SiteFooter — 頁尾。
 * （原 StatsPlaceholder / AboutSection 已由 Infograph.tsx / About.tsx 取代。）
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>台北行道樹探索 · 民眾導向的單一主題資料視覺化</span>
      <span className="spacer" />
      <a href="#explore">地圖探索</a>
      <a href="#stats">統計</a>
      <a href="#about">關於資料</a>
    </footer>
  );
}
