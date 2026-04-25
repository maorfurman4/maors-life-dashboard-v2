import { Dumbbell, Trash2, Clock, Flame } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import { AddWorkoutDrawer } from "@/components/sport/AddWorkoutDrawer";
import { useWorkouts, useDeleteWorkout } from "@/hooks/use-sport-data";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  calisthenics: "קליסטניקס",
  running: "ריצה",
  combined: "משולב",
  weights: "משקולות",
};

export function SportWorkoutCards() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: workouts, isLoading } = useWorkouts(10);
  const deleteWorkout = useDeleteWorkout();

  const handleDelete = (id: string) => {
    deleteWorkout.mutate(id, {
      onSuccess: () => toast.success("אימון נמחק"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">אימונים אחרונים</h3>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && workouts && workouts.length > 0 ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {workouts.map((w) => (
            <div key={w.id} className="rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-sport/20 border border-sport/20 flex items-center justify-center">
                    <Dumbbell className="h-3.5 w-3.5 text-sport" />
                  </div>
                  <span className="text-sm font-bold text-white">{CATEGORY_LABELS[w.category] || w.category}</span>
                  <span className="text-[10px] text-white/40">{new Date(w.date).toLocaleDateString("he-IL")}</span>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="h-7 w-7 rounded-xl flex items-center justify-center bg-white/5 hover:bg-red-500/20 border border-white/5 transition-colors"
                >
                  <Trash2 className="h-3 w-3 text-white/40 hover:text-red-400" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-white/50">
                {w.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{w.duration_minutes} דק׳
                  </span>
                )}
                {w.calories_burned && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />{w.calories_burned} קל׳
                  </span>
                )}
              </div>

              {w.workout_exercises && w.workout_exercises.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {w.workout_exercises.map((ex: any) => (
                    <span key={ex.id} className="px-2 py-0.5 rounded-lg bg-sport/15 border border-sport/15 text-[10px] text-sport font-semibold">
                      {ex.name} {ex.sets}×{ex.reps}{ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ""}
                    </span>
                  ))}
                </div>
              )}

              {w.workout_runs && w.workout_runs.length > 0 && (
                <div className="flex gap-3 text-[11px]">
                  {w.workout_runs.map((r: any) => (
                    <span key={r.id} className="text-sport font-semibold">
                      {r.distance_km && `${r.distance_km} ק״מ`}
                      {r.pace_per_km && ` | ${r.pace_per_km} דק׳/ק״מ`}
                    </span>
                  ))}
                </div>
              )}

              {w.notes && <p className="text-[10px] text-white/40 border-t border-white/5 pt-1">{w.notes}</p>}
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/10 overflow-hidden">
          <EmptyState
            icon={Dumbbell}
            message="אין אימונים עדיין"
            actionLabel="הוסף אימון ראשון"
            onAction={() => setDrawerOpen(true)}
            colorClass="text-sport"
          />
        </div>
      ) : null}

      <AddWorkoutDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
