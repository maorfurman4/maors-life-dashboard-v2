import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTasks } from "@/hooks/use-tasks";
import { format, subDays } from "date-fns";
import { he } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

export function ProgressChart() {
  const { data: tasks = [], isLoading } = useTasks();

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const completed = tasks.filter(
      (t) => t.completed_at?.startsWith(dateStr)
    ).length;
    return {
      day: format(date, "EEE", { locale: he }),
      completed,
    };
  });

  const totalThisWeek = days.reduce((sum, d) => sum + d.completed, 0);
  const totalDone = tasks.filter((t) => t.status === "done").length;
  const completionRate =
    tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  const maxVal = Math.max(...days.map((d) => d.completed), 1);

  if (isLoading) {
    return <div className="h-32 rounded-2xl bg-muted animate-pulse" />;
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">התקדמות שבועית</h3>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{totalThisWeek}</span> השבוע
          </span>
          <span>
            <span className="font-semibold text-foreground">{completionRate}%</span> הושלמו
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={days} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            domain={[0, maxVal]}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--accent))" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value, "הושלמו"]}
          />
          <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
            {days.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.completed > 0
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))"
                }
                fillOpacity={entry.completed > 0 ? 0.85 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
