// components/physician-components/DocumentSummarySection.tsx
import { useDocumentSummary } from "@/app/custom-hooks/staff-hooks/physician-hooks/useDocumentSummary";
import React from "react";
// import { useDocumentSummary } from "@/hooks/useDocumentSummary";

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
  adl?: {
    adls_affected: string;
    adls_affected_history: string;
    work_restrictions: string;
    work_restrictions_history: string;
    has_changes: boolean;
  };
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: DocumentSummary[];
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
  previous_summaries?: { [key: string]: DocumentSummary };
  allVerified?: boolean;
  gcs_file_link?: string;
  blob_path?: string;
}

interface DocumentSummarySectionProps {
  documentData: DocumentData | null;
  openModal: (briefSummary: string) => void;
  handleShowPrevious: (type: string) => void;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const DocumentSummarySection: React.FC<DocumentSummarySectionProps> = ({
  documentData,
  openModal,
  handleShowPrevious,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}: any) => {
  const {
    isAccordionOpen,
    accordionBodyRef,
    handleToggleAccordion,
    formatDate,
    uniqueSummaries,
    handlePreviewFile,
    handleViewFile,
    getDocumentSummary,
  } = useDocumentSummary(documentData, isCollapsed, onToggle);

  return (
    <>
      <div
        className="section"
        onClick={handleToggleAccordion}
        role="button"
        aria-expanded={isAccordionOpen}
        aria-controls="doc-body"
        id="doc-title"
      >
        <div className={`doc-summary ${isAccordionOpen ? "open" : ""}`}>
          📑 Document Summary (click to expand)
          {documentData?.document_summaries &&
            documentData.document_summaries.length > 1 && (
              <span className="count-span">
                {documentData.document_summaries.length} reports
              </span>
            )}
          {isCollapsed && (
            <span className="collapsed-span">({getDocumentSummary()})</span>
          )}
        </div>
        <div
          id="doc-body"
          className={`details-body ${isAccordionOpen ? "" : "hidden"}`}
          ref={accordionBodyRef}
          role="region"
          aria-label="Parsed documents"
        >
          <ul className="doc-ul">
            {uniqueSummaries.length > 0 ? (
              uniqueSummaries.map((summary, index) => {
                const hasPrevious =
                  documentData.previous_summaries &&
                  documentData.previous_summaries[summary.type];
                const sectionId = `section-summary-${index}`;

                return (
                  <li key={index} className="doc-li">
                    <strong>
                      {summary.type} ({formatDate(summary.date)}):
                    </strong>{" "}
                    {summary.summary}{" "}
                    {summary.brief_summary && (
                      <a
                        href="#"
                        className="pdf-link view-sum"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openModal(summary.brief_summary || "");
                        }}
                      >
                        [View Summary]
                      </a>
                    )}
                    {hasPrevious && (
                      <a
                        href="#"
                        className="pdf-link previous"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShowPrevious(summary.type);
                        }}
                      >
                        [Previous Summary]
                      </a>
                    )}
                    <span className="copy-span-li">
                      <button
                        className={`copy-btn-li ${
                          copied[sectionId] ? "copied-li" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopySection(sectionId);
                        }}
                        title="Copy Section"
                      >
                        {copied[sectionId] ? <CheckIcon /> : <CopyIcon />}
                        Copy
                      </button>
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="no-data-li">No component summaries available</li>
            )}
          </ul>
        </div>
      </div>

      {/* File actions always rendered, regardless of accordion state, as long as data exists */}
      <div className="file-actions">
        {documentData?.blob_path && (
          <a
            href="#"
            className="pdf-link preview"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePreviewFile(e);
            }}
          >
            [Preview File]
          </a>
        )}
        {documentData?.gcs_file_link && (
          <a
            href="#"
            className="pdf-link download"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewFile(e);
            }}
          >
            [Download File]
          </a>
        )}
      </div>

      <style jsx>{`
        .section {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
        }
        .doc-summary {
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 8px;
          font-size: 15px;
          position: relative;
        }
        .doc-summary:after {
          content: "▼";
          float: right;
        }
        .doc-summary.open:after {
          content: "▲";
        }
        .count-span {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 9999px;
          font-size: 12px;
          margin-left: 8px;
        }
        .collapsed-span {
          font-weight: normal;
          color: #6b7280;
          font-size: 14px;
          margin-left: 8px;
        }
        .details-body {
          margin-top: 8px;
        }
        .details-body.hidden {
          display: none;
        }
        .doc-ul {
          margin: 0;
          padding-left: 20px;
        }
        .doc-li {
          margin-bottom: 6px;
          font-size: 14px;
          line-height: 1.4;
        }
        .pdf-link {
          font-size: 12px;
          margin-left: 8px;
          text-decoration: underline;
          cursor: pointer;
        }
        .pdf-link.view-sum,
        .pdf-link.previous {
          color: #2563eb;
        }
        .pdf-link.preview {
          color: #16a34a;
        }
        .pdf-link.download {
          color: #9333ea;
        }
        .pdf-link:hover {
          text-decoration: none;
        }
        .copy-span-li {
          margin-left: 8px;
        }
        .copy-btn-li {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 2px 6px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          transition: background 0.2s;
          vertical-align: middle;
        }
        .copy-btn-li:hover {
          background: #cbd5e1;
        }
        .copied-li {
          background: #dcfce7;
          color: #166534;
        }
        .copied-li:hover {
          background: #bbf7d0;
        }
        .no-data-li {
          color: #6b7280;
          text-align: center;
          list-style: none;
          padding-left: 0;
        }
        .w-3.5 {
          width: 0.875rem;
          height: 0.875rem;
        }
        .status-denied {
          color: red;
        }
        .file-actions {
          margin: 0 20px 20px 20px;
          padding-left: 20px;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
        }
        .file-actions:empty {
          display: none;
        }
      `}</style>
    </>
  );
};

export default DocumentSummarySection;
