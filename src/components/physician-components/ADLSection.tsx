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

const MedicalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 transition-transform"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 transition-transform"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
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
          <div className="section-title">
            <MedicalIcon />
            <h3>
              ADL & Work Status
              {isCollapsed && (
                <span className="collapsed-text">({getADLSummary()})</span>
              )}
            </h3>
          </div>
          <div className="header-actions">
            <button
              className={`copy-btn ${copied["section-adl"] ? "copied" : ""}`}
              onClick={handleCopyClick}
              title="Copy Section"
            >
              {copied["section-adl"] ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button
              className="collapse-btn"
              onClick={handleSectionClick}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="section-content">
            <ul>
              <li>
                <strong>ADLs Affected:</strong> {getADLsAffected()}
              </li>
              <li>
                <strong>Work Restrictions:</strong> {getWorkRestrictions()}
              </li>
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .section {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .section:hover {
          background-color: #f8fafc;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        h3 {
          margin: 0;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1f2937;
        }
        .collapsed-text {
          font-weight: normal;
          color: #6b7280;
          font-size: 14px;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .section-content {
          margin-top: 12px;
        }
        ul {
          margin: 0;
          padding-left: 20px;
          list-style-type: disc;
        }
        li {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.4;
          color: #374151;
        }
        li strong {
          color: #1f2937;
          font-weight: 600;
        }
        .copy-btn {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
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
        .collapse-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
          color: #6b7280;
        }
        .collapse-btn:hover {
          background-color: #e5e7eb;
          color: #374151;
        }
        .w-3.5 {
          width: 0.875rem;
          height: 0.875rem;
        }
        .w-4 {
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </>
  );
};

export default ADLSection;
