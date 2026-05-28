import { useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { useExpenseEntries, useFinanceSettings } from "@/hooks/use-finance-data";
import { generateText, parseAIJson } from "@/lib/ai-service";
import { FT } from "@/lib/finance-theme";

const fmt = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

interface ForecastResult {
  predictedMonthEnd: number;
  topCategory: string;
  topCategoryAmount: number;
  status: "green" | "yellow" | "red";
  summary: string;
}

function TrafficLight({ status }: { status: "green" | "yellow" | "red" | null }) {
  const colors = {
    green: { active: "#22c55e", label: "בשליטה" },
    yellow: { active: "#eab308", label: "תשומת לב" },
    red: { active: "#ef4444", label: "חריגה" },
  };
  const lights = ["red", "yellow", "green"] as const;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-col gap-1.5 p-2 rounded-2xl" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {lights.map((c) => (
          <div
            key={c}
            className="h-5 w-5 rounded-full transition-all duration-500"
            style={{
              background: status === c ? colors[c].active : "rgba(255,255,255,0.06)",
              boxShadow: status === c ? `0 0 10px ${colors[c].active}` : "none",
            }}
          />
        ))}
      </div>
      {status && (
        <p className="text-[10px] font-bold" style={{ color: colors[status].active, letterSpacing: 0 }}>
          {colors[status].label}
        </p>
      )}
    </div>
  );
}

function SkeletonForecast() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-32 rounded-full" style={{ background: FT.brownDim }} />
      <div className="h-16 rounded-2xl" style={{ background: FT.brownDim }} />
      <div className="h-8 rounded-2xl" style={{ background: FT.brownDim }} />
    </div>
  );
}

export function FinanceAIForecast() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: expenses, isLoading: expLoading } = useExpenseEntries(year, month);
  const { data: settings } = useFinanceSettings();
  const monthlyBudget = settings?.savings_goal_amount ?? null;

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runForecast() {
    if (!expenses || expenses.length === 0) {
      setError("אין נתוני הוצאות לחיזוי");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const categoryTotals: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (expenses as any[]).forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount);
      });

      const today = now.getDate();
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysLeft = daysInMonth - today;

      const prompt = `אתה יועץ פיננסי. ניתח את ההוצאות החודשיות הבאות (עד עכשיו, יום ${today} מתוך ${daysInMonth}) ותחזית לסוף החודש.

הוצאות לפי קטגוריה (₪):
${Object.entries(categoryTotals).map(([cat, amt]) => `- ${cat}: ₪${amt}`).join("\n")}

נותרו ${daysLeft} ימים עד סוף החודש.

החזר JSON בפורמט הבא בלבד (ללא טקסט נוסף):
{
  "predictedMonthEnd": <סכום כולל חזוי לסוף החודש (מספר)>,
  "topCategory": "<קטגוריה עם הוצאה הגבוהה ביותר>",
  "topCategoryAmount": <סכום הקטגוריה (מספר)>,
  "status": "<green אם בשליטה, yellow אם צריך תשומת לב, red אם חריגה>",
  "summary": "<משפט קצר בעברית על מצב ההוצאות>"
}`;

      const raw = await generateText(prompt);
      const result = parseAIJson<ForecastResult>(raw);
      setForecast(result);
    } catch {
      setError("שגיאה בקבלת תחזית AI");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-3xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ background: FT.card, border: `1px solid ${FT.goldBorder}` }}
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: FT.gold }} />
          <p className="text-sm font-black" style={{ color: FT.gold, letterSpacing: 0 }}>תחזית הוצאות AI</p>
        </div>
        <button
          onClick={runForecast}
          disabled={loading || expLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90 disabled:opacity-50"
          style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}`, color: FT.gold, letterSpacing: 0 }}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {forecast ? "רענן תחזית" : "הפעל תחזית"}
        </button>
      </div>

      {(loading || expLoading) && <SkeletonForecast />}

      {error && !loading && (
        <p className="text-xs text-center py-4" style={{ color: FT.danger, letterSpacing: 0 }}>{error}</p>
      )}

      {!forecast && !loading && !expLoading && !error && (
        <p className="text-xs text-center py-4" style={{ color: FT.textFaint, letterSpacing: 0 }}>
          לחץ על "הפעל תחזית" לניתוח AI של הוצאותיך
        </p>
      )}

      {forecast && !loading && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <TrafficLight status={forecast.status} />

            <div className="flex-1">
              <p className="text-xs font-bold mb-1" style={{ color: FT.textMuted, letterSpacing: 0 }}>
                לפי הקצב הנוכחי...
              </p>
              <p
                className="text-2xl font-black"
                style={{
                  color: forecast.status === "red" ? FT.danger : forecast.status === "yellow" ? "#eab308" : FT.success,
                  letterSpacing: 0,
                }}
                dir="ltr"
              >
                ₪{fmt(forecast.predictedMonthEnd)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: FT.textFaint, letterSpacing: 0 }}>
                תחזית הוצאות לסוף החודש
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-3"
            style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${FT.brownBorder}` }}
          >
            <p className="text-xs leading-relaxed" style={{ color: FT.textSub, letterSpacing: 0 }}>
              {forecast.summary}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: FT.textMuted, letterSpacing: 0 }}>
              קטגוריה מובילה: <span className="font-bold" style={{ color: FT.gold }}>{forecast.topCategory}</span>
            </p>
            <p className="text-xs font-bold" style={{ color: FT.gold, letterSpacing: 0 }} dir="ltr">
              ₪{fmt(forecast.topCategoryAmount)}
            </p>
          </div>

          {monthlyBudget && (
            <div
              className="flex items-center justify-between pt-2"
              style={{ borderTop: `1px solid ${FT.goldBorder}` }}
            >
              <p className="text-xs" style={{ color: FT.textMuted, letterSpacing: 0 }}>תקציב חודשי</p>
              <p className="text-xs font-bold" style={{ color: FT.gold, letterSpacing: 0 }} dir="ltr">
                ₪{fmt(monthlyBudget)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
