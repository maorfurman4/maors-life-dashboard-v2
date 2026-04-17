import { useState } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { Dumbbell, Footprints, Shuffle, Weight, Plus, Trash2, AlertTriangle, Save } from "lucide-react";
import { useAddWorkout, useAddWorkoutTemplate, useWorkoutTemplates } from "@/hooks/use-sport-data";
import { toast } from "sonner";

const categories = [
  { value: "calisthenics", label: "קליסטניקס", icon: Dumbbell },
  { value: "running", label: "ריצה", icon: Footprints },
  { value: "combined", label: "משולב", icon: Shuffle },
  { value: "weights", label: "משקולות", icon: Weight },
];

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
}

interface AddWorkoutDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const commonExercises: Record<string, string[]> = {
  calisthenics: ["מתח", "מקבילים", "שכיבות סמיכה", "מתח אוסטרלי", "L-sit", "Muscle up", "שכיבת שמיכה יהלום", "רגליים למתח"],
  running: [],
  combined: ["בורפיז", "קפיצות סקוואט", "הליכת דוב", "זריקת כדור", "חתירה", "Box jumps"],
  weights: ["סקוואט", "לחיצת חזה", "דדליפט", "לחיצת כתפיים", "שורה", "כפיפות מרפק", "פשיטות מרפק"],
};

