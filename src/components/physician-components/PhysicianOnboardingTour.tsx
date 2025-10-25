// components/physician-components/PhysicianOnboardingTour.tsx
import React from "react";

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

interface PhysicianOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  steps: TourStep[];
  stepPositions: StepPosition[];
}

const PhysicianOnboardingTour: React.FC<PhysicianOnboardingTourProps> = ({
  isOpen,
  onClose,
  currentStep,
  onNext,
  onPrevious,
  steps,
  stepPositions,
}) => {
  if (!isOpen || currentStep >= steps.length) return null;

  const currentStepData = steps[currentStep];
  const position = stepPositions[currentStep] || {};
  const stepsLength = steps.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 relative transition-all duration-300 ease-in-out"
        style={{
          position: "fixed",
          top: position.top || "50%",
          left: position.left || "50%",
          transform: "translateX(-50%)",
          zIndex: 101,
        }}
      >
        {/* Arrow pointing to target element */}
        <div
          className="absolute w-4 h-4 bg-white rotate-45 transition-all duration-300 ease-in-out"
          style={{
            top: position.arrowTop || "-8px",
            left: position.arrowLeft || "50%",
            transform: "translateX(-50%)",
          }}
        ></div>

        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">{currentStepData.title}</h3>
          <p className="text-gray-600 text-sm">{currentStepData.content}</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {stepsLength}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={onPrevious}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Previous
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={onNext}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PhysicianOnboardingTour;
