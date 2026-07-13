import { useMemo, useState } from "react";
import type { SpeciesRow } from "../lib/stats";
import { fmtInt, fmtPct, fmtSigned } from "../lib/format";

type SortKey = "species" | "base" | "disappeared" | "removal_rate" | "appeared" | "appeared_rate" | "net" | "net_rate";
type SortDir = "asc" | "desc";

const COLS: { key: SortKey; label: string; short: string; align?: "right" }[] = [
  { key: "species", label: "樹種", short: "樹種" },
  { key: "base", label: "在冊數", short: "在冊", align: "right" },
  { key: "disappeared", label: "離冊數", short: "離冊", align: "right" },
  { key: "removal_rate", label: "離冊率", short: "離冊%", align: "right" },
  { key: "appeared", label: "新增數", short: "新增", align: "right" },
  { key: "appeared_rate", label: "新增率", short: "新增%", align: "right" },
  { key: "net", label: "淨變化", short: "淨變化", align: "right" },
  { key: "net_rate", label: "淨變化率", short: "淨%", align: "right" },
];

interface Row extends SpeciesRow {
  appeared_rate: number;
  net_rate: number;
}

function enrich(r: SpeciesRow): Row {
  return {
    ...r,
    appeared_rate: r.base > 0 ? r.appeared / r.base : 0,
    net_rate: r.base > 0 ? r.net / r.base : 0,
  };
}

function getValue(r: Row, key: SortKey): number | string {
  switch (key) {
    case "species": return r.species;
    case "base": return r.base;
    case "disappeared": return r.disappeared;
    case "removal_rate": return r.removal_rate;
    case "appeared": return r.appeared;
    case "appeared_rate": return r.appeared_rate;
    case "net": return r.net;
    case "net_rate": return r.net_rate;
  }
}

export function SpeciesTable({ rows, minBase = 0 }: { rows: SpeciesRow[]; minBase?: number }) {
  const [sortKey, setSortKey] = useState<SortKey>("removal_rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const data = useMemo(() => {
    const enriched = rows
      .filter((r) => r.species !== "其他" && r.base >= minBase)
      .map(enrich);
    return enriched.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = va as number, nb = vb as number;
      return sortDir === "asc" ? na - nb : nb - na;
    });
  }, [rows, minBase, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "species" ? "asc" : "desc");
    }
  };

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="sp-table-wrap">
      <table className="sp-table">
        <thead>
          <tr>
            <th className="sp-rank">#</th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`sp-sortable${sortKey === c.key ? " active" : ""}${c.align === "right" ? " r" : ""}`}
                onClick={() => toggle(c.key)}
              >
                <span className="sp-th-full">{c.label}{arrow(c.key)}</span>
                <span className="sp-th-short">{c.short}{arrow(c.key)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.species}>
              <td className="sp-rank">{i + 1}</td>
              <td className="sp-name">{r.species}</td>
              <td className="r">{fmtInt(r.base)}</td>
              <td className="r gone">{fmtInt(r.disappeared)}</td>
              <td className="r gone">{fmtPct(r.removal_rate)}</td>
              <td className="r grow">{fmtInt(r.appeared)}</td>
              <td className="r grow">{fmtPct(r.appeared_rate)}</td>
              <td className={`r ${r.net < 0 ? "gone" : r.net > 0 ? "grow" : ""}`}>
                {fmtSigned(r.net)}
              </td>
              <td className={`r ${r.net_rate < 0 ? "gone" : r.net_rate > 0 ? "grow" : ""}`}>
                {r.net_rate >= 0 ? "+" : ""}{fmtPct(Math.abs(r.net_rate))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
