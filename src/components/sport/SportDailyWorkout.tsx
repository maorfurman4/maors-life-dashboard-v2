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
    { name: "מתח",        sets: 3, reps: "8" },
    { name: "כפיפות מרפק", sets: 3, reps: "12" },
    { name: "פלאנק",      sets: 3, reps: "60 שנ'" },
  ],
};

export function SportDailyWorkout() {
  const [done, setDone] = useState(false);

  return (
    <div className={`rounded-3xl backdrop-blur-md border p-4 space-y-3 transition-all ${
      done
        ? "bg-sport/15 border-sport/30"
        : "bg-white/8 border-white/10"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-sport/20 border border-sport/25 flex items-center justify-center">
            <CalendarCheck className="h-4 w-4 text-sport" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">אימון היום</h3>
            <p className="text-xs text-white/40">{TODAY_DAY}</p>
          </div>
        </div>
        {done && <CheckCircle2 className="h-5 w-5 text-sport" />}
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/8 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-3.5 w-3.5 text-sport" />
            <span className="text-xs font-bold text-white">{SAMPLE_TODAY_WORKOUT.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/50">
            <Clock className="h-3 w-3" />
            <span>{SAMPLE_TODAY_WORKOUT.duration} דק'</span>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-white/8 pt-2">
          {SAMPLE_TODAY_WORKOUT.exercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-white/80">{ex.name}</span>
              <span className="text-white/40">{ex.sets}×{ex.reps}</span>
            </div>
          ))}
        </div>
      </div>

      {!done ? (
        <button
          onClick={() => setDone(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sport text-sport-foreground font-bold text-sm min-h-[44px] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,255,135,0.3)] active:scale-[0.98]"
        >
          <Play className="h-4 w-4" />
          התחל אימון
        </button>
      ) : (
        <p className="text-center text-sm font-bold text-sport py-1">כל הכבוד — השלמת את אימון היום! 💪</p>
      )}
    </div>
  );
}
