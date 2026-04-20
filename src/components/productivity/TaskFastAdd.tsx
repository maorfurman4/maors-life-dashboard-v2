import { useRef, useState } from "react";
import { Plus, Zap } from "lucide-react";
import { useAddTask, useTaskProjects } from "@/hooks/use-tasks";
import { toast } from "sonner";

const PRIORITY_SHORTCUTS: Record<string, "high" | "medium" | "low"> = {
  "!": "high",
  "~": "low",
};

function parsePriority(text: string): { title: string; priority: "high" | "medium" | "low" } {
  const last = text.trim().slice(-1);
  const shortcut = PRIORITY_SHORTCUTS[last];
  if (shortcut) {
    return { title: text.trim().slice(0, -1).trim(), priority: shortcut };
  }
  return { title: text.trim(), priority: "medium" };
}

export function TaskFastAdd() {
  const [value, setValue]         = useState("");
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTask = useAddTask();
  const { data: projects = [] } = useTaskProjects();

  const { title, priority } = parsePriority(value);

  const handleSubmit = async () => {
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await addTask.mutateAsync({
        title,
        priority,
        project_id: projectId || undefined,
      });
      setValue("");
      inputRef.current?.focus();
    } catch {
      toast.error("שגיאה בהוספת משימה");
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColor = priority === "high"
    ? "text-destructive border-destructive/30 bg-destructive/5"
    : priority === "low"
    ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
    : "text-muted-foreground border-transparent bg-transparent";

  return (
    <div className="rounded-2xl border border-border bg-card p-3 space-y-2" dir="rtl">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-secondary/20 px-3 has-[:focus]:border-primary transition-colors">
          <Zap className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="הוסף משימה מהירה... (! גבוה · ~ נמוך · Enter לשמירה)"
            className="flex-1 bg-transparent py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none min-h-[40px]"
            dir="rtl"
          />
          {value.trim() && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 transition-all ${priorityColor}`}>
              {priority === "high" ? "גבוה" : priority === "low" ? "נמוך" : "בינוני"}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!title || submitting}
          className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
        >
          <Plus className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>

      {/* Project selector — only shown when there are projects */}
      {projects.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setProjectId("")}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
              !projectId ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            ללא פרויקט
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjectId(p.id)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                projectId === p.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color || "#6366f1" }} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
