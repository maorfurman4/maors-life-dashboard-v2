import { useMemo } from "react";
import { TrendingUp, Target, CalendarClock } from "lucide-react";
import { useMonthlyPayslip } from "@/hooks/use-work-data";

interface Props {
  year: number;
  month: number;
}

/**
 * Real-time monthly salary forecast.
 * Compares current shifts pace to forecasted full-month earnings.
 */
export function WorkSalaryForecast({ year, month }: Props) {
  const { payslip, shifts, isLoading } = useMonthlyPayslip(year, month);

  const forecast = useMemo(() => {
    if (!payslip) return null;
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = isCurrentMonth ? now.getDate() : daysInMonth;

    // Days passed vs total
    const daysPassed = Math.min(today, daysInMonth);
    const daysRemaining = Math.max(0, daysInMonth - daysPassed);

    // Already-paid shifts (date <= today)
    const todayStr = isCurrentMonth ? now.toISOString().slice(0, 10) : `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    const completedShifts = shifts.filter((s) => s.date <= todayStr);
    const futureShifts = shifts.filter((s) => s.date > todayStr);

    const completedCount = completedShifts.length;
    const plannedCount = futureShifts.length;

    // Linear projection based on pace so far
    const pacePerDay = daysPassed > 0 ? payslip.netPay / daysPassed : 0;
    const linearProjection = pacePerDay * daysInMonth;

    // Planned projection: actual + future shifts (assumes their value)
    const totalShiftCount = completedCount + plannedCount;

    return {
      isCurrentMonth,
      daysInMonth,
      daysPassed,
      daysRemaining,
      progressPct: Math.round((daysPassed / daysInMonth) * 100),
      currentNet: payslip.netPay,
      currentGross: payslip.totalGross,
      linearProjection: Math.round(linearProjection),
      completedCount,
      plannedCount,
      totalShiftCount,
    };
  }, [payslip, shifts, year, month]);

  if (isLoading || !forecast) {
    return <div className="rounded-2xl border border-work/15 bg-card p-4 h-32 animate-pulse" />;
  }

  if (!forecast.isCurrentMonth) {
    return null; // Only show forecast for current month
  }

  const fmt = (n: number) => `₪${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;

  return (
    <div className="rounded-2xl border border-work/20 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-work" />
        <h3 className="text-sm font-bold">תחזית משכורת חודשית</h3>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">יום {forecast.daysPassed} מתוך {forecast.daysInMonth}</span>
          <span className="font-bold text-work">{forecast.progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-work to-work/70 transition-all"
            style={{ width: `${forecast.progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary/30 p-3 space-y-1">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-sport" />
            <span className="text-[10px] text-muted-foreground">נצבר עד עכשיו</span>
          </div>
          <p className="text-base font-bold">{fmt(forecast.currentNet)}</p>
          <p className="text-[9px] text-muted-foreground">{forecast.completedCount} משמרות</p>
        </div>
        <div className="rounded-xl bg-work/10 border border-work/20 p-3 space-y-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-work" />
            <span className="text-[10px] text-muted-foreground">תחזית סוף חודש</span>
          </div>
          <p className="text-base font-bold text-work">{fmt(forecast.linearProjection)}</p>
          <p className="text-[9px] text-muted-foreground">לפי קצב נוכחי</p>
        </div>
      </div>

      {forecast.plannedCount > 0 && (
        <div className="rounded-lg bg-finance/10 px-3 py-2 text-[11px]">
          <span className="text-muted-foreground">משמרות מתוכננות עוד: </span>
          <span className="font-bold text-finance">{forecast.plannedCount}</span>
          <span className="text-muted-foreground"> (כבר רשומות בלוח)</span>
        </div>
      )}

      <p className="text-[9px] text-center text-muted-foreground">
        💡 התחזית מבוססת על קצב הצבירה הנוכחי שלך
      </p>
    </div>
  );
}
