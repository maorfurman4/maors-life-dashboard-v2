import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera, Search, Sparkles, Loader2, ChevronDown, ChevronUp,
  Clock, Users, Flame, Zap, BookmarkPlus, Trash2, ArrowLeftRight, X, Youtube,
} from "lucide-react";
import { analyzeImage, generateText, parseAIJson } from "@/lib/ai-service";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  calcTDEE,
  type ActivityLevel, type Goal, type Sex,
} from "@/lib/tdee";

// ─── helpers ─────────────────────────────────────────────────────────────────
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── types ───────────────────────────────────────────────────────────────────
interface DayPlan {
  day:            string;
  breakfast:      MealSlot;
  lunch:          MealSlot;
  dinner:         MealSlot;
  snack:          MealSlot;
  total_calories: number;
}
interface MealSlot { name: string; calories: number; protein: number; }
interface WeeklyPlan { days: DayPlan[] }
interface PlanTemplate { id: string; name: string; diet_type: string | null; plan_data: WeeklyPlan; created_at: string; }

interface RecipeResult {
  name:                  string;
  difficulty:            string;   // "קל" | "בינוני" | "מתקדם"
  time_minutes:          number;
  servings:              number;
  calories_per_serving:  number;
  protein_per_serving:   number;
  tags:                  string[];
  ingredients:           string[];
  steps:                 string[];
  tip:                   string;
}

// ─── preferred diet options (saved to user_profile.diet_type) ────────────────
const DIETS = [
  { label: "ים תיכונית",       emoji: "🫒", desc: "שמן זית, ירקות, דגים" },
  { label: "קטוגנית",           emoji: "🥑", desc: "שומנים גבוהים, אפס פחמימות" },
  { label: "פליאו",             emoji: "🥩", desc: "בשר, ירקות, פירות" },
  { label: "טבעוני",            emoji: "🌱", desc: "ללא מוצרים מהחי" },
  { label: "צמחוני",            emoji: "🥚", desc: "ירקות + ביצים/חלב, ללא בשר/דגים" },
  { label: "צום לסירוגין 16:8", emoji: "⏰", desc: "חלון אכילה 8 שעות" },
  { label: "מאוזנת",            emoji: "⚖️", desc: "מגוון וגמיש" },
  { label: "דאש",               emoji: "💊", desc: "דל מלח, לב בריא, מאוזן" },
  { label: "פלקסיטריאנית",      emoji: "🌿", desc: "בעיקר צמחי, בשר מדי פעם" },
  { label: "קרניבורית",         emoji: "🥩🔴", desc: "בשר, דגים, ביצים בלבד" },
  { label: "רואו-פוד",          emoji: "🥗", desc: "פירות, ירקות, אגוזים — גולמי" },
];

// ─── quick-filter diets ───────────────────────────────────────────────────────
const DIET_FILTERS = [
  { key: "",                   label: "הכל"              },
  { key: "ים תיכונית",        label: "🫒 ים תיכונית"    },
  { key: "קטוגנית",           label: "🥑 קטו"            },
  { key: "טבעוני",            label: "🌱 טבעוני"         },
  { key: "צמחוני",            label: "🥚 צמחוני"         },
  { key: "חלבון גבוה",        label: "💪 חלבון גבוה"     },
  { key: "דאש",               label: "💊 דאש"             },
  { key: "פלקסיטריאנית",     label: "🌿 פלקסיטריאנית"   },
  { key: "קרניבורית",         label: "🥩 קרניבורית"      },
  { key: "רואו-פוד",          label: "🥗 רואו-פוד"        },
];

// ─── glass helpers ────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl bg-white/8 border border-white/15 text-white px-3 py-2.5 text-sm min-h-[44px] " +
  "focus:outline-none focus:border-emerald-500/60 placeholder:text-white/25 backdrop-blur-sm";

// ─── DifficultyBadge ─────────────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    "קל":      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "בינוני":  "bg-amber-500/20   text-amber-300   border-amber-500/30",
    "מתקדם":   "bg-rose-500/20    text-rose-300    border-rose-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[difficulty] ?? "bg-white/10 text-white/50 border-white/10"}`}>
      {difficulty}
    </span>
  );
}

