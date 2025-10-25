// hooks/usePhysicianOnboardingTour.ts
import { useState } from "react";

interface TourStep {
  title: string;
  content: string;
}

interface StepPosition {
  top: string;
  left: string;
  arrowTop?: string;
  arrowLeft?: string;
}

interface UsePhysicianOnboardingTourProps {
  steps: TourStep[];
  stepPositions: StepPosition[];
}

export const usePhysicianOnboardingTour = ({
  steps,
  stepPositions,
}: UsePhysicianOnboardingTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const onClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const onNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const onPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const openTour = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep];
  const position = stepPositions[currentStep] || { top: "50%", left: "50%" };

  return {
    isOpen,
    currentStep,
    currentStepData,
    position,
    onClose,
    onNext,
    onPrevious,
    openTour,
    stepsLength: steps.length,
  };
};
