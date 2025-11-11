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
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(
    new Set()
  );
  const { data: session } = useSession();
  const { formatDate } = useWhatsNewData(documentData);

  // Transform the new whats_new structure - GROUPED BY DOCUMENT ID
  const documentGroups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .map((doc, docIndex) => {
        const docId = doc.document_id || `doc_${docIndex}`;

        // whats_new is now an array of bullet point strings
        const bulletPoints = doc.whats_new || [];

        // Filter out empty bullet points
        const validBulletPoints = bulletPoints.filter(
          (bullet: string) =>
            bullet &&
            typeof bullet === "string" &&
            bullet.trim() &&
            bullet.trim() !==
              "• No significant new findings identified in current document"
        );

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
          reportDate: doc.created_at || "",
          bulletPoints: validBulletPoints,
          doc, // Full document object for additional info
          status: doc.status || "pending",
          consultingDoctor,
          documentType,
        };
      })
      .filter((group) => group.bulletPoints.length > 0); // Only show documents with bullet points
  }, [documentData?.documents]);

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
    if (
      !group ||
      !Array.isArray(group.bulletPoints) ||
      group.bulletPoints.length === 0
    ) {
      toast.error("No items found to copy", {
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    const textToCopy = `These findings have been reviewed by Physician\n${group.bulletPoints.join(
      "\n"
    )}`;

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
            <div className="whats-new-container">
              {documentGroups.map((group, groupIndex) => {
                const isViewed = isGroupViewed(group.docId);
                const isGroupCopied = copied[`whatsnew-${group.docId}`];
                const isLoading = isLoadingForGroup(group);
                const isPreviewLoading = isPreviewLoadingForGroup(group);

                return (
                  <div key={group.docId} className="whats-new-item">
                    {/* Group Header: Show document info */}
                    <div className="group-header">
                      <div className="group-actions">
                        <button
                          className={`copy-btn text-[0.3vw] ${
                            isGroupCopied ? "copied" : ""
                          }`}
                          onClick={(e) => handleCopyClick(e, group.docId)}
                          title="Copy This Update"
                        >
                          {isGroupCopied ? (
                            <CheckIcon className="icon-xxs text-[0.4vw]" />
                          ) : (
                            <CopyIcon className="icon-xxs text-[0.4vw]" />
                          )}
                        </button>
                        <button
                          className={`mark-viewed-btn ${
                            isViewed ? "viewed" : ""
                          } ${isLoading ? "loading" : ""}`}
                          onClick={(e) => handleMarkViewed(e, group)}
                          disabled={isLoading}
                          title={isViewed ? "Reviewed" : "Mark as Reviewed"}
                        >
                          {isLoading ? (
                            <Loader2 className="icon-xxs animate-spin" />
                          ) : isViewed ? (
                            "Reviewed"
                          ) : (
                            "Mark as Reviewed"
                          )}
                        </button>
                        <button
                          className="preview-btn"
                          onClick={(e) => handlePreviewClick(e, group.doc)}
                          disabled={isPreviewLoading}
                          title="Preview Document"
                        >
                          {isPreviewLoading ? (
                            <Loader2 className="icon-xxs animate-spin" />
                          ) : (
                            "Preview"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Display bullet points */}
                    <div className="bullet-points-container">
                      <ul className="bullet-points-list">
                        {group.bulletPoints.map(
                          (bullet: string, index: number) => (
                            <li key={index} className="bullet-point-item">
                              {bullet}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
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
        .whats-new-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          overflow: hidden;
        }
        .whats-new-item {
          padding: 10px;
          // border-bottom: 1px solid #e5e7eb;
        }
        .whats-new-item:last-child {
          border-bottom: none;
        }
        ul {
          margin: 0;
          padding-left: 0;
          list-style-type: none;
        }
        .separated-item {
          margin-top: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: #fafbfc;
        }
        .separated-item:first-child {
          margin-top: 0;
        }
        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 3px;
          margin-bottom: 3px;
          padding-bottom: 4px;
        }
        .group-info {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          flex-wrap: wrap;
        }
        .doc-type {
          color: #1f2937;
          background: #e0f2fe;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .doc-latest {
          color: #059669;
          font-size: 12px;
          background: #ecfdf5;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .doc-doctor {
          color: #6b21a8;
          font-size: 12px;
          background: #ede9fe;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .doc-date {
          color: #6b7280;
          font-size: 12px;
          font-style: italic;
        }
        .group-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .bullet-points-container {
          margin-top: 8px;
        }
        .bullet-points-list {
          margin: 0;
          padding-left: 0;
        }
        .bullet-point-item {
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
          margin-bottom: 8px;
          padding-left: 16px;
          position: relative;
        }
        .bullet-point-item:before {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        .bullet-point-item:last-child {
          margin-bottom: 0;
        }
        .no-items {
          font-size: 14px;
          line-height: 1.4;
          color: #6b7280;
          text-align: center;
          padding: 20px;
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
        .copy-btn,
        .mark-viewed-btn,
        .preview-btn {
          background: #e2e8f0;
          border: none;
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #475569;
        }
        .copy-btn {
          padding: 2px 2px;
          font-size: 9px;
        }
        .copy-btn:hover,
        .preview-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }
        .copy-btn.copied {
          background: #dcfce7;
          color: #166534;
        }
        .preview-btn {
          padding: 4px 8px;
          font-size: 12px;
        }
        .mark-viewed-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }
        .mark-viewed-btn:disabled,
        .preview-btn:disabled {
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
