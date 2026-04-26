import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckSquare, Plus, X, ChevronDown, ChevronUp,
  Flag, Calendar, Folder, Trash2, Circle, CheckCircle2,
  Tag, MoreHorizontal,
} from "lucide-react";
import {
  useTasks, useAddTask, useUpdateTask, useDeleteTask,
  useTaskProjects, useAddTaskProject,
} from "@/hooks/use-tasks-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

// ─── constants ────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "todo" | "in_progress" | "done";

const STATUS_LABELS: Record<string, string> = {
  todo:        "לעשות",
  in_progress: "בתהליך",
  done:        "הושלם",
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    "#22c55e",
  medium: "#f59e0b",
  high:   "#ef4444",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "נמוכה", medium: "בינונית", high: "גבוהה",
};

const PROJECT_PALETTE = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899",
  "#3b82f6", "#8b5cf6", "#06b6d4", "#f97316",
];

// ─── Add Task Drawer ──────────────────────────────────────────────────────────
function AddTaskDrawer({ onClose, projects }: { onClose: () => void; projects: any[] }) {
  const addTask    = useAddTask();
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [priority, setPriority]   = useState("medium");
  const [dueDate, setDueDate]     = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) return toast.error("כותרת המשימה חסרה");
    try {
      await addTask.mutateAsync({ title, description: desc, priority, project_id: projectId, due_date: dueDate || null });
      toast.success("משימה נוספה ✅");
      onClose();
    } catch { toast.error("שגיאה בשמירה"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl border-t border-x border-white/10 bg-[#0d1117]/97 backdrop-blur-2xl p-5 space-y-4 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />

        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">משימה חדשה</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-xl bg-white/8 flex items-center justify-center text-white/50"><X className="h-4 w-4" /></button>
        </div>

        {/* Title */}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מה צריך לעשות?"
          className="w-full bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40"
          dir="rtl" autoFocus />

        {/* Description */}
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="פירוט (אופציונלי)..."
          className="w-full bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40 resize-none h-20"
          dir="rtl" />

        {/* Priority + Due date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-white/40">עדיפות</p>
            <div className="flex gap-1.5">
              {["low", "medium", "high"].map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${priority === p ? "border-opacity-60 text-white" : "border-white/10 text-white/30"}`}
                  style={priority === p ? { borderColor: PRIORITY_COLORS[p], background: PRIORITY_COLORS[p] + "22", color: PRIORITY_COLORS[p] } : {}}>
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-white/40">תאריך יעד</p>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500/40" />
          </div>
        </div>

        {/* Project */}
        {projects.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-white/40">פרויקט</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setProjectId(null)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${!projectId ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/30"}`}>
                ללא
              </button>
              {projects.map((p) => (
                <button key={p.id} onClick={() => setProjectId(p.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${projectId === p.id ? "text-white" : "text-white/40"}`}
                  style={projectId === p.id ? { borderColor: p.color, background: p.color + "22", color: p.color } : { borderColor: "rgba(255,255,255,0.1)" }}>
                  {p.icon && <span className="mr-1">{p.icon}</span>}{p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={addTask.isPending}
          className="w-full py-3.5 rounded-2xl bg-violet-500 text-white font-black text-sm hover:bg-violet-400 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)]">
          {addTask.isPending ? "שומר..." : "הוסף משימה"}
        </button>
      </div>
    </div>
  );
}

// ─── Add Project Sheet ────────────────────────────────────────────────────────
function AddProjectSheet({ onClose }: { onClose: () => void }) {
  const addProject = useAddTaskProject();
  const [name, setName]   = useState("");
  const [color, setColor] = useState(PROJECT_PALETTE[0]);
  const [icon, setIcon]   = useState("📁");
  const ICONS = ["📁", "💼", "🏠", "💡", "🎯", "📚", "🛒", "✈️", "🏋️", "💰"];

  const handleSave = async () => {
    if (!name.trim()) return toast.error("שם פרויקט חסר");
    try {
      await addProject.mutateAsync({ name, color, icon });
      toast.success(`פרויקט "${name}" נוצר`);
      onClose();
    } catch { toast.error("שגיאה בשמירה"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl border-t border-x border-white/10 bg-[#0d1117]/97 backdrop-blur-2xl p-5 space-y-4 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">פרויקט חדש</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-xl bg-white/8 flex items-center justify-center text-white/50"><X className="h-4 w-4" /></button>
        </div>

        {/* Icon picker */}
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)}
              className={`h-9 w-9 rounded-xl flex items-center justify-center text-xl transition-all ${icon === ic ? "bg-white/15 scale-110" : "bg-white/5 hover:bg-white/10"}`}>
              {ic}
            </button>
          ))}
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הפרויקט..."
          className="w-full bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/40"
          dir="rtl" autoFocus />

        {/* Color palette */}
        <div className="flex gap-2.5">
          {PROJECT_PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full transition-all ${color === c ? "scale-125 ring-2 ring-white/30" : ""}`}
              style={{ background: c }} />
          ))}
        </div>

        <button onClick={handleSave} disabled={addProject.isPending}
          className="w-full py-3.5 rounded-2xl text-white font-black text-sm active:scale-[0.98] transition-all"
          style={{ background: color }}>
          {addProject.isPending ? "שומר..." : "צור פרויקט"}
        </button>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task }: { task: any }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [expanded, setExpanded] = useState(false);

  const isDone       = task.status === "done";
  const priorityCol  = PRIORITY_COLORS[task.priority] ?? "#6b7280";
  const projectColor = task.task_projects?.color ?? null;
  const projectName  = task.task_projects?.name ?? null;
  const projectIcon  = task.task_projects?.icon ?? null;

  const isOverdue = task.due_date && !isDone && new Date(task.due_date) < new Date();
  const daysLeft  = task.due_date
    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000)
    : null;

  const toggleDone = async () => {
    const newStatus = isDone ? "todo" : "done";
    try {
      await updateTask.mutateAsync({ id: task.id, status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null });
    } catch { toast.error("שגיאה בעדכון"); }
  };

  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle: Record<string, string> = { todo: "in_progress", in_progress: "done", done: "todo" };
    try { await updateTask.mutateAsync({ id: task.id, status: cycle[task.status] ?? "todo" }); }
    catch { toast.error("שגיאה בעדכון"); }
  };

  return (
    <div className={`rounded-2xl border backdrop-blur-xl overflow-hidden transition-all ${isDone ? "border-white/5 bg-white/2 opacity-60" : "border-white/10 bg-white/5"}`}>
      <div className="flex items-start gap-3 p-3.5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {/* Status circle */}
        <button onClick={(e) => { e.stopPropagation(); toggleDone(); }}
          className="mt-0.5 shrink-0 transition-transform active:scale-90">
          {isDone
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            : <Circle className="h-5 w-5 text-white/25 hover:text-white/60" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${isDone ? "line-through text-white/30" : "text-white/90"}`}>
            {task.title}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Priority */}
            <div className="flex items-center gap-1">
              <Flag className="h-2.5 w-2.5" style={{ color: priorityCol }} />
              <span className="text-[9px] font-bold" style={{ color: priorityCol }}>{PRIORITY_LABELS[task.priority]}</span>
            </div>

            {/* Project */}
            {projectName && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: (projectColor ?? "#6366f1") + "22" }}>
                <span className="text-[9px]">{projectIcon}</span>
                <span className="text-[9px] font-bold" style={{ color: projectColor ?? "#6366f1" }}>{projectName}</span>
              </div>
            )}

            {/* Due date */}
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-white/35"}`}>
                <Calendar className="h-2.5 w-2.5" />
                <span className="text-[9px]">
                  {isOverdue ? `${Math.abs(daysLeft!)} ימים איחור` : daysLeft === 0 ? "היום!" : daysLeft === 1 ? "מחר" : `${daysLeft} ימים`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={cycleStatus}
            className={`text-[9px] px-2 py-1 rounded-lg font-bold border transition-all ${
              task.status === "todo"        ? "border-white/10 text-white/30 hover:border-white/20"
              : task.status === "in_progress" ? "border-amber-500/30 text-amber-400 bg-amber-500/8"
              : "border-emerald-500/30 text-emerald-400 bg-emerald-500/8"}`}>
            {STATUS_LABELS[task.status]}
          </button>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-white/30" /> : <ChevronDown className="h-3.5 w-3.5 text-white/30" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/5 px-3.5 pb-3.5 pt-3 space-y-3">
          {task.description && (
            <p className="text-xs text-white/50 leading-relaxed">{task.description}</p>
          )}
          <button onClick={() => deleteTask.mutate(task.id)}
            className="flex items-center gap-1.5 text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
            <Trash2 className="h-3 w-3" />מחק משימה
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function TasksPage() {
  const { data: tasks }    = useTasks();
  const { data: projects } = useTaskProjects();
  const [filter, setFilter]         = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [showAddTask, setShowAddTask]     = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const filtered = (tasks ?? []).filter((t: any) => {
    const statusOk  = filter === "all" || t.status === filter;
    const projectOk = !projectFilter || t.project_id === projectFilter;
    return statusOk && projectOk;
  });

  const counts: Record<StatusFilter, number> = {
    all:         (tasks ?? []).length,
    todo:        (tasks ?? []).filter((t: any) => t.status === "todo").length,
    in_progress: (tasks ?? []).filter((t: any) => t.status === "in_progress").length,
    done:        (tasks ?? []).filter((t: any) => t.status === "done").length,
  };

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",         label: `הכל (${counts.all})`           },
    { key: "todo",        label: `לעשות (${counts.todo})`        },
    { key: "in_progress", label: `בתהליך (${counts.in_progress})`},
    { key: "done",        label: `הושלם (${counts.done})`        },
  ];

  return (
    <>
      <div
        dir="rtl"
        className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2000&auto=format&fit=crop')`,
          minHeight: "100vh",
        }}
      >
        <div className="absolute inset-0 bg-[#07030f]/88 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-violet-500/15 blur-[120px]" />
          <div className="absolute bottom-40 -left-16 h-60 w-60 rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 pb-32">
          {/* Header */}
          <div className="px-4 pt-5 pb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-violet-500/20 backdrop-blur-md border border-violet-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                <CheckSquare className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">משימות ✅</h1>
                <p className="text-[11px] text-white/40 mt-0.5">{counts.todo} ממתינות · {counts.in_progress} בתהליך</p>
              </div>
            </div>
            {/* Add task FAB */}
            <button onClick={() => setShowAddTask(true)}
              className="h-11 w-11 rounded-2xl bg-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:bg-violet-400 active:scale-95 transition-all">
              <Plus className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Project filter chips */}
          <div className="px-4 pb-1">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button onClick={() => setProjectFilter(null)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${!projectFilter ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-white/10 text-white/35 hover:border-white/20"}`}>
                <Folder className="h-2.5 w-2.5" />כל הפרויקטים
              </button>
              {(projects ?? []).map((p: any) => (
                <button key={p.id} onClick={() => setProjectFilter(projectFilter === p.id ? null : p.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all`}
                  style={projectFilter === p.id
                    ? { borderColor: p.color, background: p.color + "22", color: p.color }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
                  {p.icon && <span>{p.icon}</span>}{p.name}
                </button>
              ))}
              <button onClick={() => setShowAddProject(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border border-dashed border-white/15 text-white/30 hover:border-white/25">
                <Plus className="h-2.5 w-2.5" />פרויקט
              </button>
            </div>
          </div>

          {/* Status tab bar */}
          <div className="sticky top-0 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 overflow-x-auto scrollbar-hide">
              {STATUS_TABS.map((t) => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`flex-shrink-0 flex-1 py-2 px-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                    filter === t.key ? "bg-violet-500 text-white shadow-lg" : "text-white/40 hover:text-white/70"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="px-4 pt-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <span className="text-6xl">✅</span>
                <p className="text-white/50 font-bold text-sm">
                  {filter === "done" ? "אין משימות שהושלמו עדיין" : "אין משימות כרגע"}
                </p>
                <button onClick={() => setShowAddTask(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-bold hover:bg-violet-500/20 transition-all">
                  <Plus className="h-3.5 w-3.5" />הוסף משימה ראשונה
                </button>
              </div>
            ) : (
              filtered.map((task: any) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </div>
      </div>

      {showAddTask    && <AddTaskDrawer onClose={() => setShowAddTask(false)} projects={projects ?? []} />}
      {showAddProject && <AddProjectSheet onClose={() => setShowAddProject(false)} />}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
