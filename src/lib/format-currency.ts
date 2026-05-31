/**
 * Finance number formatting utilities — consistent across the entire Finance module
 */

/** Full format: ₪1,200 (for detail views and transaction lists) */
export const fmtFull = (n: number): string =>
  n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

/** Compact format: ₪1.2K / ₪52K / ₪1.5M (for dashboard cards where space is tight) */
export const fmtCompact = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₪${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)    return `${sign}₪${(abs / 1_000).toFixed(0)}K`;
  if (abs >= 1_000)     return `${sign}₪${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₪${abs.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
};

/** Percent format: 12.5% */
export const fmtPct = (n: number, decimals = 1): string =>
  `${n.toFixed(decimals)}%`;

/** Signed format: +₪500 / -₪200 */
export const fmtSigned = (n: number): string => {
  const prefix = n >= 0 ? "+" : "-";
  return `${prefix}₪${Math.abs(n).toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
};
