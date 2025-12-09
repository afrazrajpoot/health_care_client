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
  FileTextIcon,
  CalendarIcon,
  UserIcon,
  StethoscopeIcon,
  BookOpenIcon,
  FileText,
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
  DialogFooter,
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
  patientAge?: number;
  injuryDate?: string;
  claimNumber?: string;
  documentType?: string;
  isLongSummary?: boolean;
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

  const calculateAge = (dob: string): number | undefined => {
    if (!dob) return undefined;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return undefined;
    }
  };

  const documentGroups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .map((doc, docIndex) => {
        const docId = doc.document_id || `doc_${docIndex}`;

        const longSummary = doc.whats_new?.long_summary || "";
        const shortSummary = doc.whats_new?.short_summary || "";
        const fallbackShortSummary = doc.brief_summary || "";

        const consultingDoctor =
          doc.body_part_snapshots?.[0]?.consultingDoctor || 
          doc.consulting_doctor ||
          doc.document_summary?.consulting_doctor ||
          "Not specified";

        const documentType = doc.document_summary?.type || 
                            doc.document_type || 
                            "Unknown";

        const patientAge = calculateAge(doc.dob || documentData.dob);
        const injuryDate = doc.doi || documentData.doi;
        const claimNumber = doc.claim_number || documentData.claim_number;

        return {
          docId,
          originalDocId: docId,
          documentIndex: doc.document_index || docIndex + 1,
          isLatest: doc.is_latest || false,
          reportDate: doc.report_date || doc.created_at || "",
          longSummary,
          shortSummary: shortSummary || fallbackShortSummary,
          briefSummary: doc.brief_summary || "",
          contentType: "summaries",
          doc,
          status: doc.status || "pending",
          consultingDoctor,
          documentType,
          task_quick_notes: doc.task_quick_notes || [],
          docMode: doc.mode,
          patientName: getPatientName(),
          patientAge,
          injuryDate,
          claimNumber,
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

  const renderFormattedSummary = (text: string) => {
    if (!text) return <div className="no-summary">No summary available</div>;
    
    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (line.includes("**") && line.includes("**")) {
        const parts = line.split("**");
        return (
          <div key={index} className="summary-line">
            {parts.map((part, partIndex) =>
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="summary-heading">{part}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </div>
        );
      }

      return (
        <div key={index} className="summary-line">
          {line}
        </div>
      );
    });
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
    const formattedSummary = formatLongSummary(group.longSummary || group.briefSummary || "");
    setSelectedSummary({
      type: group.documentType,
      date: group.reportDate,
      summary: formattedSummary,
      patientName: group.patientName,
      doctorName: group.consultingDoctor,
      briefSummary: group.briefSummary,
      patientAge: group.patientAge,
      injuryDate: group.injuryDate,
      claimNumber: group.claimNumber,
      documentType: group.documentType,
      isLongSummary: true,
    });
  };

  const handleViewSummaryClick = (group: any) => {
    setSelectedSummary({
      type: group.documentType,
      date: group.reportDate,
      summary: group.briefSummary || "",
      patientName: group.patientName,
      doctorName: group.consultingDoctor,
      briefSummary: group.briefSummary,
      patientAge: group.patientAge,
      injuryDate: group.injuryDate,
      claimNumber: group.claimNumber,
      documentType: group.documentType,
      isLongSummary: false,
    });
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
                              title="Read detailed summary"
                            >
                              Read more
                            </button>
                          )}

                          <button
                            onClick={() => handleViewSummaryClick(group)}
                            className="action-btn view-summary-btn"
                            title="View brief summary"
                          >
                            View brief summary
                          </button>

                          <button
                            className={`action-btn copy-btn ${
                              isGroupCopied ? "copied" : ""
                            }`}
                            onClick={(e) => handleCopyClick(e, group.docId)}
                            title="Copy Macro"
                          >
                            {isGroupCopied ? "Copied" : "Copy Macro"}
                          </button>

                          <button
                            className={`action-btn mark-viewed-btn ${
                              isViewed ? "viewed" : ""
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

      {/* Modal for Summary */}
      <Dialog
        open={!!selectedSummary}
        onOpenChange={() => setSelectedSummary(null)}
      >
        <DialogContent className="max-w-4xl h-[85vh] overflow-y-auto p-0">
          <div className="modal-header bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                {selectedSummary?.isLongSummary ? (
                  <BookOpenIcon className="h-6 w-6 text-blue-600" />
                ) : (
                  <FileText className="h-6 w-6 text-green-600" />
                )}
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {selectedSummary?.isLongSummary ? "Detailed Report Summary" : "Brief Report Summary"}
                </DialogTitle>
              </div>
              
              <div className="patient-info-grid">
                <div className="info-item">
                  <div className="info-label">
                    <UserIcon className="icon-sm mr-2" />
                    Patient Name
                  </div>
                  <div className="info-value">{selectedSummary?.patientName || "Not specified"}</div>
                </div>
                
                {selectedSummary?.patientAge && (
                  <div className="info-item">
                    <div className="info-label">Age</div>
                    <div className="info-value">{selectedSummary.patientAge} years</div>
                  </div>
                )}
                
                {selectedSummary?.injuryDate && (
                  <div className="info-item">
                    <div className="info-label">
                      <CalendarIcon className="icon-sm mr-2" />
                      Date of Injury
                    </div>
                    <div className="info-value">{formatDisplayDate(selectedSummary.injuryDate)}</div>
                  </div>
                )}
                
                {selectedSummary?.claimNumber && (
                  <div className="info-item">
                    <div className="info-label">Claim #</div>
                    <div className="info-value font-mono">{selectedSummary.claimNumber}</div>
                  </div>
                )}
                
                <div className="info-item">
                  <div className="info-label">
                    <StethoscopeIcon className="icon-sm mr-2" />
                    Consulting Physician
                  </div>
                  <div className="info-value">Dr. {selectedSummary?.doctorName || "Not specified"}</div>
                </div>
                
                {selectedSummary?.date && (
                  <div className="info-item">
                    <div className="info-label">Report Date</div>
                    <div className="info-value">{formatDisplayDate(selectedSummary.date)}</div>
                  </div>
                )}
              </div>
            </DialogHeader>
          </div>

          <div className="modal-body p-6">
            <div className="summary-section">
              <h3 className="summary-title">
                {selectedSummary?.isLongSummary ? (
                  <>
                    <BookOpenIcon className="icon-sm mr-2" />
                    Detailed Summary
                  </>
                ) : (
                  <>
                    <FileTextIcon className="icon-sm mr-2" />
                    Brief Summary
                  </>
                )}
              </h3>
              <div className="summary-content">
                {selectedSummary?.summary ? (
                  <div className={`summary-text ${selectedSummary?.isLongSummary ? 'detailed-summary-text' : 'brief-summary-text'}`}>
                    {selectedSummary?.isLongSummary ? (
                      renderFormattedSummary(selectedSummary.summary)
                    ) : (
                      selectedSummary.summary
                    )}
                  </div>
                ) : (
                  <div className="no-summary">
                    No {selectedSummary?.isLongSummary ? "detailed" : "brief"} summary available for this document.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer border-t bg-gray-50 p-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedSummary(null)}
              className="mr-3"
            >
              Close
            </Button>
            {selectedSummary?.summary && (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(selectedSummary.summary || "");
                  toast.success("Summary copied to clipboard");
                }}
                className={`${selectedSummary?.isLongSummary ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy Summary
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .section {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          border-left: 4px solid #10b981;
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
          background: transparent;
          border: 1px solid #d1d5db;
          padding: 4px 10px;
          font-size: 11px;
          cursor: pointer;
          color: black;
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
          background: #f3f4f6;
        }
        .action-btn:active:not(:disabled) {
          background: #e5e7eb;
          transform: translateY(1px);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #d1d5db;
          color: #9ca3af;
        }
        /* Removed colorful variants to match "not color full" request */
        .read-more-btn,
        .view-summary-btn,
        .copy-btn,
        .mark-viewed-btn,
        .preview-btn {
          /* Inherit base styles */
        }
        
        .copy-btn.copied {
          background: #f0fdf4;
          border-color: #16a34a;
          color: #16a34a;
        }
        
        .mark-viewed-btn.viewed {
          background: #f0fdf4;
          border-color: #16a34a;
          color: #16a34a;
        }
        .no-items {
          font-size: 12px;
          line-height: 1.3;
          color: #6b7280;
          text-align: center;
          padding: 16px;
          font-style: italic;
        }
        
        /* Modal Styles */
        .modal-header {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .patient-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }
        
        .info-item {
          padding: 8px 0;
        }
        
        .info-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .summary-section {
          margin-bottom: 24px;
        }
        
        .summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #3b82f6;
          display: flex;
          align-items: center;
        }
        
        .summary-content {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }
        
        .brief-summary-text {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
        }
        
        .detailed-summary-text {
          font-size: 13px;
          line-height: 1.5;
          color: #4b5563;
        }
        
        .summary-line {
          margin-bottom: 12px;
        }
        
        .summary-heading {
          color: #1e40af;
          font-weight: 600;
        }
        
        .no-summary {
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
        
        .modal-footer {
          border-top: 1px solid #e5e7eb;
        }
        
        .icon-sm {
          width: 14px;
          height: 14px;
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