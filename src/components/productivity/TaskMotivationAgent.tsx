import { useMemo, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Trophy, Target, Loader2, MessageSquare } from "lucide-react";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useProfile } from "@/hooks/use-profile";
import { generateText, parseGeminiJson } from "@/lib/ai-service";
import { subDays } from "date-fns";
import { toast } from "sonner";

// ─── Pattern analysis engine (pure JS — instant, no API) ───────────────────────

interface InsightResult {
  type:        "success" | "warning" | "tip";
  icon:        "trophy" | "alert" | "target";
  headline:    string;
  body:        string;
  actionSteps?: string[];
}

function analyzeTaskPatterns(tasks: Task[], name: string | null, gender: string | null): InsightResult[] {
  const insights: InsightResult[] = [];
  const firstName  = name?.split(" ")[0] ?? null;
  const suffix     = gender === "נקבה" ? "ה" : "";
  const you        = firstName ?? (gender === "נקבה" ? "את" : "אתה");
  const youSuffix  = firstName ? firstName : you;

  const now        = new Date();
  const todayStr   = now.toISOString().split("T")[0];
  const weekAgo    = subDays(now, 7);

  const active       = tasks.filter((t) => t.status !== "done");
  const overdue      = active.filter((t) => t.due_date && new Date(t.due_date) < now);
  const highOverdue  = overdue.filter((t) => t.priority === "high");
  const doneToday    = tasks.filter((t) => t.completed_at?.startsWith(todayStr));
  const doneThisWeek = tasks.filter((t) => t.completed_at && new Date(t.completed_at) >= weekAgo);

  if (doneToday.length >= 3) {
    insights.push({
      type: "success", icon: "trophy",
      headline: `מעולה${suffix}, ${youSuffix}! 🏆`,
      body: `השלמת${suffix} ${doneToday.length} משימות היום. זה לא מובן מאליו — ${you} ממש מתקדם${suffix}.`,
    });
  } else if (doneThisWeek.length >= 5) {
    insights.push({
      type: "success", icon: "trophy",
      headline: `שבוע מוצלח, ${youSuffix}!`,
      body: `${doneThisWeek.length} משימות הושלמו השבוע. שמור${suffix} על הקצב — ${you} בדרך הנכונה.`,
    });
  }

  if (highOverdue.length > 0) {
    const names = highOverdue.slice(0, 2).map((t) => `"${t.title}"`).join(", ");
    const more  = highOverdue.length > 2 ? ` ועוד ${highOverdue.length - 2}` : "";
    insights.push({
      type: "warning", icon: "alert",
      headline: `${highOverdue.length} משימות דחופות מחכות`,
      body: `${names}${more} — אלה בעדיפות גבוהה ועברו את הדד-ליין. תטפל${suffix} בזה קודם.`,
      actionSteps: [
        `בחר${suffix} את המשימה הכי קלה מביניהן ותגמור${suffix} אותה עכשיו.`,
        `אם המשימה גדולה — חלק${suffix} אותה ל-3 צעדים קטנים.`,
        `עדכן${suffix} את הדד-ליין אם השתנו הנסיבות.`,
      ],
    });
  }

  const stuckInProgress = tasks.filter((t) => {
    if (t.status !== "in_progress") return false;
    const age = (now.getTime() - new Date(t.created_at).getTime()) / 86_400_000;
    return age > 3;
  });
  if (stuckInProgress.length > 0) {
    insights.push({
      type: "tip", icon: "target",
      headline: `${stuckInProgress.length} משימות תקועות מעל 3 ימים`,
      body: `"${stuckInProgress[0].title}"${stuckInProgress.length > 1 ? ` ועוד ${stuckInProgress.length - 1}` : ""} — משימה שתקועה היא בדרך כלל סימן שהיא גדולה מדי.`,
      actionSteps: [
        "שבור את המשימה לצעדים של 15–30 דקות.",
        "הגדר מה בדיוק 'הושלם' אומר עבור המשימה הזאת.",
        "אם יש חסימה חיצונית — תעד אותה ותדחה את הדד-ליין בצורה מודעת.",
      ],
    });
  }

  if (active.length > 7 && stuckInProgress.length === 0) {
    insights.push({
      type: "tip", icon: "target",
      headline: `${active.length} משימות — כדאי לתעדף`,
      body: `יש הרבה משימות פתוחות. בחר${suffix} 3 שיהיו ה-"Must" של היום ואל תסתכל${suffix} על השאר.`,
      actionSteps: [
        `זהה${suffix} 3 משימות שאם תגמור${suffix} אותן — היום היה שווה.`,
        `העבר${suffix} את השאר לתאריך מאוחר יותר.`,
      ],
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success", icon: "trophy",
      headline: "הכל על המסלול 👌",
      body: active.length === 0
        ? `אין משימות פתוחות — ${you} פנוי${suffix} לגמרי. תנצל${suffix} את הזמן הזה ותוסיף משהו חדש.`
        : `${active.length} משימות פעילות, אין באיחור. המשך${suffix} כך.`,
    });
  }

  return insights.slice(0, 3);
}

// ─── Gemini "Dugri" prompt builder ────────────────────────────────────────────

interface DugriResult {
  message:   string;
  highlight: string;
  action:    string;
}

