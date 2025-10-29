// components/WhatsNewSection.tsx
import { DocumentData } from "@/app/custom-hooks/staff-hooks/physician-hooks/types";
import {
  usePreviewFile,
  useQuickNotesToggle,
  useWhatsNewData,
} from "@/app/custom-hooks/staff-hooks/physician-hooks/useWhatsNewData";
import {
  BriefcaseMedicalIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import React, { useState, useMemo } from "react";

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
  const [viewedWhatsNew, setViewedWhatsNew] = useState<Set<string>>(new Set());

  const { formatDate } = useWhatsNewData(documentData);

  // Transform the new whats_new structure to snapshots format - GROUPED BY DOCUMENT ID
  const groups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .flatMap((doc, docIndex) => {
        const whatsNewArray = doc.whats_new || [];
        const docId = doc.document_id || `doc_${docIndex}`;

        // Process each whats_new group in this document
        return whatsNewArray.map((whatsNewObj, groupIndex) => {
          const items: Array<{
            type: string;
            content: string;
            description: string;
          }> = [];

          // Extract all items from this whats_new object
          Object.entries(whatsNewObj).forEach(
            ([type, entry]: [string, any]) => {
              if (!entry || typeof entry !== "object") return;

              const label =
                type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");

              if (Array.isArray(entry)) {
                // Handle array for quick_note
                entry.forEach((subEntry: any) => {
                  if (!subEntry || typeof subEntry !== "object") return;
                  items.push({
                    type,
                    content: subEntry.content || "",
                    description: subEntry.description || subEntry.content || "",
                  });
                });
              } else {
                // Handle single object entries
                items.push({
                  type,
                  content: entry.content || "",
                  description: `${label}: ${entry.content || ""}`,
                });
              }
            }
          );

          // Use the first item's dates for the group
          const firstItem = items[0];
          const reportDate = firstItem
            ? whatsNewObj[Object.keys(whatsNewObj)[0]]?.document_report_date ||
              ""
            : "";
          const createdDate = firstItem
            ? whatsNewObj[Object.keys(whatsNewObj)[0]]?.document_created_at ||
              ""
            : "";

          return {
            docId: `${docId}_${groupIndex}`, // Unique ID for each group
            originalDocId: docId,
            reportDate,
            createdDate,
            items,
            doc, // Full document object for additional info
          };
        });
      })
      .filter((group) => group.items.length > 0);
  }, [documentData?.documents]);

  const handleSectionClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".section-header")) {
      onToggle();
    }
  };

  const handleCopyClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    onCopySection(`whatsnew-${groupId}`);
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Mark all groups as reviewed
    setViewedWhatsNew(new Set(groups.map((group) => group.docId)));
  };

  const handleMarkViewed = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    setViewedWhatsNew((prev) => new Set([...prev, groupId]));
  };

  const isGroupViewed = (groupId: string) => viewedWhatsNew.has(groupId);

  return (
    <>
      <div className="section">
        <div className="section-header" onClick={handleSectionClick}>
          <div className="section-title">
            <BriefcaseMedicalIcon className="icon-sm" />
            <h3>What's New Since Last Visit</h3>
          </div>
          <div className="header-actions">
            <span className="review-toggle" onClick={handleReviewClick}>
              Mark All Reviewed
            </span>
            <button
              className="collapse-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="icon-xs" />
              ) : (
                <ChevronDownIcon className="icon-xs" />
              )}
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="section-content">
            <ul>
              {groups.map((group, groupIndex) => {
                const isViewed = isGroupViewed(group.docId);
                const isGroupCopied = copied[`whatsnew-${group.docId}`];

                return (
                  <li key={group.docId} className="separated-item">
                    {/* Group Header: Show document ID and eye icon */}
                    <div className="group-header">
                      <div className="group-info">
                        {group.doc && (
                          <>
                            <span className="doc-index">
                              Document {group.doc.document_index}
                            </span>
                            {group.doc.is_latest && (
                              <span className="doc-latest"> (Latest)</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="group-actions">
                        <button
                          className={`copy-btn ${
                            isGroupCopied ? "copied" : ""
                          }`}
                          onClick={(e) => handleCopyClick(e, group.docId)}
                          title="Copy This Update"
                        >
                          {isGroupCopied ? (
                            <CheckIcon className="icon-xxs" />
                          ) : (
                            <CopyIcon className="icon-xxs" />
                          )}
                        </button>
                        <button
                          className={`mark-viewed-btn ${
                            isViewed ? "viewed" : ""
                          }`}
                          onClick={(e) => handleMarkViewed(e, group.docId)}
                          title={isViewed ? "Viewed" : "Mark Viewed"}
                        >
                          {isViewed ? (
                            <EyeIcon className="icon-xxs" />
                          ) : (
                            <EyeOffIcon className="icon-xxs" />
                          )}
                        </button>
                      </div>
                    </div>

                    {group.reportDate && (
                      <div className="group-date">
                        {formatDate(group.reportDate)}
                      </div>
                    )}

                    {/* Show all items in this group */}
                    {group.items.map((item, index) => {
                      const itemKey = `${group.docId}_${item.type}_${index}`;

                      return (
                        <div
                          key={itemKey}
                          className={`item-wrapper ${item.type}`}
                        >
                          <div className="item-header">
                            <div className="item-content">
                              {item.type === "quick_note" && (
                                <span className="quick-note-label">
                                  Quick note
                                </span>
                              )}
                              {item.description}
                            </div>
                            <div className="item-actions">
                              {/* No toggle for quick_note, always show details */}
                            </div>
                          </div>
                          {item.type === "quick_note" && (
                            <div className="item-details">
                              <p>
                                <strong>Task:</strong>{" "}
                                {item.description || "No description available"}
                              </p>
                              <p>
                                <strong>Notes:</strong> {item.content}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </li>
                );
              })}
              {groups.length === 0 && (
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
        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        .group-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }
        .doc-id {
          color: #6b7280;
          font-family: monospace;
          font-size: 11px;
        }
        .doc-index {
          color: #1f2937;
        }
        .doc-latest {
          color: #059669;
          font-size: 11px;
        }
        .group-actions {
          display: flex;
          gap: 6px;
          align-items: center;
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
        /* Icon size classes */
        .icon-sm {
          width: 14px;
          height: 14px;
        }
        .icon-xs {
          width: 12px;
          height: 12px;
        }
        .icon-xxs {
          width: 10px;
          height: 10px;
        }
      `}</style>
    </>
  );
};

export default WhatsNewSection;
