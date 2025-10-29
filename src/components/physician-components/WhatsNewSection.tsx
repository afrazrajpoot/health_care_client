// components/WhatsNewSection.tsx
import { DocumentData } from "@/app/custom-hooks/staff-hooks/physician-hooks/types";
import {
  usePreviewFile,
  useQuickNotesToggle,
  useWhatsNewData,
} from "@/app/custom-hooks/staff-hooks/physician-hooks/useWhatsNewData";
import React from "react";

// ... (keep all your existing interfaces - PatientQuiz, SummarySnapshotItem, etc.)

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
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
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

  const filteredQuickNotes = getAllQuickNotes().filter(
    (note) => note.one_line_note || note.status_update
  );

  return (
    <>
      <div className="section" onClick={handleSectionClick}>
        <div className="section-header">
          <div className="section-title">
            <MedicalIcon />
            <h3>What's New Since Last Visit</h3>
          </div>
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
              {filteredQuickNotes.map((note, qIndex) => (
                <li key={`quick-${qIndex}`}>
                  Task Description: {note.one_line_note || note.status_update}{" "}
                  {isNoteEmpty(note) ? (
                    <span className="status-pending">⏳</span>
                  ) : (
                    <span className="status-approved">✅</span>
                  )}
                </li>
              ))}
              {getAllWhatsNewItems().length === 0 &&
                filteredQuickNotes.length === 0 && (
                  <li>No significant changes since last visit</li>
                )}
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .section {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;

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
          margin-bottom: 6px;
          font-size: 14px;
          line-height: 1.4;
          color: #374151;
        }
        .review-toggle {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .review-toggle:hover {
          background: #cbd5e1;
        }
        .status-approved {
          color: #059669;
          margin-left: 4px;
        }
        .status-pending {
          color: #d97706;
          margin-left: 4px;
        }
        .preview-link {
          margin-left: 8px;
          color: #059669;
          text-decoration: underline;
          font-size: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .preview-link:hover {
          color: #047857;
          background-color: #d1fae5;
        }
        .date-text {
          color: #6b7280;
          font-size: 12px;
          margin-left: 8px;
          font-style: italic;
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

export default WhatsNewSection;
