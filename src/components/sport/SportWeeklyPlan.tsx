import { CalendarDays, Sparkles, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAddWorkoutTemplate } from "@/hooks/use-sport-data";
import { EXERCISE_LIBRARY, MUSCLE_LABELS, type LibraryExercise } from "@/lib/exercise-library";

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

type Goal = "strength" | "endurance" | "balanced" | "weight_loss";
type Frequency = 3 | 4 | 5;

const GOAL_LABELS: Record<Goal, string> = {
  strength: "כוח",
  endurance: "סיבולת",
  balanced: "מאוזן",
  weight_loss: "ירידה במשקל",
};

interface PlannedDay {
  day: string;
  focus: string;
  exercises: LibraryExercise[];
  estimatedMinutes: number;
  category: string;
}

function buildWeekPlan(goal: Goal, frequency: Frequency, shoulderSafe: boolean): PlannedDay[] {
  const safe = (g: keyof typeof MUSCLE_LABELS, count: number, difficulty?: ("beginner" | "intermediate" | "advanced")[]) =>
    EXERCISE_LIBRARY
      .filter((e) => e.muscleGroups.includes(g) && (!shoulderSafe || e.shoulderSafe))
      .filter((e) => !difficulty || difficulty.includes(e.difficulty))
      .slice(0, count);

  // Templates per frequency
  const templates: Record<Frequency, { day: string; focus: string; muscles: (keyof typeof MUSCLE_LABELS)[]; category: string }[]> = {
    3: [
      { day: "ראשון", focus: "פלג גוף עליון", muscles: ["chest", "back", "biceps", "triceps"], category: "calisthenics" },
      { day: "שלישי", focus: "פלג גוף תחתון + ליבה", muscles: ["legs", "glutes", "core"], category: "calisthenics" },
      { day: "חמישי", focus: "אימון משולב + אירובי", muscles: ["fullbody", "cardio"], category: "combined" },
    ],
    4: [
      { day: "ראשון", focus: "חזה + גב", muscles: ["chest", "back"], category: "calisthenics" },
      { day: "שלישי", focus: "רגליים + ישבן", muscles: ["legs", "glutes"], category: "calisthenics" },
      { day: "חמישי", focus: "ידיים + ליבה", muscles: ["biceps", "triceps", "core"], category: "weights" },
      { day: "שבת", focus: "אירובי + משולב", muscles: ["cardio", "fullbody"], category: "running" },
    ],
    5: [
      { day: "ראשון", focus: "חזה + יד אחורית", muscles: ["chest", "triceps"], category: "calisthenics" },
      { day: "שני", focus: "גב + יד קדמית", muscles: ["back", "biceps"], category: "calisthenics" },
      { day: "שלישי", focus: "רגליים + ישבן", muscles: ["legs", "glutes"], category: "calisthenics" },
      { day: "חמישי", focus: "ליבה + פונקציונלי", muscles: ["core", "fullbody"], category: "combined" },
      { day: "שישי", focus: "אירובי", muscles: ["cardio"], category: "running" },
    ],
  };

  const goalDifficulty: Record<Goal, ("beginner" | "intermediate" | "advanced")[]> = {
    strength: ["intermediate", "advanced"],
    endurance: ["beginner", "intermediate"],
    balanced: ["beginner", "intermediate", "advanced"],
    weight_loss: ["beginner", "intermediate"],
  };

  return templates[frequency].map((t) => {
    const exercises: LibraryExercise[] = [];
    const seen = new Set<string>();
    t.muscles.forEach((m) => {
      const found = safe(m, goal === "strength" ? 2 : 3, goalDifficulty[goal]);
      found.forEach((ex) => {
        if (!seen.has(ex.id)) {
          seen.add(ex.id);
          exercises.push(ex);
        }
      });
    });
    const minutes = exercises.reduce((sum, e) => sum + (e.defaultSets * (e.restSeconds + 30)) / 60, 0);
    return {
      day: t.day,
      focus: t.focus,
      exercises: exercises.slice(0, 6),
      estimatedMinutes: Math.round(minutes),
      category: t.category,
    };
  });
}

export function SportWeeklyPlan() {
  const [goal, setGoal] = useState<Goal>("balanced");
  const [frequency, setFrequency] = useState<Frequency>(4);
  const [shoulderSafe, setShoulderSafe] = useState(true);
  const addTemplate = useAddWorkoutTemplate();

  const plan = useMemo(() => buildWeekPlan(goal, frequency, shoulderSafe), [goal, frequency, shoulderSafe]);

  const saveDayAsTemplate = (day: PlannedDay) => {
    addTemplate.mutate(
      {
        name: `${day.day} — ${day.focus}`,
        category: day.category,
        exercises: day.exercises.map((ex) => ({ name: ex.name, sets: ex.defaultSets, reps: ex.defaultReps })),
        estimated_duration_minutes: day.estimatedMinutes,
      },
      {
        onSuccess: () => toast.success(`תבנית "${day.day}" נשמרה`),
        onError: (err) => toast.error("שגיאה: " + err.message),
      }
    );
  };

  const saveAllAsTemplates = () => {
    plan.forEach((day) => saveDayAsTemplate(day));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">תכנית אימונים שבועית</h3>
        </div>
        <button
          onClick={saveAllAsTemplates}
          disabled={addTemplate.isPending}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sport/10 text-sport text-[11px] font-semibold hover:bg-sport/20 min-h-[32px] disabled:opacity-50"
        >
          <Save className="h-3 w-3" /> שמור הכל
        </button>
      </div>

      {/* Goal selector */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">מטרה</p>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors min-h-[36px] ${
                goal === g ? "bg-sport/20 text-sport border border-sport/30" : "bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              {GOAL_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">תדירות שבועית</p>
        <div className="grid grid-cols-3 gap-1.5">
          {([3, 4, 5] as Frequency[]).map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                frequency === f ? "bg-sport/20 text-sport border border-sport/30" : "bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              {f} ימים
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShoulderSafe(!shoulderSafe)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium ${
          shoulderSafe ? "bg-emerald-400/10 text-emerald-400" : "bg-secondary/30 text-muted-foreground"
        }`}
      >
        <Sparkles className="h-3 w-3" /> בטוח לכתפיים {shoulderSafe ? "✓" : ""}
      </button>

      {/* Plan */}
      <div className="space-y-2">
        {plan.map((day) => (
          <div key={day.day} className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{day.day}</p>
                <p className="text-[10px] text-sport">{day.focus}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">~{day.estimatedMinutes} דק׳</span>
                <button
                  onClick={() => saveDayAsTemplate(day)}
                  className="h-7 w-7 rounded-lg bg-sport/10 text-sport flex items-center justify-center hover:bg-sport/20"
                >
                  <Save className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {day.exercises.map((ex) => (
                <span key={ex.id} className="px-2 py-0.5 rounded bg-secondary/40 text-[10px]">
                  {ex.name} <span className="text-muted-foreground">{ex.defaultSets}×{ex.defaultReps}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center text-muted-foreground">
        💡 לחץ על 🗂️ לשמור יום כתבנית אימון
      </p>
    </div>
  );
}
