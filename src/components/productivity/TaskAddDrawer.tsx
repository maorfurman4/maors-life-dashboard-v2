import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddTask, useTaskProjects } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

interface TaskAddDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITIES = [
  { value: "high", label: "גבוה", className: "text-destructive" },
  { value: "medium", label: "בינוני", className: "text-yellow-600 dark:text-yellow-400" },
  { value: "low", label: "נמוך", className: "text-green-600 dark:text-green-400" },
];

export function TaskAddDrawer({ open, onOpenChange }: TaskAddDrawerProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");

  const addTask = useAddTask();
  const { data: projects = [] } = useTaskProjects();

  const reset = () => {
    setTitle("");
    setPriority("medium");
    setDueDate("");
    setProjectId("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await addTask.mutateAsync({
      title: title.trim(),
      priority,
      due_date: dueDate || undefined,
      project_id: projectId || undefined,
      description: description.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent dir="rtl" className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>הוסף משימה חדשה</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">כותרת *</Label>
            <Input
              id="task-title"
              placeholder="מה צריך לעשות?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
              dir="rtl"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>עדיפות</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    priority === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="task-due-date">תאריך יעד</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              dir="ltr"
              className="text-left"
            />
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>פרויקט</Label>
              <Select value={projectId} onValueChange={setProjectId} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="ללא פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ללא פרויקט</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: proj.color || "#6366f1" }}
                        />
                        {proj.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">תיאור (אופציונלי)</Label>
            <textarea
              id="task-description"
              placeholder="פרטים נוספים..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              dir="rtl"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <DrawerFooter className="pt-0">
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || addTask.isPending}
            className="w-full"
          >
            {addTask.isPending ? "מוסיף..." : "הוסף משימה"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={reset}>
              ביטול
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
