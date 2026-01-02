import React from "react";

interface OnboardingHelpButtonProps {
  onClick: () => void;
}

export const OnboardingHelpButton = React.memo<OnboardingHelpButtonProps>(({ onClick }) => (
  <button
    className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center z-40"
    onClick={onClick}
    title="Show onboarding tour"
  >
    ?
  </button>
));