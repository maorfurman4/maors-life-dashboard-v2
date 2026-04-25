import { useState } from "react";
import { Sparkles, Loader2, Calendar, Save, ChevronRight, ChevronLeft } from "lucide-react";
import { generateText, parseGeminiJson } from "@/lib/gemini";
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

interface AIWorkoutPlan {
  summary:  string;
  workouts: PlannedWorkout[];
  tips:     string[];
}

// ─── Conversational steps ─────────────────────────────────────────────────────

type StepKey = "frequency" | "location" | "duration" | "rpe" | "limitations";

interface Step {
  key:         StepKey;
  question:    string;
  options?:    string[];
  inputType:   "options" | "range" | "text";
  rangeMin?:   number;
  rangeMax?:   number;
  rangeUnit?:  string;
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    key: "frequency",
    question: "כמה פעמים בשבוע תרצה/י להתאמן?",
    options: ["2 פעמים", "3 פעמים", "4 פעמים", "5 פעמים", "6 פעמים"],
    inputType: "options",
  },
  {
    key: "location",
    question: "איפה מתאמנים?",
    options: ["חדר כושר", "בבית", "בחוץ", "משולב"],
    inputType: "options",
  },
  {
    key: "duration",
    question: "כמה דקות לאימון?",
    inputType: "range",
    rangeMin: 20,
    rangeMax: 120,
    rangeUnit: "דק'",
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

// ─── Gemini prompt builder ────────────────────────────────────────────────────

function buildWorkoutPrompt(answers: Answers, prs: any[]): string {
  const daysPerWeek = parseInt(answers.frequency ?? "3");
  const prText = prs.length > 0
    ? `\nשיאים אישיים של המשתמש: ${prs.slice(0, 6).map((p: any) => `${p.exercise_name}: ${p.value}${p.unit ?? ""}`).join(", ")}`
    : "";

  return `אתה מאמן כושר מקצועי ישראלי. צור תוכנית אימונים שבועית מותאמת אישית בפורמט JSON בלבד.

פרמטרים:
- תדירות: ${answers.frequency}
- מיקום: ${answers.location}
- משך אימון: ${answers.duration}
- עוצמה (RPE): ${answers.rpe}
- מגבלות: ${answers.limitations}${prText}

החזר JSON בפורמט הבא בדיוק:
{
  "summary": "תיאור קצר של התוכנית (2 משפטים בעברית)",
  "workouts": [
    {
      "day": "יום ראשון",
      "name": "שם האימון בעברית",
      "category": "כוח / קרדיו / גמישות / משולב",
      "duration_minutes": ${answers.duration?.split(" ")[0] ?? 60},
      "exercises": [
        {
          "name": "שם התרגיל בעברית",
          "sets": 3,
          "reps": "8-12",
          "weight_kg": null,
          "notes": "הנחיה קצרה אם צריך"
        }
      ]
    }
  ],
  "tips": ["טיפ 1 בעברית", "טיפ 2 בעברית", "טיפ 3 בעברית"]
}

כללים:
- צור בדיוק ${daysPerWeek} אימונים (אחד לכל יום אימון)
- כל אימון יכיל 4–7 תרגילים מתאימים למיקום (${answers.location})
- התחשב במגבלות: ${answers.limitations}
- שמות תרגילים בעברית
- weight_kg: null אם לא ידוע
- ימי מנוחה לא מופיעים ברשימה
- ללא markdown, JSON תקין בלבד`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SportAIPlanner() {
  const { data: prs } = usePersonalRecords();
  const addTemplate   = useAddWorkoutTemplate();

  const [step,       setStep]       = useState(0);
  const [answers,    setAnswers]    = useState<Answers>({});
  const [textInput,  setTextInput]  = useState("");
  const [rangeValue, setRangeValue] = useState<Record<string, number>>({ duration: 60, rpe: 7 });
  const [loading,    setLoading]    = useState(false);
  const [plan,       setPlan]       = useState<AIWorkoutPlan | null>(null);

  const currentStep = STEPS[step];
  const allAnswered = step >= STEPS.length;

  const recordAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
    setTextInput("");
  };

  const handleOptionSelect = (option: string) => {
    recordAnswer(option);
    setStep((s) => s + 1);
  };

  const handleRangeNext = () => {
    const val = rangeValue[currentStep.key] ?? currentStep.rangeMin ?? 0;
    recordAnswer(`${val} ${currentStep.rangeUnit}`);
    setStep((s) => s + 1);
  };

  const handleTextNext = () => {
    if (!textInput.trim()) { toast.error("נא למלא תשובה"); return; }
    recordAnswer(textInput.trim());
    setStep((s) => s + 1);
  };

  // ── Generate via Gemini directly (no Edge Function) ──
  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const prompt = buildWorkoutPrompt(answers, prs || []);
      const raw    = await generateText(prompt);
      const parsed = parseGeminiJson<AIWorkoutPlan>(raw);

      if (!parsed.workouts || !Array.isArray(parsed.workouts)) throw new Error("מבנה JSON לא תקין");

      setPlan(parsed);
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
        exercises:                  w.exercises as any,
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
    setPlan(null);
  };

  return (
    <div className="rounded-2xl border border-sport/30 bg-gradient-to-br from-sport/5 to-transparent p-4 space-y-3" dir="rtl">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-sport/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-sport" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>תכנון אימונים AI</h3>
          <p className="text-[11px] text-muted-foreground">תוכנית מותאמת אישית — שלב אחרי שלב</p>
        </div>
      </div>

      {/* Step progress */}
      {!plan && (
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? "bg-sport" : i === step ? "bg-sport/50" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}

      {/* Questions */}
      {!allAnswered && !plan && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">{currentStep.question}</p>

          {currentStep.inputType === "options" && (
            <div className="grid grid-cols-2 gap-2">
              {currentStep.options!.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className="py-2.5 rounded-xl text-xs font-semibold border border-border bg-secondary/30 hover:border-sport/40 hover:bg-sport/10 hover:text-sport transition-colors min-h-[40px]"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentStep.inputType === "range" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{currentStep.rangeMin} {currentStep.rangeUnit}</span>
                <span className="text-lg font-black text-sport">
                  {rangeValue[currentStep.key] ?? currentStep.rangeMin} {currentStep.rangeUnit}
                </span>
                <span className="text-xs text-muted-foreground">{currentStep.rangeMax} {currentStep.rangeUnit}</span>
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sport/15 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[40px]"
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
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sport resize-none"
              />
              <button
                onClick={handleTextNext}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sport/15 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[40px]"
              >
                המשך <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-3 w-3" /> חזור
            </button>
          )}
        </div>
      )}

      {/* Summary + Generate */}
      {allAnswered && !plan && (
        <div className="space-y-3">
          <div className="rounded-xl bg-secondary/30 border border-border p-3 space-y-1.5">
            <p className="text-[11px] font-bold text-sport mb-1">סיכום הבחירות שלך</p>
            {STEPS.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{s.question.replace("?", "")}</span>
                <span className="font-semibold">{answers[s.key]}</span>
              </div>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm min-h-[48px] disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> בונה תוכנית...</>
              : <><Sparkles className="h-4 w-4" /> צור תוכנית</>}
          </button>

          <button onClick={reset} className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            התחל מחדש
          </button>
        </div>
      )}

      {/* Generated plan */}
      {plan && (
        <div className="space-y-3">
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-xs leading-relaxed">{plan.summary}</p>
          </div>

          <div className="space-y-2">
            {plan.workouts.map((w, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Calendar className="h-3.5 w-3.5 text-sport shrink-0" />
                    <p className="text-xs font-bold truncate">{w.day} · {w.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{w.duration_minutes} דק'</span>
                </div>
                <div className="space-y-1">
                  {w.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-center justify-between text-[11px] border-r-2 border-sport/30 pr-2">
                      <span className="font-medium truncate">{ex.name}</span>
                      <span className="text-muted-foreground shrink-0 ms-2">
                        {ex.sets}×{ex.reps}{ex.weight_kg ? ` @${ex.weight_kg}kg` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => saveAsTemplate(w)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-sport/15 text-sport text-[11px] font-semibold hover:bg-sport/25"
                >
                  <Save className="h-3 w-3" /> שמור כתבנית
                </button>
              </div>
            ))}
          </div>

          {plan.tips.length > 0 && (
            <div className="rounded-xl bg-sport/5 border border-sport/20 p-3 space-y-1">
              <p className="text-[11px] font-bold text-sport mb-1">💡 טיפים</p>
              {plan.tips.map((t, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">• {t}</p>
              ))}
            </div>
          )}

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary/40 text-xs font-semibold"
          >
            <Sparkles className="h-3 w-3" /> צור תוכנית חדשה
          </button>
        </div>
      )}
    </div>
  );
}
