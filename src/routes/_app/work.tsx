import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { WorkMonthlySummary } from "@/components/work/WorkMonthlySummary";
import { WorkQuickAdd } from "@/components/work/WorkQuickAdd";
import { WorkShiftsList } from "@/components/work/WorkShiftsList";
import { WorkSalaryBreakdown } from "@/components/work/WorkSalaryBreakdown";
import { WorkContract } from "@/components/work/WorkContract";
import { WorkSalaryForecast } from "@/components/work/WorkSalaryForecast";
import { useMonthlyPayslip } from "@/hooks/use-work-data";

export const Route = createFileRoute("/_app/work")({
  component: WorkPage,
});

const MONTHS_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function WorkPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { payslip, shifts, isLoading } = useMonthlyPayslip(year, month);
  const monthLabel = `${MONTHS_HE[month - 1]} ${year}`;

  const goNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-work/15 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-work" />
        </div>
        <div>
          <h1 className="text-xl font-bold">עבודה</h1>
          <p className="text-xs text-muted-foreground">{monthLabel}</p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-1">
        <button onClick={goPrev} className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-card transition-colors min-h-[36px]">→ הקודם</button>
        <span className="text-xs font-semibold">{monthLabel}</span>
        <button onClick={goNext} className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-card transition-colors min-h-[36px]">הבא ←</button>
      </div>

      <WorkQuickAdd />
      <WorkSalaryForecast year={year} month={month} />
      <WorkMonthlySummary payslip={payslip} isLoading={isLoading} monthLabel={monthLabel} />
      <WorkShiftsList shifts={shifts} isLoading={isLoading} />
      <WorkSalaryBreakdown payslip={payslip} isLoading={isLoading} />
      <WorkContract />
    </div>
  );
}
