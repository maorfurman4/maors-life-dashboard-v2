import { useState } from "react";
import { Sparkles, Loader2, Calendar, Save, ChevronRight, ChevronLeft } from "lucide-react";
import { generateWorkoutPlan, WorkoutPlan } from "@/lib/ai-service";
import { usePersonalRecords, useAddWorkoutTemplate } from "@/hooks/use-sport-data";
import { toast } from "sonner";

interface PlannedExercise {
  name:       string;
  sets:       number;
  reps:       string;
  weight_kg?: number;
  notes?:     string;
}

interface PlannedWorkout {
  day:               string;
  name:              string;
  category:          string;
  duration_minutes:  number;
  exercises:         PlannedExercise[];
}

type AIWorkoutPlan = WorkoutPlan;

// ─── Conversational steps ─────────────────────────────────────────────────────

type StepKey =
  | "frequency"
  | "cardioDays"
  | "location"
  | "equipment"
  | "duration"
  | "durationCustom"
  | "preferredMuscles"
  | "avoidedMuscles"
  | "rpe"
  | "limitations";

interface Step {
  key:          StepKey;
  question:     string;
  options?:     string[];
  inputType:    "options" | "range" | "text" | "multiselect";
  rangeMin?:    number;
  rangeMax?:    number;
  rangeUnit?:   string;
  placeholder?: string;
  optional?:    boolean;
  multiselectItems?: string[];
}

const EQUIPMENT_LIST = [
  "ספסל לחיצה 🏋️", "סקוואט רק 🔩", "כבלים 🔗", "דמבלים 💪",
  "מוט + משקולות 🏋️", "לג פרס 🦵", "מוט מתח 🤸", "הליכון 🏃",
  "מכונת חתירה 🚣", "אליפטי 🌀", "מקבילים 🤸", "TRX",
  "כדור רפואי ⚽", "קטלבל 🔔", "מכונת פרפר 🦋", "סמית' מכונה 🏗️",
  "GHD 🔄", "ללא ציוד 🤲",
];

const MUSCLE_LIST = [
  "חזה 💪", "גב 🔙", "כתפיים 🔝", "ביצפס 💪", "טריצפס 💪",
  "בטן/ליבה 🎯", "רגליים 🦵", "ישבן 🍑", "שוקיים 👣", "אמות 🦾",
];

const STEPS: Step[] = [
  {
    key: "frequency",
    question: "כמה פעמים בשבוע תרצה/י להתאמן?",
    options: ["2 פעמים", "3 פעמים", "4 פעמים", "5 פעמים", "6 פעמים"],
    inputType: "options",
  },
  {
    key: "cardioDays",
    question: "כמה ימי אירובי תרצה/י?",
    options: ["0 ימים", "1 יום", "2 ימים", "3 ימים"],
    inputType: "options",
  },
  {
    key: "location",
    question: "איפה מתאמנים?",
    options: ["חדר כושר", "בבית", "בחוץ", "משולב"],
    inputType: "options",
  },
  {
    key: "equipment",
    question: "איזה ציוד זמין לך?",
    inputType: "multiselect",
    multiselectItems: EQUIPMENT_LIST,
  },
  {
    key: "duration",
    question: "מה אורך התוכנית?",
    options: ["שבוע אחד", "שבועיים", "3 שבועות", "חודש אחד"],
    inputType: "options",
  },
  {
    key: "durationCustom",
    question: "רוצה זמן ספציפי? (אופציונלי)",
    inputType: "text",
    placeholder: "דקות לאימון (למשל: 50)",
    optional: true,
  },
  {
    key: "preferredMuscles",
    question: "אילו שרירים לשים דגש עליהם?",
    inputType: "multiselect",
    multiselectItems: MUSCLE_LIST,
  },
  {
    key: "avoidedMuscles",
    question: "אילו שרירים לתת עדיפות נמוכה?",
    inputType: "multiselect",
    multiselectItems: MUSCLE_LIST,
  },
  {
    key: "rpe",
    question: "עוצמת מאמץ (RPE 1–10)?",
    inputType: "range",
    rangeMin: 1,
    rangeMax: 10,
    rangeUnit: "RPE",
  },
  {
    key: "limitations",
    question: "האם יש מגבלות גופניות או פציעות?",
    inputType: "text",
    placeholder: "למשל: כתף רגישה, ברכיים, גב תחתון... (אפשר לכתוב אין)",
  },
];

