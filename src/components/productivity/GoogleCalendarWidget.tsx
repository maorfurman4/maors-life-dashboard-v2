import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Clock, LogOut, RefreshCw, Sparkles } from "lucide-react";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

interface FreeSlot {
  start: Date;
  end: Date;
  durationMin: number;
  score: number;
  suggestedTasks: Task[];
  cotReason: string;
}

// ─── COT Free-Slot Detection Algorithm ────────────────────────────────────────

const WORK_START_HOUR = 8;
const WORK_END_HOUR   = 22;
const MIN_SLOT_MIN    = 30;

function scoreSlot(start: Date, durationMin: number): number {
  const h        = start.getHours();
  const timePref = h < 12 ? 3 : h < 17 ? 2 : 1;       // morning > afternoon > evening
  const durPref  = Math.min(durationMin / 60, 3);       // cap at 3 hrs weight
  return timePref + durPref;
}

function estimateTaskDuration(task: Task): number {
  return task.priority === "high" ? 60 : task.priority === "medium" ? 45 : 30;
}

function detectFreeSlots(events: CalEvent[], tasks: Task[], today: Date): FreeSlot[] {
  const workStart = new Date(today); workStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const workEnd   = new Date(today); workEnd.setHours(WORK_END_HOUR,   0, 0, 0);

  // COT step 1 — sort events; clip to work window; drop zero-length
  const sorted = events
    .map((e) => ({
      ...e,
      start: new Date(Math.max(e.start.getTime(), workStart.getTime())),
      end:   new Date(Math.min(e.end.getTime(),   workEnd.getTime())),
    }))
    .filter((e) => e.start < e.end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // COT step 2 — merge overlapping events to get busy intervals
  const busy: { start: Date; end: Date }[] = [];
  for (const e of sorted) {
    const last = busy[busy.length - 1];
    if (last && e.start <= last.end) {
      last.end = e.end.getTime() > last.end.getTime() ? e.end : last.end;
    } else {
      busy.push({ start: e.start, end: e.end });
    }
  }

  // COT step 3 — extract gaps between busy intervals (and at day edges)
  const gaps: { start: Date; end: Date }[] = [];
  let cursor = workStart;
  for (const b of busy) {
    if (b.start.getTime() > cursor.getTime()) gaps.push({ start: cursor, end: b.start });
    cursor = b.end.getTime() > cursor.getTime() ? b.end : cursor;
  }
  if (cursor.getTime() < workEnd.getTime()) gaps.push({ start: cursor, end: workEnd });

  // COT step 4 — filter gaps below minimum and score
  const pending = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 1) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 1));

  return gaps
    .filter((g) => (g.end.getTime() - g.start.getTime()) / 60_000 >= MIN_SLOT_MIN)
    .map((gap): FreeSlot => {
      const durationMin = (gap.end.getTime() - gap.start.getTime()) / 60_000;
      const score       = scoreSlot(gap.start, durationMin);
      const h           = gap.start.getHours();
      const timeLabel   = h < 12 ? "בוקר" : h < 17 ? "אחרי הצהריים" : "ערב";

      // COT step 5 — greedily fit pending tasks into slot
      let remaining = durationMin;
      const matched: Task[] = [];
      for (const t of pending) {
        const est = estimateTaskDuration(t);
        if (est <= remaining) { matched.push(t); remaining -= est; }
      }

      const cotReason = [
        `פער ${Math.round(durationMin)} דקות בשעות ה${timeLabel}`,
        score >= 4 ? "⭐ מומלץ מאוד — זמן ריכוז מיטבי" : score >= 3 ? "✓ מתאים לעבודה ממוקדת" : "מתאים למשימות קצרות",
        matched.length > 0 ? `מתאים ל-${matched.length} משימות (נותרות ${Math.round(remaining)} דק')` : "אין משימות מתאימות לגודל החלון",
      ].join(" · ");

      return { start: gap.start, end: gap.end, durationMin, score, suggestedTasks: matched, cotReason };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Google OAuth helpers ─────────────────────────────────────────────────────
// TODO: set VITE_GOOGLE_CLIENT_ID in .env when Google Cloud Console is ready

const GOOGLE_CLIENT_ID   = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? "";
const GCAL_SCOPE         = "https://www.googleapis.com/auth/calendar.readonly";
const TOKEN_STORAGE_KEY  = "google_calendar_token";
const EXPIRY_STORAGE_KEY = "google_calendar_token_expiry";

function getStoredToken(): string | null {
  const expiry = localStorage.getItem(EXPIRY_STORAGE_KEY);
  if (!expiry || Date.now() > Number(expiry)) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function storeToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(EXPIRY_STORAGE_KEY, String(Date.now() + expiresIn * 1000));
}

function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(EXPIRY_STORAGE_KEY);
}

function launchOAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("VITE_GOOGLE_CLIENT_ID not configured"));
      return;
    }
    const redirect = `${window.location.origin}/oauth/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=${encodeURIComponent(GCAL_SCOPE)}`;
    const popup = window.open(url, "gcal-oauth", "width=500,height=650");
    if (!popup) { reject(new Error("Popup blocked")); return; }

    const timer = setInterval(() => {
      try {
        const params  = new URLSearchParams(popup.location.hash.slice(1));
        const token   = params.get("access_token");
        const expiry  = params.get("expires_in");
        if (token) {
          clearInterval(timer);
          popup.close();
          storeToken(token, Number(expiry) || 3600);
          resolve(token);
        }
      } catch { /* cross-origin: not ready yet */ }
      if (popup.closed) { clearInterval(timer); reject(new Error("Popup closed")); }
    }, 500);
  });
}

