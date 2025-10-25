// hooks/useOnboarding.ts
import { useState, useCallback, useEffect, useRef } from "react";

const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);

  const createLinkButtonRef = useRef<HTMLButtonElement>(null);
  const addManualTaskButtonRef = useRef<HTMLButtonElement>(null);
  const createSnapLinkButtonRef = useRef<HTMLButtonElement>(null);

  const onboardingSteps = [
    {
      title: "Create Intake Link",
      content:
        "Generate shareable links for patients to submit their intake forms and documents securely.",
      target: createLinkButtonRef,
    },
    {
      title: "Add Manual Task",
      content:
        "Create tasks manually for specific patients or workflows that require custom tracking.",
      target: addManualTaskButtonRef,
    },
    {
      title: "Create Snap Link",
      content:
        "Quickly upload and process documents. The system will automatically extract information and create tasks.",
      target: createSnapLinkButtonRef,
    },
  ];

  const calculateStepPositions = useCallback(() => {
    const positions = [];

    if (createLinkButtonRef.current) {
      const rect = createLinkButtonRef.current.getBoundingClientRect();
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

    if (addManualTaskButtonRef.current) {
      const rect = addManualTaskButtonRef.current.getBoundingClientRect();
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

    if (createSnapLinkButtonRef.current) {
      const rect = createSnapLinkButtonRef.current.getBoundingClientRect();
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
    } else {
      setShowOnboarding(false);
      localStorage.setItem("onboardingCompleted", "true");
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("onboardingCompleted", "true");
  }, []);

  useEffect(() => {
    if (showOnboarding) {
      const positions = calculateStepPositions();
      setStepPositions(positions);
    }
  }, [showOnboarding, currentStep, calculateStepPositions]);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    if (!onboardingCompleted) {
      const timer = setTimeout(() => {
        const positions = calculateStepPositions();
        setStepPositions(positions);
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [calculateStepPositions]);

  return {
    showOnboarding,
    currentStep,
    stepPositions,
    onboardingSteps,
    createLinkButtonRef,
    addManualTaskButtonRef,
    createSnapLinkButtonRef,
    startOnboarding,
    nextStep,
    previousStep,
    closeOnboarding,
  };
};

export default useOnboarding;
