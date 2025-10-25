// components/physician-components/ADLSection.tsx
import { useADLData } from "@/app/custom-hooks/staff-hooks/physician-hooks/useADLData";
import React from "react";

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

interface ADL {
  adls_affected: string;
  adls_affected_history: string;
  work_restrictions: string;
  work_restrictions_history: string;
  has_changes: boolean;
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
  summary_snapshots?: {
    id: string;
    dx: string;
    keyConcern: string;
    nextStep: string;
    documentId: string;
  }[];
  whats_new?: { [key: string]: string };
  quick_notes_snapshots?: {
    details: string;
    timestamp: string;
    one_line_note: string;
    status_update: string;
  }[];
  adl?: ADL;
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

interface ADLSectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const ADLSection: React.FC<ADLSectionProps> = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}) => {
  const { getADLSummary, getADLsAffected, getWorkRestrictions } =
    useADLData(documentData);

  const handleSectionClick = (e: React.MouseEvent) => {
    onToggle();
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopySection("section-adl");
  };

  return (
    <>
      <div className="section" onClick={handleSectionClick}>
        <div className="section-header">
          <h3>
            {isCollapsed ? "▶️" : "▼"} 🧩 ADL & Work Status
            {isCollapsed && (
              <span className="collapsed-text">({getADLSummary()})</span>
            )}
          </h3>
          <button
            className={`copy-btn ${copied["section-adl"] ? "copied" : ""}`}
            onClick={handleCopyClick}
            title="Copy Section"
          >
            {copied["section-adl"] ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        {!isCollapsed && (
          <ul>
            <li>ADLs affected: {getADLsAffected()}</li>
            <li>Work restrictions: {getWorkRestrictions()}</li>
          </ul>
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
          margin-bottom: 14px;
        }
        h3 {
          margin: 0;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .collapsed-text {
          font-weight: normal;
          color: #6b7280;
          font-size: 14px;
        }
        ul {
          margin: 0;
          padding-left: 20px;
          list-style-type: disc;
        }
        li {
          margin-bottom: 6px;
          font-size: 14px;
          white-space: pre-wrap;
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

export default ADLSection;
