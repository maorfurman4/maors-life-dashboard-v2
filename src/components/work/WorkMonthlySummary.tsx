import { Clock, Calendar, TrendingUp, Briefcase, DollarSign, Sun, BookOpen, Car } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { MonthlyPayslip } from "@/lib/payroll-engine";

interface WorkMonthlySummaryProps {
  payslip: MonthlyPayslip | null;
  isLoading: boolean;
  monthLabel: string;
}

export function WorkMonthlySummary({ payslip, isLoading, monthLabel }: WorkMonthlySummaryProps) {
  const hasData = payslip && payslip.totalShifts > 0;

  const fmt = (n: number) => `₪${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;

  const stats = payslip
    ? [
        { label: "ברוטו צפוי", value: fmt(payslip.totalGross), icon: TrendingUp, color: "text-work" },
        { label: "נטו צפוי", value: fmt(payslip.netPay), icon: DollarSign, color: "text-sport" },
        { label: "לבנק", value: fmt(payslip.bankAmount), icon: Briefcase, color: "text-finance" },
        { label: "משמרות", value: String(payslip.totalShifts), icon: Calendar, color: "text-work" },
        { label: "שעות", value: String(payslip.totalHours), icon: Clock, color: "text-work" },
        { label: "שעות שבת", value: String(payslip.shabbatHours), icon: Sun, color: "text-finance" },
        { label: "תדרוכים", value: String(payslip.briefingCount), icon: BookOpen, color: "text-work" },
        { label: "נסיעות", value: String(payslip.travelCount), icon: Car, color: "text-work" },
      ]
    : [];

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">סיכום חודשי — {monthLabel}</h3>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={Calendar}
          message="אין משמרות החודש — הוסף משמרת כדי לראות סיכום"
          colorClass="text-work"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-secondary/30 p-3 space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <s.icon className={`h-3.5 w-3.5 ${s.color} shrink-0`} />
                <span className="text-[11px] text-muted-foreground truncate">{s.label}</span>
              </div>
              <p className="text-lg md:text-xl font-bold truncate">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