type Answers = Partial<Record<StepKey, string>>;

function parsePlanWeeks(durationAnswer: string | undefined): number {
  if (!durationAnswer) return 4;
  if (durationAnswer.includes("שבוע אחד")) return 1;
  if (durationAnswer.includes("שבועיים")) return 2;
  if (durationAnswer.includes("3 שבועות")) return 3;
  return 4;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SportAIPlanner() {
  const { data: prs } = usePersonalRecords();
  const addTemplate   = useAddWorkoutTemplate();

  const [step,               setStep]               = useState(0);
  const [answers,            setAnswers]            = useState<Answers>({});
  const [textInput,          setTextInput]          = useState("");
  const [rangeValue,         setRangeValue]         = useState<Record<string, number>>({ rpe: 7 });
  const [loading,            setLoading]            = useState(false);
  const [plan,               setPlan]               = useState<AIWorkoutPlan | null>(null);
  const [equipmentSelection, setEquipmentSelection] = useState<string[]>([]);
  const [preferredMuscles,   setPreferredMuscles]   = useState<string[]>([]);
  const [avoidedMuscles,     setAvoidedMuscles]     = useState<string[]>([]);
  const [pendingOption,      setPendingOption]      = useState<string | null>(null);

  const currentStep = STEPS[step];
  const allAnswered = step >= STEPS.length;

  const recordAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
    setTextInput("");
  };

  const handleOptionSelect = (option: string) => {
    // For cardioDays: block selection if it exceeds training frequency
    if (currentStep.key === "cardioDays") {
      const freqNum = parseInt(answers.frequency ?? "0") || 0;
      const cardioNum = parseInt(option) || 0;
      if (freqNum > 0 && cardioNum >= freqNum) {
        setPendingOption(option);
        return; // show warning, don't advance
      }
    }
    setPendingOption(null);
    recordAnswer(option);
    setStep((s) => s + 1);
  };

  const handleRangeNext = () => {
    const val = rangeValue[currentStep.key] ?? currentStep.rangeMin ?? 0;
    recordAnswer(`${val} ${currentStep.rangeUnit}`);
    setStep((s) => s + 1);
  };

  const handleTextNext = () => {
    if (!currentStep.optional && !textInput.trim()) {
      toast.error("נא למלא תשובה");
      return;
    }
    recordAnswer(textInput.trim());
    setStep((s) => s + 1);
  };

  const handleMultiselectNext = () => {
    // multiselect always allows proceeding (0 selections = no preference)
    setStep((s) => s + 1);
  };

  const toggleMultiselect = (item: string, key: StepKey) => {
    if (key === "equipment") {
      setEquipmentSelection((prev) =>
        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
      );
    } else if (key === "preferredMuscles") {
      setPreferredMuscles((prev) =>
        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
      );
    } else if (key === "avoidedMuscles") {
      setAvoidedMuscles((prev) =>
        prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
      );
    }
  };

  const getMultiselectState = (key: StepKey): string[] => {
    if (key === "equipment") return equipmentSelection;
    if (key === "preferredMuscles") return preferredMuscles;
    if (key === "avoidedMuscles") return avoidedMuscles;
    return [];
  };

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const planWeeks = parsePlanWeeks(answers.duration);
      const sessionMinutes = answers.durationCustom
        ? parseInt(answers.durationCustom) || 60
        : 60;
      const cardioDaysNum = parseInt(answers.cardioDays ?? "0") || 0;

      const result = await generateWorkoutPlan({
        goal:            `${answers.location ?? "חדר כושר"} — RPE ${answers.rpe ?? "7"}`,
        daysPerWeek:     parseInt(answers.frequency ?? "3"),
        equipment:       equipmentSelection.length > 0 ? equipmentSelection.join(", ") : (answers.location ?? "חדר כושר מלא"),
        constraints:     answers.limitations ?? "אין",
        sessionMinutes,
        cardioDays:      cardioDaysNum,
        preferredMuscles: preferredMuscles.length > 0 ? preferredMuscles : undefined,
        avoidedMuscles:   avoidedMuscles.length > 0 ? avoidedMuscles : undefined,
        recentPRs:       (prs || []).slice(0, 6).map((p: any) => ({
          exercise_name: p.exercise_name,
          value:         p.value,
          unit:          p.unit ?? "",
        })),
        // New fields
        planWeeks,
        equipmentList: equipmentSelection.length > 0 ? equipmentSelection : undefined,
      } as any);

      if (!result.workouts && (!result.weeks || !Array.isArray(result.weeks))) {
        throw new Error("מבנה לא תקין");
      }

      setPlan(result);
      toast.success("התוכנית מוכנה! 💪");
    } catch (e: any) {
      console.error("Workout plan error:", e);
      toast.error("שגיאה ביצירת התוכנית — נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = (w: PlannedWorkout) => {
    addTemplate.mutate(
      {
        name:                       w.name,
        category:                   w.category,
        estimated_duration_minutes: w.duration_minutes,
        // Normalize reps: AI may return "8-10" strings → parse to integer (use lower bound)
        exercises: w.exercises.map((ex) => ({
          ...ex,
          reps: typeof ex.reps === "string" ? (parseInt(ex.reps as string) || 10) : (ex.reps ?? 10),
          sets: typeof ex.sets === "string" ? (parseInt(ex.sets as string) || 3) : (ex.sets ?? 3),
        })) as any,
      },
      {
        onSuccess: () => toast.success(`"${w.name}" נשמר כתבנית`),
        onError:   (e: any) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setTextInput("");
    setRangeValue({ rpe: 7 });
    setPlan(null);
    setEquipmentSelection([]);
    setPreferredMuscles([]);
    setAvoidedMuscles([]);
    setPendingOption(null);
  };

  // Cardio warning helpers
  const frequencyNum = parseInt(answers.frequency ?? "0") || 0;

  return (
    <div
      className="rounded-3xl bg-white/8 backdrop-blur-md border border-sport/35 shadow-[0_0_30px_rgba(0,255,135,0.12)] p-4 space-y-4"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-sport/20 border border-sport/30 flex items-center justify-center shadow-[0_0_16px_rgba(0,255,135,0.25)]">
          <Sparkles className="h-5 w-5 text-sport" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white tracking-tight">תכנון אימונים AI</h3>
          <p className="text-[11px] text-white/40">תוכנית מותאמת אישית — שלב אחרי שלב</p>
        </div>
      </div>

      {/* Step progress bar */}
      {!plan && (
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step
                  ? "bg-sport shadow-[0_0_6px_rgba(0,255,135,0.5)]"
                  : i === step
                  ? "bg-sport/40"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {/* Question steps */}
      {!allAnswered && !plan && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-white">{currentStep.question}</p>

          {currentStep.inputType === "options" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {currentStep.options!.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className="py-3 rounded-2xl text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:border-sport/40 hover:bg-sport/10 hover:text-sport transition-all min-h-[44px]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {/* Cardio warning */}
              {currentStep.key === "cardioDays" && pendingOption !== null && frequencyNum > 0 && (parseInt(pendingOption) || 0) >= frequencyNum && (
                <p className="text-amber-400 text-sm mt-2">
                  ⚠️ ימי האירובי לא יכולים לעלות על ימי האימון הכוללים ({frequencyNum}) — בחר/י {frequencyNum - 1} ימים לכל היותר
                </p>
              )}
            </>
          )}

          {currentStep.inputType === "multiselect" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {currentStep.multiselectItems!.map((item) => {
                  const selected = getMultiselectState(currentStep.key).includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleMultiselect(item, currentStep.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selected
                          ? "border-sport bg-sport/20 text-sport"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-sport/30 hover:text-white/80"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleMultiselectNext}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sport/15 border border-sport/20 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[44px]"
              >
                המשך <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {currentStep.inputType === "range" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30">{currentStep.rangeMin} {currentStep.rangeUnit}</span>
                <span className="text-2xl font-black text-sport">
                  {rangeValue[currentStep.key] ?? currentStep.rangeMin} {currentStep.rangeUnit}
                </span>
                <span className="text-xs text-white/30">{currentStep.rangeMax} {currentStep.rangeUnit}</span>
              </div>
              <input
                type="range"
                min={currentStep.rangeMin}
                max={currentStep.rangeMax}
                value={rangeValue[currentStep.key] ?? currentStep.rangeMin}
                onChange={(e) => setRangeValue((prev) => ({ ...prev, [currentStep.key]: parseInt(e.target.value) }))}
                className="w-full accent-sport"
              />
              <button
                onClick={handleRangeNext}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sport/15 border border-sport/20 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[44px]"
              >
                המשך <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {currentStep.inputType === "text" && (
            <div className="space-y-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={currentStep.placeholder}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sport/40 resize-none"
              />
              <button
                onClick={handleTextNext}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sport/15 border border-sport/20 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[44px]"
              >
                {currentStep.optional ? "דלג / המשך" : "המשך"} <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronRight className="h-3 w-3" /> חזור
            </button>
          )}
        </div>
      )}

      {/* Summary + Generate */}
      {allAnswered && !plan && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-1.5">
            <p className="text-[11px] font-bold text-sport uppercase tracking-widest mb-2">סיכום הבחירות שלך</p>
            {STEPS.filter((s) => s.inputType !== "multiselect").map((s) => (
              <div key={s.key} className="flex items-center justify-between text-[11px]">
                <span className="text-white/40">{s.question.replace("?", "")}</span>
                <span className="font-semibold text-white">{answers[s.key] || "—"}</span>
              </div>
            ))}
            {equipmentSelection.length > 0 && (
              <div className="flex items-start justify-between text-[11px]">
                <span className="text-white/40">ציוד</span>
                <span className="font-semibold text-white text-left max-w-[60%]">{equipmentSelection.join(", ")}</span>
              </div>
            )}
            {preferredMuscles.length > 0 && (
              <div className="flex items-start justify-between text-[11px]">
                <span className="text-white/40">דגש</span>
                <span className="font-semibold text-white text-left max-w-[60%]">{preferredMuscles.join(", ")}</span>
              </div>
            )}
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sport text-sport-foreground font-bold text-sm min-h-[50px] disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,135,0.3)] active:scale-[0.98] transition-transform"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> בונה תוכנית...</>
              : <><Sparkles className="h-4 w-4" /> צור תוכנית</>}
          </button>

          <button onClick={reset} className="w-full text-[11px] text-white/30 hover:text-white/60 transition-colors">
            התחל מחדש
          </button>
        </div>
      )}

      {/* Generated plan — timeline layout */}
      {plan && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-sport/10 border border-sport/20 p-3">
            <p className="text-xs text-white/80 leading-relaxed">{plan.summary}</p>
          </div>

          <div className="space-y-2">
            {/* Render workouts: prefer weeks[0] (new multi-week structure), fall back to flat workouts array */}
            {(plan.weeks && plan.weeks.length > 0 ? plan.weeks[0].workouts : (plan.workouts ?? [])).map((w, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-6 w-6 rounded-lg bg-sport/20 flex items-center justify-center shrink-0">
                      <Calendar className="h-3 w-3 text-sport" />
                    </div>
                    <p className="text-xs font-bold text-white truncate">{w.day} · {w.name}</p>
                  </div>
                  <span className="text-[10px] text-white/40 shrink-0">{w.duration_minutes} דק'</span>
                </div>
                <div className="space-y-1.5 border-t border-white/5 pt-2">
                  {w.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-center justify-between text-[11px] border-r-2 border-sport/35 pr-2">
                      <span className="font-medium text-white/80 truncate">{ex.name}</span>
                      <span className="text-white/40 shrink-0 ms-2">
                        {ex.sets}×{ex.reps}{ex.weight_kg ? ` @${ex.weight_kg}kg` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => saveAsTemplate(w)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sport/15 border border-sport/20 text-sport text-[11px] font-bold hover:bg-sport/25 transition-colors"
                >
                  <Save className="h-3 w-3" /> שמור כתבנית
                </button>
              </div>
            ))}
          </div>

          {plan.tips.length > 0 && (
            <div className="rounded-2xl bg-sport/10 border border-sport/20 p-3.5 space-y-1.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-sport mb-1">💡 טיפים</p>
              {plan.tips.map((t, i) => (
                <p key={i} className="text-[11px] text-white/60 leading-relaxed">• {t}</p>
              ))}
            </div>
          )}

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-sport" /> צור תוכנית חדשה
          </button>
        </div>
      )}
    </div>
  );
}
