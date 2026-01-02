import React from "react";

interface BriefSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefSummary: string;
}

export const BriefSummaryModal = React.memo<BriefSummaryModalProps>(({
  isOpen,
  onClose,
  briefSummary,
}) => (
  isOpen && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Brief Summary</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-6">
            {briefSummary}
          </p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
));