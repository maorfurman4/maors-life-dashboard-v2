import { OptionPill } from "./OptionPill";
import type { OnboardingDraft } from "@/hooks/useOnboardingSync";

const GENDER_OPTIONS = ["זכר", "נקבה", "אחר", "מעדיף/ה לא לציין"];

interface Props {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
}

export function StepProfile({ draft, setField }: Props) {
  const nameError =
    draft.full_name.length > 0 && /\d/.test(draft.full_name)
      ? "שם לא יכול להכיל מספרים"
      : null;

  const handleName = (v: string) => {
    setField("full_name", v);
  };

  return (
    <div className="space-y-8 pt-4" dir="rtl">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">בואו נכיר קצת 👋</h2>
        <p className="text-sm text-white/60">ספר לנו עליך — כמה שאלות קצרות</p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-white/80">שם פרטי</label>
        <input
          type="text"
          value={draft.full_name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="למשל: מאור"
          className={[
            "w-full rounded-2xl backdrop-blur-md bg-white/10 border px-4 py-3.5 text-white text-sm placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-white/30 transition-all",
            nameError ? "border-red-400/60" : "border-white/15",
          ].join(" ")}
        />
        {nameError && (
          <p className="text-xs text-red-300 animate-in fade-in duration-150">{nameError}</p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-white/80">עיר מגורים</label>
        <input
          type="text"
          value={draft.city}
          onChange={(e) => setField("city", e.target.value)}
          placeholder="למשל: תל אביב"
          className="w-full rounded-2xl backdrop-blur-md bg-white/10 border border-white/15 px-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
        />
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-white/80">מגדר</label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((g) => (
            <OptionPill
              key={g}
              label={g}
              active={draft.gender === g}
              onClick={() => setField("gender", draft.gender === g ? "" : g)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
