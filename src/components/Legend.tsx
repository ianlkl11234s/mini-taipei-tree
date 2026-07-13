import { STATUS_META, STATUS_ORDER } from "../lib/status";

export function Legend() {
  return (
    <div className="map-legend">
      <div className="h">狀態圖例</div>
      {STATUS_ORDER.map((s) => {
        const m = STATUS_META[s];
        // 圖例用地圖上實際點色（appeared 用原亮綠）
        const dot = s === "appeared" ? "#9ccc65" : m.color;
        return (
          <div className="lg-row" key={s}>
            <span className="d" style={{ background: dot }} />
            <span>{m.label}</span>
          </div>
        );
      })}
      <div className="note">
        <span className="ghost" />
        <span>半透明的點 = 疑似「重新編號」，不一定是真的移除。</span>
      </div>
    </div>
  );
}
