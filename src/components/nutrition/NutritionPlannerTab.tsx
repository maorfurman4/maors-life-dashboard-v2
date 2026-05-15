import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, Save, Loader2, ChevronDown, ChevronUp,
  Flame, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  calcTDEE, ACTIVITY_LABELS, ACTIVITY_MULTIPLIER, GOAL_LABELS,
  type ActivityLevel, type Goal, type Sex,
} from "@/lib/tdee";
import { generateText, parseAIJson } from "@/lib/ai-service";
import { useProfile } from "@/hooks/use-profile";

// ─── helpers ─────────────────────────────────────────────────────────────────
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── types ───────────────────────────────────────────────────────────────────
interface DayPlan {
  day: string;
  breakfast: MealSlot;
  lunch:     MealSlot;
  dinner:    MealSlot;
  snack:     MealSlot;
  total_calories: number;
}
interface MealSlot {
  name:     string;
  calories: number;
  protein:  number;
}
interface WeeklyPlan { days: DayPlan[] }

// ─── glass field helper ───────────────────────────────────────────────────────
function GlassField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/8 border border-white/15 text-white px-3 py-2.5 text-sm min-h-[44px] " +
  "focus:outline-none focus:border-emerald-500/60 placeholder:text-white/25 backdrop-blur-sm";

