import { useState, useCallback, useRef } from "react";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { UserProfile } from "@/hooks/use-profile";

// ─── Draft shape (superset of what each step needs) ───────────────────────────

export type OnboardingDraft = {
  // Step 1 — Profile
  full_name: string;
  age: number | null;
  city: string;
  gender: string;

  // Step 2 — Body
  height_cm: number | null;
  weight_kg: number | null;
  lifestyle: string;
  physical_limitations: string[];

  // Step 3 — Sport
  sport_types: string[];
  sport_frequency: string;
  sport_location: string;
  sport_level: string;
  sport_goals: string[];
  muscle_focus: string[];

  // Step 4 — Nutrition
  diet_type: string;
  food_allergies: string[];
  macro_preference: string;

  // Step 5 — Finance
  monthly_income: number | null;
  monthly_budget: number | null;
};

const INITIAL_DRAFT: OnboardingDraft = {
  full_name: "",
  age: null,
  city: "",
  gender: "",
  height_cm: null,
  weight_kg: null,
  lifestyle: "",
  physical_limitations: [],
  sport_types: [],
  sport_frequency: "",
  sport_location: "",
  sport_level: "",
  sport_goals: [],
  muscle_focus: [],
  diet_type: "",
  food_allergies: [],
  macro_preference: "",
  monthly_income: null,
  monthly_budget: null,
};

// ─── Mutual exclusivity: selecting "none" clears others and vice-versa ─────────

const NONE_VALUES: Partial<Record<keyof OnboardingDraft, string>> = {
  physical_limitations: "אין מגבלות",
  food_allergies: "אין אלרגיות",
};

const DEBOUNCE_MS = 800;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboardingSync() {
  const [draft, setDraft] = useState<OnboardingDraft>(INITIAL_DRAFT);
  const [step, setStep] = useState(0);
  const updateProfile = useUpdateProfile();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(
    (patch: Partial<Omit<UserProfile, "id">>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        updateProfile.mutate(patch);
      }, DEBOUNCE_MS);
    },
    [updateProfile]
  );

  // Set a scalar field and autosave
  const setField = useCallback(
    <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => {
      setDraft((prev) => {
        const next = { ...prev, [key]: value };
        schedule({ [key]: value } as Partial<Omit<UserProfile, "id">>);
        return next;
      });
    },
    [schedule]
  );

  // Toggle an item in an array field with mutual-exclusivity enforcement
  const toggleArrayItem = useCallback(
    (key: keyof OnboardingDraft, item: string) => {
      setDraft((prev) => {
        const current = prev[key] as string[];
        const noneVal = NONE_VALUES[key];
        let next: string[];

        if (noneVal && item === noneVal) {
          // Clicking "none": toggle it on (clear all others) or off
          next = current.includes(noneVal) ? [] : [noneVal];
        } else if (current.includes(item)) {
          // Deselect specific item
          next = current.filter((i) => i !== item);
        } else {
          // Select specific item: strip "none" if present
          next = noneVal
            ? [...current.filter((i) => i !== noneVal), item]
            : [...current, item];
        }

        const updated = { ...prev, [key]: next };
        schedule({ [key]: next } as Partial<Omit<UserProfile, "id">>);
        return updated;
      });
    },
    [schedule]
  );

  // Navigation — step is clamped to [0, 4]
  const goNext = useCallback(() => setStep((s) => Math.min(s + 1, 4)), []);
  const goPrev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const goTo = useCallback((target: number) => setStep(target), []);

  // Final save: flush timer + mark onboarding complete
  const complete = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await updateProfile.mutateAsync({
      ...(draft as Partial<Omit<UserProfile, "id">>),
      onboarding_completed: true,
    });
  }, [draft, updateProfile]);

  return {
    draft,
    step,
    setField,
    toggleArrayItem,
    goNext,
    goPrev,
    goTo,
    complete,
    isSaving: updateProfile.isPending,
  };
}
