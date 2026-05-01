import { OptionPill } from "./OptionPill";
import { OptionPillGroup } from "./OptionPillGroup";
import type { OnboardingDraft } from "@/hooks/useOnboardingSync";

const SPORT_TYPES = [
  "כוח / חדר כושר",
  "ריצה",
  "יוגה",
  "פילאטס",
  "שחייה",
  "אופניים",
  "CrossFit",
  "בוקסינג / אומנויות לחימה",
  "כדורגל / כדורסל",
  "טניס / פדל",
  "הליכה / טיולים",
  "ספורט אחר",
];

const MUSCLE_FOCUS = [
  "חזה",
  "גב",
  "כתפיים",
  "ידיים (ביספס / טריספס)",
  "בטן / קור",
  "ישבן",
  "רגליים",
  "כל הגוף",
];

const MAX_SPORT = 4;
const MAX_MUSCLE = 4;

interface Props {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleArrayItem: (key: keyof OnboardingDraft, item: string) => void;
}

export function StepSport({ draft, setField, toggleArrayItem }: Props) {
  const muscleMaxed = draft.muscle_focus.length >= MAX_MUSCLE;

  return (
    <div className="space-y-8 pt-4" dir="rtl">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">ספורט 🏋️</h2>
        <p className="text-sm text-white/60">מה הפעילות שאתה אוהב? בחר עד {MAX_SPORT}</p>
      </div>

      {/* Sport types — uses OptionPillGroup for "ספורט אחר" detection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-white/80">סוגי ספורט</label>
          {draft.sport_types.length >= MAX_SPORT && (
            <span className="text-xs text-white/40 animate-in fade-in duration-200">
              הגעת למקסימום
            </span>
          )}
        </div>
        <OptionPillGroup
          mode="multi"
          options={SPORT_TYPES}
          selected={draft.sport_types}
          onToggle={(item) => toggleArrayItem("sport_types", item)}
          customValue={draft.custom_sport}
          onCustomChange={(text) => setField("custom_sport", text)}
          maxSelect={MAX_SPORT}
        />
      </div>

      {/* Muscle focus */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-white/80">קבוצות שריר להתמקד</label>
          {muscleMaxed && (
            <span className="text-xs text-white/40 animate-in fade-in duration-200">
              הגעת למקסימום
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_FOCUS.map((opt) => {
            const isActive = draft.muscle_focus.includes(opt);
            const isDisabled = !isActive && muscleMaxed;
            return (
              <OptionPill
                key={opt}
                label={opt}
                active={isActive}
                disabled={isDisabled}
                onClick={() => toggleArrayItem("muscle_focus", opt)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
