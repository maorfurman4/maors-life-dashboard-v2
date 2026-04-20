// Prevents automated actions during Shabbat (Friday 14:00 → Saturday night 22:00)
export function isShabbat(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const hour = now.getHours();

  if (day === 5 && hour >= 14) return true;
  if (day === 6 && hour < 22) return true;
  return false;
}

export function assertNotShabbat(action = "פעולה אוטומטית"): void {
  if (isShabbat()) {
    throw new Error(`${action} אינה זמינה בשבת (שישי 14:00 — מוצ"ש 22:00)`);
  }
}
