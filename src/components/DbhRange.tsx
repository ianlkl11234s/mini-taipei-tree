import { DBH_MAX_CAP } from "../filters/types";

interface Props {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}

const TICKS = [0, 10, 20, 40, DBH_MAX_CAP];

/** 胸徑雙把手 range slider（0–60cm，60 = 開放上界「60+」）。 */
export function DbhRange({ value, onChange }: Props) {
  const [lo, hi] = value;
  const pct = (v: number) => (v / DBH_MAX_CAP) * 100;

  const setLo = (v: number) => onChange([Math.min(v, hi), hi]);
  const setHi = (v: number) => onChange([lo, Math.max(v, lo)]);

  const fmt = (v: number) => (v >= DBH_MAX_CAP ? "60+" : String(v));

  return (
    <div className="range-box">
      <div className="range-values">
        <span>
          <span className="v">{fmt(lo)}</span> – <span className="v">{fmt(hi)}</span>{" "}
          <span className="u">cm 胸徑</span>
        </span>
      </div>
      <div className="dual-range">
        <div className="track" />
        <div className="fill" style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
        <input
          type="range"
          min={0}
          max={DBH_MAX_CAP}
          step={1}
          value={lo}
          aria-label="胸徑下限"
          onChange={(e) => setLo(Number(e.target.value))}
        />
        <input
          type="range"
          min={0}
          max={DBH_MAX_CAP}
          step={1}
          value={hi}
          aria-label="胸徑上限"
          onChange={(e) => setHi(Number(e.target.value))}
        />
      </div>
      <div className="range-ticks">
        {TICKS.map((t) => (
          <span key={t}>{t === DBH_MAX_CAP ? "60+" : t}</span>
        ))}
      </div>
    </div>
  );
}
