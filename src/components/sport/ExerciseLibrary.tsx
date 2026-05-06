import { useMemo, useState } from "react";
import { Search, Library, ShieldCheck, Timer, Youtube } from "lucide-react";
import { EXERCISE_LIBRARY, MUSCLE_LABELS, searchExercises, type MuscleGroup, type LibraryExercise } from "@/lib/exercise-library";
import { RestTimer } from "@/components/sport/RestTimer";

const MUSCLE_OPTIONS: (MuscleGroup | "all")[] = ["all", "chest", "back", "legs", "core", "biceps", "triceps", "glutes", "shoulders", "fullbody"];

const DIFFICULTY_LABEL = { beginner: "מתחיל", intermediate: "בינוני", advanced: "מתקדם" } as const;
const DIFFICULTY_COLOR = {
  beginner: "bg-emerald-400/15 text-emerald-400",
  intermediate: "bg-amber-400/15 text-amber-400",
  advanced: "bg-rose-400/15 text-rose-400",
} as const;

type WorkoutType = "weights" | "calisthenics";

const WORKOUT_TYPES: { key: WorkoutType; label: string }[] = [
  { key: "weights", label: "🏋️ חדר כושר" },
  { key: "calisthenics", label: "🤸 קלסטניקס" },
];

export function ExerciseLibrary() {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("weights");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [shoulderSafe, setShoulderSafe] = useState(true);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);

  const results = useMemo(
    () =>
      searchExercises(query, muscle === "all" ? undefined : muscle, shoulderSafe).filter(
        (ex) => ex.category === workoutType || ex.category === "combined"
      ),
    [query, muscle, shoulderSafe, workoutType]
  );

  const startTimer = (sec: number) => {
    setTimerSeconds(sec);
    setTimerOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">ספריית תרגילים</h3>
          <span className="text-[10px] text-muted-foreground">({EXERCISE_LIBRARY.length})</span>
        </div>
        <button
          onClick={() => startTimer(60)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sport/10 text-sport text-[11px] font-semibold hover:bg-sport/20 min-h-[32px]"
        >
          <Timer className="h-3 w-3" /> טיימר
        </button>
      </div>

      {/* Workout type tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/30">
        {WORKOUT_TYPES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setWorkoutType(key); setMuscle("all"); setQuery(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              workoutType === key ? "bg-sport text-sport-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש תרגיל או קבוצת שריר..."
          className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]"
        />
      </div>

      {/* Muscle filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MUSCLE_OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors min-h-[32px] ${
              muscle === m ? "bg-sport/20 text-sport border border-sport/30" : "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground"
            }`}
          >
            {m === "all" ? "הכל" : MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Shoulder-safe toggle */}
      <button
        onClick={() => setShoulderSafe(!shoulderSafe)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
          shoulderSafe ? "bg-emerald-400/10 text-emerald-400" : "bg-secondary/30 text-muted-foreground"
        }`}
      >
        <ShieldCheck className="h-3 w-3" />
        רק תרגילים בטוחים לכתפיים {shoulderSafe ? "✓" : ""}
      </button>

      {/* Results */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">לא נמצאו תרגילים</div>
        ) : (
          results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="w-full text-right rounded-xl border border-border bg-card p-3 hover:border-sport/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground" dir="ltr">{ex.nameEn}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold ${DIFFICULTY_COLOR[ex.difficulty]}`}>
                  {DIFFICULTY_LABEL[ex.difficulty]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {ex.muscleGroups.slice(0, 3).map((m) => (
                  <span key={m} className="px-1.5 py-0.5 rounded bg-secondary/40 text-[9px] text-muted-foreground">
                    {MUSCLE_LABELS[m]}
                  </span>
                ))}
                {ex.shoulderSafe && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <ShieldCheck className="h-2.5 w-2.5" /> כתף
                  </span>
                )}
                {ex.youtube_link && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] text-red-400 flex items-center gap-0.5">
                    <Youtube className="h-2.5 w-2.5" /> סרטון
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{ex.defaultSets} × {ex.defaultReps}</span>
                <span>מנוחה: {ex.restSeconds}s</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-card border border-border p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-bold">{selected.name}</h3>
              <p className="text-xs text-muted-foreground" dir="ltr">{selected.nameEn}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-secondary/30 p-2.5">
                <p className="text-[10px] text-muted-foreground">סטים</p>
                <p className="text-lg font-bold text-sport">{selected.defaultSets}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-2.5">
                <p className="text-[10px] text-muted-foreground">חזרות</p>
                <p className="text-lg font-bold text-sport">{selected.defaultReps}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-2.5">
                <p className="text-[10px] text-muted-foreground">מנוחה</p>
                <p className="text-lg font-bold text-sport">{selected.restSeconds}s</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">קבוצות שריר</p>
              <div className="flex flex-wrap gap-1">
                {selected.muscleGroups.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded bg-sport/10 text-[10px] text-sport font-medium">{MUSCLE_LABELS[m]}</span>
                ))}
              </div>
            </div>
            {selected.equipment.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">ציוד</p>
                <div className="flex flex-wrap gap-1">
                  {selected.equipment.map((e) => (
                    <span key={e} className="px-2 py-0.5 rounded bg-secondary/40 text-[10px]">{e}</span>
                  ))}
                </div>
              </div>
            )}
            {selected.description && <p className="text-xs text-muted-foreground">{selected.description}</p>}
            <button
              onClick={() => { setSelected(null); startTimer(selected.restSeconds); }}
              className="w-full py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Timer className="h-4 w-4" /> התחל טיימר מנוחה
            </button>
            {selected.youtube_link && (
              <a
                href={selected.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-red-500/15 text-red-400 font-bold text-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Youtube className="h-4 w-4" /> צפה בסרטון הדרכה
              </a>
            )}
          </div>
        </div>
      )}

      <RestTimer open={timerOpen} onClose={() => setTimerOpen(false)} defaultSeconds={timerSeconds} />
    </div>
  );
}
