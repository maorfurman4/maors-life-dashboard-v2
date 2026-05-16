import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, Save,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  calcTDEE, ACTIVITY_LABELS, ACTIVITY_MULTIPLIER, GOAL_LABELS,
  type ActivityLevel, type Goal, type Sex,
} from "@/lib/tdee";

// ─── helpers ─────────────────────────────────────────────────────────────────
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

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
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={age}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").replace(/^0+(\d)/, "$1");
                if (digits === "" || (Number(digits) > 0 && Number(digits) < 100)) {
                  setAge(digits === "" ? 0 : Number(digits));
                }
              }}
              className={inputCls}
              dir="ltr"
            />
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

    </div>
  );
}
