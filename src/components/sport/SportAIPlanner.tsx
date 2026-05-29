import { useState, useEffect } from "react";
import { Sparkles, Calendar, Save, ChevronRight, ChevronLeft, BookmarkCheck } from "lucide-react";
import { generateWorkoutPlan, WorkoutPlan } from "@/lib/ai-service";
import { usePersonalRecords, useAddWorkoutTemplate } from "@/hooks/use-sport-data";
import { useSaveWorkoutPlan } from "@/hooks/useAiPlanner";
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

// ─── Equipment Image Items ────────────────────────────────────────────────────

interface EquipmentImageItem {
  value: string;   // must match exercise-library equipment[] values
  label: string;   // Hebrew display name
  image: string;   // path under /public
}

const GYM_IMAGE_ITEMS: EquipmentImageItem[] = [
  { value: "ספסל לחיצה",    label: "ספסל לחיצה",        image: "/assets/equipment/chest-press.jpg" },
  { value: "רחב-גב",         label: "רחב-גב (Lat Pull)",  image: "/assets/equipment/lat-pulldown.jpg" },
  { value: "לג פרס",         label: "לג פרס",             image: "/assets/equipment/leg-press.jpg" },
  { value: "כבלים",          label: "כבלים",              image: "/assets/equipment/cables.jpg" },
  { value: "סקוואט רק",      label: "סקוואט רק",          image: "/assets/equipment/squat-rack.jpg" },
  { value: "Hack Squat",     label: "Hack Squat",          image: "/assets/equipment/hack-squat.jpg" },
  { value: "כפיפות רגל",     label: "כפיפות רגל",         image: "/assets/equipment/leg-curl.jpg" },
  { value: "פשיטות רגל",     label: "פשיטות רגל",         image: "/assets/equipment/leg-extension.jpg" },
  { value: "פרפר מכונה",     label: "פרפר מכונה",         image: "/assets/equipment/pec-deck.jpg" },
  { value: "חתירה בישיבה",   label: "חתירה בישיבה",       image: "/assets/equipment/seated-row.jpg" },
  { value: "סמית' מכונה",    label: "סמית' מכונה",        image: "/assets/equipment/smith-machine.jpg" },
  { value: "מוט + משקולות",  label: "מוט + משקולות",      image: "/assets/equipment/barbell.jpg" },
  { value: "דמבלים",         label: "דמבלים",             image: "/assets/equipment/dumbbells.jpg" },
  { value: "מוט מתח",        label: "מוט מתח",            image: "/assets/equipment/pullups.jpg" },
  { value: "מקבילים",        label: "מקבילים",            image: "/assets/equipment/dips.jpg" },
  { value: "GHD",            label: "GHD",                 image: "/assets/equipment/machine.jpg" },
  { value: "הליכון",         label: "הליכון",             image: "/assets/equipment/treadmill.jpg" },
  { value: "מכונת חתירה",   label: "מכונת חתירה",        image: "/assets/equipment/rowing-machine.jpg" },
  { value: "קטלבל",          label: "קטלבל",              image: "/assets/equipment/kettlebell.jpg" },
  { value: "ללא ציוד",       label: "ללא ציוד",           image: "/assets/equipment/mat.jpg" },
];

const HOME_IMAGE_ITEMS: EquipmentImageItem[] = [
  { value: "דמבלים",   label: "דמבלים",              image: "/assets/equipment/dumbbells.jpg" },
  { value: "מוט מתח",  label: "מוט מתח",             image: "/assets/equipment/pullups.jpg" },
  { value: "מקבילים",  label: "מקבילים",             image: "/assets/equipment/dips.jpg" },
  { value: "TRX",      label: "TRX / טבעות",          image: "/assets/equipment/rings.jpg" },
  { value: "קטלבל",    label: "קטלבל",               image: "/assets/equipment/kettlebell.jpg" },
  { value: "גומייה",   label: "גומיות התנגדות",       image: "/assets/equipment/resistance-band.jpg" },
  { value: "ספסל",     label: "ספסל",                 image: "/assets/equipment/bench.jpg" },
  { value: "ללא ציוד", label: "ללא ציוד — גוף בלבד", image: "/assets/equipment/mat.jpg" },
];

