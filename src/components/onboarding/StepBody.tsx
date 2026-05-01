import { ScrollPicker } from "./ScrollPicker";
import { OptionPill } from "./OptionPill";
import { ContextTooltip } from "./ContextTooltip";
import type { OnboardingDraft } from "@/hooks/useOnboardingSync";

const HEIGHTS = Array.from({ length: 81 }, (_, i) => 140 + i);
const WEIGHTS = Array.from({ length: 111 }, (_, i) => 40 + i);

const LIMITATION_OPTIONS = [
  "כתף",
  "גב תחתון",
  "ברך",
  "מרפק",
  "ירך",
  "קרסול",
  "אין מגבלות",
];

const NONE_VAL = "אין מגבלות";

interface Props {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleArrayItem: (key: keyof OnboardingDraft, item: string) => void;
}

export function StepBody({ draft, setField, toggleArrayItem }: Props) {
  const hasNone = draft.physical_limitations.includes(NONE_VAL);

  return (
    <div className="space-y-8 pt-4" dir="rtl">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">גוף ובריאות 💪</h2>
        <p className="text-sm text-white/60">נתונים אלה יעזרו לנו להתאים לך תוכנית מדויקת</p>
      </div>

      {/* Pickers row */}
      <div className="flex justify-around gap-4">
        <ScrollPicker
          label="גובה"
          items={HEIGHTS}
          value={draft.height_cm}
          unit='ס"מ'
          onChange={(v) => setField("height_cm", v)}
        />
        <ScrollPicker
          label="משקל"
          items={WEIGHTS}
          value={draft.weight_kg}
          unit="ק״ג"
          onChange={(v) => setField("weight_kg", v)}
        />
      </div>

      {/* Physical limitations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-white/80">מגבלות פיזיות</label>
          <ContextTooltip text="אם יש לך כאב או פציעה באיזור מסוים, נדאג לא לכלול תרגילים שעלולים להחמיר אותה." />
        </div>
        <div className="flex flex-wrap gap-2">
          {LIMITATION_OPTIONS.map((opt) => (
            <OptionPill
              key={opt}
              label={opt}
              active={draft.physical_limitations.includes(opt)}
              disabled={opt !== NONE_VAL && hasNone}
              variant={opt === NONE_VAL ? "none" : "default"}
              onClick={() => toggleArrayItem("physical_limitations", opt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
