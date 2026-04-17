import { useState } from "react";
import { Sparkles, Loader2, Calendar, Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePersonalRecords, useAddWorkoutTemplate } from "@/hooks/use-sport-data";
import { toast } from "sonner";

interface PlannedExercise {
  name: string;
  sets: number;
  reps: string;
  weight_kg?: number;
  notes?: string;
}

interface PlannedWorkout {
  day: string;
  name: string;
  category: string;
  duration_minutes: number;
  exercises: PlannedExercise[];
}

interface AIWorkoutPlan {
  summary: string;
  workouts: PlannedWorkout[];
  tips: string[];
}

const GOALS = [
  { value: "כוח ומסת שריר", label: "כוח ומסה" },
  { value: "ירידה במשקל וקרדיו", label: "ירידה במשקל" },
  { value: "סבולת וריצה", label: "סבולת" },
  { value: "תחזוקה כללית", label: "תחזוקה" },
];

export function SportAIPlanner() {
  const { data: prs } = usePersonalRecords();
  const addTemplate = useAddWorkoutTemplate();
  const [goal, setGoal] = useState(GOALS[0].value);
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState("חדר כושר מלא");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIWorkoutPlan | null>(null);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke("workout-plan-ai", {
        body: {
          goal,
          daysPerWeek: days,
          equipment,
          constraints,
          recentPRs: (prs || []).slice(0, 8),
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setPlan(data.plan);
      toast.success("התוכנית מוכנה!");
    } catch (e: any) {
      console.error(e);
      toast.error("שגיאה: " + (e?.message || "לא ידוע"));
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = (w: PlannedWorkout) => {
    addTemplate.mutate(
      {
        name: w.name,
        category: w.category,
        estimated_duration_minutes: w.duration_minutes,
        exercises: w.exercises as any,
      },
      {
        onSuccess: () => toast.success(`"${w.name}" נשמר כתבנית`),
        onError: (e: any) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  return (
    <div className="rounded-2xl border border-sport/30 bg-gradient-to-br from-sport/5 to-transparent p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-sport/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-sport" />
        </div>
        <div>
          <h3 className="text-sm font-bold">תכנון אימונים שבועי AI</h3>
          <p className="text-[11px] text-muted-foreground">תוכנית מותאמת לפי השיאים שלך</p>
        </div>
      </div>

      {!plan && (
        <div className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">מטרה</label>
            <div className="grid grid-cols-2 gap-1.5">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`py-2 rounded-lg text-[11px] font-semibold transition-colors min-h-[36px] ${
                    goal === g.value ? "bg-sport/20 text-sport border border-sport/40" : "bg-secondary/30 text-muted-foreground border border-transparent"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">ימי אימון בשבוע: {days}</label>
            <input type="range" min={2} max={6} value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full accent-sport" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">ציוד</label>
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">מגבלות / רגישויות (אופציונלי)</label>
            <input
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="לדוגמה: כתף רגישה, ברכיים..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs placeholder:text-muted-foreground/50"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm min-h-[48px] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "AI מתכנן…" : "צור תוכנית AI"}
          </button>
        </div>
      )}

      {plan && (
        <div className="space-y-3">
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs leading-relaxed">{plan.summary}</p>
          </div>

          <div className="space-y-2">
            {plan.workouts.map((w, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Calendar className="h-3.5 w-3.5 text-sport shrink-0" />
                    <p className="text-xs font-bold truncate">
                      {w.day} · {w.name}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{w.duration_minutes} דק'</span>
                </div>
                <div className="space-y-1">
                  {w.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-center justify-between text-[11px] border-r-2 border-sport/30 pr-2">
                      <span className="font-medium truncate">{ex.name}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {ex.sets}×{ex.reps}
                        {ex.weight_kg ? ` @${ex.weight_kg}kg` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => saveAsTemplate(w)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sport/15 text-sport text-[11px] font-semibold hover:bg-sport/25"
                >
                  <Save className="h-3 w-3" /> שמור כתבנית
                </button>
              </div>
            ))}
          </div>

          {plan.tips.length > 0 && (
            <div className="rounded-xl bg-sport/5 border border-sport/20 p-3 space-y-1">
              <p className="text-[11px] font-bold text-sport mb-1">💡 טיפים</p>
              {plan.tips.map((t, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">• {t}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => setPlan(null)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary/40 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" /> צור תוכנית חדשה
          </button>
        </div>
      )}
    </div>
  );
}
