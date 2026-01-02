import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export interface OnboardingStep {
  title: string;
  content: string;
  target: React.RefObject<HTMLElement>;
}

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const staffButtonRef = useRef<HTMLAnchorElement>(null);
  const modeSelectorRef = useRef<HTMLSelectElement>(null);

  const onboardingSteps = useMemo(
    () => [
      {
        title: "Staff Dashboard",
        content:
          "Switch to the Staff Dashboard to manage tasks, upload documents, and track workflow.",
        target: staffButtonRef,
      },
    ],
    []
  );

  const calculateStepPositions = useCallback(() => {
    const positions = [];
    if (staffButtonRef.current) {
      const rect = staffButtonRef.current.getBoundingClientRect();
      positions.push({
        top: `${rect.bottom + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    } else {
      positions.push({
        top: "50%",
        left: "50%",
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    }
    return positions;
  }, []);

  const startOnboarding = useCallback(() => {
    const positions = calculateStepPositions();
    setStepPositions(positions);
    setShowOnboarding(true);
    setCurrentStep(0);
  }, [calculateStepPositions]);

  const nextStep = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => {
        const newPositions = calculateStepPositions();
        setStepPositions(newPositions);
      }, 50);
    } else {
      setShowOnboarding(false);
      localStorage.setItem("physicianOnboardingCompleted", "true");
    }
  }, [currentStep, onboardingSteps.length, calculateStepPositions]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeout(() => {
        const newPositions = calculateStepPositions();
        setStepPositions(newPositions);
      }, 50);
    }
  }, [currentStep, calculateStepPositions]);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("physicianOnboardingCompleted", "true");
  }, []);

  // Check if onboarding should be shown on component mount
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem(
      "physicianOnboardingCompleted"
    );
    const welcomeShown = localStorage.getItem("physicianWelcomeShown");
    if (!welcomeShown) {
      setShowWelcomeModal(true);
      localStorage.setItem("physicianWelcomeShown", "true");
    } else if (!onboardingCompleted) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startOnboarding]);

  // Listen for start onboarding event
  useEffect(() => {
    const handleStartOnboarding = () => {
      startOnboarding();
    };
    window.addEventListener("start-onboarding", handleStartOnboarding);
    return () => {
      window.removeEventListener("start-onboarding", handleStartOnboarding);
    };
  }, [startOnboarding]);

  // Recalculate positions when step changes
  useEffect(() => {
    if (showOnboarding) {
      const positions = calculateStepPositions();
      setStepPositions(positions);
    }
  }, [showOnboarding, currentStep, calculateStepPositions]);

  return {
    showOnboarding,
    currentStep,
    stepPositions,
    showWelcomeModal,
    onboardingSteps,
    staffButtonRef,
    modeSelectorRef,
    nextStep,
    previousStep,
    closeOnboarding,
    startOnboarding,
  };
};