const OUTDOOR_IMAGE_ITEMS: EquipmentImageItem[] = [
  { value: "מוט מתח",  label: "מוט מתח",        image: "/assets/equipment/pullups.jpg" },
  { value: "מקבילים",  label: "מקבילים",        image: "/assets/equipment/dips.jpg" },
  { value: "גומייה",   label: "גומיות התנגדות",  image: "/assets/equipment/resistance-band.jpg" },
  { value: "קטלבל",    label: "קטלבל",          image: "/assets/equipment/kettlebell.jpg" },
  { value: "ללא ציוד", label: "ללא ציוד — פארק", image: "/assets/equipment/mat.jpg" },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

type StepKey =
  | "goal"
  | "strengthLevel"
  | "frequency"
  | "cardioDays"
  | "cardioType"
  | "cardioFitnessLevel"
  | "lastRunKm"
  | "lastRunPace"
  | "location"
  | "gymEquipment"
  | "homeEquipment"
  | "splitType"
  | "duration"
  | "durationCustom"
  | "restBetweenSets"
  | "preferredMuscles"
  | "avoidedMuscles"
  | "rpe"
  | "limitations";

interface Step {
  key:               StepKey;
  question:          string;
  options?:          string[];
  inputType:         "options" | "range" | "text" | "multiselect" | "imagepicker" | "numberbuttons";
  rangeMin?:         number;
  rangeMax?:         number;
  rangeUnit?:        string;
  placeholder?:      string;
  optional?:         boolean;
  multiselectItems?: string[];
  imageItems?:       EquipmentImageItem[];
  wideOptions?:      boolean;
}

const MUSCLE_LIST = [
  "חזה 💪", "גב 🔙", "כתפיים 🔝", "ביצפס 💪", "טריצפס 💪",
  "בטן/ליבה 🎯", "רגליים 🦵", "ישבן 🍑", "שוקיים 👣", "אמות 🦾",
];

const STEPS: Step[] = [
  // ── 1. מטרת אימון ──
  {
    key:       "goal",
    question:  "מה המטרה הראשית שלך?",
    options:   ["עלייה במסת שריר 💪", "שריפת שומן 🔥", "כוח מקסימלי 🏋️", "שיפור סיבולת 🏃"],
    inputType: "options",
  },
  // ── 2. רמת ניסיון ──
  {
    key:       "strengthLevel",
    question:  "מה רמת הניסיון שלך באימוני כוח?",
    options:   ["מתחיל — פחות משנה", "בינוני — 1–3 שנים", "מתקדם — 3+ שנים"],
    inputType: "options",
  },
  // ── 3. תדירות — עד 7 ──
  {
    key:       "frequency",
    question:  "כמה פעמים בשבוע תרצה/י להתאמן?",
    options:   ["2 פעמים", "3 פעמים", "4 פעמים", "5 פעמים", "6 פעמים", "7 פעמים"],
    inputType: "options",
  },
  // ── 4. ימי אירובי — כפתורי מספרים ──
  {
    key:       "cardioDays",
    question:  "כמה ימי אירובי בשבוע?",
    inputType: "numberbuttons",
    rangeMin:  0,
    rangeMax:  7,
    rangeUnit: "ימים",
  },
  // ── 5. סוג אירובי (conditional) ──
  {
    key:       "cardioType",
    question:  "מה סוג האירובי המועדף?",
    options:   ["ריצה 🏃", "אופניים 🚴", "חתירה 🚣", "HIIT 🔥", "הליכה מהירה 🚶", "אליפטי 🌀"],
    inputType: "options",
  },
  // ── 6. רמת כושר אירובי (conditional) ──
  {
    key:       "cardioFitnessLevel",
    question:  "מה רמת הכושר האירובי שלך?",
    options:   ["מתחיל", "בינוני", "מתקדם", "חוזר לאחר הפסקה"],
    inputType: "options",
  },
  // ── 7–8. נתוני ריצה (conditional, optional) ──
  {
    key:         "lastRunKm",
    question:    "מה הייתה הריצה האחרונה שלך? (ק\"מ)",
    inputType:   "text",
    placeholder: "למשל: 5.5 (אפשר לדלג)",
    optional:    true,
  },
  {
    key:         "lastRunPace",
    question:    "מה היה הקצב? (דקות לק\"מ)",
    inputType:   "text",
    placeholder: "למשל: 6 (אפשר לדלג)",
    optional:    true,
  },
  // ── 9. מיקום ──
  {
    key:       "location",
    question:  "איפה מתאמנים?",
    options:   ["חדר כושר 🏢", "בבית 🏠", "בחוץ 🌳", "משולב 🔀"],
    inputType: "options",
  },
  // ── 10. ציוד חדר כושר (imagepicker, shown for gym + mixed) ──
  {
    key:        "gymEquipment",
    question:   "אילו מכונות/ציוד יש לך בחדר הכושר? (לחץ על כל מה שיש)",
    inputType:  "imagepicker",
    imageItems: GYM_IMAGE_ITEMS,
    optional:   true,
  },
  // ── 11. ציוד בית/חוץ (imagepicker, shown for home + outdoor + mixed) ──
  {
    key:        "homeEquipment",
    question:   "איזה ציוד יש לך? (לחץ על כל מה שיש)",
    inputType:  "imagepicker",
    imageItems: HOME_IMAGE_ITEMS,
    optional:   true,
  },
  // ── 12. סוג פיצול ──
  {
    key:         "splitType",
    question:    "איזה סוג חלוקת אימון אתה מעדיף?",
    options:     ["Full Body", "Upper / Lower", "A-B (שני סוגי ימים)", "A-B-C (שלושה סוגי ימים)", "Push / Pull / Legs"],
    inputType:   "options",
    wideOptions: true,
  },
  // ── 13. אורך תוכנית ──
  {
    key:       "duration",
    question:  "כמה שבועות תרצה/י את התוכנית?",
    options:   ["שבוע אחד", "שבועיים", "3 שבועות", "חודש אחד (4 שבועות)"],
    inputType: "options",
  },
  // ── 14. משך אימון (optional) ──
  {
    key:         "durationCustom",
    question:    "כמה דקות כל אימון? (אופציונלי)",
    inputType:   "text",
    placeholder: "דקות לאימון (למשל: 50)",
    optional:    true,
  },
  // ── 15. מנוחה בין סטים ──
  {
    key:       "restBetweenSets",
    question:  "כמה זמן מנוחה בין סטים?",
    options:   ["30 שניות — מהיר / HIIT", "60 שניות — בינוני", "90 שניות — כוח", "120 שניות — כוח מקסימלי"],
    inputType: "options",
  },
  // ── 16–17. שרירים ──
  {
    key:               "preferredMuscles",
    question:          "אילו שרירים לשים דגש עליהם?",
    inputType:         "multiselect",
    multiselectItems:  MUSCLE_LIST,
  },
  {
    key:               "avoidedMuscles",
    question:          "אילו שרירים לתת עדיפות נמוכה?",
    inputType:         "multiselect",
    multiselectItems:  MUSCLE_LIST,
  },
  // ── 18. RPE ──
  {
    key:       "rpe",
    question:  "עוצמת מאמץ (RPE 1–10)?",
    inputType: "range",
    rangeMin:  1,
    rangeMax:  10,
    rangeUnit: "RPE",
  },
  // ── 19. מגבלות ──
  {
    key:         "limitations",
    question:    "האם יש מגבלות גופניות או פציעות?",
    inputType:   "text",
    placeholder: "למשל: כתף רגישה, ברכיים, גב תחתון... (אפשר לכתוב אין)",
  },
];

type Answers = Partial<Record<StepKey, string>>;

const CARDIO_CONDITIONAL_KEYS: StepKey[] = ["cardioType", "cardioFitnessLevel", "lastRunKm", "lastRunPace"];

// Helper — strip emoji for location comparisons
function locIncludes(answers: Answers, keyword: string): boolean {
  return (answers.location ?? "").includes(keyword);
}

function shouldSkipStep(key: StepKey, answers: Answers): boolean {
  const cardioDays = parseInt(answers.cardioDays ?? "0") || 0;
  if (CARDIO_CONDITIONAL_KEYS.includes(key) && cardioDays === 0) return true;

  // Equipment steps shown only for relevant locations
  const isGym     = locIncludes(answers, "חדר כושר");
  const isHome    = locIncludes(answers, "בבית");
  const isOutdoor = locIncludes(answers, "בחוץ");
  const isMixed   = locIncludes(answers, "משולב");

  if (key === "gymEquipment"  && !isGym  && !isMixed) return true;
  if (key === "homeEquipment" && !isHome && !isOutdoor && !isMixed) return true;

  return false;
}

function nextStepIdx(current: number, answers: Answers): number {
  let next = current + 1;
  while (next < STEPS.length && shouldSkipStep(STEPS[next].key, answers)) next++;
  return next;
}

function prevStepIdx(current: number, answers: Answers): number {
  let prev = current - 1;
  while (prev >= 0 && shouldSkipStep(STEPS[prev].key, answers)) prev--;
  return Math.max(0, prev);
}

function parsePlanWeeks(ans: string | undefined): number {
  if (!ans) return 4;
  if (ans.includes("שבוע אחד")) return 1;
  if (ans.includes("שבועיים")) return 2;
  if (ans.includes("3 שבועות")) return 3;
  return 4;
}

const PROGRESS_STAGES = [
  { threshold: 20,  label: "מנתח פרופיל..." },
  { threshold: 50,  label: "בונה מבנה שבועי..." },
  { threshold: 80,  label: "מתאים תרגילים..." },
  { threshold: 99,  label: "מסיים ובודק..." },
  { threshold: 101, label: "✓ התוכנית מוכנה!" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SportAIPlanner() {
  const { data: prs } = usePersonalRecords();
  const addTemplate   = useAddWorkoutTemplate();
  const savePlan      = useSaveWorkoutPlan();

  const [step,                  setStep]                 = useState(0);
  const [answers,               setAnswers]              = useState<Answers>({});
  const [textInput,             setTextInput]            = useState("");
  const [rangeValue,            setRangeValue]           = useState<Record<string, number>>({ rpe: 7, cardioDays: 0 });
  const [loading,               setLoading]              = useState(false);
  const [plan,                  setPlan]                 = useState<AIWorkoutPlan | null>(null);
  const [gymEquipmentSelection, setGymEquipmentSelection] = useState<string[]>([]);
  const [homeEquipmentSelection,setHomeEquipmentSelection] = useState<string[]>([]);
  const [preferredMuscles,      setPreferredMuscles]     = useState<string[]>([]);
  const [avoidedMuscles,        setAvoidedMuscles]       = useState<string[]>([]);
  const [progress,              setProgress]             = useState(0);
  const [progressLabel,         setProgressLabel]        = useState("מנתח פרופיל...");

  const currentStep  = STEPS[step];
  const allAnswered  = step >= STEPS.length;
  const frequencyNum = parseInt(answers.frequency ?? "3") || 3;

  // Animated progress bar
  useEffect(() => {
    if (!loading) return;
    const startTime   = Date.now();
    const fakeDuration = 15000;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct     = Math.min(99, Math.floor((elapsed / fakeDuration) * 100));
      setProgress(pct);
      const stage = PROGRESS_STAGES.find((s) => pct < s.threshold) ?? PROGRESS_STAGES[PROGRESS_STAGES.length - 1];
      setProgressLabel(stage.label);
    }, 200);
    return () => clearInterval(timer);
  }, [loading]);

  const advance = (newAnswers: Answers) => {
    setAnswers(newAnswers);
    setTextInput("");
    setStep((s) => nextStepIdx(s, newAnswers));
  };

  const handleOptionSelect = (option: string) => {
    const newAnswers = { ...answers, [currentStep.key]: option };
    // Rest time → warn if session will be too long
    if (currentStep.key === "restBetweenSets") {
      const restSec      = parseInt(option) || 60;
      const sessionMins  = parseInt(answers.durationCustom ?? "60") || 60;
      const estimatedSets = 18;
      const totalRestMins = (restSec * estimatedSets) / 60;
      const estimatedTotal = Math.round(totalRestMins + estimatedSets * 0.75);
      if (estimatedTotal > sessionMins * 1.2) {
        toast.warning(`⚠️ שים לב: עם זמן מנוחה זה האימון יקח כ-${estimatedTotal} דקות (בחרת ${sessionMins} דקות)`);
      }
    }
    advance(newAnswers);
  };

  // Number-buttons step uses same rangeValue + handleRangeNext
  const handleRangeNext = () => {
    let val = rangeValue[currentStep.key] ?? currentStep.rangeMin ?? 0;
    if (currentStep.key === "cardioDays") {
      val = Math.min(val, frequencyNum);
      if (val > 0 && val >= frequencyNum) {
        toast.warning(`⚠️ בחרת ${val} ימי אירובי מתוך ${frequencyNum} ימי אימון — לא נשאר יום כוח`);
      }
    }
    const newAnswers = { ...answers, [currentStep.key]: `${val} ${currentStep.rangeUnit ?? ""}`.trim() };
    advance(newAnswers);
  };

  const handleTextNext = () => {
    if (!currentStep.optional && !textInput.trim()) {
      toast.error("נא למלא תשובה");
      return;
    }
    advance({ ...answers, [currentStep.key]: textInput.trim() });
  };

  const handleMultiselectNext = () => advance({ ...answers });

  const toggleMultiselect = (item: string, key: StepKey) => {
    if (key === "preferredMuscles") {
      setPreferredMuscles((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
    } else if (key === "avoidedMuscles") {
      setAvoidedMuscles((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]);
    }
  };

  const getMultiselectState = (key: StepKey): string[] => {
    if (key === "preferredMuscles") return preferredMuscles;
    if (key === "avoidedMuscles")   return avoidedMuscles;
    return [];
  };

  const getImagePickerState = (key: StepKey): string[] => {
    if (key === "gymEquipment")  return gymEquipmentSelection;
    if (key === "homeEquipment") return homeEquipmentSelection;
    return [];
  };

  const toggleImagePicker = (value: string, key: StepKey) => {
    const setter = key === "gymEquipment" ? setGymEquipmentSelection : setHomeEquipmentSelection;
    setter((prev) => prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]);
  };

  const generate = async (extraConstraints?: string) => {
    setLoading(true);
    setProgress(0);
    setProgressLabel("מנתח פרופיל...");
    setPlan(null);
    try {
      const planWeeks         = parsePlanWeeks(answers.duration);
      const sessionMinutes    = parseInt(answers.durationCustom ?? "") || 60;
      const cardioDaysNum     = parseInt(answers.cardioDays ?? "0") || rangeValue.cardioDays || 0;
      const allEquipment      = [...gymEquipmentSelection, ...homeEquipmentSelection];
      const restBetweenSetsNum = parseInt(answers.restBetweenSets ?? "60") || 60;
      const lastRunKm         = parseFloat(answers.lastRunKm ?? "") || undefined;
      const lastRunPace       = parseFloat(answers.lastRunPace ?? "") || undefined;
      const baseConstraints   = answers.limitations ?? "אין";
      const fullConstraints   = extraConstraints
        ? `${baseConstraints}. ${extraConstraints}`
        : baseConstraints;

      const result = await generateWorkoutPlan({
        goal:               answers.goal ?? `${answers.location ?? "חדר כושר"} — RPE ${answers.rpe ?? "7"}`,
        daysPerWeek:        parseInt(answers.frequency ?? "3"),
        equipment:          allEquipment.length > 0
                              ? allEquipment.join(", ")
                              : (answers.location ?? "חדר כושר מלא"),
        constraints:        fullConstraints,
        sessionMinutes,
        cardioDays:         cardioDaysNum,
        preferredMuscles:   preferredMuscles.length > 0 ? preferredMuscles : undefined,
        avoidedMuscles:     avoidedMuscles.length > 0 ? avoidedMuscles : undefined,
        recentPRs:          (prs || []).slice(0, 6).map((p: any) => ({
          exercise_name: p.exercise_name,
          value:         p.value,
          unit:          p.unit ?? "",
        })),
        planWeeks,
        equipmentList:        allEquipment.length > 0 ? allEquipment : undefined,
        splitType:            answers.splitType,
        restBetweenSets:      restBetweenSetsNum,
        cardioFitnessLevel:   answers.cardioFitnessLevel,
        lastRunData:          lastRunKm ? { distanceKm: lastRunKm, paceMinPerKm: lastRunPace } : undefined,
        // v5 params
        goalType:             answers.goal,
        strengthLevel:        answers.strengthLevel,
        preferredCardioType:  answers.cardioType,
      });

      if (!result.workouts && (!result.weeks || !Array.isArray(result.weeks))) {
        throw new Error("מבנה לא תקין");
      }

      setProgress(100);
      setProgressLabel("✓ התוכנית מוכנה!");
      setPlan(result);
      toast.success("התוכנית מוכנה! 💪");
    } catch (e: any) {
      console.error("Workout plan error:", e);
      setProgress(0);
      setProgressLabel("מנתח פרופיל...");
      toast.error("שגיאה ביצירת התוכנית — נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const generateWithTweak = (tweak: string) => generate(tweak);

  const saveAsTemplate = (w: PlannedWorkout) => {
    addTemplate.mutate(
      {
        name:                       w.name,
        category:                   w.category,
        estimated_duration_minutes: w.duration_minutes,
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

  const saveFullPlan = () => {
    if (!plan) return;
    savePlan.mutate(
      {
        name:       `תוכנית ${new Date().toLocaleDateString("he-IL")}`,
        goal:       answers.goal ?? undefined,
        split_type: answers.splitType ?? undefined,
        weeks:      plan.weeks && plan.weeks.length > 0
                      ? plan.weeks
                      : [{ week: 1, workouts: plan.workouts ?? [] }],
        tips:       plan.tips,
      },
      {
        onSuccess: () => toast.success("התוכנית נשמרה! 📋"),
        onError:   (e: any) => toast.error("שגיאה בשמירה: " + e.message),
      }
    );
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setTextInput("");
    setRangeValue({ rpe: 7, cardioDays: 0 });
    setPlan(null);
    setGymEquipmentSelection([]);
    setHomeEquipmentSelection([]);
    setPreferredMuscles([]);
    setAvoidedMuscles([]);
    setProgress(0);
    setProgressLabel("מנתח פרופיל...");
  };

  // Active steps for progress dots
  const activeSteps     = STEPS.filter((s) => !shouldSkipStep(s.key, answers));
  const activeStepIndex = STEPS.slice(0, step).filter((s) => !shouldSkipStep(s.key, answers)).length;

  // Dynamic question for homeEquipment based on location
  const homeEquipmentQuestion = locIncludes(answers, "בחוץ")
    ? "עם איזה ציוד אתה מתאמן בחוץ? (לחץ על כל מה שיש)"
    : locIncludes(answers, "משולב")
    ? "ועכשיו — איזה ציוד יש לך בבית?"
    : "איזה ציוד יש לך בבית? (לחץ על כל מה שיש)";

  const homeEquipmentItems = locIncludes(answers, "בחוץ") ? OUTDOOR_IMAGE_ITEMS : HOME_IMAGE_ITEMS;

  return (
    <div
      className="rounded-3xl bg-white/8 backdrop-blur-md border border-sport/35 shadow-[0_0_30px_rgba(0,255,135,0.12)] p-4 space-y-4"
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

      {/* Step progress dots */}
      {!plan && !loading && (
        <div className="flex gap-1">
          {activeSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < activeStepIndex
                  ? "bg-sport shadow-[0_0_6px_rgba(0,255,135,0.5)]"
                  : i === activeStepIndex
                  ? "bg-sport/40"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {/* Question steps */}
      {!allAnswered && !plan && !loading && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-white">
            {currentStep.key === "homeEquipment" ? homeEquipmentQuestion : currentStep.question}
          </p>

          {/* Options */}
          {currentStep.inputType === "options" && (
            <div className={`grid gap-2 ${currentStep.wideOptions ? "grid-cols-1" : "grid-cols-2"}`}>
              {currentStep.options!.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className="py-3 px-3 rounded-2xl text-xs font-semibold border border-white/10 bg-white/5 text-white/70 hover:border-sport/40 hover:bg-sport/10 hover:text-sport transition-all min-h-[44px] text-end"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Number buttons (cardioDays) */}
          {currentStep.inputType === "numberbuttons" && (() => {
            const max     = currentStep.key === "cardioDays" ? frequencyNum : (currentStep.rangeMax ?? 7);
            const current = Math.min(rangeValue[currentStep.key] ?? 0, max);
            return (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap justify-center">
                  {Array.from({ length: max + 1 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setRangeValue((prev) => ({ ...prev, [currentStep.key]: i }))}
                      className={`h-14 w-14 rounded-2xl text-lg font-black transition-all ${
                        i === current
                          ? "bg-sport text-sport-foreground shadow-[0_0_20px_rgba(0,255,135,0.4)]"
                          : "bg-white/5 border border-white/10 text-white/60 hover:border-sport/40 hover:text-white"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-white/40">
                  {current === 0
                    ? "רק אימוני כוח"
                    : `${current} מתוך ${frequencyNum} ימי אימון יהיו אירובי`}
                </p>
                <button
                  onClick={handleRangeNext}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sport/15 border border-sport/20 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[44px]"
                >
                  המשך <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })()}

          {/* Image Picker */}
          {currentStep.inputType === "imagepicker" && (() => {
            const items    = currentStep.key === "homeEquipment" ? homeEquipmentItems : currentStep.imageItems!;
            const selected = getImagePickerState(currentStep.key);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pb-1">
                  {items.map((item) => {
                    const isSelected = selected.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        onClick={() => toggleImagePicker(item.value, currentStep.key)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-sport shadow-[0_0_12px_rgba(0,255,135,0.4)]"
                            : "border-white/10 hover:border-white/30"
                        }`}
                        style={{ aspectRatio: "1" }}
                      >
                        <img
                          src={item.image}
                          alt={item.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.style.background = "rgba(255,255,255,0.05)";
                            }
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-sport/30 flex items-center justify-center">
                            <div className="h-7 w-7 rounded-full bg-sport flex items-center justify-center">
                              <span className="text-black text-sm font-black">✓</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-1 py-1.5">
                          <p className="text-[9px] text-white font-bold text-center leading-tight">{item.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleMultiselectNext}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sport/15 border border-sport/20 text-sport text-xs font-bold hover:bg-sport/25 transition-colors min-h-[44px]"
                >
                  {selected.length > 0
                    ? `${selected.length} נבחרו · המשך`
                    : "דלג / המשך"}
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })()}

          {/* Multiselect */}
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

          {/* Range (RPE) */}
          {currentStep.inputType === "range" && (() => {
            const effectiveMax = currentStep.rangeMax!;
            const effectiveVal = Math.min(rangeValue[currentStep.key] ?? currentStep.rangeMin ?? 0, effectiveMax);
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">{currentStep.rangeMin} {currentStep.rangeUnit}</span>
                  <span className="text-2xl font-black text-sport">
                    {effectiveVal} {currentStep.rangeUnit}
                  </span>
                  <span className="text-xs text-white/30">{effectiveMax} {currentStep.rangeUnit}</span>
                </div>
                <input
                  type="range"
                  min={currentStep.rangeMin}
                  max={effectiveMax}
                  value={effectiveVal}
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
            );
          })()}

          {/* Text */}
          {currentStep.inputType === "text" && (
            <div className="space-y-2">
              {(currentStep.key === "lastRunKm" || currentStep.key === "lastRunPace") ? (
                <input
                  type="number"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={currentStep.placeholder}
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sport/40"
                />
              ) : (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={currentStep.placeholder}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sport/40 resize-none"
                />
              )}
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
              onClick={() => setStep((s) => prevStepIdx(s, answers))}
              className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronRight className="h-3 w-3" /> חזור
            </button>
          )}
        </div>
      )}

      {/* Summary + Generate */}
      {allAnswered && !plan && !loading && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-1.5">
            <p className="text-[11px] font-bold text-sport uppercase tracking-widest mb-2">סיכום הבחירות שלך</p>
            {STEPS.filter((s) =>
              s.inputType !== "multiselect" &&
              s.inputType !== "imagepicker" &&
              !shouldSkipStep(s.key, answers)
            ).map((s) => (
              <div key={s.key} className="flex items-center justify-between text-[11px]">
                <span className="text-white/40">{s.question.replace("?", "").replace(/"/g, "'").substring(0, 30)}</span>
                <span className="font-semibold text-white">{answers[s.key] || "—"}</span>
              </div>
            ))}
            {gymEquipmentSelection.length > 0 && (
              <div className="flex items-start justify-between text-[11px]">
                <span className="text-white/40 shrink-0">ציוד חדר כושר</span>
                <span className="font-semibold text-white text-start max-w-[55%] truncate">
                  {gymEquipmentSelection.length} פריטים
                </span>
              </div>
            )}
            {homeEquipmentSelection.length > 0 && (
              <div className="flex items-start justify-between text-[11px]">
                <span className="text-white/40 shrink-0">ציוד בית/חוץ</span>
                <span className="font-semibold text-white text-start max-w-[55%] truncate">
                  {homeEquipmentSelection.length} פריטים
                </span>
              </div>
            )}
            {preferredMuscles.length > 0 && (
              <div className="flex items-start justify-between text-[11px]">
                <span className="text-white/40 shrink-0">דגש</span>
                <span className="font-semibold text-white text-start max-w-[55%]">{preferredMuscles.join(", ")}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => generate()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sport text-sport-foreground font-bold text-sm min-h-[50px] shadow-[0_0_20px_rgba(0,255,135,0.3)] active:scale-[0.98] transition-transform"
          >
            <Sparkles className="h-4 w-4" /> צור תוכנית
          </button>

          <button onClick={reset} className="w-full text-[11px] text-white/30 hover:text-white/60 transition-colors">
            התחל מחדש
          </button>
        </div>
      )}

      {/* Animated progress bar */}
      {loading && (
        <div className="space-y-4 py-6">
          <p className="text-center text-sm font-bold text-white">{progressLabel}</p>
          <div className="relative h-3 rounded-full bg-white/10 overflow-hidden" dir="ltr">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-sport shadow-[0_0_12px_rgba(0,255,135,0.6)] transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/40">{Math.floor(progress)}%</p>
        </div>
      )}

      {/* Generated plan */}
      {plan && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-sport/10 border border-sport/20 p-3">
            <p className="text-xs text-white/80 leading-relaxed">{plan.summary}</p>
          </div>

          <div className="space-y-2">
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
                    <div key={ei} className="flex items-center justify-between text-[11px] border-e-2 border-sport/35 pe-2">
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

          {/* Quick tweak buttons */}
          <div className="flex gap-2">
            {[
              { label: "🔥 קשה יותר", tweak: "make the plan significantly harder — increase sets, weight percentage, or add advanced exercise variations" },
              { label: "🌊 קל יותר",  tweak: "make the plan easier — reduce sets, lower weight percentages, use beginner-friendly exercise alternatives" },
            ].map(({ label, tweak }) => (
              <button
                key={label}
                onClick={() => generateWithTweak(tweak)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white/80 transition-colors disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Save full plan */}
          <button
            onClick={saveFullPlan}
            disabled={savePlan.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-sport/15 border border-sport/20 text-sport text-xs font-bold hover:bg-sport/25 transition-colors disabled:opacity-50"
          >
            <BookmarkCheck className="h-3.5 w-3.5" /> שמור תוכנית שלמה
          </button>

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