const selectCls =
  "w-full rounded-xl bg-white/8 border border-white/15 text-white px-3 py-2.5 text-sm min-h-[44px] " +
  "focus:outline-none focus:border-emerald-500/60 backdrop-blur-sm appearance-none";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function NutritionPlannerTab() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();

  // ── TDEE state — lazy-init from localStorage where applicable ──
  const [sex,      setSex]      = useState<Sex>(() =>
    (localStorage.getItem("tdee_sex") as Sex) ?? "male"
  );
  const [age,      setAge]      = useState(() =>
    parseInt(localStorage.getItem("tdee_age") ?? "28", 10)
  );
  const [height,   setHeight]   = useState(175);
  const [weight,   setWeight]   = useState(75);
  const [activity, setActivity] = useState<ActivityLevel>(() =>
    (localStorage.getItem("tdee_activity") as ActivityLevel) ?? "moderate"
  );
  const [goal,     setGoal]     = useState<Goal>(() =>
    (localStorage.getItem("tdee_goal") as Goal) ?? "maintain"
  );

  // ── Planner state ──
  const [exclusions,  setExclusions]  = useState<string[]>([]);
  const [tagInput,    setTagInput]    = useState("");
  const [weekPlan,    setWeekPlan]    = useState<WeeklyPlan | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const [openDay,     setOpenDay]     = useState<number | null>(null);

  // ── Load saved settings ──
  const { data: settings } = useQuery({
    queryKey: ["user-settings-tdee"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data } = await supabase
        .from("user_settings")
        .select("date_of_birth,height_cm,weight_kg")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!settings) return;
    if (settings.height_cm) setHeight(Number(settings.height_cm));
    if (settings.weight_kg) setWeight(Number(settings.weight_kg));
    if (settings.date_of_birth) {
      const dob   = new Date(settings.date_of_birth);
      const today = new Date();
      let computed = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computed--;
      if (computed > 0 && computed < 120) setAge(computed);
    }
  }, [settings]);

  // ── Persist calculator-specific inputs to localStorage ──
  useEffect(() => { localStorage.setItem("tdee_sex",      sex);              }, [sex]);
  useEffect(() => { localStorage.setItem("tdee_age",      String(age));      }, [age]);
  useEffect(() => { localStorage.setItem("tdee_activity", activity);         }, [activity]);
  useEffect(() => { localStorage.setItem("tdee_goal",     goal);             }, [goal]);

  // ── Auto-load profile allergies ──
  useEffect(() => {
    if (profile?.food_allergies?.length) {
      setExclusions(profile.food_allergies);
    }
  }, [profile]);

  // ── TDEE result (live) ──
  const result = useMemo(
    () => calcTDEE({ sex, age, heightCm: height, weightKg: weight, activityLevel: activity, goal }),
    [sex, age, height, weight, activity, goal]
  );

  // ── Save goals to DB ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = await getUserId();
      const updates = {
        daily_calories_goal:   result.targetCalories,
        training_day_calories: result.trainingCalories,
        daily_protein_goal:    result.protein,
        training_day_protein:  result.trainingProtein,
        daily_carbs_goal:      result.carbs,
        daily_fat_goal:        result.fat,
        daily_water_ml:        result.waterMl,
        height_cm: height,
        weight_kg: weight,
      };
      const { data: existing } = await supabase
        .from("user_settings").select("id").eq("user_id", userId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("user_settings").update(updates).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_settings").insert({ user_id: userId, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("יעדים עודכנו בהצלחה!");
      qc.invalidateQueries({ queryKey: ["user-settings-tdee"] });
      qc.invalidateQueries({ queryKey: ["nutrition-goals"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "שגיאה בשמירה"),
  });

  // ── Tag input handlers ──
  const addTag = () => {
    const val = tagInput.trim();
    if (val && !exclusions.includes(val)) {
      setExclusions((p) => [...p, val]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => setExclusions((p) => p.filter((x) => x !== t));

  // ── Generate weekly meal plan ──
  const generatePlan = async () => {
    if (!profile?.diet_type) { toast.error("בחר סוג דיאטה בטאב 'מתכונים' תחילה"); return; }
    setGenerating(true);
    setWeekPlan(null);
    setOpenDay(null);
    try {
      const dietLabel = profile.diet_type;
      const excStr    = exclusions.length > 0 ? exclusions.join(", ") : "אין";
      const prompt    = `אתה דיאטן ישראלי מקצועי. צור תפריט שבועי מלא בפורמט JSON בלבד.

פרמטרים:
- סוג דיאטה: ${dietLabel}
- קלוריות יומיות: ${result.targetCalories}
- יעד חלבון יומי: ${result.protein}g
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

כללים: 7 ימים בדיוק (ראשון עד שבת). ארוחות ישראליות אמיתיות. אל תחרוג מ${excStr} לעולם. JSON בלבד ללא markdown.`;

      const raw  = await generateText(prompt);
      const plan = parseAIJson<WeeklyPlan>(raw);
      setWeekPlan(plan);
      setOpenDay(0);
    } catch {
      toast.error("שגיאה ביצירת תפריט — נסה שנית");
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-4 space-y-5 pb-4">

      {/* ══ SECTION 1: TDEE CALCULATOR ═══════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔬</span>
          <div>
            <p className="text-sm font-black text-white">מחשבון TDEE</p>
            <p className="text-[10px] text-white/40">נוסחת Mifflin-St Jeor — הסטנדרט המדעי</p>
          </div>
        </div>

        {/* Sex */}
        <GlassField label="מגדר">
          <div className="grid grid-cols-2 gap-2">
            {(["male", "female"] as Sex[]).map((s) => (
              <button key={s} onClick={() => setSex(s)}
                className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  sex === s
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/5 text-white/50"
                }`}>
                {s === "male" ? "זכר 👨" : "נקבה 👩"}
              </button>
            ))}
          </div>
        </GlassField>

        {/* Age / Height / Weight */}
        <div className="grid grid-cols-3 gap-3">
          <GlassField label='גיל'>
            <input type="number" value={age} onChange={(e) => setAge(+e.target.value)}
              className={inputCls} dir="ltr" />
          </GlassField>
          <GlassField label='גובה (ס"מ)'>
            <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)}
              className={inputCls} dir="ltr" />
          </GlassField>
          <GlassField label='משקל (ק"ג)'>
            <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)}
              className={inputCls} dir="ltr" />
          </GlassField>
        </div>

        {/* Activity */}
        <GlassField label="רמת פעילות">
          <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className={selectCls}>
            {(Object.keys(ACTIVITY_MULTIPLIER) as ActivityLevel[]).map((k) => (
              <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
            ))}
          </select>
        </GlassField>

        {/* Goal */}
        <GlassField label="מטרה">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button key={g} onClick={() => setGoal(g)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  goal === g
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/5 text-white/50"
                }`}>
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </GlassField>

        {/* Results panel */}
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400">היעדים המחושבים שלך</span>
          </div>

          {/* Big numbers row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "קלוריות יום רגיל",  value: `${result.targetCalories.toLocaleString()} קל׳`, big: true },
              { label: "קלוריות יום אימון", value: `${result.trainingCalories.toLocaleString()} קל׳`, big: true },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/8 border border-white/10 p-3 text-center">
                <p className="text-[10px] text-white/40 mb-1">{s.label}</p>
                <p className="text-lg font-black text-emerald-300">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { label: "חלבון",   value: `${result.protein}g` },
              { label: "פחמימות", value: `${result.carbs}g` },
              { label: "שומן",    value: `${result.fat}g` },
              { label: "מים",     value: `${(result.waterMl / 1000).toFixed(1)}L` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-2">
                <p className="text-[9px] text-white/40">{s.label}</p>
                <p className="text-sm font-black text-white/90">{s.value}</p>
              </div>
            ))}
          </div>

          {/* BMR / TDEE small */}
          <div className="flex justify-between text-[10px] text-white/30 px-1">
            <span>BMR: {result.bmr} קל׳</span>
            <span>TDEE: {result.tdee} קל׳</span>
          </div>
        </div>

        {/* Save button */}
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "שומר..." : "החל יעדים → Tab 1"}
        </button>
      </div>

      {/* ── Diet type indicator (set in מתכונים tab) ── */}
      {profile?.diet_type && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8">
          <span className="text-base">🥗</span>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40">דיאטה פעילה</p>
            <p className="text-sm font-bold text-emerald-300">{profile.diet_type}</p>
          </div>
          <p className="text-[9px] text-white/25 mr-auto">שנה בטאב מתכונים</p>
        </div>
      )}

      {/* ══ SECTION 3: EXCLUSIONS ════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚫</span>
          <div>
            <p className="text-sm font-black text-white">אלרגיות והגבלות</p>
            <p className="text-[10px] text-white/40">מרכיבים שלעולם לא יופיעו בתפריט</p>
          </div>
        </div>

        {/* Tag input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="גלוטן, חלב, אגוזים..."
            className={inputCls + " flex-1"}
          />
          <button onClick={addTag}
            className="px-4 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-colors min-h-[44px]">
            + הוסף
          </button>
        </div>

        {/* Tags */}
        {exclusions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {exclusions.map((t) => (
              <span key={t}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {t}
                <button onClick={() => removeTag(t)} className="opacity-60 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ══ SECTION 4: AI GENERATE BUTTON ════════════════════════════════════ */}
      <button
        onClick={generatePlan}
        disabled={generating || !profile?.diet_type}
        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-sm transition-all min-h-[56px] ${
          profile?.diet_type
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-2xl shadow-emerald-500/30 active:scale-[0.98]"
            : "bg-white/10 border border-white/10 opacity-40 cursor-not-allowed"
        } disabled:opacity-50`}
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>יוצר תפריט שבועי עם AI...</span>
          </>
        ) : (
          <>
            <Flame className="h-5 w-5" />
            <span>צור תפריט שבועי עם AI ✨</span>
          </>
        )}
      </button>

      {/* ══ SECTION 5: WEEKLY PLAN RESULTS ══════════════════════════════════ */}
      {weekPlan && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-black text-white">
              תפריט שבועי — {profile?.diet_type}
            </p>
          </div>

          {weekPlan.days.map((day, i) => (
            <div key={i}
              className={`rounded-2xl border overflow-hidden transition-all ${
                openDay === i ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/8 bg-white/3"
              }`}>
              {/* Day header */}
              <button
                onClick={() => setOpenDay(openDay === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${openDay === i ? "text-emerald-300" : "text-white/80"}`}>
                    {day.day}
                  </span>
                  <span className="text-[10px] text-white/30">{day.total_calories?.toLocaleString() ?? "—"} קל׳</span>
                </div>
                {openDay === i
                  ? <ChevronUp  className="h-4 w-4 text-emerald-400" />
                  : <ChevronDown className="h-4 w-4 text-white/30" />}
              </button>

              {/* Day meals */}
              {openDay === i && (
                <div className="px-4 pb-4 space-y-2">
                  {(
                    [
                      { key: "breakfast", label: "🌅 בוקר"   },
                      { key: "lunch",     label: "☀️ צהריים" },
                      { key: "dinner",    label: "🌙 ערב"    },
                      { key: "snack",     label: "🍎 חטיף"   },
                    ] as { key: keyof DayPlan; label: string }[]
                  ).map(({ key, label }) => {
                    const meal = day[key] as MealSlot | undefined;
                    if (!meal) return null;
                    return (
                      <div key={key} className="flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-[10px] text-white/40 shrink-0 pt-0.5">{label}</span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm text-white/90 font-medium leading-tight">{meal.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {meal.calories} קל׳ · {meal.protein}g חלבון
                          </p>
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
    </div>
  );
}
