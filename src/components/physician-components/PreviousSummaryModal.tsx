import React from "react";

interface DocumentSummary {
  type: string;
  date: string;
  summary: string;
  brief_summary?: string;
  document_id?: string;
}

interface PreviousSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBrief: (summary: string) => void;
  previousSummary: DocumentSummary | null;
  formatDate: (date: string | undefined) => string;
}

export const PreviousSummaryModal = React.memo<PreviousSummaryModalProps>(({
  isOpen,
  onClose,
  onViewBrief,
  previousSummary,
  formatDate,
}) =>
  isOpen &&
  previousSummary && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Previous {previousSummary.type} Summary
          </h3>
          <div className="grid grid-cols-[140px_1fr] gap-2 mb-6">
            <div className="text-gray-600 text-xs">Date</div>
            <div>{formatDate(previousSummary.date)}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2 mb-6">
            <div className="text-gray-600 text-xs">Summary</div>
            <div>{previousSummary.summary}</div>
          </div>
          <button
            onClick={() => onViewBrief(previousSummary.brief_summary || "")}
            className="mr-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            View Brief
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
);