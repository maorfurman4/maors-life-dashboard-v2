import { Banknote } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { MonthlyPayslip } from "@/lib/payroll-engine";

interface WorkSalaryBreakdownProps {
  payslip: MonthlyPayslip | null;
  isLoading: boolean;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "font-bold" : ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${bold ? "text-foreground font-bold" : "text-foreground"}`} dir="ltr">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-work/80 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

const fmt = (n: number) => `₪${n.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function WorkSalaryBreakdown({ payslip, isLoading }: WorkSalaryBreakdownProps) {
  const hasData = payslip && payslip.totalShifts > 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-work" />
        <h3 className="text-sm font-semibold text-muted-foreground">פירוט תלוש צפוי</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-5 rounded bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={Banknote}
          message="אין משמרות — הוסף משמרות כדי לראות חישוב שכר"
          colorClass="text-work"
        />
      ) : payslip && (
        <div className="space-y-4">
          <Section title="רכיבי שכר">
            <Row label="שכר יסוד כולל שנ״ג" value={fmt(payslip.basePay)} />
            <Row label="הבראה" value={fmt(payslip.recovery)} />
            <Row label="תוספת מצוינות" value={fmt(payslip.excellence)} />
            {payslip.shabbatPay > 0 && <Row label="שעות שבת כולל שנ״ג" value={fmt(payslip.shabbatPay)} />}
            <Row label="נסיעות" value={fmt(payslip.travel)} />
            {payslip.briefingPay > 0 && <Row label="פ. תדרוך" value={fmt(payslip.briefingPay)} />}
            <div className="border-t border-border pt-1">
              <Row label="ברוטו" value={fmt(payslip.totalGross)} bold />
            </div>
          </Section>

          <Section title="ניכויי חובה">
            <Row label="ביטוח לאומי" value={fmt(payslip.nationalInsurance)} />
            <Row label="ביטוח בריאות" value={fmt(payslip.healthInsurance)} />
            <div className="border-t border-border pt-1">
              <Row label="סה״כ ניכויי חובה" value={fmt(payslip.totalMandatory)} bold />
            </div>
          </Section>

          <Section title="ניכויי משרד">
            <Row label="השתתפות ארוחות צהר" value={fmt(payslip.lunchDeduction)} />
            <Row label="הסתדרות לאומית" value={fmt(payslip.unionNational)} />
            <div className="border-t border-border pt-1">
              <Row label="סה״כ ניכויי משרד" value={fmt(payslip.totalOffice)} bold />
            </div>
          </Section>

          <Section title="ניכויי חו״ז">
            <Row label="ניכוי הראל ש'" value={fmt(payslip.harelSavings)} />
            <Row label="ניכוי הראל קר" value={fmt(payslip.harelStudy)} />
            <Row label="ניכוי האל נסיע" value={fmt(payslip.harelTravel)} />
            <Row label="ניכוי הראל ש' (נוסף)" value={fmt(payslip.extraHarel)} />
            <div className="border-t border-border pt-1">
              <Row label="סה״כ ניכויי חו״ז" value={fmt(payslip.totalPension)} bold />
            </div>
          </Section>

          <div className="rounded-xl bg-work/10 border border-work/20 p-3 space-y-1">
            <Row label="סה״כ ניכויים" value={fmt(payslip.totalDeductions)} bold />
            <Row label="שכר נטו" value={fmt(payslip.netPay)} bold />
            <Row label="סכום לבנק" value={fmt(payslip.bankAmount)} bold />
          </div>
        </div>
      )}
    </div>
  );
}
