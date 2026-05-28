import { motion } from "framer-motion";
import { useMonthlyFinance } from "@/hooks/use-finance-data";
import { useProfile } from "@/hooks/use-profile";

const fmt = (n: number) =>
  n.toLocaleString("he-IL", { maximumFractionDigits: 0 });

export function HomeBalanceCard() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fin = useMonthlyFinance(year, month);
  const { data: profile, isLoading } = useProfile();

  const monthlyBudget =
    profile?.monthly_budget ?? null;

  const net = fin.totalIncome - fin.totalExpenses;
  const budgetUsedPct =
    monthlyBudget && monthlyBudget > 0
      ? Math.min(100, (fin.totalExpenses / monthlyBudget) * 100)
      : null;

  const remaining =
    monthlyBudget != null ? monthlyBudget - fin.totalExpenses : null;

  const barColor =
    budgetUsedPct == null
      ? "bg-white/30"
      : budgetUsedPct > 85
      ? "bg-red-500"
      : budgetUsedPct > 60
      ? "bg-amber-400"
      : "bg-emerald-400";

  if (isLoading && fin.totalIncome === 0 && fin.totalExpenses === 0) {
    return (
      <div className="rounded-2xl animate-pulse bg-white/10 h-[110px] w-full" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-4 space-y-2.5"
      style={{
        background: "rgba(43,34,28,0.72)",
        border: "1px solid rgba(244,226,140,0.18)",
        backdropFilter: "blur(12px)",
      }}
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-white/40 tracking-wide">
          נקי חודשי
        </p>
        <p
          className="text-xl font-black tabular-nums"
          style={{ color: net >= 0 ? "#7cbf8e" : "#d96b6b" }}
          dir="ltr"
        >
          {net >= 0 ? "+" : ""}₪{fmt(net)}
        </p>
      </div>

      {budgetUsedPct != null && (
        <div className="space-y-1">
          <div className="h-2 rounded-full overflow-hidden bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/35">
              {budgetUsedPct.toFixed(0)}% מהתקציב נוצל
            </p>
            {remaining != null && (
              <p
                className="text-[10px] font-bold"
                style={{ color: remaining >= 0 ? "#7cbf8e" : "#d96b6b" }}
                dir="ltr"
              >
                {remaining >= 0 ? "נותרו" : "חריגה"} ₪{fmt(Math.abs(remaining))}
              </p>
            )}
          </div>
        </div>
      )}

      {budgetUsedPct == null && (
        <p className="text-[10px] text-white/30">
          הגדר תקציב חודשי בפרופיל לצפייה באחוז ניצול
        </p>
      )}
    </motion.div>
  );
}
