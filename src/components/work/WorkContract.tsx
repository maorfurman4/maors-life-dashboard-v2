import { Settings, FileText } from "lucide-react";
import { DEFAULT_RATES, DEFAULT_DEDUCTIONS, ROLES } from "@/lib/work-utils";

const contractDetails = [
  { label: "תפקיד", value: ROLES.guard.label },
  { label: "שכר שעתי (מאבטח)", value: `₪${DEFAULT_RATES.guardRate}` },
  { label: "שכר שעתי (אחראי)", value: `₪${DEFAULT_RATES.shiftManagerRate}` },
  { label: "נסיעות ליום", value: `₪${DEFAULT_RATES.travelAllowance}` },
  { label: "תדרוך", value: `₪${DEFAULT_RATES.briefingAllowance}` },
  { label: "שבת/חג", value: `${DEFAULT_RATES.shabbatMultiplier * 100}%` },
];

const deductionDetails = [
  { label: "הסתדרות", value: `${DEFAULT_DEDUCTIONS.unionPct}%` },
  { label: "פנסיה", value: `${DEFAULT_DEDUCTIONS.pensionPct}%` },
  { label: "קרן השתלמות", value: `${DEFAULT_DEDUCTIONS.educationFundPct}%` },
];

export function WorkContract() {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-work" />
          <h3 className="text-sm font-semibold text-muted-foreground">תעריפים וחוזה</h3>
        </div>
        <button className="flex items-center gap-0.5 text-xs text-work hover:underline">
          <Settings className="h-3 w-3" /> עריכה בהגדרות
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">תעריפים</p>
        {contractDetails.map((d) => (
          <div key={d.label} className="flex items-center justify-between py-1.5 px-1">
            <span className="text-sm text-muted-foreground">{d.label}</span>
            <span className="text-sm font-medium">{d.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground font-medium">ניכויים</p>
        {deductionDetails.map((d) => (
          <div key={d.label} className="flex items-center justify-between py-1.5 px-1">
            <span className="text-sm text-muted-foreground">{d.label}</span>
            <span className="text-sm font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
