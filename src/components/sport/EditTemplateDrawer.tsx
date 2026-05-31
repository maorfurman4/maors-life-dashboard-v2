import { useState, useCallback, memo, useEffect } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { Dumbbell, Footprints, Shuffle, Weight, Plus, Trash2 } from "lucide-react";
import { useUpdateWorkoutTemplate } from "@/hooks/use-sport-data";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

const categories = [
  { value: "calisthenics", label: "קליסטניקס", icon: Dumbbell },
  { value: "running", label: "ריצה", icon: Footprints },
  { value: "combined", label: "משולב", icon: Shuffle },
  { value: "weights", label: "משקולות", icon: Weight },
];

interface TemplateExercise {
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
  youtube_link?: string;
}

interface TemplateExerciseRowProps {
  exercise: TemplateExercise;
  index: number;
  onUpdate: (i: number, field: keyof TemplateExercise, value: string) => void;
  onRemove: (i: number) => void;
}

const TemplateExerciseRow = memo(function TemplateExerciseRow({ exercise, index, onUpdate, onRemove }: TemplateExerciseRowProps) {
  return (
    <div className="rounded-xl bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input type="text" value={exercise.name} onChange={(e) => onUpdate(index, "name", e.target.value)} placeholder="שם התרגיל"
          className="flex-1 px-2 py-1.5 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[36px]" />
        <button onClick={() => onRemove(index)} className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] text-muted-foreground">סטים</label>
          <input type="number" value={exercise.sets} onChange={(e) => onUpdate(index, "sets", e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">חזרות</label>
          <input type="number" value={exercise.reps} onChange={(e) => onUpdate(index, "reps", e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground">משקל (kg)</label>
          <input type="number" value={exercise.weightKg} onChange={(e) => onUpdate(index, "weightKg", e.target.value)} placeholder="—"
            className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center placeholder:text-muted-foreground/30 focus:outline-none focus:border-sport min-h-[36px]" dir="ltr" />
        </div>
      </div>
    </div>
  );
});

interface WorkoutTemplateRow {
  id: string;
  name: string;
  category: string;
  exercises: any[];
  estimated_duration_minutes?: number | null;
  is_system?: boolean | null;
}

interface EditTemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  template: WorkoutTemplateRow | null;
}

export function EditTemplateDrawer({ open, onClose, template }: EditTemplateDrawerProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("weights");
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);

  const updateTemplate = useUpdateWorkoutTemplate();

  // Sync state whenever template changes
  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setCategory(template.category);
    setDuration(template.estimated_duration_minutes ? String(template.estimated_duration_minutes) : "");
    const exArr = Array.isArray(template.exercises) ? template.exercises : [];
    setExercises(exArr.map((ex: any) => ({
      name: ex.name || "",
      sets: String(ex.sets || 3),
      reps: String(ex.reps || 10),
      weightKg: String(ex.weight_kg || ""),
      youtube_link: ex.youtube_link,
    })));
  }, [template]);

  const addExercise = () => {
    setExercises(prev => [...prev, { name: "", sets: "3", reps: "10", weightKg: "" }]);
  };

  const updateExercise = useCallback((i: number, field: keyof TemplateExercise, value: string) => {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  }, []);

  const removeExercise = useCallback((i: number) => {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleSave = () => {
    if (!template) return;
    if (!name.trim()) {
      toast.error("נא להזין שם לתבנית");
      return;
    }

    const exerciseData = exercises.filter((e) => e.name.trim()).map((e) => ({
      name: e.name,
      sets: parseInt(e.sets) || 0,
      reps: parseInt(e.reps) || 0,
      weight_kg: e.weightKg ? parseFloat(e.weightKg) : 0,
      youtube_link: e.youtube_link,
    }));

    updateTemplate.mutate(
      {
        id: template.id,
        exercises: exerciseData,
        name: name.trim(),
        category,
        estimated_duration_minutes: duration ? parseInt(duration) : undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          toast.success("תבנית עודכנה בהצלחה!");
          onClose();
        },
        onError: (err) => {
          haptics.error();
          toast.error("שגיאה בעדכון תבנית: " + err.message);
        },
      }
    );
  };

  if (!template) return null;

  return (
    <AddItemDrawer open={open} onClose={onClose} title="עריכת תבנית">
      <div className="space-y-4">
        {/* Template name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">שם התבנית</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם התבנית"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג אימון</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors text-sm font-medium min-h-[44px] ${
                  category === cat.value
                    ? "border-sport bg-sport/10 text-sport"
                    : "border-border bg-card hover:bg-secondary/40 text-foreground"
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">משך משוער (דקות)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]"
          />
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">תרגילים</label>
            <button onClick={addExercise} className="flex items-center gap-1 text-[10px] text-sport font-semibold hover:underline min-h-[32px]">
              <Plus className="h-3 w-3" /> הוסף תרגיל
            </button>
          </div>
          {exercises.map((ex, i) => (
            <TemplateExerciseRow
              key={i}
              exercise={ex}
              index={i}
              onUpdate={updateExercise}
              onRemove={removeExercise}
            />
          ))}
          {exercises.length === 0 && (
            <p className="text-[11px] text-muted-foreground/60 text-center py-3">
              אין תרגילים — הוסף תרגיל ראשון
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={updateTemplate.isPending}
          className="w-full py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50"
        >
          {updateTemplate.isPending ? "מעדכן..." : "עדכן תבנית"}
        </button>
      </div>
    </AddItemDrawer>
  );
}
