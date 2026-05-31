import { useState, useCallback, memo } from "react";
import { AddItemDrawer } from "@/components/shared/AddItemDrawer";
import { Dumbbell, Footprints, Shuffle, Weight, Plus, Trash2, AlertTriangle, Save, Library, X as XIcon } from "lucide-react";
import { useAddWorkout, useAddWorkoutTemplate, useWorkoutTemplates } from "@/hooks/use-sport-data";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { ExercisePickerSheet, type PickedExercise } from "@/components/sport/ExercisePickerSheet";

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
  youtube_link?: string;
}

interface RunSegment {
  type: "warmup" | "cardio" | "cooldown";
  distance_km: string;
  duration_minutes: string;
  pace: string;
}

const RUN_SEGMENT_TYPES: { value: RunSegment["type"]; label: string }[] = [
  { value: "warmup", label: "חימום" },
  { value: "cardio", label: "קרדיו" },
  { value: "cooldown", label: "קירור" },
];

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  onUpdate: (i: number, field: keyof Exercise, value: string) => void;
  onRemove: (i: number) => void;
}

const ExerciseRow = memo(function ExerciseRow({ exercise, index, onUpdate, onRemove }: ExerciseRowProps) {
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

interface AddWorkoutDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const commonExercises: Record<string, string[]> = {
  calisthenics: ["מתח", "מקבילים", "שכיבות סמיכה", "מתח אוסטרלי", "L-sit", "מאסל אפ", "שכיבת יהלום", "הרמות רגליים"],
  running: [],
  combined: ["בורפי", "סקוואט קפיצה", "הליכת דוב", "מטפסי הרים", "קפיצות לקופסה"],
  weights: ["סקוואט", "לחיצת חזה", "דדליפט", "לחיצת כתפיים", "חתירה", "כפיפות מרפק", "פשיטות מרפק"],
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
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [runSegment, setRunSegment] = useState<RunSegment | null>(null);

  const addWorkout = useAddWorkout();
  const addTemplate = useAddWorkoutTemplate();
  const { data: templates } = useWorkoutTemplates();

  const addExercise = (name?: string) => {
    setExercises([...exercises, { name: name || "", sets: "3", reps: "10", weightKg: "" }]);
  };

  const updateExercise = useCallback((i: number, field: keyof Exercise, value: string) => {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  }, []);

  const removeExercise = useCallback((i: number) => {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleLibraryConfirm = useCallback((picked: PickedExercise[]) => {
    setExercises(prev => [...prev, ...picked]);
  }, []);

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
      youtube_link: ex.youtube_link,
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
    setRunSegment(null);
  };

  const handleSave = () => {
    const exerciseData = exercises.filter((e) => e.name.trim()).map((e) => ({
      name: e.name,
      sets: parseInt(e.sets) || 0,
      reps: parseInt(e.reps) || 0,
      weight_kg: e.weightKg ? parseFloat(e.weightKg) : undefined,
      youtube_link: e.youtube_link,
    }));

    const isRunning = category === "running";
    const isHybrid = !isRunning && exerciseData.length > 0 && runSegment !== null;
    const effectiveCategory = isHybrid ? "mixed" : category;

    addWorkout.mutate(
      {
        category: effectiveCategory,
        duration_minutes: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
        exercises: isRunning ? undefined : exerciseData,
        run: isRunning
          ? {
              distance_km: distance ? parseFloat(distance) : undefined,
              duration_minutes: duration ? parseInt(duration) : undefined,
              pace_per_km: pace ? parseFloat(pace) : undefined,
            }
          : runSegment
          ? {
              distance_km: runSegment.distance_km ? parseFloat(runSegment.distance_km) : undefined,
              duration_minutes: runSegment.duration_minutes ? parseInt(runSegment.duration_minutes) : undefined,
              pace_per_km: runSegment.pace ? parseFloat(runSegment.pace) : undefined,
            }
          : undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          toast.success("אימון נשמר בהצלחה!");
          if (saveAsTemplate && templateName.trim()) {
            addTemplate.mutate(
              {
                name: templateName,
                category: effectiveCategory,
                exercises: exerciseData as any,
                estimated_duration_minutes: duration ? parseInt(duration) : undefined,
              },
              {
                onSuccess: () => toast.success("תבנית נשמרה!"),
                onError: (err) => { haptics.error(); toast.error("שגיאה בשמירת תבנית: " + err.message); },
              }
            );
          }
          resetForm();
          onClose();
        },
        onError: (err) => { haptics.error(); toast.error("שגיאה בשמירת אימון: " + err.message); },
      }
    );
  };

  const isRunning = category === "running";
  const showShoulderWarning = category === "calisthenics" || category === "weights";
  const categoryTemplates = templates?.filter((t) => t.category === category) || [];

  return (
    <>
      <AddItemDrawer open={open} onClose={onClose} title="אימון חדש">
        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">סוג אימון</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setExercises([]); setSelectedTemplateId(null); setRunSegment(null); }}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { haptics.tap(); setLibraryOpen(true); }}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold hover:text-foreground transition-colors min-h-[32px] px-2 py-1 rounded-lg bg-secondary/30 hover:bg-secondary/50"
                  >
                    <Library className="h-3 w-3" /> מהספרייה
                  </button>
                  <button onClick={() => addExercise()} className="flex items-center gap-1 text-[10px] text-sport font-semibold hover:underline min-h-[32px]">
                    <Plus className="h-3 w-3" />הוסף
                  </button>
                </div>
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
                <ExerciseRow
                  key={i}
                  exercise={ex}
                  index={i}
                  onUpdate={updateExercise}
                  onRemove={removeExercise}
                />
              ))}

              {/* Run segment */}
              {!runSegment ? (
                <button
                  onClick={() => { haptics.tap(); setRunSegment({ type: "cardio", distance_km: "", duration_minutes: "", pace: "" }); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-[11px] text-muted-foreground hover:border-sport/40 hover:text-sport transition-colors w-full justify-center"
                >
                  <Footprints className="h-3.5 w-3.5" /> הוסף קטע ריצה / קרדיו
                </button>
              ) : (
                <div className="rounded-xl border border-sport/20 bg-sport/5 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-sport flex items-center gap-1.5">
                      <Footprints className="h-3.5 w-3.5" /> קטע ריצה / קרדיו
                    </p>
                    <button onClick={() => setRunSegment(null)} className="h-5 w-5 rounded flex items-center justify-center hover:bg-destructive/10">
                      <XIcon className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    {RUN_SEGMENT_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setRunSegment(prev => prev ? { ...prev, type: value } : prev)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                          runSegment.type === value
                            ? "bg-sport/20 text-sport border border-sport/30"
                            : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground">מרחק (ק״מ)</label>
                      <input type="number" step="0.1" value={runSegment.distance_km}
                        onChange={(e) => setRunSegment(prev => prev ? { ...prev, distance_km: e.target.value } : prev)}
                        placeholder="2.0"
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" dir="ltr" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">משך (דק׳)</label>
                      <input type="number" value={runSegment.duration_minutes}
                        onChange={(e) => setRunSegment(prev => prev ? { ...prev, duration_minutes: e.target.value } : prev)}
                        placeholder="10"
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">קצב (דק׳/ק״מ)</label>
                      <input type="number" step="0.1" value={runSegment.pace}
                        onChange={(e) => setRunSegment(prev => prev ? { ...prev, pace: e.target.value } : prev)}
                        placeholder="5.5"
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border text-sm text-center focus:outline-none focus:border-sport min-h-[36px]" dir="ltr" />
                    </div>
                  </div>
                </div>
              )}
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

      <ExercisePickerSheet
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onConfirm={handleLibraryConfirm}
      />
    </>
  );
}