async function fetchTodayEvents(token: string): Promise<CalEvent[]> {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const url   = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=20`;
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { if (res.status === 401) clearToken(); throw new Error(`Google API error ${res.status}`); }
  const data  = await res.json();
  return (data.items || [])
    .filter((e: any) => e.start?.dateTime)
    .map((e: any): CalEvent => ({
      id:    e.id,
      title: e.summary || "אירוע",
      start: new Date(e.start.dateTime),
      end:   new Date(e.end.dateTime),
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────

const fmtTime = (d: Date) => d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

export function GoogleCalendarWidget() {
  const { data: tasks = [] } = useTasks();
  const [token, setToken]         = useState<string | null>(() => getStoredToken());
  const [events, setEvents]       = useState<CalEvent[]>([]);
  const [loading, setLoading]     = useState(false);
  const [openSlot, setOpenSlot]   = useState<number | null>(null);

  const freeSlots = useMemo(
    () => (token ? detectFreeSlots(events, tasks, new Date()) : []),
    [events, tasks, token]
  );

  const fetchEvents = useCallback(async (t: string) => {
    setLoading(true);
    try {
      setEvents(await fetchTodayEvents(t));
    } catch (e: any) {
      toast.error(e.message || "שגיאה בטעינת יומן");
      if (!getStoredToken()) setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) fetchEvents(token); }, [token, fetchEvents]);

  const handleConnect = async () => {
    try {
      const t = await launchOAuth();
      setToken(t);
      toast.success("גוגל קלנדר חובר בהצלחה");
    } catch (e: any) {
      toast.error(e.message === "VITE_GOOGLE_CLIENT_ID not configured"
        ? "הגדר VITE_GOOGLE_CLIENT_ID ב-.env"
        : "שגיאה בחיבור: " + e.message);
    }
  };

  const handleDisconnect = () => {
    clearToken(); setToken(null); setEvents([]);
    toast.success("גוגל קלנדר נותק");
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">גוגל קלנדר</h3>
        </div>
        {token && (
          <div className="flex items-center gap-1">
            <button onClick={() => fetchEvents(token)} disabled={loading}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40">
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleDisconnect}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors">
              <LogOut className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        )}
      </div>

      {!token ? (
        <div className="text-center py-4 space-y-3">
          <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-xs text-muted-foreground">
            חבר את גוגל קלנדר לזיהוי אוטומטי של חלונות זמן פנויים ותזמון משימות
          </p>
          <button onClick={handleConnect}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl border border-border bg-secondary/30 text-sm font-semibold hover:bg-secondary/60 transition-colors">
            <Calendar className="h-4 w-4 text-primary" />
            חבר גוגל קלנדר
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Events */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-10 rounded-xl bg-secondary/30 animate-pulse" />)}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground">אירועים היום ({events.length})</p>
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-2 rounded-lg bg-secondary/20 px-2.5 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                  <span className="text-xs font-medium flex-1 truncate">{e.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0" dir="ltr">
                    {fmtTime(e.start)}–{fmtTime(e.end)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">אין אירועים מתוזמנים היום</p>
          )}

          {/* Free slots */}
          {freeSlots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-semibold text-primary">חלונות זמן פנויים ({freeSlots.length})</p>
              </div>
              {freeSlots.map((slot, i) => {
                const isOpen = openSlot === i;
                return (
                  <div key={i} className={`rounded-xl border overflow-hidden ${slot.score >= 4 ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/10"}`}>
                    <button onClick={() => setOpenSlot(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold" dir="ltr">{fmtTime(slot.start)} – {fmtTime(slot.end)}</span>
                        <span className="text-[10px] text-muted-foreground">{Math.round(slot.durationMin)} דק'</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {slot.suggestedTasks.length > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                            {slot.suggestedTasks.length} משימות
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 border-t border-border/50 pt-2 space-y-2">
                        <p className="text-[10px] text-muted-foreground italic">{slot.cotReason}</p>
                        {slot.suggestedTasks.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground">משימות מומלצות:</p>
                            {slot.suggestedTasks.slice(0, 3).map((t) => (
                              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 border border-border">
                                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.priority === "high" ? "bg-destructive" : t.priority === "low" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                                <span className="text-xs flex-1 truncate">{t.title}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0">~{estimateTaskDuration(t)} דק'</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">אין משימות פתוחות לחלון הזה</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
