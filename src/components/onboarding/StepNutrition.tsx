import { OptionPill } from "./OptionPill";
import { ContextTooltip } from "./ContextTooltip";
import type { OnboardingDraft } from "@/hooks/useOnboardingSync";

const DIET_TYPES = [
  "רגיל (הכל)",
  "טבעוני",
  "צמחוני",
  "ללא גלוטן",
  "ללא לקטוז",
  "קטוגני",
  "ים-תיכוני",
  "אחר",
];

const ALLERGY_OPTIONS = [
  "בוטנים",
  "אגוזים",
  "חלב",
  "ביצים",
  "גלוטן",
  "סויה",
  "דגים / פירות ים",
  "אין אלרגיות",
];

const NONE_ALLERGY = "אין אלרגיות";

interface Props {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleArrayItem: (key: keyof OnboardingDraft, item: string) => void;
}

export function StepNutrition({ draft, setField, toggleArrayItem }: Props) {
  const hasNoAllergy = draft.food_allergies.includes(NONE_ALLERGY);

  return (
    <div className="space-y-8 pt-4" dir="rtl">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">תזונה 🥗</h2>
        <p className="text-sm text-white/60">כדי להמליץ על תפריטים שמתאימים לך</p>
      </div>

      {/* Diet type */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-white/80">סוג תזונה</label>
        <div className="flex flex-wrap gap-2">
          {DIET_TYPES.map((opt) => (
            <OptionPill
              key={opt}
              label={opt}
              active={draft.diet_type === opt}
              onClick={() => setField("diet_type", draft.diet_type === opt ? "" : opt)}
            />
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-white/80">אלרגיות</label>
          <ContextTooltip text="נסנן מהמלצות המזון כל מוצר שמכיל רכיבים שאתה אלרגי אליהם." />
        </div>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_OPTIONS.map((opt) => {
            const isNone = opt === NONE_ALLERGY;
            const isActive = draft.food_allergies.includes(opt);
            const isDisabled = !isNone && !isActive && hasNoAllergy;
            return (
              <OptionPill
                key={opt}
                label={opt}
                active={isActive}
                disabled={isDisabled}
                variant={isNone ? "none" : "allergy"}
                onClick={() => toggleArrayItem("food_allergies", opt)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
