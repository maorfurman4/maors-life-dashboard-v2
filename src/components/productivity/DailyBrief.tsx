import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useTasks } from "@/hooks/use-tasks";
import { HebrewDate } from "./HebrewDate";
import { GoogleCalendarWidget } from "./GoogleCalendarWidget";
import { formatDueDate } from "@/lib/hebrew-date";

function getGreeting(name: string | null) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";
  return name ? `${greeting}, ${name.split(" ")[0]}!` : `${greeting}!`;
}

export function DailyBrief() {
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useTasks();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const pending = tasks.filter((t) => t.status !== "done");
    const overdue = pending.filter(
      (t) => t.due_date && new Date(t.due_date) < now
    );
    const dueToday = pending.filter(
      (t) => t.due_date && t.due_date.startsWith(todayStr)
    );

    return { pending: pending.length, overdue: overdue.length, dueToday };
  }, [tasks]);

  const greeting = getGreeting(profile?.full_name ?? null);

  return (
    <div className="space-y-3">
      {/* Greeting card */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold">{greeting}</h2>
            <HebrewDate />
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{stats.pending} משימות פעילות</span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-medium">{stats.overdue} באיחור</span>
              </div>
            )}
            {stats.overdue === 0 && stats.pending > 0 && (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>הכל בזמן</span>
              </div>
            )}
          </div>
        </div>

        {/* Tasks due today */}
        {stats.dueToday.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              להיום ({stats.dueToday.length})
            </p>
            <div className="space-y-1">
              {stats.dueToday.slice(0, 3).map((task) => {
                const dueDateInfo = task.due_date
                  ? formatDueDate(task.due_date)
                  : null;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-accent/50 px-2.5 py-1.5"
                  >
                    <span className="text-sm truncate">{task.title}</span>
                    {dueDateInfo && (
                      <span className="text-xs text-muted-foreground shrink-0 mr-2">
                        {dueDateInfo.label}
                      </span>
                    )}
                  </div>
                );
              })}
              {stats.dueToday.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  ועוד {stats.dueToday.length - 3}...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Google Calendar */}
      <GoogleCalendarWidget />
    </div>
  );
}
