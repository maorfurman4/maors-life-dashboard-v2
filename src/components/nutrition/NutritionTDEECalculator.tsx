import { useEffect, useMemo, useState } from "react";
import { Calculator, Sparkles, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIER,
  GOAL_LABELS,
  calcAge,
  calcTDEE,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/tdee";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function NutritionTDEECalculator() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings-tdee"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data } = await supabase
        .from("user_settings")
        .select("date_of_birth, height_cm, weight_kg, daily_calories_goal, training_day_calories, daily_protein_goal, training_day_protein, daily_carbs_goal, daily_fat_goal, daily_water_ml")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState<number>(28);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");

  useEffect(() => {
    if (!settings) return;
    const computedAge = calcAge(settings.date_of_birth);
    if (computedAge) setAge(computedAge);
    if (settings.height_cm) setHeightCm(Number(settings.height_cm));
    if (settings.weight_kg) setWeightKg(Number(settings.weight_kg));
  }, [settings]);

  const result = useMemo(
    () => calcTDEE({ sex, age, heightCm, weightKg, activityLevel: activity, goal }),
    [sex, age, heightCm, weightKg, activity, goal]
  );

  const applyMutation = useMutation({
    mutationFn: async () => {
      const userId = await getUserId();
      const updates = {
        daily_calories_goal: result.targetCalories,
        training_day_calories: result.trainingCalories,
        daily_protein_goal: result.protein,
        training_day_protein: result.trainingProtein,
        daily_carbs_goal: result.carbs,
        daily_fat_goal: result.fat,
        daily_water_ml: result.waterMl,
        height_cm: heightCm,
        weight_kg: weightKg,
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
    onError: (e: any) => toast.error(e?.message || "שגיאה בשמירה"),
  });

  if (isLoading) {
    return <div className="rounded-2xl border border-nutrition/15 bg-card p-4 h-48 animate-pulse" />;
  }

  return (
    <div className="rounded-2xl border border-nutrition/15 bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-nutrition" />
        <h3 className="text-sm font-bold">מחשבון יעדי תזונה (TDEE)</h3>
      </div>
      <p className="text-[10px] text-muted-foreground -mt-2">
        מחושב לפי נוסחת Mifflin-St Jeor — הסטנדרט המודרני
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="מגדר">
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}
            className="w-full rounded-lg bg-secondary/40 border border-border px-2 py-2 text-sm min-h-[40px]">
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
          </select>
        </Field>
        <Field label="גיל">
          <input type="number" value={age} onChange={(e) => setAge(+e.target.value)}
            className="w-full rounded-lg bg-secondary/40 border border-border px-2 py-2 text-sm min-h-[40px]" dir="ltr" />
        </Field>
        <Field label='גובה (ס"מ)'>
          <input type="number" value={heightCm} onChange={(e) => setHeightCm(+e.target.value)}
            className="w-full rounded-lg bg-secondary/40 border border-border px-2 py-2 text-sm min-h-[40px]" dir="ltr" />
        </Field>
        <Field label='משקל (ק"ג)'>
          <input type="number" value={weightKg} onChange={(e) => setWeightKg(+e.target.value)}
            className="w-full rounded-lg bg-secondary/40 border border-border px-2 py-2 text-sm min-h-[40px]" dir="ltr" />
        </Field>
      </div>

      <Field label="רמת פעילות">
        <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}
          className="w-full rounded-lg bg-secondary/40 border border-border px-2 py-2 text-sm min-h-[40px]">
          {(Object.keys(ACTIVITY_MULTIPLIER) as ActivityLevel[]).map((k) => (
            <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
          ))}
        </select>
      </Field>

      <Field label="מטרה">
        <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}
          className="w-full rounded-lg bg-secondary/40 border border-border px-2 py-2 text-sm min-h-[40px]">
          {(Object.keys(GOAL_LABELS) as Goal[]).map((k) => (
            <option key={k} value={k}>{GOAL_LABELS[k]}</option>
          ))}
        </select>
      </Field>

      {/* Results */}
      <div className="rounded-xl bg-nutrition/10 border border-nutrition/20 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-nutrition" />
          <span className="text-xs font-bold text-nutrition">היעדים המחושבים שלך</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Stat label="BMR" value={`${result.bmr} kcal`} />
          <Stat label="TDEE (תחזוקה)" value={`${result.tdee} kcal`} />
          <Stat label="קלוריות יעד" value={`${result.targetCalories} kcal`} highlight />
          <Stat label="קלוריות יום אימון" value={`${result.trainingCalories} kcal`} highlight />
          <Stat label="חלבון מנוחה" value={`${result.protein}g`} />
          <Stat label="חלבון אימון" value={`${result.trainingProtein}g`} />
          <Stat label="פחמימות" value={`${result.carbs}g`} />
          <Stat label="שומן" value={`${result.fat}g`} />
          <Stat label="מים" value={`${result.waterMl}ml`} />
        </div>
      </div>

      <button
        onClick={() => applyMutation.mutate()}
        disabled={applyMutation.isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-nutrition/20 text-nutrition text-sm font-bold hover:bg-nutrition/30 transition-colors min-h-[44px] disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {applyMutation.isPending ? "שומר..." : "החל את היעדים"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-card/50 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight ? "text-nutrition" : ""}`}>{value}</span>
    </div>
  );
}
