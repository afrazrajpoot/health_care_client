import React from "react";

interface Patient {
  patientName: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface ErrorDisplayProps {
  error: string | null;
  onRetry: () => void;
  selectedPatient: Patient | null;
  fetchDocumentData: (patient: Patient, mode: "wc" | "gm") => void;
  mode: "wc" | "gm";
}

export const ErrorDisplay = React.memo<ErrorDisplayProps>(
  ({ error, onRetry, selectedPatient, fetchDocumentData, mode }) => (
    <div className="mb-3.5 p-4 bg-red-50 border border-red-300 rounded-xl">
      <div className="text-red-600 font-semibold mb-2">Error</div>
      <p className="text-red-800">{error}</p>
      <button
        onClick={onRetry}
        className="mt-2 bg-red-500 text-white px-3 py-1.5 rounded-md cursor-pointer"
      >
        Retry
      </button>
    </div>
  )
);