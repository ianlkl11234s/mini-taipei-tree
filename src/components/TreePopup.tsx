import { FIELDS, statusFieldFor, renumberFieldFor, type SegmentKey } from "../lib/dataSource";
import { STATUS_META, type TreeStatus } from "../lib/status";
import { fmtDate } from "../lib/format";
import { IconClose, IconAlert } from "./icons";

interface Props {
  props: Record<string, unknown>;
  segment: SegmentKey;
  x: number;
  y: number;
  onClose: () => void;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
function truthy(v: unknown): boolean {
  return v === true || v === 1 || v === "true" || v === "1";
}

export function TreePopup({ props, segment, x, y, onClose }: Props) {
  const statusField = statusFieldFor(segment) ?? FIELDS.status2426;
  const status = String(props[statusField] ?? "") as TreeStatus;
  const meta = STATUS_META[status]; // absent / 未知 → undefined（不顯示狀態標籤）
  const renumberField = renumberFieldFor(segment) ?? FIELDS.renumber2426;

  const species = String(props[FIELDS.species] ?? "").trim() || "未紀錄樹種";
  const region = String(props[FIELDS.region] ?? "").trim() || "—";
  const dist = String(props[FIELDS.dist] ?? "").trim();
  const dbh = num(props[FIELDS.dbhCm]);
  const rawHeight = num(props[FIELDS.heightM]);
  const height = rawHeight != null && rawHeight > 0 && rawHeight <= 60 ? rawHeight : null;
  const date = fmtDate(String(props[FIELDS.surveyDate] ?? ""));
  const renumber = truthy(props[renumberField]);
  const treeId = String(props[FIELDS.treeId] ?? "");

  return (
    <div className="tree-popup" style={{ left: x, top: y }} role="dialog">
      <div className="pop-top">
        {meta && (
          <span
            className="pop-status"
            style={{
              color: meta.color,
              background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
            }}
          >
            <span className="d" style={{ background: meta.color }} />
            {meta.label}
          </span>
        )}
        <div className="pop-species">{species}</div>
        <div className="pop-region">
          {dist && `${dist} · `}
          {region}
        </div>
        <button className="pop-close" onClick={onClose} aria-label="關閉">
          <IconClose />
        </button>
      </div>

      <div className="pop-grid">
        <div className="pop-cell">
          <div className="k">胸徑</div>
          <div className="v">{dbh != null ? `${dbh} cm` : "—"}</div>
        </div>
        <div className="pop-cell">
          <div className="k">樹高</div>
          <div className="v">{height != null ? `${height} m` : "—"}</div>
        </div>
        <div className="pop-cell">
          <div className="k">調查日期</div>
          <div className="v" style={{ fontSize: 13 }}>{date}</div>
        </div>
        <div className="pop-cell">
          <div className="k">樹編號</div>
          <div className="v" style={{ fontSize: 12, fontWeight: 500 }}>{treeId || "—"}</div>
        </div>
      </div>

      {renumber && (
        <div className="pop-warn">
          <IconAlert />
          <span>此點疑似為「重新編號」——狀態變動可能只是編號調整，不一定代表實際移除。</span>
        </div>
      )}
    </div>
  );
}
