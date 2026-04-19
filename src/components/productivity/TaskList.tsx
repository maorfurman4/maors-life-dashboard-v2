import { useState, useMemo } from "react";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "done";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "active", label: "פעיל" },
  { key: "done", label: "הושלם" },
];

function sortTasks(tasks: Task[]): Task[] {
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    // Overdue first
    const aOverdue = a.due_date && new Date(a.due_date) < new Date() && a.status !== "done";
    const bOverdue = b.due_date && new Date(b.due_date) < new Date() && b.status !== "done";
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // By due date
    if (a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (diff !== 0) return diff;
    }
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    // By priority
    return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
  });
}

export function TaskList() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: tasks = [], isLoading } = useTasks();

  const filtered = useMemo(() => {
    let result = tasks;
    if (filter === "active") result = tasks.filter((t) => t.status !== "done");
    if (filter === "done") result = tasks.filter((t) => t.status === "done");
    return result;
  }, [tasks, filter]);

  // Group by project
  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const task of sortTasks(filtered)) {
      const key = task.project_id || "__none__";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return groups;
  }, [filtered]);

  const projectGroups = useMemo(() => {
    return Object.entries(grouped).sort(([a], [b]) => {
      if (a === "__none__") return 1;
      if (b === "__none__") return -1;
      return 0;
    });
  }, [grouped]);

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary/30 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task Groups */}
      {projectGroups.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm text-muted-foreground">אין משימות, מעולה!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {projectGroups.map(([projectId, groupTasks]) => {
            const firstTask = groupTasks[0];
            const projectName =
              projectId === "__none__"
                ? "ללא פרויקט"
                : firstTask?.task_projects?.name || "פרויקט";
            const projectColor =
              projectId === "__none__"
                ? "#94a3b8"
                : firstTask?.task_projects?.color || "#6366f1";

            return (
              <div key={projectId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: projectColor }}
                  />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {projectName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({groupTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {groupTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
