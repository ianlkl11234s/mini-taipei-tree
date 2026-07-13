/** 千分位整數。 */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** 帶正負號整數（淨變化用）。 */
export function fmtSigned(n: number): string {
  const s = fmtInt(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s;
}

/** 百分比（帶 1 位小數）。 */
export function fmtPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 截掉時間、只留日期；空值 / 佔位日回破折號。 */
export function fmtDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = raw.slice(0, 10);
  if (!d || d === "1900-01-01") return "—";
  return d;
}
