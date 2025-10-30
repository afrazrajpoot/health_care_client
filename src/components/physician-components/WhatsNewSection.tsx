// components/WhatsNewSection.tsx
import { DocumentData } from "@/app/custom-hooks/staff-hooks/physician-hooks/types";
import {
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import React, { useState, useMemo, useEffect } from "react";

interface WhatsNewSectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

// Helper function to check if a value is "not specified"
const isSpecified = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    return !["", "not specified", "n/a", "na", "null", "undefined"].includes(
      trimmed
    );
  }
  return true;
};

const WhatsNewSection: React.FC<WhatsNewSectionProps> = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}) => {
  const [viewedWhatsNew, setViewedWhatsNew] = useState<Set<string>>(new Set());
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());

  const { formatDate } = useWhatsNewData(documentData);

  // Initialize viewed state based on verified status
  useEffect(() => {
    const initial = new Set<string>();
    if (documentData?.documents) {
      documentData.documents.forEach((doc, docIndex) => {
        if (doc.status === "verified") {
          const docId = doc.document_id || `doc_${docIndex}`;
          // Add groups for whats_new
          const whatsNewArray = doc.whats_new || [];
          whatsNewArray.forEach((_, groupIndex) => {
            initial.add(`${docId}_${groupIndex}`);
          });
          // Add summary group if exists
          const summaryData = documentData.document_summaries?.[docIndex];
          if (isSpecified(summaryData?.summary)) {
            initial.add(`${docId}_summary`);
          }
        }
      });
    }
    setViewedWhatsNew(initial);
  }, [documentData]);

  // Transform the new whats_new structure to snapshots format - GROUPED BY DOCUMENT ID
  const groups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .map((doc, docIndex) => {
        const whatsNewArray = doc.whats_new || [];
        const docId = doc.document_id || `doc_${docIndex}`;

        const summaryData = documentData.document_summaries?.[docIndex];
        const summary = summaryData?.summary;
        const summaryDate = summaryData?.date;
        const hasSummary = isSpecified(summary);

        // Process each whats_new group in this document
        const whatsNewGroups = whatsNewArray
          .map((whatsNewObj, groupIndex) => {
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
                  type.charAt(0).toUpperCase() +
                  type.slice(1).replace(/_/g, " ");

                if (Array.isArray(entry)) {
                  // Handle array for quick_note
                  entry.forEach((subEntry: any) => {
                    if (!subEntry || typeof subEntry !== "object") return;

                    // Check if content or description has specified values
                    const hasSpecifiedContent = isSpecified(subEntry.content);
                    const hasSpecifiedDescription = isSpecified(
                      subEntry.description
                    );

                    if (!hasSpecifiedContent && !hasSpecifiedDescription)
                      return;

                    items.push({
                      type,
                      content: subEntry.content || "",
                      description: subEntry.description || "",
                    });
                  });
                } else {
                  // Handle single object entries - only add if content is specified
                  if (!isSpecified(entry.content)) return;

                  items.push({
                    type,
                    content: entry.content || "",
                    description: `${label}: ${entry.content || ""}`,
                  });
                }
              }
            );

            // Filter out items that have no specified content
            const filteredItems = items.filter(
              (item) =>
                isSpecified(item.content) || isSpecified(item.description)
            );

            // Skip entire group if no items with specified data
            if (filteredItems.length === 0) return null;

            // Use the first item's dates for the group (only if specified)
            const firstItem = filteredItems[0];
            const reportDate =
              firstItem &&
              isSpecified(
                whatsNewObj[Object.keys(whatsNewObj)[0]]?.document_report_date
              )
                ? whatsNewObj[Object.keys(whatsNewObj)[0]]
                    ?.document_report_date || ""
                : "";
            const createdDate =
              firstItem &&
              isSpecified(
                whatsNewObj[Object.keys(whatsNewObj)[0]]?.document_created_at
              )
                ? whatsNewObj[Object.keys(whatsNewObj)[0]]
                    ?.document_created_at || ""
                : "";

            return {
              docId: `${docId}_${groupIndex}`, // Unique ID for each group
              originalDocId: docId,
              reportDate,
              createdDate,
              items: filteredItems,
              doc, // Full document object for additional info
            };
          })
          .filter(
            (group): group is NonNullable<typeof group> =>
              group !== null && group.items.length > 0
          );

        let allGroupsForDoc: Array<{
          docId: string;
          originalDocId: string;
          reportDate: string;
          createdDate: string;
          items: Array<{
            type: string;
            content: string;
            description: string;
          }>;
          doc: any;
        }> = whatsNewGroups;

        if (hasSummary) {
          const summaryItem = {
            type: "document_summary" as const,
            content: summary || "",
            description: summary || "",
          };

          if (allGroupsForDoc.length > 0) {
            // Add to the first group
            const firstGroup = allGroupsForDoc[0];
            firstGroup.items = [summaryItem, ...firstGroup.items];

            // Use summaryDate for reportDate if not set
            if (
              !isSpecified(firstGroup.reportDate) &&
              isSpecified(summaryDate)
            ) {
              firstGroup.reportDate = summaryDate || "";
            }
          } else {
            // Create a group with only summary
            allGroupsForDoc = [
              {
                docId: `${docId}_summary`,
                originalDocId: docId,
                reportDate: isSpecified(summaryDate) ? summaryDate || "" : "",
                createdDate: "",
                items: [summaryItem],
                doc,
              },
            ];
          }
        }

        return allGroupsForDoc;
      })
      .flat();
  }, [documentData?.documents, documentData?.document_summaries]);

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

  const handleMarkViewed = async (e: React.MouseEvent, group: any) => {
    e.stopPropagation();
    const groupId = group.docId;
    const docId = group.doc?.document_id;
    if (!docId) return;

    if (viewedWhatsNew.has(groupId)) return;
    if (loadingDocs.has(docId)) return;

    const needsVerification = group.doc.status !== "verified";

    if (needsVerification) {
      setLoadingDocs((prev) => new Set([...prev, docId]));
    }

    try {
      if (needsVerification) {
        const response = await fetch(
          `/api/verify-document?document_id=${encodeURIComponent(docId)}`,
          { method: "POST" }
        );
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Verification failed");
        }
        toast.success("Successfully verified");
      }

      // Mark all groups for this document as viewed
      const docGroups = groups
        .filter((g) => g.originalDocId === group.originalDocId)
        .map((g) => g.docId);
      setViewedWhatsNew((prev) => {
        const newSet = new Set(prev);
        docGroups.forEach((id) => newSet.add(id));
        return newSet;
      });
    } catch (err) {
      console.error("Error verifying document:", err);
      toast.error(`Verification failed: ${(err as Error).message}`);
      // Do not mark as viewed on error
    } finally {
      if (needsVerification) {
        setLoadingDocs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(docId);
          return newSet;
        });
      }
    }
  };

  const handlePreviewClick = (e: React.MouseEvent, doc: any) => {
    e.stopPropagation();
    if (doc.blob_path) {
      const previewUrl = `http://localhost:8000/api/preview/${encodeURIComponent(
        doc.blob_path
      )}`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } else {
      console.error("Blob path not found for preview");
    }
  };

  const isGroupViewed = (groupId: string) => viewedWhatsNew.has(groupId);
  const isLoadingForGroup = (group: any) => {
    const docId = group.doc?.document_id;
    return docId ? loadingDocs.has(docId) : false;
  };

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
                const isLoading = isLoadingForGroup(group);

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
                          } ${isLoading ? "loading" : ""}`}
                          onClick={(e) => handleMarkViewed(e, group)}
                          disabled={isLoading}
                          title={isViewed ? "Viewed" : "Mark Viewed"}
                        >
                          {isLoading ? (
                            <Loader2 className="icon-xxs animate-spin" />
                          ) : isViewed ? (
                            <EyeIcon className="icon-xxs" />
                          ) : (
                            <EyeOffIcon className="icon-xxs" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isSpecified(group.reportDate) && (
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
                              {item.type === "document_summary" && (
                                <span className="summary-label">
                                  Document Summary
                                </span>
                              )}
                              {/* Only show description if it has specified content */}
                              {isSpecified(item.description)
                                ? item.description
                                : isSpecified(item.content)
                                ? item.content
                                : null}
                            </div>
                            <div className="item-actions">
                              {item.type === "document_summary" &&
                                group.doc && (
                                  <button
                                    className="preview-btn"
                                    onClick={(e) =>
                                      handlePreviewClick(e, group.doc)
                                    }
                                    title="Preview Text"
                                  >
                                    Preview
                                  </button>
                                )}
                              {/* No toggle for quick_note, always show details */}
                            </div>
                          </div>
                          {item.type === "quick_note" && (
                            <div className="item-details">
                              {isSpecified(item.description) && (
                                <p>
                                  <strong>Task:</strong> {item.description}
                                </p>
                              )}
                              {isSpecified(item.content) && (
                                <p>
                                  <strong>Notes:</strong> {item.content}
                                </p>
                              )}
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
        .summary-label {
          background: #ecfdf5;
          color: #047857;
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
        .preview-btn {
          background: #e2e8f0;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #475569;
          transition: all 0.2s;
        }
        .preview-btn:hover {
          background: #cbd5e1;
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
        .mark-viewed-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }
        .mark-viewed-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .mark-viewed-btn.viewed {
          background: #dcfce7;
          color: #166534;
        }
        .mark-viewed-btn.viewed:hover {
          background: #bbf7d0;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
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
