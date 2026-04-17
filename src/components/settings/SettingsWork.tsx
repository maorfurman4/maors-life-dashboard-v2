import { useState, useEffect } from "react";
import { Briefcase, Save, Loader2 } from "lucide-react";
import { usePayrollSettings, useSavePayrollSettings } from "@/hooks/use-work-data";
import { DEFAULT_PAYROLL_SETTINGS, type PayrollSettings } from "@/lib/payroll-engine";
import { toast } from "sonner";

export function SettingsWork() {
  const { data: settings, isLoading } = usePayrollSettings();
  const saveSettings = useSavePayrollSettings();
  const [form, setForm] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const update = <K extends keyof PayrollSettings>(key: K, value: string) => {
    if (key === 'income_sync_mode') {
      setForm(prev => ({ ...prev, [key]: value as 'net' | 'bank' }));
    } else {
      setForm(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    }
  };

  const handleSave = () => {
    saveSettings.mutate(form, {
      onSuccess: () => toast.success("הגדרות עבודה נשמרו"),
      onError: () => toast.error("שגיאה בשמירת הגדרות"),
    });
  };

  const rateFields: { key: keyof PayrollSettings; label: string; unit: string }[] = [
    { key: "base_hourly_rate", label: "שכר בסיס (שעתי)", unit: "₪" },
    { key: "alt_hourly_rate", label: "שכר אחראי (שעתי)", unit: "₪" },
    { key: "recovery_per_hour", label: "הבראה לשעה", unit: "₪" },
    { key: "excellence_per_hour", label: "מצוינות לשעה", unit: "₪" },
    { key: "shabbat_hourly_rate", label: "שבת לשעה", unit: "₪" },
    { key: "travel_per_shift", label: "נסיעות למשמרת", unit: "₪" },
    { key: "briefing_per_shift", label: "תדרוך למשמרת", unit: "₪" },
  ];

  const mandatoryFields: { key: keyof PayrollSettings; label: string }[] = [
    { key: "national_insurance_pct", label: "ביטוח לאומי" },
    { key: "health_insurance_pct", label: "ביטוח בריאות" },
  ];

  const officeFields: { key: keyof PayrollSettings; label: string; unit: string }[] = [
    { key: "lunch_deduction", label: "השתתפות ארוחות צהר", unit: "₪" },
    { key: "union_national_deduction", label: "הסתדרות לאומית", unit: "₪" },
  ];

  const pensionFields: { key: keyof PayrollSettings; label: string }[] = [
    { key: "harel_savings_pct", label: "ניכוי הראל ש'" },
    { key: "harel_study_pct", label: "ניכוי הראל קר" },
    { key: "harel_travel_pct", label: "ניכוי האל נסיע" },
    { key: "extra_harel_pct", label: "ניכוי הראל ש' (נוסף)" },
  ];

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 md:p-5 flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 text-work animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-work" />
        <h3 className="text-sm font-semibold">חוזה עבודה ותעריפים</h3>
      </div>

      {/* Rates */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">תעריפים</p>
        {rateFields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">{f.label}</label>
            <div className="flex items-center gap-1.5">
              <input type="number" step="0.01"
                value={form[f.key] as number}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-24 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-work min-h-[44px]"
                dir="ltr" />
              <span className="text-xs text-muted-foreground w-6">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory */}
      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground font-medium">ניכויי חובה (%)</p>
        {mandatoryFields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">{f.label}</label>
            <div className="flex items-center gap-1.5">
              <input type="number" step="0.01"
                value={form[f.key] as number}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-24 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-work min-h-[44px]"
                dir="ltr" />
              <span className="text-xs text-muted-foreground w-6">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Office */}
      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground font-medium">ניכויי משרד</p>
        {officeFields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">{f.label}</label>
            <div className="flex items-center gap-1.5">
              <input type="number" step="0.01"
                value={form[f.key] as number}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-24 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-work min-h-[44px]"
                dir="ltr" />
              <span className="text-xs text-muted-foreground w-6">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pension */}
      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground font-medium">ניכויי חו״ז (%)</p>
        {pensionFields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted-foreground">{f.label}</label>
            <div className="flex items-center gap-1.5">
              <input type="number" step="0.01"
                value={form[f.key] as number}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-24 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-work min-h-[44px]"
                dir="ltr" />
              <span className="text-xs text-muted-foreground w-6">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sync mode */}
      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground font-medium">סנכרון הכנסה לכלכלה</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'net' as const, label: 'נטו' },
            { value: 'bank' as const, label: 'סכום בבנק' },
          ].map((opt) => (
            <button key={opt.value} onClick={() => update('income_sync_mode', opt.value)}
              className={`px-3 py-2.5 rounded-xl border transition-colors text-xs font-medium min-h-[44px] ${
                form.income_sync_mode === opt.value ? "border-work bg-work/10 text-work" : "border-border bg-card hover:bg-secondary/40 text-foreground"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saveSettings.isPending}
        className="w-full py-3 rounded-xl bg-work text-work-foreground font-bold text-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50">
        {saveSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saveSettings.isPending ? "שומר..." : "שמור הגדרות עבודה"}
      </button>
    </div>
  );
}
