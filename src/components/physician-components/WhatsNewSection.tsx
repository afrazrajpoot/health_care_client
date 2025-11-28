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
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WhatsNewSectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface SelectedSummary {
  type: string;
  date: string;
  summary: string;
}

interface SelectedCaseContext {
  type: string;
  date: string;
  context: string;
}

const WhatsNewSection: React.FC<WhatsNewSectionProps> = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
  mode,
}) => {
  const [viewedWhatsNew, setViewedWhatsNew] = useState<Set<string>>(new Set());
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(
    new Set()
  );
  const [selectedSummary, setSelectedSummary] =
    useState<SelectedSummary | null>(null);
  const [selectedCaseContext, setSelectedCaseContext] =
    useState<SelectedCaseContext | null>(null);
  const { data: session } = useSession();
  const { formatDate } = useWhatsNewData(documentData);
  console.log(documentData, "documentData what new");

  // Helper for timestamp formatting
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Transform the new whats_new structure - GROUPED BY DOCUMENT ID
  // Transform the new whats_new structure - GROUPED BY DOCUMENT ID
  const documentGroups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .map((doc, docIndex) => {
        const docId = doc.document_id || `doc_${docIndex}`;

        // Extract both summaries from whats_new object
        const longSummary = doc.whats_new?.long_summary || "";
        const shortSummary = doc.whats_new?.short_summary || "";
        const caseContext = doc.brief_summary || "";

        // Fallback to legacy brief_summary if no short summary
        const fallbackShortSummary = doc.brief_summary || "";

        // Extract consulting doctor from the first body part snapshot (or fallback)
        const consultingDoctor =
          doc.body_part_snapshots?.[0]?.consultingDoctor || "Not specified";

        // Extract document type from document_summary
        const documentType = doc.document_summary?.type || "Unknown";

        return {
          docId,
          originalDocId: docId,
          documentIndex: doc.document_index || docIndex + 1,
          isLatest: doc.is_latest || false,
          reportDate: doc.report_date || doc.created_at || "",
          longSummary,
          shortSummary: shortSummary || fallbackShortSummary,
          caseContext,
          contentType: "summaries", // Now we have both summaries
          doc, // Full document object for additional info
          status: doc.status || "pending",
          consultingDoctor,
          documentType,
          task_quick_notes: doc.task_quick_notes || [], // Add quick notes per document
          // Add mode field from document data for filtering
          docMode: doc.mode, // Assuming your document has a mode field
        };
      })
      .filter((group) => {
        // First filter: only show documents with short summary
        if (!group.shortSummary) return false;

        // Second filter: filter by mode if mode prop is provided
        if (mode && group.docMode) {
          return group.docMode === mode;
        }

        // If no mode filter or document doesn't have mode, include it
        return true;
      });
  }, [documentData?.documents, mode]); // Add mode to dependencies

  // Format the long summary with bold headings and remove brackets/quotes
  const formatLongSummary = (summary: string): string => {
    if (!summary) return "";

    // Remove brackets and quotes
    let formatted = summary
      .replace(/[\[\]"]/g, "") // Remove brackets and quotes
      .replace(/'/g, "") // Remove single quotes
      .replace(/\{/g, "")
      .replace(/\}/g, ""); // Remove curly braces

    // Make headings bold
    formatted = formatted
      .replace(/(📋 REPORT OVERVIEW)/g, "**$1**")
      .replace(/(👤 PATIENT INFORMATION)/g, "**$1**")
      .replace(/(🏥 DIAGNOSIS)/g, "**$1**")
      .replace(/(🔬 CLINICAL STATUS)/g, "**$1**")
      .replace(/(💊 MEDICATIONS)/g, "**$1**")
      .replace(/(⚖️ MEDICAL-LEGAL CONCLUSIONS)/g, "**$1**")
      .replace(/(💼 WORK STATUS)/g, "**$1**")
      .replace(/(🎯 RECOMMENDATIONS)/g, "**$1**")
      .replace(/(🚨 CRITICAL FINDINGS)/g, "**$1**")
      .replace(/(--------------------------------------------------)/g, "---")
      .replace(/(Primary Diagnoses:)/g, "**$1**")
      .replace(/(Chief Complaint:)/g, "**$1**")
      .replace(/(Pain Scores:)/g, "**$1**")
      .replace(/(Functional Limitations:)/g, "**$1**")
      .replace(/(Objective Findings:)/g, "**$1**")
      .replace(/(Current Medications:)/g, "**$1**")
      .replace(/(Recommended Future Medications:)/g, "**$1**")
      .replace(/(MMI Status:)/g, "**$1**")
      .replace(/(MMI Reason:)/g, "**$1**")
      .replace(/(Current Work Status:)/g, "**$1**")
      .replace(/(Work Restrictions:)/g, "**$1**")
      .replace(/(Prognosis for Return to Work:)/g, "**$1**")
      .replace(/(Diagnostic Tests Recommended:)/g, "**$1**")
      .replace(/(Interventional Procedures:)/g, "**$1**")
      .replace(/(Therapy Recommendations:)/g, "**$1**")
      .replace(/(Future Surgical Needs:)/g, "**$1**");

    return formatted;
  };

  // Convert formatted text to JSX with bold styling
  const renderFormattedSummary = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // Check if line should be bold (contains **text**)
      if (line.includes("**") && line.includes("**")) {
        const parts = line.split("**");
        return (
          <div key={index} style={{ marginBottom: "8px" }}>
            {parts.map((part, partIndex) =>
              partIndex % 2 === 1 ? (
                <strong key={partIndex}>{part}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </div>
        );
      }

      // Regular line
      return (
        <div key={index} style={{ marginBottom: "8px" }}>
          {line}
        </div>
      );
    });
  };

  // Automatically mark verified documents as viewed
  useEffect(() => {
    const verifiedIds = documentGroups
      .filter((g) => g.status === "verified")
      .map((g) => g.docId);
    setViewedWhatsNew((prev) => {
      const newSet = new Set(prev);
      verifiedIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  }, [documentGroups]);

  const handleSectionClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".section-header")) {
      onToggle();
    }
  };

  const handleCopyClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();

    const group = documentGroups.find((g) => g.docId === groupId);
    if (!group || !group.shortSummary) {
      toast.error("No summary found to copy", {
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    const textToCopy =
      `DOCUMENT SUMMARY\n\n` +
      `📋 Brief Summary:\n${group.shortSummary}\n\n` +
      `These findings have been reviewed by Physician`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));

    onCopySection(textToCopy);
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Mark all groups as reviewed
    setViewedWhatsNew(new Set(documentGroups.map((group) => group.docId)));
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
        toast.success("Successfully verified", {
          duration: 5000,
          position: "top-right",
        });
      }

      // Mark as viewed
      setViewedWhatsNew((prev) => {
        const newSet = new Set(prev);
        newSet.add(groupId);
        return newSet;
      });
    } catch (err) {
      console.error("Error verifying document:", err);
      toast.error(`Verification failed: ${(err as Error).message}`, {
        duration: 5000,
        position: "top-right",
      });
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

  const handlePreviewClick = async (e: React.MouseEvent, doc: any) => {
    e.stopPropagation();

    if (!doc.blob_path) {
      console.error("Blob path not found for preview");
      return;
    }

    const docId = doc.document_id;
    if (!docId || loadingPreviews.has(docId)) return;

    setLoadingPreviews((prev) => new Set([...prev, docId]));

    try {
      const response = await fetch(
        `https://api.kebilo.com/api/documents/preview/${encodeURIComponent(
          doc.blob_path
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.status}`);
      }

      // 🧩 Get blob instead of JSON
      const blob = await response.blob();

      // Create local object URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error fetching preview:", error);
    } finally {
      setLoadingPreviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  const handleReadMoreClick = (group: any) => {
    if (group.longSummary) {
      const formattedSummary = formatLongSummary(group.longSummary);
      setSelectedSummary({
        type: group.documentType,
        date: group.reportDate,
        summary: formattedSummary,
      });
    }
  };

  const handleCaseContextClick = (group: any) => {
    if (group.caseContext) {
      setSelectedCaseContext({
        type: group.documentType,
        date: group.reportDate,
        context: group.caseContext,
      });
    }
  };

  const isGroupViewed = (groupId: string) => viewedWhatsNew.has(groupId);
  const isLoadingForGroup = (group: any) => {
    const docId = group.doc?.document_id;
    return docId ? loadingDocs.has(docId) : false;
  };
  const isPreviewLoadingForGroup = (group: any) => {
    const docId = group.doc?.document_id;
    return docId ? loadingPreviews.has(docId) : false;
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
            <div className="whats-new-list">
              {documentGroups.map((group, groupIndex) => {
                const isViewed = isGroupViewed(group.docId);
                const isGroupCopied = copied[`whatsnew-${group.docId}`];
                const isLoading = isLoadingForGroup(group);
                const isPreviewLoading = isPreviewLoadingForGroup(group);

                return (
                  <div key={group.docId} className="whats-new-bullet-item">
                    {/* Bullet point with summary */}
                    <div className="bullet-content">
                      <div className="bullet-marker">•</div>
                      <div className="bullet-text">
                        <span className="summary-text">
                          {group.shortSummary}
                        </span>

                        {/* Action buttons at the end of summary */}
                        <div className="action-buttons">
                          {group.longSummary && (
                            <button
                              onClick={() => handleReadMoreClick(group)}
                              className="action-link read-more-link"
                            >
                              Read more
                            </button>
                          )}

                          {group.caseContext && (
                            <button
                              onClick={() => handleCaseContextClick(group)}
                              className="action-link case-context-link"
                            >
                              View brief summary
                            </button>
                          )}

                          <button
                            className={`action-link copy-link ${isGroupCopied ? "copied" : ""
                              }`}
                            onClick={(e) => handleCopyClick(e, group.docId)}
                            title="Copy This Update"
                          >
                            {isGroupCopied ? (
                              <CheckIcon className="icon-micro" />
                            ) : (
                              <CopyIcon className="icon-micro" />
                            )}
                            Copy
                          </button>

                          <button
                            className={`action-link mark-viewed-link ${isViewed ? "viewed" : ""
                              } ${isLoading ? "loading" : ""}`}
                            onClick={(e) => handleMarkViewed(e, group)}
                            disabled={isLoading}
                            title={isViewed ? "Reviewed" : "Mark as Reviewed"}
                          >
                            {isLoading ? (
                              <Loader2 className="icon-micro animate-spin" />
                            ) : isViewed ? (
                              "Reviewed"
                            ) : (
                              "Mark Reviewed"
                            )}
                          </button>

                          <button
                            className="action-link preview-link"
                            onClick={(e) => handlePreviewClick(e, group.doc)}
                            disabled={isPreviewLoading}
                            title="Preview Document"
                          >
                            {isPreviewLoading ? (
                              <Loader2 className="icon-micro animate-spin" />
                            ) : (
                              "Preview"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Notes - Show if available */}
                    {group.task_quick_notes &&
                      group.task_quick_notes.length > 0 && (
                        <div className="quick-notes-section">
                          <div className="quick-notes-header">Quick Notes:</div>
                          <div className="quick-notes-list">
                            {group.task_quick_notes.map(
                              (note: any, noteIndex: number) => (
                                <div
                                  key={noteIndex}
                                  className="quick-note-item"
                                >
                                  <span className="note-status">
                                    {note.status_update || "Note"}
                                  </span>
                                  <span className="note-one-line">
                                    {note.one_line_note || ""}
                                  </span>
                                  <span className="note-details">
                                    {note.details}
                                  </span>
                                  <span className="note-timestamp">
                                    {formatTimestamp(note.timestamp || "")}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Document metadata - smaller and less prominent */}
                    {/* <div className="document-metadata">
                      <span className="meta-item doc-type">
                        {group.documentType}
                      </span>
                      <span className="meta-item doc-date">
                        {formatDate(group.reportDate)}
                      </span>
                      <span className="meta-item doc-doctor">
                        {group.consultingDoctor}
                      </span>
                      {group.isLatest && (
                        <span className="meta-item doc-latest">Latest</span>
                      )}
                    </div> */}
                  </div>
                );
              })}
              {documentGroups.length === 0 && (
                <div className="no-items">
                  No significant changes since last visit
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Detailed Summary with EXTRA WIDE MODAL */}
      <Dialog
        open={!!selectedSummary}
        onOpenChange={() => setSelectedSummary(null)}
      >
        <DialogContent className=" w-full h-[95vh] overflow-y-auto p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">
              Detailed {selectedSummary?.type} Summary -{" "}
              {formatDate(selectedSummary?.date)}
            </DialogTitle>
          </DialogHeader>
          <div className="detailed-summary-content extra-wide-modal">
            {selectedSummary && renderFormattedSummary(selectedSummary.summary)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal for Case Context */}
      <Dialog
        open={!!selectedCaseContext}
        onOpenChange={() => setSelectedCaseContext(null)}
      >
        <DialogContent className="w-full h-fit overflow-y-auto p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">
              Case Context - {selectedCaseContext?.type} -{" "}
              {formatDate(selectedCaseContext?.date)}
            </DialogTitle>
          </DialogHeader>
          <div className="detailed-summary-content extra-wide-modal">
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {selectedCaseContext?.context}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .section {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .section-header:hover {
          background-color: #f8fafc;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        h3 {
          margin: 0;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #1f2937;
        }
        .header-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .section-content {
          margin-top: 10px;
        }
        .whats-new-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .whats-new-bullet-item {
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .whats-new-bullet-item:last-child {
          border-bottom: none;
        }
        .bullet-content {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .bullet-marker {
          color: #3b82f6;
          font-weight: bold;
          font-size: 14px;
          line-height: 1.3;
          min-width: 12px;
        }
        .bullet-text {
          flex: 1;
          // display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          line-height: 1.3;
        }
        .summary-text {
          font-size: 12px;
          line-height: 1.3;
          color: #374151;
          font-weight: 400;
          flex: 1;
        }
        .action-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .action-link {
          background: none;
          border: none;
          padding: 0;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 3px;
          text-decoration: underline;
          color: #3b82f6;
          transition: color 0.2s;
        }
        .action-link:hover:not(:disabled) {
          color: #2563eb;
        }
        .action-link:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .read-more-link {
          color: #059669;
          text-decoration: underline;
        }
        .read-more-link:hover {
          color: #047857;
        }
        .case-context-link {
          color: #0891b2;
          text-decoration: underline;
        }
        .case-context-link:hover {
          color: #0e7490;
        }
        .copy-link {
          color: #7c3aed;
          text-decoration: underline;
        }
        .copy-link.copied {
          color: #059669;
        }
        .copy-link:hover {
          color: #6d28d9;
        }
        .mark-viewed-link {
          color: #dc2626;
          text-decoration: underline;
        }
        .mark-viewed-link.viewed {
          color: #059669;
        }
        .mark-viewed-link:hover:not(:disabled) {
          color: #b91c1c;
        }
        .preview-link {
          color: #ea580c;
          text-decoration: underline;
        }
        .preview-link:hover:not(:disabled) {
          color: #c2410c;
        }
        .document-metadata {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 20px;
          flex-wrap: wrap;
        }
        .meta-item {
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .doc-type {
          color: #1f2937;
          background: #e0f2fe;
        }
        .doc-latest {
          color: #059669;
          background: #ecfdf5;
        }
        .doc-doctor {
          color: #6b21a8;
          background: #ede9fe;
        }
        .doc-date {
          color: #6b7280;
          font-style: italic;
        }
        .no-items {
          font-size: 12px;
          line-height: 1.3;
          color: #6b7280;
          text-align: center;
          padding: 16px;
          font-style: italic;
        }
        .detailed-summary-content {
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }
        .extra-wide-modal {
          width: 100%;
          max-width: none;
          font-size: 14px;
          line-height: 1.7;
        }
        .collapse-btn {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: color 0.2s;
        }
        .collapse-btn:hover {
          color: #374151;
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
        /* Icon size classes - much smaller */
        .icon-sm {
          width: 12px;
          height: 12px;
        }
        .icon-xs {
          width: 10px;
          height: 10px;
        }
        .icon-micro {
          width: 8px;
          height: 8px;
        }
        /* Quick Notes Styles */
        .quick-notes-section {
          margin-top: 8px;
          padding: 8px 0;
          border-top: 1px dashed #e5e7eb;
          margin-left: 20px;
        }
        .quick-notes-header {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .quick-notes-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .quick-note-item {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 10px;
          color: #4b5563;
          line-height: 1.2;
        }
        .note-status {
          font-weight: 500;
          color: #059669;
        }
        .note-one-line {
          font-style: italic;
          color: #6b7280;
          min-width: 120px;
        }
        .note-details {
          flex: 1;
          min-width: 150px;
        }
        .note-timestamp {
          font-size: 9px;
          color: #9ca3af;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
};

export default WhatsNewSection;
