import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock, Trash2, Circle, ArrowRight, ArrowLeft, Undo2 } from "lucide-react";
import { useUpdateTaskStatus, useDeleteTask, type Task } from "@/hooks/use-tasks";
import { formatDueDate } from "@/lib/hebrew-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const UNDO_MS = 5000;

const PRIORITY_CONFIG = {
  high:   { label: "גבוה",  className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "בינוני", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400" },
  low:    { label: "נמוך",  className: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400" },
};

const STATUS_ORDER  = { pending: "in_progress", in_progress: "done", done: "pending" } as const;
const STATUS_PREV   = { pending: "done", in_progress: "pending", done: "in_progress" } as const;

interface TaskCardProps {
  task: Task;
  showMoveButtons?: boolean;
}

export function TaskCard({ task, showMoveButtons = false }: TaskCardProps) {
  const [hovered, setHovered]           = useState(false);
  // undoPending: task was JUST checked "done" — waiting for 5s before committing
  const [undoPending, setUndoPending]   = useState(false);
  const [undoSecondsLeft, setSecondsLeft] = useState(UNDO_MS / 1000);
  const commitTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateStatus = useUpdateTaskStatus();
  const deleteTask   = useDeleteTask();

  const isDone = undoPending ? true : task.status === "done";

  const clearTimers = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    if (tickTimerRef.current)   clearInterval(tickTimerRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startUndoWindow = useCallback(() => {
    setUndoPending(true);
    setSecondsLeft(UNDO_MS / 1000);

    tickTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(tickTimerRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);

    commitTimerRef.current = setTimeout(() => {
      setUndoPending(false);
      updateStatus.mutate({ id: task.id, status: "done" });
    }, UNDO_MS);
  }, [task.id, updateStatus]);

  const handleUndo = useCallback(() => {
    clearTimers();
    setUndoPending(false);
    setSecondsLeft(UNDO_MS / 1000);
  }, [clearTimers]);

  const handleCheckbox = () => {
    if (undoPending) {
      handleUndo();
      return;
    }
    if (isDone) {
      updateStatus.mutate({ id: task.id, status: "pending" });
    } else {
      // Start 5-second deferred commit
      startUndoWindow();
    }
  };

  const dueDateInfo = task.due_date ? formatDueDate(task.due_date) : null;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all",
        isDone && !undoPending && "opacity-60",
        undoPending && "border-primary/30 bg-primary/5",
        hovered && !undoPending && "border-primary/20 bg-accent/30"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckbox}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isDone
            ? "border-primary bg-primary text-primary-foreground"
            : task.status === "in_progress"
            ? "border-yellow-500 text-yellow-500"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {isDone ? (
          <Check className="h-3 w-3" />
        ) : task.status === "in_progress" ? (
          <Clock className="h-3 w-3" />
        ) : (
          <Circle className="h-3 w-3 opacity-0 group-hover:opacity-40" />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "text-sm font-medium leading-tight",
              isDone && !undoPending && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {/* Undo button — visible during 5s window */}
            {undoPending && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
              >
                <Undo2 className="h-3 w-3" />
                בטל ({undoSecondsLeft}s)
              </button>
            )}

            {showMoveButtons && !undoPending && (
              <>
                {task.status !== "pending" && (
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => updateStatus.mutate({ id: task.id, status: STATUS_PREV[task.status] })}
                    title="הזז לאחור">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
                {task.status !== "done" && (
                  <Button variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => updateStatus.mutate({ id: task.id, status: STATUS_ORDER[task.status] })}
                    title="הזז קדימה">
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}

            {!undoPending && (
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => deleteTask.mutate(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Undo countdown progress bar */}
        {undoPending && (
          <div className="h-0.5 rounded-full bg-primary/20 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(undoSecondsLeft / (UNDO_MS / 1000)) * 100}%`,
                transition: "width 1s linear",
              }}
            />
          </div>
        )}

        {task.description && !undoPending && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {!undoPending && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0", priorityConfig.className)}>
              {priorityConfig.label}
            </Badge>

            {task.task_projects && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.task_projects.color || "#6366f1" }} />
                <span className="text-xs text-muted-foreground">{task.task_projects.name}</span>
              </div>
            )}

            {dueDateInfo && (
              <span className={cn(
                "text-xs",
                dueDateInfo.isOverdue    ? "text-destructive font-medium" :
                dueDateInfo.isDueSoon    ? "text-yellow-600 dark:text-yellow-400" :
                                           "text-muted-foreground"
              )}>
                {dueDateInfo.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