function buildDugriPrompt(tasks: Task[], name: string | null, gender: string | null): string {
  const suffix  = gender === "נקבה" ? "ה" : "";
  const you     = name?.split(" ")[0] ?? (gender === "נקבה" ? "את" : "אתה");
  const now     = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const doneToday    = tasks.filter((t) => t.completed_at?.startsWith(todayStr)).length;
  const openHigh     = tasks.filter((t) => t.status !== "done" && t.priority === "high").length;
  const overdue      = tasks.filter((t) => t.status !== "done" && t.due_date && new Date(t.due_date) < now).length;
  const totalOpen    = tasks.filter((t) => t.status !== "done").length;
  const stuckTasks   = tasks.filter((t) => {
    if (t.status !== "in_progress") return false;
    return (now.getTime() - new Date(t.created_at).getTime()) / 86_400_000 > 3;
  }).map((t) => t.title).slice(0, 3);

  return `אתה מאמן אישי ישיר ואמיתי (סגנון "דוגרי" — כנה, לא מחמיא, אבל מעודד).
שמך הוא מאור, המשתמש${suffix} שלך שמ${suffix === "ה" ? "ה" : "ו"} ${you}.

נתוני משימות:
- הושלמו היום: ${doneToday}
- פתוחות בעדיפות גבוהה: ${openHigh}
- משימות שעברו דד-ליין: ${overdue}
- סך משימות פתוחות: ${totalOpen}
- תקועות >3 ימים: ${stuckTasks.join(", ") || "אין"}

ספק משוב דוגרי קצר ופרקטי בפורמט JSON בלבד:
{
  "message": "משפט ראשי — ישיר, לא מחמיא, אמיתי. עד 2 משפטים.",
  "highlight": "הדגשה אחת — מה הכי דחוף/חשוב עכשיו",
  "action": "פעולה ספציפית אחת לעשות בשעה הקרובה"
}
כתוב בעברית, בגוף שני${suffix}. ללא markdown, JSON תקין בלבד.`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const ICON_MAP   = { trophy: Trophy, alert: AlertTriangle, target: Target };
const TYPE_STYLES = {
  success: { border: "border-emerald-400/20", bg: "bg-emerald-400/5",  icon: "text-emerald-400"  },
  warning: { border: "border-destructive/20", bg: "bg-destructive/5",  icon: "text-destructive"  },
  tip:     { border: "border-primary/20",     bg: "bg-primary/5",      icon: "text-primary"      },
};

export function TaskMotivationAgent() {
  const { data: tasks = [] } = useTasks();
  const { data: profile }    = useProfile();
  const [openIdx, setOpenIdx]       = useState<number | null>(null);
  const [dugri,   setDugri]         = useState<DugriResult | null>(null);
  const [loadingDugri, setLoadingDugri] = useState(false);

  const insights = useMemo(
    () => analyzeTaskPatterns(tasks, profile?.full_name ?? null, profile?.gender ?? null),
    [tasks, profile]
  );

  const handleDugri = async () => {
    setLoadingDugri(true);
    try {
      const prompt = buildDugriPrompt(tasks, profile?.full_name ?? null, profile?.gender ?? null);
      const raw    = await generateText(prompt);
      const parsed = parseGeminiJson<DugriResult>(raw);
      setDugri(parsed);
    } catch (err) {
      console.error("Dugri AI error:", err);
      toast.error("Gemini לא זמין כרגע");
    } finally {
      setLoadingDugri(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>עוזר אישי</h3>
            <p className="text-[10px] text-muted-foreground">ניתוח דפוסים · AI דוגרי</p>
          </div>
        </div>

        {/* Dugri AI button */}
        <button
          onClick={handleDugri}
          disabled={loadingDugri}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {loadingDugri
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <MessageSquare className="h-3 w-3" />}
          {loadingDugri ? "חושב..." : "AI דוגרי"}
        </button>
      </div>

      {/* Dugri AI message */}
      {dugri && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-xs font-semibold leading-relaxed">{dugri.message}</p>
          <div className="flex items-start gap-1.5">
            <span className="text-primary text-[10px] font-bold shrink-0 mt-0.5">🎯</span>
            <p className="text-[11px] text-muted-foreground">{dugri.highlight}</p>
          </div>
          <div className="flex items-start gap-1.5 pt-1 border-t border-border/50">
            <span className="text-emerald-400 text-[10px] font-bold shrink-0 mt-0.5">→</span>
            <p className="text-[11px] font-medium">{dugri.action}</p>
          </div>
        </div>
      )}

      {/* Pattern-based insights */}
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const Icon   = ICON_MAP[insight.icon];
          const styles = TYPE_STYLES[insight.type];
          const isOpen = openIdx === i;

          return (
            <div key={i} className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}>
              <button
                className="w-full flex items-start gap-3 p-3 text-right"
                onClick={() => setOpenIdx(isOpen ? null : i)}
              >
                <Icon className={`h-4 w-4 ${styles.icon} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight">{insight.headline}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                    {insight.body}
                  </p>
                </div>
                {insight.actionSteps && (
                  isOpen
                    ? <ChevronUp   className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                )}
              </button>

              {isOpen && insight.actionSteps && (
                <div className="px-3 pb-3 pt-0 border-t border-border/50 space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground pt-2">צעדים קונקרטיים:</p>
                  {insight.actionSteps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <span className={`font-bold shrink-0 ${styles.icon}`}>{j + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