// ─── RecipeCard ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: RecipeResult }) {
  const [openSection, setOpenSection] = useState<"ingredients" | "steps" | null>("ingredients");

  const toggle = (s: "ingredients" | "steps") =>
    setOpenSection((prev) => (prev === s ? null : s));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-black text-white leading-tight">{recipe.name}</p>
          <DifficultyBadge difficulty={recipe.difficulty} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { icon: Clock,  val: `${recipe.time_minutes}′`, label: "זמן"       },
            { icon: Users,  val: `×${recipe.servings}`,     label: "מנות"      },
            { icon: Flame,  val: `${recipe.calories_per_serving}`, label: "קל׳/מנה" },
            { icon: Zap,    val: `${recipe.protein_per_serving}g`, label: "חלבון"   },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-2">
              <Icon className="h-3 w-3 text-white/30 mx-auto mb-0.5" />
              <p className="text-xs font-black text-white/80">{val}</p>
              <p className="text-[8px] text-white/30">{label}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[9px] text-white/50">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Ingredients accordion ── */}
      <div className="border-t border-white/8">
        <button
          onClick={() => toggle("ingredients")}
          className="w-full flex items-center justify-between px-5 py-3"
        >
          <span className="text-xs font-black text-white/70">🛒 מרכיבים ({recipe.ingredients?.length ?? 0})</span>
          {openSection === "ingredients"
            ? <ChevronUp   className="h-3.5 w-3.5 text-white/40" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
        </button>
        {openSection === "ingredients" && (
          <div className="px-5 pb-4 space-y-1.5">
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                <p className="text-sm text-white/70 leading-snug">{ing}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Steps accordion ── */}
      <div className="border-t border-white/8">
        <button
          onClick={() => toggle("steps")}
          className="w-full flex items-center justify-between px-5 py-3"
        >
          <span className="text-xs font-black text-white/70">👨‍🍳 הוראות הכנה ({recipe.steps?.length ?? 0} שלבים)</span>
          {openSection === "steps"
            ? <ChevronUp   className="h-3.5 w-3.5 text-white/40" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
        </button>
        {openSection === "steps" && (
          <div className="px-5 pb-4 space-y-3">
            {recipe.steps?.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-white/70 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip */}
      {recipe.tip && (
        <div className="border-t border-white/8 px-5 py-3">
          <p className="text-[10px] text-amber-400/80 leading-relaxed">
            💡 <span className="font-semibold">טיפ:</span> {recipe.tip}
          </p>
        </div>
      )}

      {/* YouTube search link */}
      <div className="border-t border-white/8 px-5 py-3">
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent("מתכון " + recipe.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[11px] text-rose-400/80 hover:text-rose-400 transition-colors font-semibold"
        >
          <Youtube className="h-3.5 w-3.5 shrink-0" />
          צפה בסרטון הכנה ב-YouTube
        </a>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function NutritionCulinaryTab() {
  const qc = useQueryClient();

  // ── Profile / diet preference ──
  const { data: profile }  = useProfile();
  const updateProfile      = useUpdateProfile();
  const [activeDiet, setActiveDiet] = useState<string | null>(null);
  const [localAllergies, setLocalAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");

  useEffect(() => {
    if (profile?.diet_type) setActiveDiet(profile.diet_type);
    if (profile?.food_allergies) setLocalAllergies(profile.food_allergies);
  }, [profile]);

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (!val || localAllergies.includes(val)) return;
    const next = [...localAllergies, val];
    setLocalAllergies(next);
    setAllergyInput("");
    updateProfile.mutate({ food_allergies: next }, { onError: (e: any) => toast.error(e?.message ?? "שגיאה") });
  };

  const removeAllergy = (tag: string) => {
    const next = localAllergies.filter((x) => x !== tag);
    setLocalAllergies(next);
    updateProfile.mutate({ food_allergies: next }, { onError: (e: any) => toast.error(e?.message ?? "שגיאה") });
  };

  const handleDietSelect = (label: string) => {
    setActiveDiet(label);
    updateProfile.mutate(
      { diet_type: label },
      { onError: (e: any) => toast.error(e?.message ?? "שגיאה בשמירה") }
    );
  };

  // ── TDEE (read from localStorage — set by Planner tab) ──
  const tdeeCalories = useMemo(() => {
    const sex      = (localStorage.getItem("tdee_sex")      ?? "male") as Sex;
    const age      = parseInt(localStorage.getItem("tdee_age")      ?? "28", 10);
    const activity = (localStorage.getItem("tdee_activity") ?? "moderate") as ActivityLevel;
    const goal     = (localStorage.getItem("tdee_goal")     ?? "maintain") as Goal;
    return calcTDEE({ sex, age, heightCm: 175, weightKg: 75, activityLevel: activity, goal });
  }, []);

  // ── Saved goals from DB (the values the user explicitly saved in Planner) ──
  const { data: savedGoals } = useQuery({
    queryKey: ["culinary-saved-goals"],
    queryFn: async () => {
      const uid = await getUserId();
      const { data } = await supabase
        .from("user_settings")
        .select("daily_calories_goal,daily_protein_goal,daily_carbs_goal,daily_fat_goal")
        .eq("user_id", uid)
        .maybeSingle();
      return data;
    },
  });

  const dailyCalTarget  = (savedGoals?.daily_calories_goal || 0) > 0 ? savedGoals!.daily_calories_goal! : tdeeCalories.targetCalories;
  const dailyProtTarget = (savedGoals?.daily_protein_goal  || 0) > 0 ? savedGoals!.daily_protein_goal!  : tdeeCalories.protein;
  const dailyCarbTarget = (savedGoals?.daily_carbs_goal    || 0) > 0 ? savedGoals!.daily_carbs_goal!    : tdeeCalories.carbs;
  const dailyFatTarget  = (savedGoals?.daily_fat_goal      || 0) > 0 ? savedGoals!.daily_fat_goal!      : tdeeCalories.fat;

  // ── Weekly plan state (persisted for 7 days in localStorage) ──
  const [weekPlan,      setWeekPlan]      = useState<WeeklyPlan | null>(() => {
    try {
      const raw = localStorage.getItem("current_week_plan");
      if (!raw) return null;
      const { plan, createdAt } = JSON.parse(raw);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - createdAt > sevenDays) { localStorage.removeItem("current_week_plan"); return null; }
      return plan as WeeklyPlan;
    } catch { return null; }
  });
  const [weekPlanDate, setWeekPlanDate] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem("current_week_plan");
      if (!raw) return null;
      return JSON.parse(raw).createdAt as number;
    } catch { return null; }
  });
  const [planGenerating, setPlanGenerating] = useState(false);
  const [openDay,       setOpenDay]       = useState<number | null>(null);
  const [saveModal,  setSaveModal]  = useState(false);
  const [templateName, setTemplateName] = useState("");

  const saveCurrentWeekPlan = (plan: WeeklyPlan) => {
    const createdAt = Date.now();
    localStorage.setItem("current_week_plan", JSON.stringify({ plan, createdAt }));
    setWeekPlanDate(createdAt);
  };

  const clearCurrentWeekPlan = () => {
    localStorage.removeItem("current_week_plan");
    setWeekPlan(null);
    setWeekPlanDate(null);
    setOpenDay(null);
  };

  // ── Saved templates ──
  const { data: templates = [] } = useQuery<PlanTemplate[]>({
    queryKey: ["meal-plan-templates"],
    queryFn: async () => {
      const userId = await getUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("meal_plan_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PlanTemplate[];
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async (name: string) => {
      if (!weekPlan) return;
      const userId = await getUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("meal_plan_templates").insert({
        user_id:   userId,
        name,
        diet_type: profile?.diet_type ?? null,
        plan_data: weekPlan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("תבנית נשמרה!");
      qc.invalidateQueries({ queryKey: ["meal-plan-templates"] });
      setSaveModal(false);
      setTemplateName("");
    },
    onError: (e: any) => toast.error(e?.message ?? "שגיאה בשמירה"),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("meal_plan_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("תבנית נמחקה");
      qc.invalidateQueries({ queryKey: ["meal-plan-templates"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "שגיאה במחיקה"),
  });

  // ── Generate weekly plan ──
  const generatePlan = async () => {
    if (!profile?.diet_type) { toast.error("בחר סוג דיאטה תחילה"); return; }
    setPlanGenerating(true);
    setWeekPlan(null);
    setOpenDay(null);
    try {
      const excStr   = localAllergies.length ? localAllergies.join(", ") : "אין";
      const dietRule = DIET_RULES[profile.diet_type] ?? "";

      const bfCal  = Math.round(dailyCalTarget * 0.25);
      const lnCal  = Math.round(dailyCalTarget * 0.35);
      const dnCal  = Math.round(dailyCalTarget * 0.30);
      const snCal  = Math.round(dailyCalTarget * 0.10);
      const bfProt = Math.round(dailyProtTarget * 0.20);
      const lnProt = Math.round(dailyProtTarget * 0.35);
      const dnProt = Math.round(dailyProtTarget * 0.35);
      const snProt = Math.round(dailyProtTarget * 0.10);

      // Some diets override macro ratios — note conflicts explicitly
      const isZeroCarb = ["קרניבורית", "קטוגנית"].includes(profile.diet_type);
      const isIfDiet   = profile.diet_type === "צום לסירוגין 16:8";
      const carbNote   = isZeroCarb
        ? `\n⚠️ דיאטה זו = אפס פחמימות — יעד הפחמימות הכללי אינו רלוונטי כאן. לא לכלול אף מרכיב פחמימתי.`
        : "";
      const ifNote = isIfDiet
        ? `\n⚠️ דיאטת צום 16:8 — אסור ארוחת בוקר. ארוחה ראשונה = צהריים בלבד. שים "צום (קפה/מים)" בשדה breakfast עם 0 קלוריות.`
        : "";

      const prompt = `אתה דיאטן ישראלי מקצועי. צור תפריט שבועי בפורמט JSON בלבד.

════ כלל #1 — גובר על הכל: חוקי הדיאטה ════
סוג דיאטה: ${profile.diet_type}
${dietRule}${carbNote}${ifNote}

לפני כל ארוחה שאתה כותב — בדוק: האם כל מרכיב בה מותר בדיאטה ${profile.diet_type}?
אם מרכיב אחד אסור — החלף את כל הארוחה. אין פשרות.
════════════════════════════════════════════

מרכיבים אסורים (אלרגיות): ${excStr}

יעדי קלוריות יומיים (עמוד בהם ככל שהדיאטה מאפשרת):
- קלוריות: ${dailyCalTarget} קק"ל (טווח: ${Math.round(dailyCalTarget * 0.95)}–${Math.round(dailyCalTarget * 1.05)})
- חלבון: ${dailyProtTarget}g (טווח: ${dailyProtTarget - 8}–${dailyProtTarget + 8}g)
${!isZeroCarb ? `- פחמימות: ${dailyCarbTarget}g (טווח: ${Math.max(0, dailyCarbTarget - 15)}–${dailyCarbTarget + 15}g)` : "- פחמימות: 0g (קרניבורית/קטוגנית)"}
- שומן: ${dailyFatTarget}g (טווח: ${dailyFatTarget - 10}–${dailyFatTarget + 10}g)

חלוקה לארוחות:
- בוקר:   ${isIfDiet ? "0 קק\"ל (צום)" : `${bfCal} קק"ל · ${bfProt}g חלבון`}
- צהריים: ${isIfDiet ? `${Math.round(dailyCalTarget * 0.40)} קק"ל · ${Math.round(dailyProtTarget * 0.40)}g חלבון` : `${lnCal} קק"ל · ${lnProt}g חלבון`}
- ערב:    ${isIfDiet ? `${Math.round(dailyCalTarget * 0.40)} קק"ל · ${Math.round(dailyProtTarget * 0.40)}g חלבון` : `${dnCal} קק"ל · ${dnProt}g חלבון`}
- חטיף:   ${isIfDiet ? `${Math.round(dailyCalTarget * 0.20)} קק"ל · ${Math.round(dailyProtTarget * 0.20)}g חלבון` : `${snCal} קק"ל · ${snProt}g חלבון`}

פורמט JSON (7 ימים, JSON בלבד ללא markdown):
{
  "days": [
    {
      "day": "ראשון",
      "breakfast": { "name": "שם ארוחת בוקר",    "calories": ${isIfDiet ? 0 : bfCal}, "protein": ${isIfDiet ? 0 : bfProt} },
      "lunch":     { "name": "שם ארוחת צהריים",   "calories": ${lnCal}, "protein": ${lnProt} },
      "dinner":    { "name": "שם ארוחת ערב",      "calories": ${dnCal}, "protein": ${dnProt} },
      "snack":     { "name": "שם חטיף",            "calories": ${snCal}, "protein": ${snProt} },
      "total_calories": ${dailyCalTarget}
    }
  ]
}

7 ימים (ראשון עד שבת). כל שמות הארוחות בעברית בלבד — אסור לכתוב מילה אחת באנגלית. JSON בלבד.`;

      const raw  = await generateText(prompt);
      const plan = parseAIJson<WeeklyPlan>(raw);
      if (!plan?.days || !Array.isArray(plan.days) || plan.days.length === 0) {
        throw new Error("מבנה תפריט לא תקין");
      }
      setWeekPlan(plan);
      saveCurrentWeekPlan(plan);
      setOpenDay(0);
    } catch {
      toast.error("שגיאה ביצירת תפריט — נסה שנית");
    } finally {
      setPlanGenerating(false);
    }
  };

  // ── Fridge Scanner state ──
  const fileRef                   = useRef<HTMLInputElement>(null);
  const [scanning, setScanning]   = useState(false);
  const [scanIngredients, setScanIngredients] = useState<string[]>([]);
  const [scanDone, setScanDone]   = useState(false);

  // ── Recipe Generator state ──
  const [query,          setQuery]          = useState("");
  const [dietFilter,     setDietFilter]     = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein,  setTargetProtein]  = useState("");
  const [generating,     setGenerating]     = useState(false);
  const [recipes,        setRecipes]        = useState<RecipeResult[]>([]);

  // ─── Scan image → extract ingredients ────────────────────────────────────
  const handleScan = async (file: File) => {
    setScanning(true);
    setScanDone(false);
    setScanIngredients([]);
    setRecipes([]);
    try {
      const { b64, mime } = await fileToSmallBase64(file);
      const raw = await analyzeImage(
        b64,
        mime,
        `You are a food ingredient detector. Identify all food ingredients visible in this fridge or pantry image.
Return ONLY a valid JSON array of ingredient names in Hebrew.
Example: ["עגבניות", "גבינה לבנה", "ביצים", "חסה", "גזר"]
No explanation, no markdown. JSON array only.`
      );
      const ings = parseAIJson<string[]>(raw);
      const list = Array.isArray(ings) && ings.length > 0 ? ings : ["מרכיב לא ידוע"];
      setScanIngredients(list);
      setScanDone(true);
      setQuery(list.join(", "));
      toast.success(`זוהו ${list.length} מרכיבים!`);
    } catch (err: any) {
      toast.error(err?.message?.includes("גדולה") ? err.message : "לא הצלחתי לזהות מרכיבים — נסה תמונה אחרת");
    } finally {
      setScanning(false);
    }
  };

  // ─── Diet constraint definitions (strict, explicit) ─────────────────────
  const DIET_RULES: Record<string, string> = {
    "ים תיכונית": `
חוקי דיאטה ים תיכונית (חובה מוחלט לעמוד בהם):
- מותר: שמן זית (בסיס לכל בישול), ירקות טריים ומבושלים, קטניות (חומוס, עדשים, שעועית), דגים ופירות ים, עוף בכמות מתונה, גבינות כבשים/עיזים (פטה, לבנה), יוגורט, אגוזים, זרעים, פירות טריים, דגנים מלאים (לחם מחמצת, קינואה, אורז חום), עשבי תיבול
- מותר במידה: ביצים, גבינות קשות
- אסור: בשר אדום (מקסימום פעם בשבוע), מזון מעובד, שמנים מזוקקים (חמניות, תירס), ממתקים מתועשים, מרגרינה`,
    "קטוגנית": `
חוקי דיאטה קטוגנית (חובה מוחלט לעמוד בהם):
- מותר: בשר (כל סוג), עוף, דגים, פירות ים, ביצים, גבינות שמנות, שמן זית, חמאה, שמנת, גבינת שמנת, אגוזים (אגוז מלך, שקד, מקדמיה), זרעים, ירקות לא עמילניים (ברוקולי, כרובית, תרד, קישוא, מלפפון, עגבנייה בכמות קטנה), שמן קוקוס, אבוקדו
- אסור לחלוטין: לחם, פסטה, אורז, קוסקוס, תפוחי אדמה, בטטה, תירס, קטניות (עדשים, חומוס, שעועית), סוכר, קמח, מאפים, פירות (למעט פירות יער בכמות קטנה עד 30g), מיצים
- פחמימות: מקסימום 20-30g כלל יומי — בדוק כל מרכיב!`,
    "טבעוני": `
חוקי דיאטה טבעונית (חובה מוחלט לעמוד בהם — אין יוצאים מן הכלל):
- אסור לחלוטין — כל מוצר מהחי ללא יוצא מן הכלל: בשר אדום, עוף, הודו, דגים, טונה, סלמון, פירות ים, ביצים, חלב פרה/עיזים/כבשים, גבינה (כל סוג), יוגורט, שמנת, חמאה, מיונז, דבש, ג'לטין
- מותר בלבד: ירקות (כל סוג), פירות (כל סוג), קטניות (עדשים, חומוס, שעועית שחורה/לבנה/אדומה, פולי סויה), טופו, טמפה, שמנים צמחיים (זית, קוקוס, שומשום), אגוזים וחמאות אגוזים (שקדים, קשיו, בוטנים), זרעים (שומשום, פשתן, צ'יה, חמניות), דגנים (אורז, קינואה, שיבולת שועל, לחם צמחוני), חלב צמחי (שקדים, שיבולת שועל, סויה), שמרי בירה, נוטריישנל ייסט
- אם מרכיב לא ידוע מקורו — אל תכלול אותו`,
    "צמחוני": `
חוקי דיאטה צמחונית (חובה מוחלט לעמוד בהם):
- אסור לחלוטין: בשר אדום (בקר, כבש, חזיר), עוף, הודו, דגים, פירות ים, ג'לטין מהחי
- מותר: ירקות, פירות, קטניות, דגנים, ביצים (כל סוגי הביצים), מוצרי חלב (חלב, גבינה, יוגורט, שמנת, חמאה), דבש, טופו, טמפה, אגוזים, זרעים, שמנים צמחיים
- חלבון מגיע מ: ביצים, גבינות, קטניות, טופו, יוגורט`,
    "פליאו": `
חוקי דיאטה פליאו (חובה מוחלט לעמוד בהם):
- מותר: בשר (כל סוגי הבשר, עדיפות לבשר כבש/פרה), עוף, דגים ופירות ים, ביצים, ירקות (כל סוג חוץ ממקטשינות), פירות טריים, אגוזים (אגוז מלך, שקד, פקאן — לא בוטנים), זרעים, שמן זית, שמן קוקוס, אבוקדו, עשבי תיבול ותבלינים טבעיים
- אסור לחלוטין: דגנים (חיטה, אורז, שיבולת שועל, דורה, קינואה), קטניות (חומוס, עדשים, שעועית, בוטנים), מוצרי חלב (חלב, גבינה, יוגורט, חמאה), סוכר וממתיקים מלאכותיים, מזון מעובד, שמנים מזוקקים (חמניות, קנולה)`,
    "צום לסירוגין 16:8": `
חוקי צום לסירוגין 16:8 (חובה מוחלט לעמוד בהם):
- חלון אכילה: 8 שעות בלבד (12:00–20:00)
- ארוחה ראשונה: ארוחת צהריים (12:00 לערך) — אסור ארוחת בוקר
- ארוחה אחרונה: לא אחרי 20:00
- מחוץ לחלון: מים, קפה שחור, תה ללא סוכר — בלבד
- חלק את הקלוריות בין: ארוחת צהריים (40%), ארוחת ערב (40%), חטיף אחד (20%) — ללא ארוחת בוקר
- לא להכניס ארוחת בוקר לתפריט היומי`,
    "מאוזנת": `
חוקי דיאטה מאוזנת:
- מגוון מלא של כל קבוצות המזון: חלבונים, פחמימות מורכבות, שומנים בריאים בפרופורציה טובה (30% חלבון, 40% פחמימות, 30% שומן)
- כולל: ירקות, פירות, דגנים מלאים, חלבון רזה (עוף, דגים, קטניות, ביצים), שמנים צמחיים, מוצרי חלב
- אין הגבלות מיוחדות — אוכל ישראלי מגוון ובריא`,
    "חלבון גבוה": `
חוקי דיאטה עתירת חלבון (חובה לעמוד בהם):
- חלבון למנה: לפחות 30g בכל ארוחה
- התמקד ב: חזה עוף, הודו, ביצים, גבינת קוטג', טונה, סלמון, בשר רזה, טופו, אדממה, יוגורט יווני
- הגבל: שומנים רוויים ופחמימות ריקות`,
    "דאש": `
חוקי דיאטה דאש — DASH (Dietary Approaches to Stop Hypertension) — חובה מוחלט לעמוד בהם:
- מותר: פירות (כל סוג), ירקות (כל סוג), דגנים מלאים (לחם מחמצת, שיבולת שועל, קינואה, אורז חום), קטניות, עוף (ללא עור), דגים, מוצרי חלב דלי שומן (יוגורט 0%, גבינה לייט), אגוזים, זרעים
- הגבל מאוד: מלח (מקסימום 1500mg נתרן ליום — אל תוסיף מלח, השתמש בעשבי תיבול), בשר אדום (מקסימום פעם בשבוע), ממתקים וסוכר, שומן רווי (חמאה, שמנת, גבינות שמנות), שמנים מזוקקים
- אסור: מזון מעובד ומלוח, נקניקיות, שימורים עם נתרן גבוה, מרגרינה
- לא להוסיף מלח שולחן — תבל עם שום, לימון, פטרוזיליה, כמון`,
    "פלקסיטריאנית": `
חוקי דיאטה פלקסיטריאנית (חובה לעמוד בהם):
- עיקר התפריט: מזון צמחי — ירקות, פירות, קטניות, דגנים מלאים, טופו, טמפה, אגוזים, זרעים
- מותר במידה (עד 2-3 פעמים בשבוע): עוף, דגים, ביצים, מוצרי חלב
- מותר לעתים רחוקות (פעם בשבועיים): בשר אדום בכמות קטנה
- עיקרון: צמחי קודם — בשר/דגים הם תוספת, לא הבסיס
- הדגש על: חלבון צמחי (קטניות, טופו) כבסיס, בשר כשאפשרי`,
    "קרניבורית": `
חוקי דיאטה קרניבורית (חובה מוחלט לעמוד בהם — אין יוצאים מן הכלל):
- מותר בלבד: בשר (בקר, כבש, חזיר), עוף, הודו, דגים (סלמון, טונה, מקרל, בורי), פירות ים, ביצים, חמאה, שומן בקר/כבש, מרק עצמות
- אסור לחלוטין כל מזון מהצומח: ירקות, פירות, דגנים, קטניות, אגוזים, זרעים, שמנים צמחיים, פחמימות מכל סוג, סוכר, קמח, עשבי תיבול ותבלינים צמחיים
- מותר לתבל עם: מלח בלבד
- אין ירקות, אין פחמימות, אין מוצרי חלב (מעבר לחמאה)`,
    "רואו-פוד": `
חוקי דיאטה רואו-פוד (Raw Food) — חובה מוחלט לעמוד בהם:
- עיקרון מרכזי: אין בישול מעל 48°C (118°F) — כל המאכלים גולמיים, לא מבושלים, לא מאודים, לא מוקפצים
- מותר: פירות טריים (כל סוג), ירקות טריים (כל סוג), ירקות נבוטים (מש, חומוס, עדשים — נבוטים בלבד), אגוזים גולמיים (שקד, קשיו, פקאן, אגוז מלך), זרעים גולמיים (צ'יה, פשתן, שומשום, חמניות), פירות מיובשים בטמפרטורה נמוכה, שמן זית כבישה קרה, שמן קוקוס גולמי, אבוקדו, תמרים גולמיים
- אסור לחלוטין: כל מאכל מבושל, מאפה, בשר, עוף, דגים, מוצרי חלב מפוסטרים, שמנים מזוקקים, סוכר, קמח
- טכניקות מותרות: בלנדר, מעבד מזון, כבישה (פרמנטציה), השרייה`,
  };

  // ─── Generate recipes from query ─────────────────────────────────────────
  const generateRecipes = async () => {
    if (!query.trim()) { toast.error("הכנס חומרים או שם מנה"); return; }
    setGenerating(true);
    setRecipes([]);
    try {
      const dietRules = dietFilter && DIET_RULES[dietFilter] ? DIET_RULES[dietFilter] : "";

      const NUTRITION_TABLE = `
טבלת ערכים תזונתיים (לכל 100g אלא אם צוין אחרת):
| מרכיב | קלוריות | חלבון |
|---|---|---|
| חזה עוף | 165 | 23g |
| ביצה שלמה (50g) | 70 | 6g |
| חומוס מבושל | 164 | 8g |
| עדשים מבושלות | 116 | 9g |
| טופו | 76 | 8g |
| גבינת קוטג' | 98 | 11g |
| יוגורט 3% | 59 | 3.5g |
| טונה בשימורים | 116 | 26g |
| סלמון | 208 | 20g |
| בשר בקר רזה | 217 | 26g |
| גבינה צהובה | 402 | 25g |
| שיבולת שועל | 389 | 13g |
| אורז מבושל | 130 | 2.7g |
| פסטה מבושלת | 158 | 5.5g |
| לחם | 265 | 9g |
| עגבנייה | 18 | 0.9g |
| מלפפון | 15 | 0.6g |
| ברוקולי | 34 | 2.8g |
| תרד | 23 | 2.9g |
| שמן זית (1 כף = 14g) | 124 | 0g |
| חמאת בוטנים (2 כף = 32g) | 190 | 8g |
| אבוקדו (100g) | 160 | 2g |
| שקדים (30g) | 173 | 6g |`;

      const macroTargetBlock = (targetCalories || targetProtein) ? `
יעדי מאקרו נדרשים:${targetCalories ? `\n- קלוריות למנה: ${targetCalories} קק"ל (טווח מותר: ${Math.round(+targetCalories * 0.9)}–${Math.round(+targetCalories * 1.1)})` : ""}${targetProtein ? `\n- חלבון למנה: ${targetProtein}g (טווח מותר: ${Math.max(0, +targetProtein - 2)}–${+targetProtein + 2}g)` : ""}

⚠️ חובה מוחלט: חשב את ערכי החלבון והקלוריות לפי הטבלה ולפי הכמויות שבחרת. אסור לכתוב את המספרים הנדרשים אם הם לא תואמים את חישוב המרכיבים. אם 2 ביצים = 12g חלבון ואתה צריך 5g — אתה חייב לשנות את הכמות (לא לכתוב 5g בשקר). כתוב בדיוק מה שיוצא מהחישוב.` : "";

      const excClause = localAllergies.length
        ? `\nמרכיבים אסורים (אלרגיות): ${localAllergies.join(", ")} — אסור בהחלט לכלול אותם בשום צורה.`
        : "";

      const fridgeConstraint = scanDone
        ? `\n⚠️ המרכיבים נסרקו מהמקרר — השתמש אך ורק במרכיבים הרשומים. אסור להוסיף כל מרכיב שאינו ברשימה.`
        : "";

      const prompt = `אתה שף ודיאטן ישראלי מקצועי ומדויק. צור 3 מתכונים בפורמט JSON בלבד.

${dietRules ? `════ חוקי הדיאטה — גוברים על הכל ════
${dietRules}
לפני כל מרכיב שאתה כותב — בדוק שהוא מותר לפי חוקי הדיאטה. אם אסור — החלף אותו. אין יוצאים מן הכלל.
════════════════════════════════════════════

` : ""}${excClause ? `מרכיבים אסורים (אלרגיות): ${excClause.replace(/\n/g, "")}

` : ""}${scanDone ? `מרכיבים זמינים במקרר: "${query}"` : `בקשה: "${query}"`}
${fridgeConstraint}
${NUTRITION_TABLE}
${macroTargetBlock}

תהליך חובה לכל מתכון:
1. בחר מרכיבים וכמויות מדויקות — כולל תבלינים בכמויות מדויקות (לדוגמה: "½ כפית כמון", "1 כפית פפריקה מתוקה", "2 שיני שום כתושות", "¼ כפית פלפל שחור")
2. חשב: חלבון_כולל = סכום(כמות_g × חלבון_ל100g ÷ 100) לכל מרכיב
3. חשב: קלוריות_כולל = סכום(כמות_g × קל_ל100g ÷ 100) לכל מרכיב
4. חלק במספר המנות → חלבון_למנה, קלוריות_למנה
5. רק אם עומד בטווח — כתוב JSON. אם לא — שנה כמויות וחזור לשלב 2

פורמט JSON (JSON בלבד, ללא markdown):
{
  "recipes": [
    {
      "name": "שם המנה בעברית",
      "difficulty": "קל",
      "time_minutes": 20,
      "servings": 2,
      "calories_per_serving": 350,
      "protein_per_serving": 25,
      "tags": ["בריא", "מהיר"],
      "ingredients": ["200g חזה עוף", "1 כף שמן זית", "½ כפית כמון", "1 כפית פפריקה", "¼ כפית מלח", "פלפל שחור לפי טעם"],
      "steps": ["שלב 1: ...", "שלב 2: ..."],
      "tip": "טיפ להגשה מושלמת"
    }
  ]
}

difficulty: קל/בינוני/מתקדם בלבד. JSON בלבד ללא כל טקסט נוסף.`;

      const raw    = await generateText(prompt);
      const parsed = parseAIJson<{ recipes: RecipeResult[] }>(raw);
      setRecipes(parsed?.recipes ?? []);
    } catch (err: any) {
      toast.error("שגיאה ביצירת מתכונים — נסה שנית");
      console.error("generateRecipes error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-4 pt-4 space-y-5 pb-4">

      {/* ══ DIET PREFERENCE SELECTOR ════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🥗</span>
          <div>
            <p className="text-sm font-black text-white">סוג דיאטה מועדף</p>
            <p className="text-[10px] text-white/40">נשמר לפרופיל — משפיע על תפריט ה-AI</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DIETS.map((d) => (
            <button
              key={d.label}
              onClick={() => handleDietSelect(d.label)}
              disabled={updateProfile.isPending}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition-all disabled:opacity-50 ${
                activeDiet === d.label
                  ? "border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-500/10"
                  : "border-white/10 bg-white/4 hover:bg-white/8"
              }`}
            >
              <span className="text-xl shrink-0">{d.emoji}</span>
              <div className="min-w-0 w-full">
                <p className={`text-[10px] font-bold leading-tight ${activeDiet === d.label ? "text-emerald-300" : "text-white/80"}`}>
                  {d.label}
                </p>
                <p className="text-[8px] text-white/35 line-clamp-1">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ ALLERGIES & EXCLUSIONS ══════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚫</span>
          <div>
            <p className="text-sm font-black text-white">אלרגיות והגבלות</p>
            <p className="text-[10px] text-white/40">משפיע על תפריט ומתכונים שנוצרים עם AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAllergy()}
            placeholder="גלוטן, חלב, אגוזים..."
            className={inputCls + " flex-1"}
          />
          <button
            onClick={addAllergy}
            className="px-4 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-colors min-h-[44px]"
          >
            + הוסף
          </button>
        </div>
        {localAllergies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {localAllergies.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold"
              >
                {tag}
                <button onClick={() => removeAllergy(tag)} className="opacity-60 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ══ WEEKLY MENU GENERATOR ═══════════════════════════════════════════ */}
      <button
        onClick={generatePlan}
        disabled={planGenerating || !profile?.diet_type}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-sm transition-all min-h-[56px] ${
          profile?.diet_type
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-2xl shadow-emerald-500/30 active:scale-[0.98]"
            : "bg-white/10 border border-white/10 opacity-40 cursor-not-allowed"
        } disabled:opacity-50`}
      >
        {planGenerating ? (
          <><Loader2 className="h-5 w-5 animate-spin" /><span>יוצר תפריט שבועי עם AI...</span></>
        ) : (
          <><Flame className="h-5 w-5" /><span>צור תפריט שבועי עם AI ✨</span></>
        )}
      </button>

      {/* ── Weekly plan results ── */}
      {weekPlan && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-sm font-black text-white">תפריט שבועי — {profile?.diet_type}</p>
                {weekPlanDate && (() => {
                  const created = new Date(weekPlanDate);
                  const expires = new Date(weekPlanDate + 7 * 24 * 60 * 60 * 1000);
                  const daysLeft = Math.ceil((expires.getTime() - Date.now()) / 86_400_000);
                  return (
                    <p className="text-[9px] text-white/30 mt-0.5">
                      נוצר {created.toLocaleDateString("he-IL", { day: "numeric", month: "short" })} · בתוקף עוד {daysLeft} ימים
                    </p>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTemplateName(""); setSaveModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition-all"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                שמור
              </button>
              <button
                onClick={clearCurrentWeekPlan}
                className="p-1.5 rounded-xl hover:bg-rose-500/15 text-white/25 hover:text-rose-400 transition-all"
                title="מחק תפריט"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {(weekPlan.days ?? []).map((day, i) => (
            <div key={i}
              className={`rounded-2xl border overflow-hidden transition-all ${
                openDay === i ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/8 bg-white/3"
              }`}>
              <button
                onClick={() => setOpenDay(openDay === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${openDay === i ? "text-emerald-300" : "text-white/80"}`}>{day.day}</span>
                  <span className="text-[10px] text-white/30">{day.total_calories?.toLocaleString() ?? "—"} קל׳</span>
                </div>
                {openDay === i
                  ? <ChevronUp   className="h-4 w-4 text-emerald-400" />
                  : <ChevronDown className="h-4 w-4 text-white/30" />}
              </button>
              {openDay === i && (
                <div className="px-4 pb-4 space-y-2">
                  {([
                    { key: "breakfast", label: "🌅 ארוחת בוקר"   },
                    { key: "lunch",     label: "☀️ ארוחת צהריים" },
                    { key: "dinner",    label: "🌙 ארוחת ערב"    },
                    { key: "snack",     label: "🍎 חטיף"          },
                  ] as { key: keyof DayPlan; label: string }[]).map(({ key, label }) => {
                    const meal = day[key] as MealSlot | undefined;
                    if (!meal) return null;
                    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent("מתכון " + meal.name)}`;
                    return (
                      <div key={key} className="py-2 border-b border-white/5 last:border-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[10px] text-white/40 shrink-0 pt-0.5 font-bold">{label}</span>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm text-white/90 font-medium leading-tight">{meal.name}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{meal.calories} קל׳ · {meal.protein}g חלבון</p>
                          </div>
                        </div>
                        <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[10px] text-rose-400/70 hover:text-rose-400 transition-colors font-semibold pr-1">
                          <Youtube className="h-3 w-3 shrink-0" />
                          צפה בסרטון הכנה
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Save template modal ── */}
      {saveModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center pb-8 px-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSaveModal(false)}
        >
          <div
            dir="rtl"
            className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/8 backdrop-blur-2xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-black text-white">שמור תבנית</p>
            <input
              autoFocus
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && templateName.trim() && saveTemplate.mutate(templateName.trim())}
              placeholder="שם התבנית (למשל: 'שבוע ים תיכוני')"
              className="w-full rounded-xl bg-white/8 border border-white/15 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/60 placeholder:text-white/25"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSaveModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/15 bg-white/5 text-white/70 text-sm font-bold hover:bg-white/10 transition-all"
              >
                ביטול
              </button>
              <button
                onClick={() => templateName.trim() && saveTemplate.mutate(templateName.trim())}
                disabled={saveTemplate.isPending || !templateName.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {saveTemplate.isPending ? "שומר..." : "שמור"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SAVED TEMPLATES ═════════════════════════════════════════════════ */}
      {templates.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <div>
              <p className="text-sm font-black text-white">תבניות שמורות</p>
              <p className="text-[10px] text-white/40">טען תפריט שמור והמשך לעבוד איתו</p>
            </div>
          </div>
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/8 bg-white/3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white/90 truncate">{t.name}</p>
                {t.diet_type && (
                  <p className="text-[10px] text-white/35">{t.diet_type}</p>
                )}
              </div>
              <button
                onClick={() => { setWeekPlan(t.plan_data); saveCurrentWeekPlan(t.plan_data); setOpenDay(0); toast.success("תפריט נטען!"); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-[11px] font-bold hover:bg-teal-500/20 transition-all shrink-0"
              >
                <ArrowLeftRight className="h-3 w-3" />
                טען
              </button>
              <button
                onClick={() => deleteTemplate.mutate(t.id)}
                disabled={deleteTemplate.isPending}
                className="p-1.5 rounded-xl hover:bg-rose-500/15 text-white/25 hover:text-rose-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ══ FRIDGE SCANNER ══════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <div>
            <p className="text-sm font-black text-white">סריקת מקרר</p>
            <p className="text-[10px] text-white/40">צלם מרכיבים — AI ימצא מתכונים מתאימים</p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleScan(f);
            e.target.value = "";
          }}
        />

        {/* Scan button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-white/20 bg-white/3 hover:bg-white/8 hover:border-white/30 transition-all min-h-[56px] disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
              <span className="text-sm text-purple-300 font-bold">מזהה מרכיבים...</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-white/60 font-bold">צלם / בחר תמונה מהגלריה</span>
            </>
          )}
        </button>

        {/* Scan results */}
        {scanDone && scanIngredients.length > 0 && (
          <div className="rounded-2xl border border-purple-500/25 bg-purple-500/8 p-4 space-y-2">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
              זוהו {scanIngredients.length} מרכיבים
            </p>
            <div className="flex flex-wrap gap-1.5">
              {scanIngredients.map((ing) => (
                <span key={ing}
                  className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-200 text-xs font-semibold">
                  {ing}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-white/30">המרכיבים הועתקו לשדה החיפוש — לחץ "צור מתכונים"</p>
          </div>
        )}
      </div>

      {/* ══ RECIPE GENERATOR ════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">👨‍🍳</span>
          <div>
            <p className="text-sm font-black text-white">מחולל מתכונים AI</p>
            <p className="text-[10px] text-white/40">כתוב מרכיבים, שם מנה, או בקשה חופשית</p>
          </div>
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (scanDone) setScanDone(false); }}
            onKeyDown={(e) => e.key === "Enter" && generateRecipes()}
            placeholder="עוף, ברוקולי, לימון... או 'פסטה עם ירקות'"
            className={inputCls + " flex-1"}
          />
          <button
            onClick={generateRecipes}
            disabled={generating}
            className="px-4 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-colors min-h-[44px] disabled:opacity-40 shrink-0"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Diet filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {DIET_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDietFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                dietFilter === f.key
                  ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Precision Macro Targets ── */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest">
              🎯 יעדי מאקרו למנה
            </p>
            <button
              onClick={() => {
                setTargetCalories(String(Math.round(dailyCalTarget / 3)));
                setTargetProtein(String(Math.round(dailyProtTarget / 3)));
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/25 transition-all"
            >
              ⚡ סנכרן עם היעדים שלי
            </button>
          </div>

          {/* Saved goals reference */}
          <div className="text-[9px] text-white/30 space-y-0.5">
            <span className="block">יעד יומי: {dailyCalTarget} קל׳ · {dailyProtTarget}g חלבון · {dailyCarbTarget}g פחמימות · {dailyFatTarget}g שומן</span>
            <span className="block text-white/20">לארוחה (÷3): {Math.round(dailyCalTarget / 3)} קל׳ · {Math.round(dailyProtTarget / 3)}g חלבון</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-white/40 font-bold uppercase tracking-wide block">
                קלוריות למנה (קק"ל)
              </label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                placeholder={String(Math.round(tdeeCalories.targetCalories / 3))}
                className={inputCls}
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-white/40 font-bold uppercase tracking-wide block">
                חלבון למנה (g)
              </label>
              <input
                type="number"
                value={targetProtein}
                onChange={(e) => setTargetProtein(e.target.value)}
                placeholder={String(Math.round(tdeeCalories.protein / 3))}
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>
          {(targetCalories || targetProtein) && (
            <p className="text-[9px] text-emerald-400/70">
              ✓ AI יחשב מרכיבים וכמויות שמגיעים בדיוק לערכים אלו
            </p>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={generateRecipes}
          disabled={generating || !query.trim()}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-sm transition-all min-h-[56px] ${
            query.trim()
              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-2xl shadow-amber-500/25 active:scale-[0.98]"
              : "bg-white/10 border border-white/10 opacity-40 cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>יוצר מתכונים...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>צור מתכונים AI ✨</span>
            </>
          )}
        </button>
      </div>

      {/* ══ RESULTS ═════════════════════════════════════════════════════════ */}
      {recipes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-black text-white">{recipes.length} מתכונים נוצרו</p>
          </div>
          {recipes.map((r, i) => (
            <RecipeCard key={i} recipe={r} />
          ))}
        </div>
      )}

      {/* bottom padding */}
      <div className="h-16" />
    </div>
  );
}

// ─── file → resized base64 (max 800px, 0.75 JPEG quality → well under 5MB limit) ─
function fileToSmallBase64(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else                { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      resolve({ b64: dataUrl.split(",")[1], mime: "image/jpeg" });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("לא ניתן לקרוא את התמונה")); };
    img.src = url;
  });
}
