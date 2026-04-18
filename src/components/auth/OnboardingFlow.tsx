import { useState } from "react";
import { useUpdateProfile, type UserProfile } from "@/hooks/use-profile";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Heart,
  Dumbbell,
  Sparkles,
  Utensils,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type Draft = Partial<Omit<UserProfile, "id">>;

const STEP_ICONS = [User, Heart, Dumbbell, Utensils, Wallet, TrendingUp, Sparkles];
const STEP_TITLES = [
  "מי אתה?",
  "גוף ובריאות",
  "ספורט",
  "תזונה",
  "כלכלה",
  "שוק ההון",
  "תחומי עניין",
];
const TOTAL_STEPS = 7;

const GENDER_OPTIONS = ["זכר", "נקבה", "אחר", "מעדיף/ה לא לציין"];

const LIMITATION_OPTIONS = [
  "כתף",
  "גב תחתון",
  "ברך",
  "מרפק",
  "ירך",
  "קרסול",
  "אין מגבלות",
];

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

const FREQUENCY_OPTIONS = [
  "פחות מפעם בשבוע",
  "1–2 פעמים בשבוע",
  "3–4 פעמים בשבוע",
  "5+ פעמים בשבוע",
];

const LOCATION_OPTIONS = ["חדר כושר", "הבית", "בחוץ / פארק", "שילוב"];

const LEVEL_OPTIONS = ["מתחיל", "בינוני", "מתקדם", "ספורטאי"];

