import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera, Search, Sparkles, Loader2, ChevronDown, ChevronUp,
  Clock, Users, Flame, Zap, BookmarkPlus, Trash2, ArrowLeftRight,
} from "lucide-react";
import { recognizeMeal, generateText, parseAIJson } from "@/lib/ai-service";
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
  { label: "צום לסירוגין 16:8", emoji: "⏰", desc: "חלון אכילה 8 שעות" },
  { label: "מאוזנת",            emoji: "⚖️", desc: "מגוון וגמיש" },
];

// ─── quick-filter diets ───────────────────────────────────────────────────────
const DIET_FILTERS = [
  { key: "",              label: "הכל"         },
  { key: "ים תיכונית",   label: "🫒 ים תיכונית" },
  { key: "קטוגנית",      label: "🥑 קטו"       },
  { key: "טבעוני",       label: "🌱 טבעוני"    },
  { key: "חלבון גבוה",   label: "💪 חלבון גבוה" },
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

  useEffect(() => {
    if (profile?.diet_type) setActiveDiet(profile.diet_type);
  }, [profile]);

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

  // ── Weekly plan state ──
  const [weekPlan,      setWeekPlan]      = useState<WeeklyPlan | null>(null);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [openDay,       setOpenDay]       = useState<number | null>(null);
  const [saveModal,  setSaveModal]  = useState(false);
  const [templateName, setTemplateName] = useState("");

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
      const excStr  = "אין";
      const prompt  = `אתה דיאטן ישראלי מקצועי. צור תפריט שבועי מלא בפורמט JSON בלבד.

פרמטרים:
- סוג דיאטה: ${profile.diet_type}
- קלוריות יומיות: ${tdeeCalories.targetCalories}
- יעד חלבון יומי: ${tdeeCalories.protein}g
- מרכיבים אסורים: ${excStr}

פורמט JSON חובה (7 ימים, ישראלי, ריאלי):
{
  "days": [
    {
      "day": "ראשון",
      "breakfast": { "name": "שם ארוחת בוקר", "calories": 0, "protein": 0 },
      "lunch":     { "name": "שם ארוחת צהריים", "calories": 0, "protein": 0 },
      "dinner":    { "name": "שם ארוחת ערב", "calories": 0, "protein": 0 },
      "snack":     { "name": "שם חטיף", "calories": 0, "protein": 0 },
      "total_calories": 0
    }
  ]
}

כללים: 7 ימים בדיוק (ראשון עד שבת). ארוחות ישראליות אמיתיות. JSON בלבד ללא markdown.`;

      const raw  = await generateText(prompt);
      const plan = parseAIJson<WeeklyPlan>(raw);
      setWeekPlan(plan);
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
      const b64 = await fileToBase64(file);
      const result = await recognizeMeal(b64);
      // use items list as ingredients
      const ings = result.items?.length ? result.items : [result.name];
      setScanIngredients(ings);
      setScanDone(true);
      setQuery(ings.join(", "));
      toast.success(`זוהו ${ings.length} מרכיבים!`);
    } catch {
      toast.error("לא הצלחתי לזהות מרכיבים — נסה תמונה אחרת");
    } finally {
      setScanning(false);
    }
  };

  // ─── Generate recipes from query ─────────────────────────────────────────
  const generateRecipes = async () => {
    if (!query.trim()) { toast.error("הכנס חומרים או שם מנה"); return; }
    setGenerating(true);
    setRecipes([]);
    try {
      const dietClause = dietFilter     ? `\n- דיאטה מועדפת: ${dietFilter}` : "";
      const calClause  = targetCalories ? `\n- יעד קלוריות למנה: ${targetCalories} קק"ל (חובה לעמוד בטווח ±10%)` : "";
      const protClause = targetProtein  ? `\n- יעד חלבון למנה: ${targetProtein}g (חובה לעמוד בטווח ±5g)` : "";

      const macroInstruction = (targetCalories || targetProtein)
        ? `\n\nחשוב ביותר: עליך לבנות את המתכון כך שיגיע בדיוק ליעדי המאקרו שצוינו. חשב את הכמויות בהתאם.`
        : "";

      const prompt = `אתה שף ודיאטן ישראלי מקצועי. צור 3 מתכונים מפורטים בפורמט JSON בלבד.

בקשה: "${query}"${dietClause}${calClause}${protClause}${macroInstruction}

פורמט JSON חובה:
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
      "ingredients": ["100g עוף", "2 כפות שמן זית"],
      "steps": ["שלב 1: ...", "שלב 2: ..."],
      "tip": "טיפ להגשה מושלמת"
    }
  ]
}

כללים: מתכונים ישראליים ריאליים. difficulty: קל/בינוני/מתקדם. JSON בלבד ללא markdown.`;

      const raw    = await generateText(prompt);
      const parsed = parseAIJson<{ recipes: RecipeResult[] }>(raw);
      setRecipes(parsed.recipes ?? []);
    } catch {
      toast.error("שגיאה ביצירת מתכונים — נסה שנית");
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

        <div className="grid grid-cols-2 gap-2.5">
          {DIETS.map((d) => (
            <button
              key={d.label}
              onClick={() => handleDietSelect(d.label)}
              disabled={updateProfile.isPending}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-right transition-all disabled:opacity-50 ${
                activeDiet === d.label
                  ? "border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-500/10"
                  : "border-white/10 bg-white/4 hover:bg-white/8"
              }`}
            >
              <span className="text-2xl shrink-0">{d.emoji}</span>
              <div className="min-w-0">
                <p className={`text-xs font-bold leading-tight ${activeDiet === d.label ? "text-emerald-300" : "text-white/80"}`}>
                  {d.label}
                </p>
                <p className="text-[9px] text-white/35 truncate">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
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
              <p className="text-sm font-black text-white">תפריט שבועי — {profile?.diet_type}</p>
            </div>
            <button
              onClick={() => { setTemplateName(""); setSaveModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition-all"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              שמור
            </button>
          </div>

          {weekPlan.days.map((day, i) => (
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
                    { key: "breakfast", label: "🌅 בוקר"   },
                    { key: "lunch",     label: "☀️ צהריים" },
                    { key: "dinner",    label: "🌙 ערב"    },
                    { key: "snack",     label: "🍎 חטיף"   },
                  ] as { key: keyof DayPlan; label: string }[]).map(({ key, label }) => {
                    const meal = day[key] as MealSlot | undefined;
                    if (!meal) return null;
                    return (
                      <div key={key} className="flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-[10px] text-white/40 shrink-0 pt-0.5">{label}</span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm text-white/90 font-medium leading-tight">{meal.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{meal.calories} קל׳ · {meal.protein}g חלבון</p>
                        </div>
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
                onClick={() => { setWeekPlan(t.plan_data); setOpenDay(0); toast.success("תפריט נטען!"); }}
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
            onChange={(e) => setQuery(e.target.value)}
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
          <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest">
            🎯 יעדי מאקרו מדויקים (אופציונלי)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-white/40 font-bold uppercase tracking-wide block">
                קלוריות למנה (קק"ל)
              </label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                placeholder="למשל: 450"
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
                placeholder="למשל: 35"
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>
          {(targetCalories || targetProtein) && (
            <p className="text-[9px] text-amber-400/60">
              ✓ AI יבנה מתכונים שמגיעים בדיוק לערכים אלו
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

// ─── file → base64 ────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the data:image/...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
