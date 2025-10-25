// components/physician-components/TreatmentHistorySection.tsx
import { useTreatmentHistory } from "@/app/custom-hooks/staff-hooks/physician-hooks/useTreatmentHistory";
import React from "react";
// import { useTreatmentHistory } from "@/hooks/useTreatmentHistory";

// Define TypeScript interfaces for data structures (only those needed for this component)
interface SummarySnapshotItem {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
  recommended?: string;
  consultingDoctors?: string[];
  aiOutcome?: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  brief_summary?: { [key: string]: string[] };
  summary_snapshot?: {
    diagnosis: string;
    diagnosis_history: string;
    key_concern: string;
    key_concern_history: string;
    next_step: string;
    next_step_history: string;
    has_changes: boolean;
  };
  summary_snapshots?: SummarySnapshotItem[];
  whats_new?: { [key: string]: string };
  quick_notes_snapshots?: {
    details: string;
    timestamp: string;
    one_line_note: string;
    status_update: string;
  }[];
  adl?: {
    adls_affected: string;
    adls_affected_history: string;
    work_restrictions: string;
    work_restrictions_history: string;
    has_changes: boolean;
  };
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: {
    type: string;
    date: string;
    summary: string;
    brief_summary?: string;
    document_id?: string;
  }[];
  patient_quiz?: {
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
  } | null;
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: {
    [key: string]: {
      type: string;
      date: string;
      summary: string;
      brief_summary?: string;
      document_id?: string;
    };
  };
  allVerified?: boolean;
  gcs_file_link?: string;
  blob_path?: string;
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

interface TreatmentHistorySectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string, index?: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const TreatmentHistorySection: React.FC<TreatmentHistorySectionProps> = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}) => {
  const {
    currentSnapshotIndex,
    expandedSnapshots,
    snapshots,
    toggleSnapshot,
    handlePreviousSnapshot,
    handleLatestSnapshot,
    getTreatmentSummary,
  } = useTreatmentHistory(documentData);
  console.log(documentData, "console data");
  const handleSectionClick = (e: React.MouseEvent) => {
    onToggle();
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopySection("section-treatment", currentSnapshotIndex);
  };

  const handleNavClick = (e: React.MouseEvent, handler: () => void) => {
    e.stopPropagation();
    handler();
  };

  const handleSnapshotToggle = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    toggleSnapshot(index);
  };

  return (
    <>
      <div className="section" onClick={handleSectionClick}>
        <div className="section-header">
          <h3>{isCollapsed ? "▶️" : "▼"} 📌 Treatment History Snapshot</h3>
          <button
            className={`copy-btn ${
              copied[`section-treatment-${currentSnapshotIndex}`]
                ? "copied"
                : ""
            }`}
            onClick={handleCopyClick}
            title="Copy Section"
          >
            {copied[`section-treatment-${currentSnapshotIndex}`] ? (
              <CheckIcon />
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>
        {!isCollapsed && (
          <>
            {snapshots.map((snapshot, index) => (
              <div key={snapshot.id || index} className="bodypart-card">
                <h4 onClick={(e) => handleSnapshotToggle(e, index)}>
                  {expandedSnapshots[index] ? "▼" : "▶️"}{" "}
                  {snapshot.keyConcern || `Key Concern ${index + 1}`}
                </h4>
                <div
                  className={`card-details ${
                    expandedSnapshots[index] ? "" : "hidden"
                  }`}
                >
                  <ul>
                    <li>
                      <strong>Dx:</strong> {snapshot.dx || "Not specified"}
                    </li>
                    <li>
                      <strong>Key Concern:</strong>{" "}
                      {snapshot.keyConcern || "Not specified"}
                    </li>
                    <li>
                      <strong>Next Step:</strong>{" "}
                      {snapshot.nextStep || "Not specified"}
                    </li>
                    <li>
                      <strong>Recommended:</strong>{" "}
                      {snapshot.recommended || "Not specified"}
                    </li>
                    <li>
                      <strong>Consulting Doctors:</strong>{" "}
                      {snapshot.consultingDoctors
                        ? snapshot.consultingDoctors.join(", ")
                        : "Not specified"}
                    </li>
                    <li>
                      <strong>Outcome:</strong>{" "}
                      {snapshot.aiOutcome || "Not specified"}
                    </li>
                  </ul>
                </div>
              </div>
            ))}
            {snapshots.length === 0 && (
              <div className="no-data">
                <ul>
                  <li>No treatment history snapshots available</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .section {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        h3 {
          font-weight: 600;
          color: #1e3a8a;
          margin: 0;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 16px;
        }
        .nav-btn {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          transition: background 0.2s;
        }
        .nav-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .latest-btn {
          background: #3b82f6;
          color: white;
        }
        .latest-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        .previous-btn {
          background: #6b7280;
          color: white;
        }
        .previous-btn:hover:not(:disabled) {
          background: #4b5563;
        }
        .counter-text {
          font-size: 12px;
          color: #6b7280;
          margin-left: auto;
        }
        .bodypart-card h4 {
          font-size: 14px;
          background: #e5e7eb;
          padding: 10px;
          margin: 0;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-details {
          background: #f1f5f9;
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .card-details.hidden {
          display: none;
        }
        ul {
          margin: 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 6px;
          font-size: 14px;
        }
        .no-data {
          padding: 10px 14px;
          background: #f1f5f9;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .no-data ul {
          padding-left: 20px;
        }
        .no-data li {
          color: #6b7280;
          text-align: center;
          list-style: none;
          padding-left: 0;
        }
        .copy-btn {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: background 0.2s;
        }
        .copy-btn:hover {
          background: #cbd5e1;
        }
        .copied {
          background: #dcfce7;
          color: #166534;
        }
        .copied:hover {
          background: #bbf7d0;
        }
        .w-3.5 {
          width: 0.875rem;
          height: 0.875rem;
        }
      `}</style>
    </>
  );
};

export default TreatmentHistorySection;
