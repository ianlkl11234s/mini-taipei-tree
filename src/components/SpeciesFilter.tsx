import { useMemo, useState } from "react";
import { fmtInt } from "../lib/format";
import { IconSearch } from "./icons";

export interface SpeciesItem {
  species: string;
  count: number;
}

interface Props {
  list: SpeciesItem[];
  selected: Set<string>;
  onToggle: (s: string) => void;
  onClear: () => void;
}

const TOP_CHIPS = 12;

export function SpeciesFilter({ list, selected, onToggle, onClear }: Props) {
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  // chip：top N + 已選但不在 top N 的樹種
  const chips = useMemo(() => {
    const top = list.slice(0, TOP_CHIPS).map((i) => i.species);
    const extra = [...selected].filter((s) => !top.includes(s));
    const set = new Set([...top, ...extra]);
    return list.filter((i) => set.has(i.species));
  }, [list, selected]);

  const matches = useMemo(() => {
    const query = q.trim();
    if (!query) return [];
    return list.filter((i) => i.species.includes(query)).slice(0, 40);
  }, [q, list]);

  return (
    <div>
      <div className="species-search">
        <IconSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`搜尋樹種（共 ${list.length} 種）`}
        />
      </div>

      {q.trim() ? (
        <div className="species-dropdown">
          {matches.length === 0 && (
            <button disabled style={{ color: "var(--map-ink-3)" }}>
              查無「{q.trim()}」
            </button>
          )}
          {matches.map((m) => (
            <button
              key={m.species}
              className={selected.has(m.species) ? "sel" : ""}
              onClick={() => onToggle(m.species)}
            >
              <span>
                {selected.has(m.species) ? "✓ " : ""}
                {m.species}
              </span>
              <span className="c">{fmtInt(m.count)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="chip-wrap">
          {chips.map((c) => (
            <button
              key={c.species}
              className={`chip${selected.has(c.species) ? " on" : ""}`}
              onClick={() => onToggle(c.species)}
            >
              {c.species}
              <span className="c">{fmtInt(c.count)}</span>
            </button>
          ))}
          <button className="chip all-species-btn" onClick={() => setShowAll(true)}>
            全部 {list.length} 種 ›
          </button>
        </div>

      )}

      {showAll && (
        <div className="species-modal-backdrop" onClick={() => setShowAll(false)}>
          <div className="species-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-header">
              <span className="sm-title">全部樹種（{list.length} 種）</span>
              <button className="sm-close" onClick={() => setShowAll(false)}>✕</button>
            </div>
            <div className="sm-list">
              {list.map((item) => (
                <button
                  key={item.species}
                  className={`sm-row${selected.has(item.species) ? " sel" : ""}`}
                  onClick={() => onToggle(item.species)}
                >
                  <span>{selected.has(item.species) ? "✓ " : ""}{item.species}</span>
                  <span className="c">{fmtInt(item.count)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="selected-note">
          已選 {selected.size} 種樹 · <a onClick={onClear}>清除</a>
        </div>
      )}
    </div>
  );
}
