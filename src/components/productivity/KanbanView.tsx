import { useMemo } from "react";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/components/ui/badge";

type Status = "pending" | "in_progress" | "done";

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "pending", label: "ממתין", color: "bg-muted-foreground/20 text-muted-foreground" },
  { status: "in_progress", label: "בתהליך", color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { status: "done", label: "הושלם", color: "bg-green-500/20 text-green-600 dark:text-green-400" },
];

export function KanbanView() {
  const { data: tasks = [], isLoading } = useTasks();

  const grouped = useMemo(() => {
    const result: Record<Status, Task[]> = {
      pending: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) {
      if (task.status in result) {
        result[task.status].push(task);
      }
    }
    return result;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((col) => (
        <div key={col.status} className="space-y-3">
          {/* Column Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <Badge variant="secondary" className={col.color}>
              {grouped[col.status].length}
            </Badge>
          </div>

          {/* Column Tasks */}
          <div className="space-y-2 min-h-[60px]">
            {grouped[col.status].length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">ריק</p>
              </div>
            ) : (
              grouped[col.status].map((task) => (
                <TaskCard key={task.id} task={task} showMoveButtons />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
