import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Calendar, ShoppingCart, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserSettings } from "@/hooks/use-sport-data";
import { toast } from "sonner";

type MealType = "ארוחת בוקר" | "ארוחת צהריים" | "ארוחת ערב";

interface Meal {
  type: MealType;
  name: string;
  calories: number;
  ingredients: string[];
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

interface MealPlanResult {
  plan: DayPlan[];
  shoppingList: string[];
}

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;

const RESTRICTIONS = [
  { key: "ללא גלוטן", label: "ללא גלוטן" },
  { key: "ללא לקטוז", label: "ללא לקטוז" },
  { key: "טבעוני", label: "טבעוני" },
  { key: "צמחוני", label: "צמחוני" },
  { key: "כשר", label: "כשר" },
] as const;

const MEAL_COLORS: Record<MealType, string> = {
  "ארוחת בוקר": "#f59e0b",
  "ארוחת צהריים": "#10b981",
  "ארוחת ערב": "#8b5cf6",
};

function MealAccordion({ meal, index }: { meal: Meal; index: number }) {
  const [open, setOpen] = useState(false);
  const color = MEAL_COLORS[meal.type] ?? "#10b981";

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
      style={{
        opacity: 1,
        animation: `slideIn 0.25s ease ${index * 0.07}s both`,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 text-right"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
          <div>
            <p className="text-[10px] font-bold" style={{ color }}>{meal.type}</p>
            <p className="text-sm font-semibold text-white leading-tight">{meal.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-white/60">{meal.calories} קל׳</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-0 border-t border-white/5">
          <p className="text-[10px] font-bold text-white/40 mb-2 mt-2">מרכיבים:</p>
          <ul className="space-y-1">
            {meal.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                <div className="h-1 w-1 rounded-full bg-white/30 shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function NutritionWeeklyMealPlan() {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();

  const s = settings as Record<string, unknown> | undefined;
  const defaultCalories = (s?.daily_calories_goal as number | undefined) ?? 2000;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState<string>(String(defaultCalories));
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealPlanResult | null>(null);
  const [activeDay, setActiveDay] = useState(0);

  const toggleRestriction = (key: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("meal-plan-ai", {
        body: {
          calorieGoal: parseInt(calorieGoal) || 2000,
          restrictions: selectedRestrictions,
          budget: budget ? parseFloat(budget) : undefined,
          userId: user?.id,
        },
      });
      if (error) throw error;
      if (!data?.plan) throw new Error("תגובה לא תקינה מהשרת");
      setResult(data as MealPlanResult);
      setSheetOpen(false);
      setActiveDay(0);
    } catch (err: unknown) {
      toast.error("שגיאה: " + ((err as Error).message ?? "נסה שוב"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    toast.success("תפריט נשמר!");
  };

  const activeDayData = result?.plan.find((d) => d.day === DAYS[activeDay]);
  const totalDayCalories = activeDayData?.meals.reduce((s, m) => s + m.calories, 0) ?? 0;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      <div className="px-4 pt-6 pb-32 space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">תפריט שבועי</h2>
            <p className="text-xs text-white/40">תכנון ארוחות ל-7 ימים עם AI</p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            <Calendar className="h-4 w-4" />
            בנה תפריט שבועי
          </button>
        </div>

        {sheetOpen && (
          <>
            <div
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
              style={{ animation: "fadeScale 0.15s ease both" }}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[95] rounded-t-3xl bg-[#0f1117] border-t border-white/10 p-6 space-y-5 max-h-[85vh] overflow-y-auto"
              style={{ animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1) both" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">הגדרות תפריט</h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 mb-2">יעד קלוריות יומי</label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/60"
                  placeholder="2000"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 mb-3">הגבלות תזונה</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map((r) => {
                    const active = selectedRestrictions.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        onClick={() => toggleRestriction(r.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          active
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "bg-white/5 border-white/10 text-white/50"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 mb-2">תקציב מזון יומי (₪)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/60"
                  placeholder="לא חובה"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    בונה תפריט אישי...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    צור תפריט שבועי
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {!result && !loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-3xl bg-emerald-500/15 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-white font-bold text-base">עדיין אין תפריט</p>
            <p className="text-white/40 text-sm">לחץ על "בנה תפריט שבועי" כדי לקבל תכנית ארוחות מותאמת אישית ל-7 ימים</p>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            <p className="text-white font-bold">בונה תפריט אישי...</p>
            <p className="text-white/40 text-xs">יכול לקחת עד 30 שניות</p>
          </div>
        )}

        {result && (
          <div style={{ animation: "fadeScale 0.25s ease both" }} className="space-y-4">
            <div className="overflow-x-auto pb-1 -mx-1 px-1">
              <div className="flex gap-1.5 min-w-max">
                {DAYS.map((day, i) => {
                  const dayData = result.plan.find((d) => d.day === day);
                  const dayCal = dayData?.meals.reduce((s, m) => s + m.calories, 0) ?? 0;
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveDay(i)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all min-w-[52px] ${
                        activeDay === i
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white/70"
                      }`}
                    >
                      <span>{day}</span>
                      {dayCal > 0 && (
                        <span className={`text-[9px] ${activeDay === i ? "text-white/80" : "text-white/30"}`}>
                          {dayCal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeDayData && (
              <div key={activeDay} className="space-y-3" style={{ animation: "fadeScale 0.18s ease both" }}>
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-black text-white">יום {activeDayData.day}</p>
                  <span className="text-xs text-white/40">{totalDayCalories} קל׳ סה״כ</span>
                </div>

                {activeDayData.meals.map((meal, i) => (
                  <MealAccordion key={i} meal={meal} index={i} />
                ))}
              </div>
            )}

            {result.shoppingList && result.shoppingList.length > 0 && (
              <div
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3"
                style={{ animation: "slideIn 0.3s ease 0.2s both" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-white">רשימת קנייה</h3>
                  <span className="text-xs text-white/30">{result.shoppingList.length} פריטים</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {result.shoppingList.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-white/70 py-1.5 px-2 rounded-xl bg-white/5"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-sm active:scale-95 transition-transform"
            >
              <Check className="h-4 w-4" />
              שמור תפריט
            </button>
          </div>
        )}
      </div>
    </>
  );
}
