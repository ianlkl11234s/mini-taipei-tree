import { SEGMENTS, type SegmentKey } from "../lib/dataSource";
import { STATUS_META, STATUS_ORDER, type TreeStatus } from "../lib/status";
import { DISTRICTS, type FilterState } from "../filters/types";
import { fmtInt } from "../lib/format";
import { DbhRange } from "./DbhRange";
import { SpeciesFilter, type SpeciesItem } from "./SpeciesFilter";
import { IconClose } from "./icons";

interface Props {
  filter: FilterState;
  species: SpeciesItem[];
  /** 當前時段各狀態總數（來自 overview.json），toggle 旁的參考量。 */
  statusTotals: Record<TreeStatus, number> | null;
  open: boolean;
  onSegment: (s: SegmentKey) => void;
  onToggleStatus: (s: TreeStatus) => void;
  onSpeciesToggle: (s: string) => void;
  onSpeciesClear: () => void;
  onDbh: (v: [number, number]) => void;
  onStreetOnly: (v: boolean) => void;
  onDistrictToggle: (d: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ControlPanel(p: Props) {
  const { filter } = p;
  return (
    <aside className={`control-panel${p.open ? " open" : ""}`} aria-label="篩選面板">
      <div className="cp-header">
        <span className="t">篩選條件</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="reset" onClick={p.onReset}>
            重設
          </button>
          <button className="reset cp-close-btn" onClick={p.onClose} aria-label="收合面板"
            style={{ padding: 4, display: "grid", placeItems: "center" }}>
            <IconClose />
          </button>
        </div>
      </div>

      <div className="cp-scroll">
        {/* 時段 */}
        <div className="cp-group">
          <div className="cp-legend">時段</div>
          <div className="segmented">
            {SEGMENTS.map((s) => (
              <button
                key={s.key}
                className={filter.segment === s.key ? "active" : ""}
                disabled={!s.available}
                onClick={() => s.available && p.onSegment(s.key)}
                title={s.available ? undefined : s.note}
              >
                {s.label}
                {!s.available && <span className="tag">{s.note}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 狀態 */}
        <div className="cp-group">
          <div className="cp-legend">
            狀態 <span className="hint">可獨立開關</span>
          </div>
          <div className="status-toggles">
            {STATUS_ORDER.map((s) => {
              const on = filter.statuses[s];
              const meta = STATUS_META[s];
              return (
                <button
                  key={s}
                  className={`status-toggle${on ? "" : " off"}`}
                  aria-pressed={on}
                  onClick={() => p.onToggleStatus(s)}
                >
                  <span className="sw" style={{ background: meta.color }} />
                  <span className="lbl">
                    <span className="n">{meta.label}</span>
                    <span className="d">{meta.blurb}</span>
                  </span>
                  {p.statusTotals && (
                    <span className="cnt">{fmtInt(p.statusTotals[s])}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 樹種 */}
        <div className="cp-group">
          <div className="cp-legend">樹種</div>
          <SpeciesFilter
            list={p.species}
            selected={filter.species}
            onToggle={p.onSpeciesToggle}
            onClear={p.onSpeciesClear}
          />
        </div>

        {/* 胸徑 */}
        <div className="cp-group">
          <div className="cp-legend">胸徑範圍</div>
          <DbhRange value={filter.dbhRange} onChange={p.onDbh} />
        </div>

        {/* 只看道路 */}
        <div className="cp-group">
          <button
            className="switch-row"
            style={{ width: "100%" }}
            aria-pressed={filter.streetOnly}
            onClick={() => p.onStreetOnly(!filter.streetOnly)}
          >
            <span className="txt">
              <span className="n">只看道路行道樹</span>
              <span className="d">排除公園 / 綠地 / 廣場（約 11%）</span>
            </span>
            <span className={`switch${filter.streetOnly ? " on" : ""}`} />
          </button>
        </div>

        {/* 行政區 */}
        <div className="cp-group">
          <div className="cp-legend">
            行政區{" "}
            <span className="hint">
              {filter.districts.size === 0 ? "全部" : `已選 ${filter.districts.size}`}
            </span>
          </div>
          <div className="district-grid">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                className={filter.districts.has(d) ? "on" : ""}
                onClick={() => p.onDistrictToggle(d)}
              >
                {d.replace("區", "")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
