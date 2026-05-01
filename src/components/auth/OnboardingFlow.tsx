import { useState } from "react";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { StepProfile } from "@/components/onboarding/StepProfile";
import { StepBody } from "@/components/onboarding/StepBody";
import { StepSport } from "@/components/onboarding/StepSport";
import { StepNutrition } from "@/components/onboarding/StepNutrition";
import { StepFinance } from "@/components/onboarding/StepFinance";
import { MagicMoment } from "@/components/onboarding/MagicMoment";

interface Props {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const { draft, step, setField, toggleArrayItem, goNext, complete, isSaving } =
    useOnboardingSync();
  const [showMagic, setShowMagic] = useState(false);

  const handleNext = async () => {
    if (step < 4) {
      goNext();
    } else {
      await complete();
      setShowMagic(true);
    }
  };

  const handleSkip = async () => {
    await complete();
    setShowMagic(true);
  };

  if (showMagic) {
    return <MagicMoment name={draft.full_name} onComplete={onComplete} />;
  }

  const stepNode = (() => {
    switch (step) {
      case 0:
        return <StepProfile draft={draft} setField={setField} />;
      case 1:
        return <StepBody draft={draft} setField={setField} toggleArrayItem={toggleArrayItem} />;
      case 2:
        return <StepSport draft={draft} toggleArrayItem={toggleArrayItem} />;
      case 3:
        return <StepNutrition draft={draft} setField={setField} toggleArrayItem={toggleArrayItem} />;
      case 4:
        return <StepFinance draft={draft} setField={setField} />;
      default:
        return null;
    }
  })();

  return (
    <OnboardingLayout
      step={step}
      onNext={handleNext}
      onSkip={handleSkip}
      isSaving={isSaving}
    >
      {stepNode}
    </OnboardingLayout>
  );
}
