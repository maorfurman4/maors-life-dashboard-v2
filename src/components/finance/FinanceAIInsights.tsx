import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMonthlyFinance, useExpenseHistory, useIncomeHistory, useFinanceSettings } from "@/hooks/use-finance-data";
import { toast } from "sonner";

interface AIComparison {
  category: string;
  change_pct: number;
  verdict: "good" | "neutral" | "bad";
  note: string;
}

interface AIRecommendation {
  title: string;
  impact_ils: number;
  action: string;
}

interface AIInsights {
  status: "excellent" | "good" | "warning" | "danger";
  summary: string;
  comparisons: AIComparison[];
  recommendations: AIRecommendation[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  excellent: { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-500", icon: CheckCircle2, label: "מצוין" },
  good: { bg: "bg-finance/15 border-finance/30", text: "text-finance", icon: CheckCircle2, label: "טוב" },
  warning: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-500", icon: AlertTriangle, label: "אזהרה" },
  danger: { bg: "bg-destructive/15 border-destructive/30", text: "text-destructive", icon: AlertTriangle, label: "קריטי" },
};

export function FinanceAIInsights() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthly = useMonthlyFinance(year, month);
  const { data: expenseHistory } = useExpenseHistory(4);
  const { data: incomeHistory } = useIncomeHistory(4);
  const { data: settings } = useFinanceSettings();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsights | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      // Build previous months summary
      const previousMonths: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(year, month - 1 - i, 1);
        const ym = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        const exp = (expenseHistory || []).filter((e: any) => e.date.startsWith(ym)).reduce((s: number, e: any) => s + Number(e.amount), 0);
        const inc = (incomeHistory || []).filter((e: any) => e.date.startsWith(ym)).reduce((s: number, e: any) => s + Number(e.amount), 0);
        previousMonths.push({
          label: d.toLocaleDateString("he-IL", { month: "long" }),
          income: Math.round(inc),
          expenses: Math.round(exp),
          savings: Math.round(inc - exp),
        });
      }

      const { data, error } = await supabase.functions.invoke("finance-insights-ai", {
        body: {
          currentMonth: {
            income: Math.round(monthly.totalIncome || 0),
            expenses: Math.round(monthly.totalExpenses || 0),
            savings: Math.round((monthly.totalIncome || 0) - (monthly.totalExpenses || 0)),
            categories: monthly.categoryBreakdown || {},
          },
          previousMonths,
          savingsGoalPct: settings?.savings_goal_pct || 35,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setInsights(data.insights);
      toast.success("הניתוח מוכן!");
    } catch (e: any) {
      console.error(e);
      toast.error("שגיאה: " + (e?.message || "לא ידוע"));
    } finally {
      setLoading(false);
    }
  };

  const status = insights ? STATUS_STYLES[insights.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="rounded-2xl border border-finance/30 bg-gradient-to-br from-finance/5 to-transparent p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-finance/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-finance" />
          </div>
          <div>
            <h3 className="text-sm font-bold">ניתוח חודשי AI</h3>
            <p className="text-[11px] text-muted-foreground">השוואות + המלצות מותאמות</p>
          </div>
        </div>
        {!loading && (
          <button
            onClick={generate}
            className="px-3 py-1.5 rounded-lg bg-finance text-finance-foreground text-[11px] font-bold hover:opacity-90 min-h-[32px]"
          >
            {insights ? "רענן" : "נתח עכשיו"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-finance" />
          <p className="text-xs text-muted-foreground">AI מנתח את החודש שלך…</p>
        </div>
      )}

      {insights && status && StatusIcon && (
        <div className="space-y-3">
          <div className={`rounded-xl border ${status.bg} p-3 flex items-start gap-2`}>
            <StatusIcon className={`h-4 w-4 ${status.text} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className={`text-[11px] font-bold ${status.text} mb-0.5`}>{status.label}</p>
              <p className="text-xs leading-relaxed">{insights.summary}</p>
            </div>
          </div>

          {insights.comparisons.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-muted-foreground">השוואה לחודש קודם</p>
              {insights.comparisons.map((c, i) => {
                const Icon = c.change_pct > 5 ? TrendingUp : c.change_pct < -5 ? TrendingDown : Minus;
                const color = c.verdict === "good" ? "text-emerald-500" : c.verdict === "bad" ? "text-destructive" : "text-muted-foreground";
                return (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{c.category}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.note}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${color} shrink-0`}>
                      {c.change_pct > 0 ? "+" : ""}{c.change_pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {insights.recommendations.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-muted-foreground">המלצות לחיסכון</p>
              {insights.recommendations.map((r, i) => (
                <div key={i} className="rounded-lg border border-finance/20 bg-finance/5 p-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold flex-1">{r.title}</p>
                    {r.impact_ils > 0 && (
                      <span className="text-[10px] font-bold text-finance shrink-0">חיסכון ~₪{r.impact_ils}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{r.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!insights && !loading && (
        <p className="text-[11px] text-muted-foreground text-center py-2">
          לחץ על "נתח עכשיו" כדי לקבל המלצות מותאמות אישית מ-AI
        </p>
      )}
    </div>
  );
}