const SPORT_GOALS = [
  "ירידה במשקל",
  "עלייה במסת שריר",
  "כוח מרבי",
  "סיבולת לב-ריאה",
  "גמישות ושיווי משקל",
  "בריאות כללית",
  "ביצועים תחרותיים",
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

const MACRO_OPTIONS = [
  "גבוה חלבון (30%+)",
  "מאוזן (40/30/30)",
  "גבוה פחמימות (ספורטאים)",
  "נמוך פחמימות",
  "לפי המלצת AI",
];

const INVESTMENT_TYPES = [
  "מניות",
  "אג\"ח",
  "קרנות מחקות / ETF",
  "קריפטו",
  "נדל\"ן",
  "סחורות",
];

const INVESTMENT_LEVELS = ["מתחיל", "בינוני", "מנוסה", "מקצועי"];

const INTEREST_TOPICS = [
  "כלכלה ופיננסים",
  "מדע וטכנולוגיה",
  "בריאות וספורט",
  "היסטוריה",
  "פסיכולוגיה",
  "תזונה",
  "עסקים ויזמות",
  "פיתוח אישי",
];

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
        selected
          ? "bg-primary/20 border-primary text-primary"
          : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function toggleArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

function StepOne({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          שם מלא
        </label>
        <input
          type="text"
          placeholder="למשל: מאור"
          value={draft.full_name ?? ""}
          onChange={(e) => set({ ...draft, full_name: e.target.value })}
          className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            גיל
          </label>
          <input
            type="number"
            placeholder="25"
            value={draft.age ?? ""}
            onChange={(e) => set({ ...draft, age: e.target.value ? Number(e.target.value) : null })}
            className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            עיר מגורים
          </label>
          <input
            type="text"
            placeholder="תל אביב"
            value={draft.city ?? ""}
            onChange={(e) => set({ ...draft, city: e.target.value })}
            className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          מגדר
        </label>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((g) => (
            <ToggleChip
              key={g}
              label={g}
              selected={draft.gender === g}
              onClick={() => set({ ...draft, gender: g })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTwo({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            גובה (ס"מ)
          </label>
          <input
            type="number"
            placeholder="175"
            value={draft.height_cm ?? ""}
            onChange={(e) =>
              set({ ...draft, height_cm: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            משקל נוכחי (ק"ג)
          </label>
          <input
            type="number"
            placeholder="75"
            value={draft.weight_kg ?? ""}
            onChange={(e) =>
              set({ ...draft, weight_kg: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          משקל יעד (ק"ג) — אופציונלי
        </label>
        <input
          type="number"
          placeholder="70"
          value={draft.target_weight_kg ?? ""}
          onChange={(e) =>
            set({ ...draft, target_weight_kg: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          מגבלות גופניות (בחר/י הכל שרלוונטי)
        </label>
        <div className="flex flex-wrap gap-2">
          {LIMITATION_OPTIONS.map((l) => (
            <ToggleChip
              key={l}
              label={l}
              selected={(draft.physical_limitations ?? []).includes(l)}
              onClick={() =>
                set({ ...draft, physical_limitations: toggleArray(draft.physical_limitations ?? [], l) })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepThree({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          סוגי ספורט (בחר/י הכל שרלוונטי)
        </label>
        <div className="flex flex-wrap gap-2">
          {SPORT_TYPES.map((s) => (
            <ToggleChip
              key={s}
              label={s}
              selected={(draft.sport_types ?? []).includes(s)}
              onClick={() => set({ ...draft, sport_types: toggleArray(draft.sport_types ?? [], s) })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          יעדי ספורט (בחר/י הכל שרלוונטי)
        </label>
        <div className="flex flex-wrap gap-2">
          {SPORT_GOALS.map((g) => (
            <ToggleChip
              key={g}
              label={g}
              selected={(draft.sport_goals ?? []).includes(g)}
              onClick={() => set({ ...draft, sport_goals: toggleArray(draft.sport_goals ?? [], g) })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          שרירים / אזורים לשיפור
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_FOCUS.map((m) => (
            <ToggleChip
              key={m}
              label={m}
              selected={(draft.muscle_focus ?? []).includes(m)}
              onClick={() => set({ ...draft, muscle_focus: toggleArray(draft.muscle_focus ?? [], m) })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          תדירות אימונים
        </label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_OPTIONS.map((f) => (
            <ToggleChip
              key={f}
              label={f}
              selected={draft.sport_frequency === f}
              onClick={() => set({ ...draft, sport_frequency: f })}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            מקום אימון
          </label>
          <div className="flex flex-col gap-1.5">
            {LOCATION_OPTIONS.map((l) => (
              <ToggleChip
                key={l}
                label={l}
                selected={draft.sport_location === l}
                onClick={() => set({ ...draft, sport_location: l })}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            רמה
          </label>
          <div className="flex flex-col gap-1.5">
            {LEVEL_OPTIONS.map((l) => (
              <ToggleChip
                key={l}
                label={l}
                selected={draft.sport_level === l}
                onClick={() => set({ ...draft, sport_level: l })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFour({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          סוג תזונה
        </label>
        <div className="flex flex-wrap gap-2">
          {DIET_TYPES.map((d) => (
            <ToggleChip
              key={d}
              label={d}
              selected={draft.diet_type === d}
              onClick={() => set({ ...draft, diet_type: d })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          אלרגיות למזון
        </label>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_OPTIONS.map((a) => (
            <ToggleChip
              key={a}
              label={a}
              selected={(draft.food_allergies ?? []).includes(a)}
              onClick={() => set({ ...draft, food_allergies: toggleArray(draft.food_allergies ?? [], a) })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          העדפת מאקרו
        </label>
        <div className="flex flex-wrap gap-2">
          {MACRO_OPTIONS.map((m) => (
            <ToggleChip
              key={m}
              label={m}
              selected={draft.macro_preference === m}
              onClick={() => set({ ...draft, macro_preference: m })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepFive({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        הנתונים ישמשו לניתוח ההוצאות, יעד החיסכון וסיכומי התקציב שלך.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            הכנסה חודשית (₪)
          </label>
          <input
            type="number"
            placeholder="10,000"
            value={draft.monthly_income ?? ""}
            onChange={(e) =>
              set({ ...draft, monthly_income: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            תקציב חודשי (₪)
          </label>
          <input
            type="number"
            placeholder="7,000"
            value={draft.monthly_budget ?? ""}
            onChange={(e) =>
              set({ ...draft, monthly_budget: e.target.value ? Number(e.target.value) : null })
            }
            className="w-full rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          יעד חיסכון חודשי (%)
        </label>
        <div className="flex flex-wrap gap-2">
          {["10%", "15%", "20%", "25%", "30%", "35%", "40%+"].map((p) => {
            const val = parseInt(p);
            return (
              <ToggleChip
                key={p}
                label={p}
                selected={draft.savings_goal_percent === val}
                onClick={() => set({ ...draft, savings_goal_percent: val })}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          או הכנס מותאם אישית:
        </p>
        <input
          type="number"
          placeholder="20"
          min="1"
          max="100"
          value={draft.savings_goal_percent ?? ""}
          onChange={(e) =>
            set({ ...draft, savings_goal_percent: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full mt-1 rounded-xl bg-secondary/40 border border-border px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          dir="ltr"
        />
      </div>
    </div>
  );
}

function StepSix({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          האם אתה משקיע בשוק ההון?
        </label>
        <div className="flex gap-2">
          <ToggleChip
            label="כן"
            selected={draft.invests_in_market === true}
            onClick={() => set({ ...draft, invests_in_market: true })}
          />
          <ToggleChip
            label="לא עדיין"
            selected={draft.invests_in_market === false}
            onClick={() => set({ ...draft, invests_in_market: false })}
          />
        </div>
      </div>

      {draft.invests_in_market && (
        <>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              סוגי השקעה (בחר/י הכל שרלוונטי)
            </label>
            <div className="flex flex-wrap gap-2">
              {INVESTMENT_TYPES.map((t) => (
                <ToggleChip
                  key={t}
                  label={t}
                  selected={(draft.investment_types ?? []).includes(t)}
                  onClick={() =>
                    set({ ...draft, investment_types: toggleArray(draft.investment_types ?? [], t) })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              רמת ניסיון בהשקעות
            </label>
            <div className="flex flex-wrap gap-2">
              {INVESTMENT_LEVELS.map((l) => (
                <ToggleChip
                  key={l}
                  label={l}
                  selected={draft.investment_level === l}
                  onClick={() => set({ ...draft, investment_level: l })}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {!draft.invests_in_market && draft.invests_in_market !== undefined && (
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground">
            מודול שוק ההון יהיה זמין עבורך כשתרצה להתחיל. תוכל להפעיל אותו בהגדרות.
          </p>
        </div>
      )}
    </div>
  );
}

function StepSeven({ draft, set }: { draft: Draft; set: (d: Draft) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        כל יום בדף הבית תופיע עובדה מעניינת מהתחום שתבחר.
      </p>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          תחומי עניין (בחר/י עד 3)
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_TOPICS.map((t) => {
            const selected = (draft.interest_topics ?? []).includes(t);
            const maxReached = (draft.interest_topics ?? []).length >= 3;
            return (
              <ToggleChip
                key={t}
                label={t}
                selected={selected}
                onClick={() => {
                  if (!selected && maxReached) return;
                  set({ ...draft, interest_topics: toggleArray(draft.interest_topics ?? [], t) });
                }}
              />
            );
          })}
        </div>
        {(draft.interest_topics ?? []).length >= 3 && (
          <p className="text-xs text-muted-foreground mt-2">בחרת 3 תחומים — המקסימום</p>
        )}
      </div>
    </div>
  );
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    physical_limitations: [],
    sport_types: [],
    sport_goals: [],
    muscle_focus: [],
    food_allergies: [],
    investment_types: [],
    interest_topics: [],
    invests_in_market: false,
  });
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const isLastStep = step === TOTAL_STEPS - 1;

  const handleNext = async () => {
    if (isLastStep) {
      try {
        await updateProfile({ ...draft, onboarding_completed: true });
        const firstName = draft.full_name?.split(" ")[0] ?? "";
        toast.success(`ברוך הבא${firstName ? `, ${firstName}` : ""}! האפליקציה מוכנה עבורך`);
        onComplete();
      } catch {
        toast.error("שגיאה בשמירת הנתונים — נסה שוב");
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const StepIcon = STEP_ICONS[step];

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center px-4 overflow-y-auto py-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <StepIcon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{STEP_TITLES[step]}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            שלב {step + 1} מתוך {TOTAL_STEPS}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-secondary/50"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
          {step === 0 && <StepOne draft={draft} set={setDraft} />}
          {step === 1 && <StepTwo draft={draft} set={setDraft} />}
          {step === 2 && <StepThree draft={draft} set={setDraft} />}
          {step === 3 && <StepFour draft={draft} set={setDraft} />}
          {step === 4 && <StepFive draft={draft} set={setDraft} />}
          {step === 5 && <StepSix draft={draft} set={setDraft} />}
          {step === 6 && <StepSeven draft={draft} set={setDraft} />}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-secondary/40 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              אחורה
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4" />
                בוא נתחיל!
              </>
            ) : (
              <>
                הבא
                <ChevronLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        {!isLastStep && (
          <button
            type="button"
            onClick={async () => {
              try {
                await updateProfile({ ...draft, onboarding_completed: true });
                onComplete();
              } catch {
                onComplete();
              }
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 py-2 transition-colors"
          >
            דלג על השאלון
          </button>
        )}
      </div>
    </div>
  );
}
