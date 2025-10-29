// components/WhatsNewSection.tsx
import { DocumentData } from "@/app/custom-hooks/staff-hooks/physician-hooks/types";
import {
  usePreviewFile,
  useQuickNotesToggle,
  useWhatsNewData,
} from "@/app/custom-hooks/staff-hooks/physician-hooks/useWhatsNewData";
import React, { useState, useMemo } from "react";

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

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
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

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-4 h-4 transition-transform ${className || ""}`}
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
  // Local state for tracking viewed whatsnew items
  const [viewedWhatsNew, setViewedWhatsNew] = useState<Set<string>>(new Set());
  const [expandedQuickNotes, setExpandedQuickNotes] = useState<Set<string>>(
    new Set()
  );

  // Use new data structure
  const snapshots = documentData?.whats_new_snapshots || [];

  const { formatDate } = useWhatsNewData(documentData); // Keep for date formatting if needed

  const { isQuickNotesOpen, toggleQuickNotes } = useQuickNotesToggle();

  const handlePreviewFile = usePreviewFile(documentData);

  // Group snapshots by document_id, with diagnosis first
  const groups = useMemo(() => {
    const grouped: { [key: string]: typeof snapshots } = snapshots.reduce(
      (acc, item) => {
        if (!acc[item.document_id]) {
          acc[item.document_id] = [];
        }
        acc[item.document_id].push(item);
        return acc;
      },
      {}
    );

    return Object.entries(grouped).map(([docId, items]) => ({
      docId,
      reportDate: items[0]?.document_report_date,
      items: items.sort((a, b) =>
        a.type === "diagnosis" && b.type !== "diagnosis" ? -1 : 1
      ),
    }));
  }, [snapshots]);

  const handleSectionClick = (e: React.MouseEvent) => {
    // Only toggle if clicking on the section header, not on items inside
    if ((e.target as HTMLElement).closest(".section-header")) {
      onToggle();
    }
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopySection("section-whatsnew");
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Mark all reviewed (only diagnosis items)
    setViewedWhatsNew(
      new Set(
        snapshots
          .filter((item) => item.type !== "quick_note")
          .map((item) => `${item.document_id}_${item.type}`)
      )
    );
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePreviewFile(e);
  };

  const handleMarkViewed = (e: React.MouseEvent, itemKey: string) => {
    e.stopPropagation();
    setViewedWhatsNew((prev) => new Set([...prev, itemKey]));
  };

  const handleToggleExpand = (e: React.MouseEvent, itemKey: string) => {
    e.stopPropagation();
    setExpandedQuickNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const isItemViewed = (itemKey: string) => viewedWhatsNew.has(itemKey);
  const isItemExpanded = (itemKey: string) => expandedQuickNotes.has(itemKey);

  return (
    <>
      <div className="section">
        <div className="section-header" onClick={handleSectionClick}>
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
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="section-content">
            <ul>
              {groups.map(({ docId, reportDate, items }, groupIndex) => (
                <li key={docId} className="separated-item">
                  {reportDate && (
                    <div className="group-date">{formatDate(reportDate)}</div>
                  )}
                  {items.map((item, index) => {
                    const itemKey = `${item.document_id}_${item.type}`;
                    const isViewed =
                      item.type !== "quick_note" && isItemViewed(itemKey);
                    const isExpanded =
                      item.type === "quick_note" && isItemExpanded(itemKey);

                    return (
                      <div
                        key={`${item.type}-${index}`}
                        className={`item-wrapper ${item.type}`}
                      >
                        <div className="item-header">
                          <div className="item-content">
                            {item.type === "quick_note" && (
                              <span className="quick-note-label">
                                Quick note
                              </span>
                            )}
                            {item.content}
                            {item.type !== "quick_note" && (
                              <span
                                className={`status-${
                                  isViewed ? "approved" : "pending"
                                }`}
                              >
                                {isViewed ? "✅" : "⏳"}
                              </span>
                            )}
                          </div>
                          <div className="item-actions">
                            {item.type === "quick_note" && (
                              <button
                                className="toggle-btn"
                                onClick={(e) => handleToggleExpand(e, itemKey)}
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                <ChevronDownIcon
                                  className={isExpanded ? "rotate-180" : ""}
                                />
                              </button>
                            )}
                            {item.type !== "quick_note" && (
                              <button
                                className={`mark-viewed-btn ${
                                  isViewed ? "viewed" : ""
                                }`}
                                onClick={(e) => handleMarkViewed(e, itemKey)}
                                title={isViewed ? "Viewed" : "Mark Viewed"}
                              >
                                {isViewed ? <EyeIcon /> : <EyeOffIcon />}
                              </button>
                            )}
                          </div>
                        </div>
                        {item.type === "quick_note" && isExpanded && (
                          <div className="item-details">
                            <p>
                              <strong>Task Description:</strong>{" "}
                              {item.description || "No description available"}
                            </p>
                            <p>
                              <strong>Content:</strong> {item.content}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </li>
              ))}
              {snapshots.length === 0 && (
                <li className="no-items">
                  No significant changes since last visit
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .section {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .section-header:hover {
          background-color: #f8fafc;
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
          padding-left: 0;
          list-style-type: none;
        }
        .separated-item {
          margin-top: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          cursor: default;
        }
        .separated-item:first-child {
          margin-top: 0;
          border-top: none;
          padding-top: 0;
        }
        .group-date {
          color: #6b7280;
          font-size: 12px;
          font-style: italic;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #f3f4f6;
        }
        .item-wrapper {
          margin-bottom: 12px;
        }
        .item-wrapper:last-child {
          margin-bottom: 0;
        }
        .item-wrapper.quick_note {
          margin-left: 16px;
          border-left: 2px solid #e5e7eb;
          padding-left: 12px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
        }
        .item-content {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .quick-note-label {
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .item-actions {
          display: flex;
          gap: 4px;
          align-items: center;
          flex-shrink: 0;
        }
        .item-details {
          margin-top: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
          border-left: 3px solid #3b82f6;
        }
        .item-details p {
          margin: 6px 0;
        }
        .no-items {
          font-size: 14px;
          line-height: 1.4;
          color: #6b7280;
          text-align: center;
          padding: 20px;
          list-style: none;
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
        }
        .status-pending {
          color: #d97706;
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
        .toggle-btn {
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
        .toggle-btn:hover {
          background-color: #e5e7eb;
          color: #374151;
        }
        .mark-viewed-btn {
          background: #e2e8f0;
          border: none;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #475569;
          flex-shrink: 0;
        }
        .mark-viewed-btn:hover {
          background: #cbd5e1;
        }
        .mark-viewed-btn.viewed {
          background: #dcfce7;
          color: #166534;
        }
        .mark-viewed-btn.viewed:hover {
          background: #bbf7d0;
        }
        .rotate-180 {
          transform: rotate(180deg);
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
