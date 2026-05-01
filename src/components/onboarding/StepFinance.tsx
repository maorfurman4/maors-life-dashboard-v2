import { ContextTooltip } from "./ContextTooltip";
import type { OnboardingDraft } from "@/hooks/useOnboardingSync";

interface Props {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
}

function CurrencyInput({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  tooltip?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-white/80">{label}</label>
        {tooltip && <ContextTooltip text={tooltip} />}
      </div>
      <div className="relative">
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">₪</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value ?? ""}
          onChange={(e) => {
            const n = e.target.value === "" ? null : Number(e.target.value);
            onChange(n);
          }}
          placeholder="0"
          dir="ltr"
          className="w-full rounded-2xl backdrop-blur-md bg-white/10 border border-white/15 pr-9 pl-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
        />
      </div>
    </div>
  );
}

export function StepFinance({ draft, setField }: Props) {
  return (
    <div className="space-y-8 pt-4" dir="rtl">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">כלכלה 💰</h2>
        <p className="text-sm text-white/60">נעזור לך לנהל את הכסף בצורה חכמה</p>
      </div>

      <CurrencyInput
        label="הכנסה חודשית נטו"
        value={draft.monthly_income}
        onChange={(v) => setField("monthly_income", v)}
        tooltip="ההכנסה שלך לאחר ניכוי מיסים ובטוח לאומי."
      />

      <CurrencyInput
        label="תקציב חודשי להוצאות"
        value={draft.monthly_budget}
        onChange={(v) => setField("monthly_budget", v)}
        tooltip="הסכום שאתה מתכנן להוציא בממוצע בחודש על מחיה."
      />

      {/* Savings recommendation — static text, no calculation */}
      <div className="rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 px-5 py-4 space-y-1">
        <p className="text-xs font-bold text-white/50">המלצת חיסכון</p>
        <p className="text-sm text-white/80">
          מומלץ לחסוך לפחות{" "}
          <span className="font-black text-white">20%</span>{" "}
          מההכנסה החודשית שלך — כ-קרן חירום, פנסיה, ו/או השקעות.
        </p>
      </div>
    </div>
  );
}
