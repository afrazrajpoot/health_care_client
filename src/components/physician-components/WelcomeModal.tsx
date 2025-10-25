// pages/PhysicianCard.tsx (or app/physician-card/page.tsx)
"use client";

// Define TypeScript interfaces for data structures
interface Patient {
  id?: number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface PatientQuiz {
  id: string;
  patientName: string;
  dob: string;
  doi: string;
  lang: string;
  newAppt: string;
  appts: Array<{
    date: string;
    type: string;
    other: string;
  }>;
  pain: number;
  workDiff: string;
  trend: string;
  workAbility: string;
  barrier: string;
  adl: string[];
  createdAt: string;
  updatedAt: string;
}

interface SummarySnapshotItem {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
}

interface SummarySnapshot {
  diagnosis: string;
  diagnosis_history: string;
  key_concern: string;
  key_concern_history: string;
  next_step: string;
  next_step_history: string;
  has_changes: boolean;
}

interface WhatsNew {
  [key: string]: string;
}

interface QuickNoteSnapshot {
  details: string;
  timestamp: string;
  one_line_note: string;
  status_update: string;
}

interface ADL {
  adls_affected: string;
  adls_affected_history: string;
  work_restrictions: string;
  work_restrictions_history: string;
  has_changes: boolean;
}

interface DocumentSummary {
  type: string;
  date: string;
  summary: string;
  brief_summary?: string;
  document_id?: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  brief_summary?: { [key: string]: string[] };
  summary_snapshot?: SummarySnapshot;
  summary_snapshots?: SummarySnapshotItem[];
  whats_new?: WhatsNew;
  quick_notes_snapshots?: QuickNoteSnapshot[]; // ✅ Added interface for quick notes snapshots
  adl?: ADL;
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: DocumentSummary[];
  patient_quiz?: PatientQuiz | null;
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: { [key: string]: DocumentSummary };
  allVerified?: boolean;
  gcs_file_link?: string; // Signed GCS URL for view file
  blob_path?: string; // Blob path for preview (e.g., "uploads/filename.ext")
}

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Treatment History Snapshot Component (Using Summary Snapshot Data)

// ADL Component

// Patient Quiz Section

// Document Summary Component
// Document Summary Component

// Onboarding Tour Component for Physician Card

// Welcome Modal Component
export const WelcomeModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 relative">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to Physician Dashboard!
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by searching for a patient or take a quick tour to learn
            about the features.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Get Started
            </button>
            <button
              onClick={() => {
                onClose();
                // Start onboarding after welcome modal closes
                setTimeout(() => {
                  const event = new CustomEvent("start-onboarding");
                  window.dispatchEvent(event);
                }, 500);
              }}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200"
            >
              Take a Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
