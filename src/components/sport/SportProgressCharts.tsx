import { BarChart3 } from "lucide-react";
import { useWorkouts } from "@/hooks/use-sport-data";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";

export function SportProgressCharts() {
  const { data: workouts } = useWorkouts(100);

  // Build max weight per exercise per week
  const { exercises, chartData, selectedExercise } = useMemo(() => {
    if (!workouts?.length) return { exercises: [] as string[], chartData: [] as any[], selectedExercise: "" };

    // Collect all exercises with weight data
    const exerciseMap: Record<string, { date: string; weight: number }[]> = {};
    for (const w of workouts) {
      const exs = (w as any).workout_exercises || [];
      for (const ex of exs) {
        if (ex.weight_kg && ex.weight_kg > 0) {
          if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
          exerciseMap[ex.name].push({ date: (w as any).date, weight: Number(ex.weight_kg) });
        }
      }
    }

    const exercises = Object.keys(exerciseMap).sort();
    if (exercises.length === 0) return { exercises: [], chartData: [], selectedExercise: "" };

    // For each exercise, group by week and take max
    const selected = exercises[0];
    const entries = exerciseMap[selected] || [];
    
    // Group by week
    const weekMap: Record<string, number> = {};
    for (const e of entries) {
      const d = new Date(e.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekMap[key] = Math.max(weekMap[key] || 0, e.weight);
    }

    const chartData = Object.entries(weekMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, max]) => ({
        week: new Date(week).toLocaleDateString("he-IL", { day: "numeric", month: "short" }),
        maxWeight: max,
      }));

    return { exercises, chartData, selectedExercise: selected };
  }, [workouts]);

  if (!exercises.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">גרף התקדמות</h3>
        </div>
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={BarChart3}
            message="הוסף אימונים עם משקלים כדי לראות גרף התקדמות"
            colorClass="text-sport"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-sport" />
        <h3 className="text-sm font-bold">התקדמות — {selectedExercise}</h3>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[10px] text-muted-foreground mb-3">משקל מקסימלי לפי שבוע (ק״ג)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={35} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v} ק״ג`, "מקסימום"]}
              />
              <Line type="monotone" dataKey="maxWeight" stroke="hsl(145, 100%, 52%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(145, 100%, 52%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {exercises.length > 1 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1.5">תרגילים עם מעקב משקל:</p>
            <div className="flex flex-wrap gap-1">
              {exercises.map(ex => (
                <span key={ex} className="text-[10px] px-2 py-0.5 rounded-lg bg-sport/10 text-sport">{ex}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
