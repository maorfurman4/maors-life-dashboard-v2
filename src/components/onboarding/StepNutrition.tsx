import { OptionPillGroup } from "./OptionPillGroup";
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

interface Props {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleArrayItem: (key: keyof OnboardingDraft, item: string) => void;
}

export function StepNutrition({ draft, setField, toggleArrayItem }: Props) {
  return (
    <div className="space-y-8 pt-4" dir="rtl">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">תזונה 🥗</h2>
        <p className="text-sm text-white/60">כדי להמליץ על תפריטים שמתאימים לך</p>
      </div>

      {/* Diet type — single select, "אחר" reveals custom input */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-white/80">סוג תזונה</label>
        <OptionPillGroup
          mode="single"
          options={DIET_TYPES}
          value={draft.diet_type}
          onChange={(v) => setField("diet_type", v)}
          customValue={draft.custom_diet}
          onCustomChange={(text) => setField("custom_diet", text)}
        />
      </div>

      {/* Allergies — multi select with mutual exclusivity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-white/80">אלרגיות</label>
          <ContextTooltip text="נסנן מהמלצות המזון כל מוצר שמכיל רכיבים שאתה אלרגי אליהם." />
        </div>
        <OptionPillGroup
          mode="multi"
          options={ALLERGY_OPTIONS}
          selected={draft.food_allergies}
          onToggle={(item) => toggleArrayItem("food_allergies", item)}
          customValue=""
          onCustomChange={() => {}}
          variant="allergy"
          disabledWhen="אין אלרגיות"
        />
      </div>
    </div>
  );
}
