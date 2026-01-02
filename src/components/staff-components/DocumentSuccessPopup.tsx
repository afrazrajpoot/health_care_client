import React from 'react';

interface DocumentSuccessPopupProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const DocumentSuccessPopup: React.FC<DocumentSuccessPopupProps> = ({
  isOpen,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Document Successfully Submitted!
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Your document has been processed and verified successfully.
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default DocumentSuccessPopup;