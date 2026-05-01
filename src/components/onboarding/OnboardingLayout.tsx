import { ReactNode, useEffect, useRef } from "react";
import { toast } from "sonner";
import { RootLayout } from "@/components/layout/RootLayout";

// ─── Step metadata ─────────────────────────────────────────────────────────────

export const STEP_COUNT = 5;

export const STEP_LABELS = [
  "פרופיל",
  "גוף",
  "ספורט",
  "תזונה",
  "כלכלה",
];

const STEP_PRAISE = [
  "מעולה! בואו נמשיך 💪",
  "יופי! עוד קצת...",
  "כמעט שם! ממשיכים",
  "נהדר! צעד אחרון",
  "",
];

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 px-6 pt-4" dir="ltr">
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-white transition-all duration-500 ease-out"
            style={{ width: i <= step ? "100%" : "0%" }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Action Bar ────────────────────────────────────────────────────────────────

interface ActionBarProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
  isSaving?: boolean;
}

function ActionBar({ step, onNext, onSkip, isLastStep, isSaving }: ActionBarProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-20" dir="rtl">
      {/* Gradient fade */}
      <div className="h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Buttons */}
      <div className="bg-black/30 backdrop-blur-sm px-5 pb-8 pt-3 space-y-2.5">
        <button
          onClick={onNext}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 rounded-2xl backdrop-blur-md bg-white/15 border border-white/20 py-4 text-base font-black text-white transition-all hover:bg-white/25 active:scale-[0.98] disabled:opacity-60"
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {isLastStep ? "סיום" : "הבא"}
        </button>

        {step < STEP_COUNT - 1 && (
          <button
            onClick={onSkip}
            className="w-full py-2.5 text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
          >
            דלג על הכל
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────

interface OnboardingLayoutProps {
  step: number;
  children: ReactNode;
  onNext: () => void;
  onSkip: () => void;
  isSaving?: boolean;
}

export function OnboardingLayout({
  step,
  children,
  onNext,
  onSkip,
  isSaving,
}: OnboardingLayoutProps) {
  const prevStep = useRef(step);

  // Show praise toast when step advances
  useEffect(() => {
    if (step > prevStep.current && step < STEP_COUNT) {
      const msg = STEP_PRAISE[prevStep.current];
      if (msg) toast.success(msg, { duration: 2000, position: "top-center" });
    }
    prevStep.current = step;
  }, [step]);

  const isLastStep = step === STEP_COUNT - 1;

  return (
    <RootLayout>
      <div className="relative flex flex-col min-h-screen" dir="rtl">
        {/* Top: step label + progress bar */}
        <div className="pt-14 pb-4">
          <ProgressBar step={step} />
          <p className="text-center text-xs font-medium text-white/50 mt-2">
            שלב {step + 1} מתוך {STEP_COUNT} — {STEP_LABELS[step]}
          </p>
        </div>

        {/* Scrollable content — padded so action bar never overlaps */}
        <div className="flex-1 overflow-y-auto pb-48 px-5">
          {children}
        </div>

        {/* Sticky action bar */}
        <ActionBar
          step={step}
          onNext={onNext}
          onSkip={onSkip}
          isLastStep={isLastStep}
          isSaving={isSaving}
        />
      </div>
    </RootLayout>
  );
}
