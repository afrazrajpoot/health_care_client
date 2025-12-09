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
  FileTextIcon,
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
  mode?: string;
}

interface SelectedSummary {
  type: string;
  date: string;
  summary: string;
  patientName?: string;
  doctorName?: string;
  briefSummary?: string;
  isBriefOnly?: boolean;
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
  console.log(documentData,'what new data')
  const [selectedSummary, setSelectedSummary] =
    useState<SelectedSummary | null>(null);
  const [selectedCaseContext, setSelectedCaseContext] =
    useState<SelectedCaseContext | null>(null);
  const { data: session } = useSession();
  const { formatDate } = useWhatsNewData(documentData);

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getPatientName = () => {
    if (!documentData?.documents?.[0]) return "Unknown Patient";
    
    const firstDoc = documentData.documents[0];
    return (
      firstDoc.patient_name ||
      firstDoc.document_summary?.patient_name ||
      documentData.patient_name ||
      "Unknown Patient"
    );
  };

  const documentGroups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .map((doc, docIndex) => {
        const docId = doc.document_id || `doc_${docIndex}`;

        const longSummary = doc.whats_new?.long_summary || "";
        const shortSummary = doc.whats_new?.short_summary || "";
        const caseContext = doc.brief_summary || "";

        // Fallback to legacy brief_summary if no short summary
        const fallbackShortSummary = doc.brief_summary || "";

        const consultingDoctor =
          doc.body_part_snapshots?.[0]?.consultingDoctor || 
          doc.consulting_doctor ||
          doc.document_summary?.consulting_doctor ||
          "Not specified";

        const documentType = doc.document_summary?.type || 
                            doc.document_type || 
                            "Unknown";

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
          task_quick_notes: doc.task_quick_notes || [],
          docMode: doc.mode,

          patientName: getPatientName(),
          briefSummary: doc.brief_summary || "",
        };
      })
      .filter((group) => {
        if (!group.shortSummary) return false;
        if (mode && group.docMode) {
          return group.docMode === mode;
        }
        return true;
      });
  }, [documentData?.documents, mode]);

  const formatLongSummary = (summary: string): string => {
    if (!summary) return "";

    let formatted = summary
      .replace(/[\[\]"]/g, "")
      .replace(/'/g, "")
      .replace(/\{/g, "")
      .replace(/\}/g, "");

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

  const renderFormattedSummary = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
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

      return (
        <div key={index} style={{ marginBottom: "8px" }}>
          {line}
        </div>
      );
    });
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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
        `http://localhost:8000/api/documents/preview/${encodeURIComponent(
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

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
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
        patientName: group.patientName,
        doctorName: group.consultingDoctor,
        briefSummary: group.shortSummary,
      });
    }
  };

  const handleViewSummaryClick = (group: any) => {
    const summaryToShow = group.briefSummary || group.shortSummary;
    if (summaryToShow) {
      setSelectedSummary({
        type: group.documentType,
        date: group.reportDate,
        summary: summaryToShow,
        patientName: group.patientName,
        doctorName: group.consultingDoctor,
        isBriefOnly: true,
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
                const formattedDate = formatDisplayDate(group.reportDate);

                return (
                  <div key={group.docId} className="whats-new-bullet-item">
                    {/* Report Heading */}
                    <div className="report-heading">
                      {group.documentType} Report for {group.patientName} by Dr. {group.consultingDoctor} ({formattedDate})
                    </div>
                    
                    {/* Bullet point with summary */}
                    <div className="bullet-content">
                      <div className="bullet-marker">•</div>
                      <div className="bullet-text">
                        <span className="summary-text">
                          {group.shortSummary}
                        </span>

                        {/* Buttons with border like screenshot */}
                        <div className="action-buttons">
                          {group.longSummary && (
                            <button
                              onClick={() => handleReadMoreClick(group)}
                              className="action-btn read-more-btn"
                              title="Read more"
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
                            View brief summary
                          </button>

                          <button
                            className={`action-link mark-viewed-link ${isViewed ? "viewed" : ""
                              } ${isLoading ? "loading" : ""}`}
                            onClick={(e) => handleMarkViewed(e, group)}
                            disabled={isLoading}
                            title="Mark as Reviewed"
                          >
                            {isLoading ? "Loading..." : isViewed ? "Reviewed" : "Mark Reviewed"}
                          </button>

                          <button
                            className="action-btn preview-btn"
                            onClick={(e) => handlePreviewClick(e, group.doc)}
                            disabled={isPreviewLoading}
                            title="Preview Document"
                          >
                            {isPreviewLoading ? "Loading..." : "Preview"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Notes */}
                    {group.task_quick_notes &&
                      group.task_quick_notes.length > 0 && (() => {
                        // Filter out notes with empty details, one_line_note, and status_update
                        const validNotes = group.task_quick_notes.filter(
                          (note: any) =>
                            note.details?.trim() ||
                            note.one_line_note?.trim() ||
                            note.status_update?.trim()
                        );

                        if (validNotes.length === 0) return null;

                        return (
                          <div className="quick-notes-section">
                            <div className="quick-notes-header">Quick Notes:</div>
                            <div className="quick-notes-list">
                              {validNotes.map(
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
                        );
                      })()}

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

      {selectedSummary && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Detailed Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">
              {selectedSummary?.summary}
            </p>
            <button
              onClick={() => setSelectedSummary(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>}

      {selectedCaseContext && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Brief Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">
              {selectedCaseContext?.context}
            </p>
            <button
              onClick={() => setSelectedCaseContext(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>}

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
          gap: 12px;
        }
        .whats-new-bullet-item {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background-color: #f9fafb;
        }
        .report-heading {
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
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
          margin-top: 1px;
        }
        .bullet-text {
          flex: 1;
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
          margin-bottom: 8px;
          display: block;
        }
        .action-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .action-btn {
          background: white;
          border: 1px solid #d1d5db;
          padding: 4px 10px;
          font-size: 11px;
          cursor: pointer;
          color: #4b5563;
          border-radius: 4px;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
          font-family: inherit;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
          color: #374151;
        }
        .action-btn:active:not(:disabled) {
          background: #f3f4f6;
          transform: translateY(1px);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #e5e7eb;
          background: #f9fafb;
        }
        .read-more-btn {
          color: #1e40af;
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .read-more-btn:hover:not(:disabled) {
          background: #dbeafe;
          border-color: #60a5fa;
          color: #1e3a8a;
        }
<<<<<<< HEAD
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
=======
        .view-summary-btn {
          color: #065f46;
          border-color: #a7f3d0;
>>>>>>> 5c0a3a6 (set the ui)
          background: #ecfdf5;
        }
        .view-summary-btn:hover:not(:disabled) {
          background: #d1fae5;
          border-color: #34d399;
          color: #064e3b;
        }
        .copy-btn {
          color: #7c3aed;
          border-color: #ddd6fe;
          background: #f5f3ff;
        }
        .copy-btn:hover:not(:disabled) {
          background: #ede9fe;
          border-color: #c4b5fd;
          color: #6d28d9;
        }
        .copy-btn.copied {
          color: #059669;
          border-color: #a7f3d0;
          background: #d1fae5;
        }
        .mark-viewed-btn {
          color: #dc2626;
          border-color: #fecaca;
          background: #fef2f2;
        }
        .mark-viewed-btn:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #b91c1c;
        }
        .mark-viewed-btn.viewed {
          color: #059669;
          border-color: #a7f3d0;
          background: #d1fae5;
        }
        .mark-viewed-btn.viewed:hover:not(:disabled) {
          background: #a7f3d0;
          border-color: #34d399;
          color: #047857;
        }
        .mark-viewed-btn.loading {
          color: #6b7280;
          border-color: #d1d5db;
          background: #f9fafb;
        }
        .preview-btn {
          color: #ea580c;
          border-color: #fed7aa;
          background: #fff7ed;
        }
        .preview-btn:hover:not(:disabled) {
          background: #ffedd5;
          border-color: #fdba74;
          color: #c2410c;
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
        /* Icon size classes */
        .icon-sm {
          width: 12px;
          height: 12px;
        }
        .icon-xs {
          width: 10px;
          height: 10px;
        }
        /* Quick Notes Styles */
        .quick-notes-section {
          margin-top: 12px;
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