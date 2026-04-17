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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground">אימונים אחרונים</h3>
      </div>

      {isLoading && <div className="text-xs text-muted-foreground text-center py-4">טוען...</div>}

      {!isLoading && workouts && workouts.length > 0 ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {workouts.map((w) => (
            <div key={w.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-sport" />
                  <span className="text-sm font-bold">{CATEGORY_LABELS[w.category] || w.category}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(w.date).toLocaleDateString("he-IL")}</span>
                </div>
                <button onClick={() => handleDelete(w.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {w.duration_minutes && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{w.duration_minutes} דק׳</span>
                )}
                {w.calories_burned && (
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3" />{w.calories_burned} קל׳</span>
                )}
              </div>
              {/* Exercises */}
              {w.workout_exercises && w.workout_exercises.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {w.workout_exercises.map((ex: any) => (
                    <span key={ex.id} className="px-2 py-0.5 rounded bg-sport/10 text-[10px] text-sport font-medium">
                      {ex.name} {ex.sets}×{ex.reps}{ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ""}
                    </span>
                  ))}
                </div>
              )}
              {/* Run data */}
              {w.workout_runs && w.workout_runs.length > 0 && (
                <div className="flex gap-3 text-[11px]">
                  {w.workout_runs.map((r: any) => (
                    <span key={r.id} className="text-sport">
                      {r.distance_km && `${r.distance_km} ק״מ`}
                      {r.pace_per_km && ` | ${r.pace_per_km} דק׳/ק״מ`}
                    </span>
                  ))}
                </div>
              )}
              {w.notes && <p className="text-[10px] text-muted-foreground">{w.notes}</p>}
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={Dumbbell} message="אין אימונים עדיין" actionLabel="הוסף אימון ראשון"
            onAction={() => setDrawerOpen(true)} colorClass="text-sport" />
        </div>
      ) : null}

      <AddWorkoutDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
