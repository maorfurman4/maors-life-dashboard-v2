const _ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const _ilsPrecise = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const _ilsCompact = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "1,200 ₪" — RTL shekel placement via he-IL locale */
export function formatCurrency(n: number): string {
  return _ils.format(n);
}

/** "1,200.50 ₪" */
export function formatCurrencyPrecise(n: number): string {
  return _ilsPrecise.format(n);
}

/** "1.2K ₪" */
export function formatCompactCurrency(n: number): string {
  return _ilsCompact.format(n);
}

/** Numeric only, no symbol: "1,200" */
export function formatAmount(n: number): string {
  return n.toLocaleString("he-IL", { maximumFractionDigits: 0 });
}
