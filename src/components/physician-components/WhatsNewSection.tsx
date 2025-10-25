// components/WhatsNewSection.tsx
import {
  usePreviewFile,
  useQuickNotesToggle,
  useWhatsNewData,
} from "@/app/custom-hooks/staff-hooks/physician-hooks/useWhatsNewData";
import React from "react";
// import {
//   useWhatsNewData,
//   useQuickNotesToggle,
//   usePreviewFile,
// } from "@/hooks/useWhatsNew";

// Define TypeScript interfaces for data structures (only those needed for this component)

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

interface WhatsNewSectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const WhatsNewSection: React.FC<WhatsNewSectionProps> = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}) => {
  // Extract logic and state using custom hooks
  const {
    getWhatsNewSummary,
    formatTimestamp,
    formatDate,
    getAllQuickNotes,
    getQuickNotesSummary,
    isNoteEmpty,
    getAllWhatsNewItems,
  } = useWhatsNewData(documentData);

  const { isQuickNotesOpen, toggleQuickNotes } = useQuickNotesToggle();

  const handlePreviewFile = usePreviewFile(documentData);

  const handleSectionClick = (e: React.MouseEvent) => {
    onToggle();
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopySection("section-whatsnew");
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add mark all reviewed logic here if needed
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePreviewFile(e);
  };

  return (
    <>
      <div className="section" onClick={handleSectionClick}>
        <div className="section-header">
          <h3>
            {isCollapsed ? "▶️" : "▼"} What’s New Since Last Visit{" "}
            {isCollapsed && (
              <span className="collapsed-text">({getWhatsNewSummary()})</span>
            )}
          </h3>
          <div className="header-actions">
            <span className="review-toggle" onClick={handleReviewClick}>
              Mark All Reviewed
            </span>
            <button
              className={`copy-btn ${
                copied["section-whatsnew"] ? "copied" : ""
              }`}
              onClick={handleCopyClick}
              title="Copy Section"
            >
              {copied["section-whatsnew"] ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <ul>
            {getAllWhatsNewItems().map((item, index) => {
              if (item.type === "whatsnew") {
                return (
                  <li key={`whatsnew-${item.key}-${index}`}>
                    {item.value} <span className="status-approved">✅</span>
                  </li>
                );
              } else {
                // document_group
                return item.summaries.map((summaryItem, sIndex) => (
                  <li key={`doc-${item.key}-${sIndex}`}>
                    {summaryItem.summary}
                    {documentData?.blob_path && (
                      <button
                        onClick={handlePreviewClick}
                        className="preview-link"
                        title="Preview File"
                      >
                        Preview
                      </button>
                    )}
                    {summaryItem.date && (
                      <span className="date-text">
                        {formatDate(summaryItem.date)}
                      </span>
                    )}{" "}
                    <span className="status-pending">⏳</span>
                  </li>
                ));
              }
            })}
            {getAllQuickNotes().map((note, qIndex) => (
              <li key={`quick-${qIndex}`}>
                {note.one_line_note || note.status_update || "Quick note"}{" "}
                {isNoteEmpty(note) ? (
                  <span className="status-pending">⏳</span>
                ) : (
                  <span className="status-approved">✅</span>
                )}
              </li>
            ))}
            {getAllWhatsNewItems().length === 0 &&
              getAllQuickNotes().length === 0 && (
                <li>No significant changes since last visit</li>
              )}
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
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        ul {
          margin: 0;
          padding-left: 20px;
          list-style-type: disc;
        }
        li {
          margin-bottom: 6px;
          font-size: 14px;
        }
        .review-toggle {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 2px 6px;
          border-radius: 6px;
          cursor: pointer;
        }
        .status-approved {
          color: green;
        }
        .status-pending {
          color: orange;
        }
        .preview-link {
          float: right;
          color: green;
          text-decoration: underline;
          font-size: 12px;
          background: none;
          border: none;
          cursor: pointer;
          margin-left: 10px;
        }
        .preview-link:hover {
          color: darkgreen;
        }
        .date-text {
          color: #6b7280;
          font-size: 12px;
          margin-left: 10px;
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

export default WhatsNewSection;