export function AddWorkoutDrawer({ open, onClose, defaultCategory }: AddWorkoutDrawerProps) {
  const [category, setCategory] = useState(defaultCategory || "calisthenics");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const addWorkout = useAddWorkout();
  const addTemplate = useAddWorkoutTemplate();
  const { data: templates } = useWorkoutTemplates();

  const addExercise = (name?: string) => {
    setExercises([...exercises, { name: name || "", sets: "3", reps: "10", weightKg: "" }]);
  };

  const updateExercise = (i: number, field: keyof Exercise, value: string) => {
    const updated = [...exercises];
    updated[i] = { ...updated[i], [field]: value };
    setExercises(updated);
  };

  const removeExercise = (i: number) => {
    setExercises(exercises.filter((_, idx) => idx !== i));
  };

  const loadTemplate = (templateId: string) => {
    const tmpl = templates?.find((t) => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplateId(templateId);
    setCategory(tmpl.category);
    const exArr = Array.isArray(tmpl.exercises) ? tmpl.exercises : [];
    setExercises(exArr.map((ex: any) => ({
      name: ex.name || "",
      sets: String(ex.sets || 3),
      reps: String(ex.reps || 10),
      weightKg: String(ex.weight_kg || ""),
    })));
    if (tmpl.estimated_duration_minutes) setDuration(String(tmpl.estimated_duration_minutes));
  };

  const resetForm = () => {
    setCategory(defaultCategory || "calisthenics");
    setDuration("");
    setNotes("");
    setExercises([]);
    setDistance("");
    setPace("");
    setSaveAsTemplate(false);
    setTemplateName("");
    setSelectedTemplateId(null);
  };

  const handleSave = () => {
    const exerciseData = exercises.filter((e) => e.name.trim()).map((e) => ({
      name: e.name,
      sets: parseInt(e.sets) || 0,
      reps: parseInt(e.reps) || 0,
      weight_kg: e.weightKg ? parseFloat(e.weightKg) : undefined,
    }));

    const isRunning = category === "running";

    addWorkout.mutate(
      {
        category,
        duration_minutes: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
        exercises: isRunning ? undefined : exerciseData,
        run: isRunning
          ? {
              distance_km: distance ? parseFloat(distance) : undefined,
              duration_minutes: duration ? parseInt(duration) : undefined,
              pace_per_km: pace ? parseFloat(pace) : undefined,
            }
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("אימון נשמר בהצלחה!");
          // Save as template if requested
          if (saveAsTemplate && templateName.trim()) {
            addTemplate.mutate({
              name: templateName,
              category,
              exercises: exerciseData,
              estimated_duration_minutes: duration ? parseInt(duration) : undefined,
            }, {
              onSuccess: () => toast.success("תבנית נשמרה!"),
              onError: (err) => toast.error("שגיאה בשמירת תבנית: " + err.message),
            });
          }
          resetForm();
          onClose();
        },
        onError: (err) => toast.error("שגיאה בשמירת אימון: " + err.message),
      }
    );
  };

  const isRunning = category === "running";
  const showShoulderWarning = category === "calisthenics" || category === "weights";
  const categoryTemplates = templates?.filter((t) => t.category === category) || [];

  return (
    <AddItemDrawer open={open} onClose={onClose} title="אימון חדש">
      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג אימון</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setExercises([]); setSelectedTemplateId(null); }}
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

        {/* Templates */}
        {categoryTemplates.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">טען מתבנית</label>
            <div className="flex flex-wrap gap-1.5">
              {categoryTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    selectedTemplateId === t.id
                      ? "bg-sport/20 text-sport border border-sport/30"
                      : "bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shoulder warning */}
        {showShoulderWarning && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-400/80">
              יש לך רגישות בכתפיים — שים לב לתרגילים עם עומס כבד על הכתפיים
            </p>
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">משך (דקות)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]"
          />
        </div>

        {/* Running-specific fields */}
        {isRunning && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">מרחק (ק״מ)</label>
              <input type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5.0"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">קצב (דק׳/ק״מ)</label>
              <input type="number" step="0.1" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="5:30"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]" dir="ltr" />
            </div>
          </div>
        )}

        {/* Exercises (non-running) */}
        {!isRunning && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">תרגילים</label>
              <button onClick={() => addExercise()} className="flex items-center gap-1 text-[10px] text-sport font-semibold hover:underline min-h-[32px]">
                <Plus className="h-3 w-3" />הוסף תרגיל
              </button>
            </div>
            {exercises.length === 0 && commonExercises[category]?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {commonExercises[category].map((ex) => (
                  <button key={ex} onClick={() => addExercise(ex)} className="px-2.5 py-1.5 rounded-lg bg-secondary/30 text-[11px] font-medium hover:bg-secondary/50 transition-colors">
                    + {ex}
                  </button>
                ))}
              </div>
            )}
            {exercises.map((ex, i) => (
              <div key={i} className="rounded-xl bg-secondary/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={ex.name} onChange={(e) => updateExercise(i, "name", e.target.value)} placeholder="שם התרגיל"
                    className="flex-1 px-2 py-1.5 rounded-lg bg-card border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[36px]" />
                  <button onClick={() => removeExercise(i)} className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-muted-foreground">סטים</label>
                    <input type="number" value={ex.sets} onChange={(e) => updateExercise(i, "sets", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground">חזרות</label>
                    <input type="number" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground">משקל (kg)</label>
                    <input type="number" value={ex.weightKg} onChange={(e) => updateExercise(i, "weightKg", e.target.value)} placeholder="—"
                      className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center placeholder:text-muted-foreground/30 focus:outline-none focus:border-sport min-h-[36px]" dir="ltr" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">הערות</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="פרטים נוספים..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport resize-none" />
        </div>

        {/* Save as template */}
        <div className="flex items-center gap-2">
          <button onClick={() => setSaveAsTemplate(!saveAsTemplate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              saveAsTemplate ? "bg-sport/15 text-sport" : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
            }`}>
            <Save className="h-3 w-3" />
            שמור כתבנית
          </button>
        </div>
        {saveAsTemplate && (
          <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="שם התבנית"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-sport min-h-[44px]" />
        )}

        <button
          onClick={handleSave}
          disabled={addWorkout.isPending}
          className="w-full py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50"
        >
          {addWorkout.isPending ? "שומר..." : "שמור אימון"}
        </button>
      </div>
    </AddItemDrawer>
  );
}
