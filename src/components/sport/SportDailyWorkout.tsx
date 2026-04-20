import { CalendarCheck, Dumbbell, Clock, Play, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const TODAY_DAY = new Date().toLocaleDateString("he-IL", { weekday: "long" });

// Static placeholder — replace with real data from weekly plan hook when wired
const SAMPLE_TODAY_WORKOUT = {
  name: "אימון כוח עליון",
  category: "weights",
  duration: 55,
  exercises: [
    { name: "לחיצת חזה", sets: 4, reps: "8" },
    { name: "מתח", sets: 3, reps: "8" },
    { name: "כפיפות מרפק", sets: 3, reps: "12" },
    { name: "פלאנק", sets: 3, reps: "60 שנ'" },
  ],
};

export function SportDailyWorkout() {
  const [done, setDone] = useState(false);

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
        done ? "border-sport/40 bg-sport/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sport/10 flex items-center justify-center">
            <CalendarCheck className="h-4 w-4 text-sport" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">אימון היום</h3>
            <p className="text-xs text-muted-foreground">{TODAY_DAY}</p>
          </div>
        </div>
        {done && (
          <CheckCircle2 className="h-5 w-5 text-sport" />
        )}
      </div>

      <div className="rounded-xl bg-secondary/30 border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-3.5 w-3.5 text-sport" />
            <span className="text-xs font-bold">{SAMPLE_TODAY_WORKOUT.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{SAMPLE_TODAY_WORKOUT.duration} דק'</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-border pt-2">
          {SAMPLE_TODAY_WORKOUT.exercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between text-[11px]">
              <span className="font-medium">{ex.name}</span>
              <span className="text-muted-foreground">
                {ex.sets}×{ex.reps}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!done ? (
        <button
          onClick={() => setDone(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sport text-sport-foreground font-bold text-xs min-h-[40px] hover:bg-sport/90 transition-colors"
        >
          <Play className="h-3.5 w-3.5" />
          התחל אימון
        </button>
      ) : (
        <p className="text-center text-xs font-semibold text-sport">כל הכבוד — השלמת את אימון היום! 💪</p>
      )}
    </div>
  );
}
