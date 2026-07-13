import { useMemo, useState } from "react";
import { fmtInt, fmtPct, fmtSigned } from "../lib/format";

interface DistRow {
  dist: string;
  base: number;
  disappeared: number;
  appeared: number;
  net: number;
  removal_rate: number;
  removal_rate_street: number;
}

type SortKey = "dist" | "base" | "disappeared" | "removal_rate" | "appeared" | "appeared_rate" | "net" | "net_rate";
type SortDir = "asc" | "desc";

interface Enriched extends DistRow {
  appeared_rate: number;
  net_rate: number;
}

const COLS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "dist", label: "行政區" },
  { key: "base", label: "在冊數", align: "right" },
  { key: "disappeared", label: "離冊數", align: "right" },
  { key: "removal_rate", label: "離冊率", align: "right" },
  { key: "appeared", label: "新增數", align: "right" },
  { key: "appeared_rate", label: "新增率", align: "right" },
  { key: "net", label: "淨變化", align: "right" },
  { key: "net_rate", label: "淨變化率", align: "right" },
];

function getValue(r: Enriched, key: SortKey): number | string {
  switch (key) {
    case "dist": return r.dist;
    case "base": return r.base;
    case "disappeared": return r.disappeared;
    case "removal_rate": return r.removal_rate;
    case "appeared": return r.appeared;
    case "appeared_rate": return r.appeared_rate;
    case "net": return r.net;
    case "net_rate": return r.net_rate;
  }
}

export function DistrictTable({ rows }: { rows: DistRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("removal_rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const data = useMemo(() => {
    const enriched: Enriched[] = rows.map((r) => ({
      ...r,
      appeared_rate: r.base > 0 ? r.appeared / r.base : 0,
      net_rate: r.base > 0 ? r.net / r.base : 0,
    }));
    return enriched.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string")
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [rows, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "dist" ? "asc" : "desc"); }
  };

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

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
                {c.label}{arrow(c.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.dist}>
              <td className="sp-rank">{i + 1}</td>
              <td className="sp-name">{r.dist}</td>
              <td className="r">{fmtInt(r.base)}</td>
              <td className="r gone">{fmtInt(r.disappeared)}</td>
              <td className="r gone">{fmtPct(r.removal_rate)}</td>
              <td className="r grow">{fmtInt(r.appeared)}</td>
              <td className="r grow">{fmtPct(r.appeared_rate)}</td>
              <td className={`r ${r.net < 0 ? "gone" : r.net > 0 ? "grow" : ""}`}>{fmtSigned(r.net)}</td>
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
