/**
 * Local date utilities — avoids UTC offset bug where toISOString()
 * returns yesterday's date for Israeli users (UTC+2/+3) after midnight.
 */

/**
 * Returns "YYYY-MM-DD" in the user's LOCAL timezone.
 * @param d - Date to format (defaults to now)
 */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns today's date string in "YYYY-MM-DD" local time */
export function todayLocalStr(): string {
  return localDateStr(new Date());
}

/** Returns yesterday's date string in "YYYY-MM-DD" local time */
export function yesterdayLocalStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateStr(d);
}

/** Returns the last day of a given month as "YYYY-MM-DD" in local time */
export function lastDayOfMonth(year: number, month: number): string {
  // month is 1-based (1=Jan, 12=Dec)
  const d = new Date(year, month, 0); // day 0 of next month = last day of this month
  return localDateStr(d);
}
