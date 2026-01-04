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
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Types for new structured short summary response
interface SummaryFinding {
  label: string;
  value: string;
  indicator: "danger" | "warning" | "normal";
}

interface SummaryRecommendation {
  label: string;
  value: string;
}

interface SummaryStatus {
  label: string;
  value: string;
}

interface SummaryHeader {
  title: string;
  source_type: string;
  author: string;
  date: string;
  disclaimer: string;
}

interface StructuredShortSummary {
  header: SummaryHeader;
  summary: {
    findings: SummaryFinding[];
    recommendations: SummaryRecommendation[];
    status: SummaryStatus[];
  };
}

interface WhatsNewSectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  mode?: string;
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
  const [expandedLongSummary, setExpandedLongSummary] = useState<string | null>(
    null
  );
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());
  const [briefSummaryModalOpen, setBriefSummaryModalOpen] = useState(false);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState<string>("");
  const [selectedLongSummary, setSelectedLongSummary] = useState<string>("");
  const [selectedDocumentInfo, setSelectedDocumentInfo] = useState<{
    patientName?: string;
    reportDate?: string;
    documentType?: string;
  } | null>(null);
  const [isBriefSummaryExpanded, setIsBriefSummaryExpanded] = useState(false);
  const [isLongSummaryExpanded, setIsLongSummaryExpanded] = useState(false);
  const { data: session } = useSession();
  const { formatDate } = useWhatsNewData(documentData);

  // Patient Intake Submissions state
  const [intakeSubmissions, setIntakeSubmissions] = useState<any[]>([]);
  const [intakesExpanded, setIntakesExpanded] = useState(false);
  const [loadingIntakes, setLoadingIntakes] = useState(false);

  // Fetch patient intake submissions
  useEffect(() => {
    const fetchIntakeSubmissions = async () => {
      if (!documentData?.patient_name) return;

      setLoadingIntakes(true);
      try {
        const params = new URLSearchParams({
          patientName: documentData.patient_name,
        });
        if (documentData.dob) {
          params.append("dob", documentData.dob.split("T")[0]);
        }
        if (
          documentData.claim_number &&
          documentData.claim_number !== "Not specified"
        ) {
          params.append("claimNumber", documentData.claim_number);
        }

        const response = await fetch(`/api/patient-intakes?${params}`);
        if (response.ok) {
          const data = await response.json();
          setIntakeSubmissions(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching intake submissions:", error);
      } finally {
        setLoadingIntakes(false);
      }
    };

    fetchIntakeSubmissions();
  }, [
    documentData?.patient_name,
    documentData?.dob,
    documentData?.claim_number,
  ]);

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
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    } catch {
      return undefined;
    }
  };

  // Function to safely render HTML content
  const renderSummaryWithHTML = (text: string, isInModal: boolean = false) => {
    if (!text) return <span>No summary available</span>;

    // Check if text contains HTML tags
    const hasHTML = /<[^>]*>/.test(text);

    if (hasHTML) {
      // Sanitize HTML (basic sanitization - consider using DOMPurify for production)
      const sanitizedHTML = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:/gi, "");

      return (
        <span
          className={`summary-text ${
            isInModal ? "modal-summary" : "inline-summary"
          }`}
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }

    return <span className="summary-text">{text}</span>;
  };

  // Get indicator color based on type
  const getIndicatorColor = (indicator: string): string => {
    switch (indicator) {
      case "danger":
        return "#ef4444"; // Red
      case "warning":
        return "#f59e0b"; // Amber/Yellow
      case "normal":
        return "#22c55e"; // Green
      default:
        return "#6b7280"; // Gray
    }
  };

  // Get indicator icon based on type
  const getIndicatorIcon = (indicator: string) => {
    switch (indicator) {
      case "danger":
        return (
          <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} />
        );
      case "warning":
        return (
          <AlertTriangle
            size={18}
            style={{ color: "#d97706", flexShrink: 0 }}
          />
        );
      case "normal":
        return (
          <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
        );
      default:
        return (
          <Activity size={18} style={{ color: "#6b7280", flexShrink: 0 }} />
        );
    }
  };

  // Get indicator text color based on type
  const getIndicatorTextColor = (indicator: string): string => {
    switch (indicator) {
      case "danger":
        return "#dc2626"; // Red
      case "warning":
        return "#d97706"; // Amber
      case "normal":
        return "#16a34a"; // Green
      default:
        return "#374151"; // Gray
    }
  };

  // Render structured short summary with clean, professional UI
  const renderStructuredShortSummary = (summary: StructuredShortSummary) => {
    const { header, summary: summaryContent } = summary;

    return (
      <div className="structured-summary">
        {/* Header Section */}
        <div className="summary-header-block">
          <div className="summary-title-row">
            <span className="summary-doc-title">{header.title}</span>
          </div>
          <div className="summary-meta-row">
            <span className="summary-source-badge">{header.source_type}</span>
            {header.date && (
              <span className="summary-date-text">• {header.date}</span>
            )}
          </div>
        </div>

        {/* Findings Section */}
        {summaryContent.findings && summaryContent.findings.length > 0 && (
          <div className="summary-block">
            <div className="summary-block-header">
              <ClipboardList size={14} style={{ color: "#6b7280" }} />
              <span>FINDINGS (REFERENCED FROM EXTERNAL RECORDS)</span>
            </div>
            <div className="findings-list">
              {summaryContent.findings.map((finding, idx) => (
                <div key={idx} className="finding-row">
                  <span className="finding-icon-wrapper">
                    {getIndicatorIcon(finding.indicator)}
                  </span>
                  <span
                    className="finding-text"
                    style={{
                      color: getIndicatorTextColor(finding.indicator),
                      fontWeight: 600,
                    }}
                  >
                    {finding.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {summaryContent.recommendations &&
          summaryContent.recommendations.length > 0 && (
            <div className="summary-block">
              <div className="summary-block-header">
                <Activity size={14} style={{ color: "#6b7280" }} />
                <span>RECOMMENDED ACTIONS (WORKFLOW)</span>
              </div>
              <div className="recommendations-list">
                {summaryContent.recommendations.map((rec, idx) => (
                  <div key={idx} className="recommendation-row">
                    <ChevronRightIcon
                      size={16}
                      style={{ color: "#3b82f6", flexShrink: 0 }}
                    />
                    <span className="recommendation-text">{rec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Status Section */}
        {summaryContent.status && summaryContent.status.length > 0 && (
          <div className="summary-block">
            <div className="summary-block-header">
              <CheckCircle2 size={14} style={{ color: "#6b7280" }} />
              <span>STATUS</span>
            </div>
            <div className="status-pills-row">
              {summaryContent.status.map((status, idx) => (
                <span key={idx} className="status-badge">
                  {status.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {header.disclaimer && (
          <div className="summary-disclaimer-text">{header.disclaimer}</div>
        )}
      </div>
    );
  };

  // Function to format long summary with colors
  const formatLongSummaryWithColors = (summary: string): string => {
    if (!summary) return "";

    let formatted = summary
      .replace(/[\[\]"]/g, "")
      .replace(/'/g, "")
      .replace(/\{/g, "")
      .replace(/\}/g, "");

    // Enhance formatting with colors for specific sections
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
      .replace(/(--------------------------------------------------)/g, "---");

    return formatted;
  };

  // Helper function to parse short summary - handles both string and structured object
  const parseShortSummary = (
    shortSummary: any
  ): StructuredShortSummary | string | null => {
    if (!shortSummary) return null;

    // If it's already an object with the expected structure
    if (
      typeof shortSummary === "object" &&
      shortSummary.header &&
      shortSummary.summary
    ) {
      return shortSummary as StructuredShortSummary;
    }

    // If it's a string, try to parse it as JSON
    if (typeof shortSummary === "string") {
      try {
        const parsed = JSON.parse(shortSummary);
        if (parsed.header && parsed.summary) {
          return parsed as StructuredShortSummary;
        }
      } catch {
        // Not JSON, return as plain string
        return shortSummary;
      }
    }

    return shortSummary;
  };

  // Helper to check if summary is structured
  const isStructuredSummary = (
    summary: any
  ): summary is StructuredShortSummary => {
    return (
      summary &&
      typeof summary === "object" &&
      summary.header &&
      summary.summary
    );
  };

  const documentGroups = useMemo(() => {
    if (!documentData?.documents) return [];

    return documentData.documents
      .map((doc, docIndex) => {
        const docId = doc.document_id || `doc_${docIndex}`;

        const longSummary = doc.whats_new?.long_summary || "";
        const rawShortSummary = doc.whats_new?.short_summary;
        const parsedShortSummary = parseShortSummary(rawShortSummary);
        const fallbackShortSummary = doc.brief_summary || "";

        const consultingDoctor =
          doc.body_part_snapshots?.[0]?.consultingDoctor ||
          doc.consulting_doctor ||
          doc.document_summary?.consulting_doctor ||
          "Not specified";

        const documentType =
          doc.document_summary?.type || doc.document_type || "Unknown";

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
          shortSummary: parsedShortSummary || fallbackShortSummary,
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

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not provided";
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return "Not provided";
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
                <strong key={partIndex} className="summary-heading">
                  {part}
                </strong>
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

    let textToCopy = "";

    // Handle structured summary
    if (isStructuredSummary(group.shortSummary)) {
      const { header, summary: summaryContent } = group.shortSummary;

      let parts: string[] = [];
      parts.push(`📋 ${header.title}`);
      parts.push(`Source: ${header.source_type} • ${header.date}`);
      parts.push("");

      if (summaryContent.findings?.length > 0) {
        parts.push("FINDINGS:");
        summaryContent.findings.forEach((f: SummaryFinding) => {
          const indicator =
            f.indicator === "danger"
              ? "🔴"
              : f.indicator === "warning"
              ? "🟡"
              : "🟢";
          parts.push(`${indicator} ${f.value}`);
        });
        parts.push("");
      }

      if (summaryContent.recommendations?.length > 0) {
        parts.push("RECOMMENDATIONS:");
        summaryContent.recommendations.forEach((r: SummaryRecommendation) => {
          parts.push(`• ${r.value}`);
        });
        parts.push("");
      }

      if (summaryContent.status?.length > 0) {
        parts.push("STATUS:");
        summaryContent.status.forEach((s: SummaryStatus) => {
          parts.push(`• ${s.value}`);
        });
        parts.push("");
      }

      parts.push("These findings have been reviewed by Physician");
      textToCopy = parts.join("\n");
    } else {
      // Handle string summary - Remove HTML tags when copying to clipboard
      const cleanText =
        typeof group.shortSummary === "string"
          ? group.shortSummary.replace(/<[^>]*>/g, "")
          : "";
      textToCopy =
        `📋 Brief Summary:\n${cleanText}\n\n` +
        `These findings have been reviewed by Physician`;
    }

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

  const handleReadMoreClick = (e: React.MouseEvent, group: any) => {
    e.preventDefault();
    e.stopPropagation();
    // Toggle the expanded state for this card
    if (expandedLongSummary === group.docId) {
      setExpandedLongSummary(null);
    } else {
      setExpandedLongSummary(group.docId);
      // Ensure the details element is open
      setOpenCards((prev) => new Set([...prev, group.docId]));
    }
  };

  const handleBriefSummaryClick = (e: React.MouseEvent, group: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (group.briefSummary || group.longSummary) {
      setSelectedBriefSummary(group.briefSummary || "");
      setSelectedLongSummary(group.longSummary || "");
      setSelectedDocumentInfo({
        patientName: group.patientName || documentData?.patient_name,
        reportDate: group.reportDate,
        documentType: group.documentType,
      });
      setBriefSummaryModalOpen(true);
      setIsBriefSummaryExpanded(false);
      setIsLongSummaryExpanded(false);
    } else {
      toast.error("Summary not available for this document", {
        duration: 3000,
        position: "top-right",
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

  // Extract meaningful document title from short summary (text before first pipe or from structured header)
  const extractDocumentTitle = (
    shortSummary: string | StructuredShortSummary,
    fallbackType: string
  ): string => {
    if (!shortSummary) return fallbackType || "Document";

    // Handle structured summary
    if (isStructuredSummary(shortSummary)) {
      return shortSummary.header?.title || fallbackType || "Document";
    }

    // Handle string summary
    if (typeof shortSummary === "string") {
      // Split by pipe and get the first part
      const firstPart = shortSummary.split("|")[0]?.trim();

      // If we got a meaningful title, use it; otherwise fall back to document type
      if (firstPart && firstPart.length > 0 && firstPart.length < 100) {
        // Remove any HTML tags that might be present
        return (
          firstPart.replace(/<[^>]*>/g, "").trim() || fallbackType || "Document"
        );
      }
    }

    return fallbackType || "Document";
  };

  const handleCopyAllReports = (e: React.MouseEvent) => {
    e.stopPropagation();

    const reportNames = documentGroups
      .map((group) => {
        const formattedDate = formatDisplayDate(group.reportDate);
        return `${group.documentType} Report for ${group.patientName} by  ${group.consultingDoctor} (${formattedDate})`;
      })
      .join("\n");

    const textToCopy = `The following external data was reviewed and incorporated into the current patient's treatment plan, including:\n\n${reportNames}`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("All reports copied to clipboard"))
      .catch(() => toast.error("Failed to copy reports"));
  };

  return (
    <>
      {!isCollapsed && (
        <div className="section-content">
          <div className="whats-new-list">
            {documentGroups.map((group, groupIndex) => {
              const isViewed = isGroupViewed(group.docId);
              const isGroupCopied = copied[`whatsnew-${group.docId}`];
              const isLoading = isLoadingForGroup(group);
              const isPreviewLoading = isPreviewLoadingForGroup(group);
              const formattedDate = formatDisplayDate(group.reportDate);

              // Get icon based on document type
              const getIcon = () => {
                const type = (group.documentType || "").toLowerCase();
                if (type.includes("mri")) return "📘";
                if (type.includes("emg") || type.includes("ncs")) return "⚡";
                if (type.includes("ortho")) return "🩺";
                if (type.includes("pt") || type.includes("physical therapy"))
                  return "�";
                return "📘";
              };

              // Extract key findings from summary for pills
              const extractPills = (
                summary: string | StructuredShortSummary
              ) => {
                if (!summary) return [];

                // Handle structured summary
                if (isStructuredSummary(summary)) {
                  return (
                    summary.summary.findings?.slice(0, 3).map((f) => f.label) ||
                    []
                  );
                }

                // Handle string summary
                if (typeof summary === "string") {
                  const pills: string[] = [];
                  const lines = summary.split("\n").slice(0, 3);
                  lines.forEach((line) => {
                    const words = line.split(" ").slice(0, 3).join(" ");
                    if (words.length > 0 && words.length < 30) {
                      pills.push(words);
                    }
                  });
                  return pills.slice(0, 3);
                }

                return [];
              };

              const pills = extractPills(group.shortSummary || "");

              return (
                <details
                  key={group.docId}
                  className="card"
                  open={openCards.has(group.docId)}
                  onToggle={(e) => {
                    const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                    if (isOpen) {
                      // Accordion behavior: close all others, open only this one
                      setOpenCards(new Set([group.docId]));
                      // Also collapse any expanded long summary from other cards
                      if (
                        expandedLongSummary &&
                        expandedLongSummary !== group.docId
                      ) {
                        setExpandedLongSummary(null);
                      }
                    } else {
                      // Closing this card
                      setOpenCards((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(group.docId);
                        return newSet;
                      });
                      // If closing, also collapse long summary if it was expanded
                      if (expandedLongSummary === group.docId) {
                        setExpandedLongSummary(null);
                      }
                    }
                  }}
                >
                  <summary>
                    <div className="icon">{getIcon()}</div>
                    <div className="main">
                      <div className="row1">
                        <div className="left">
                          <div className="flex items-center gap-2">
                            {extractDocumentTitle(
                              group.shortSummary,
                              group.documentType
                            )}
                            <div className="sub">
                              {/* {group.consultingDoctor || "Unknown"} */}•{" "}
                              {formattedDate}
                            </div>
                          </div>
                        </div>
                        <div className="cta">
                          <span
                            className="doc-pill"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePreviewClick(e, group.doc);
                            }}
                          >
                            📄 View Original
                          </span>
                        </div>
                      </div>
                      {/* <div className="scanline">
                        {pills.map((pill, idx) => (
                          <span
                            key={idx}
                            className={idx === 0 ? "pill" : "pill gray"}
                          >
                            {pill}
                          </span>
                        ))}
                      </div> */}
                    </div>
                  </summary>
                  <div className="detail">
                    <div className="detail-grid">
                      {expandedLongSummary === group.docId &&
                      group.longSummary ? (
                        <div className="detail-box">
                          <div className="label">Long Summary</div>
                          <div className="text long">
                            {renderFormattedSummary(
                              formatLongSummaryWithColors(
                                group.longSummary || group.briefSummary || ""
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="detail-box">
                          <div className="label">Referenced Summary</div>
                          <div className="text long structured-summary-container">
                            {isStructuredSummary(group.shortSummary)
                              ? renderStructuredShortSummary(group.shortSummary)
                              : renderSummaryWithHTML(
                                  typeof group.shortSummary === "string"
                                    ? group.shortSummary
                                    : "",
                                  false
                                )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="actions">
                      {group.longSummary && (
                        <button
                          onClick={(e) => handleReadMoreClick(e, group)}
                          className="action-btn read-more-btn"
                          title={
                            expandedLongSummary === group.docId
                              ? "Show brief summary"
                              : "Read detailed summary"
                          }
                        >
                          {expandedLongSummary === group.docId
                            ? "Show brief"
                            : "Read more"}
                        </button>
                      )}

                      {(group.briefSummary || group.longSummary) && (
                        <button
                          onClick={(e) => handleBriefSummaryClick(e, group)}
                          className="action-btn brief-summary-btn"
                          title="View Document Summary"
                        >
                          Brief Summary
                        </button>
                      )}

                      <button
                        className={`action-btn copy-btn ${
                          isGroupCopied ? "copied" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopyClick(e, group.docId);
                        }}
                        title="Copy Macro"
                      >
                        {isGroupCopied ? "Copied" : "Copy Macro"}
                      </button>

                      <button
                        className={`action-btn mark-viewed-btn ${
                          isViewed ? "viewed" : ""
                        } ${isLoading ? "loading" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkViewed(e, group);
                        }}
                        disabled={isLoading}
                        title="Mark as Reviewed"
                      >
                        {isLoading
                          ? "Loading..."
                          : isViewed
                          ? "Reviewed"
                          : "Mark Reviewed"}
                      </button>

                      <button
                        className="action-btn preview-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePreviewClick(e, group.doc);
                        }}
                        disabled={isPreviewLoading}
                        title="Preview Document"
                      >
                        {isPreviewLoading ? "Loading..." : "Preview"}
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
            {documentGroups.length === 0 && (
              <div className="no-items">
                No significant changes since last visit
              </div>
            )}
          </div>

          {/* Patient Intake Submissions Section */}
        </div>
      )}

      <style jsx>{`
        .section {
          padding: 0;
          border: none;
        }
        .section-header {
          display: none;
        }
        .section-content {
          margin-top: 0;
        }
        .whats-new-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        /* Card styles from HTML */
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          margin: 0;
          overflow: hidden;
        }
        .card summary {
          list-style: none;
          cursor: pointer;
          padding: 10px 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .card summary::-webkit-details-marker {
          display: none;
        }
        .icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          font-size: 16px;
          flex: 0 0 34px;
        }
        .main {
          flex: 1;
          min-width: 0;
        }
        .row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .left {
          min-width: 0;
        }
        .t {
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sub {
          font-size: 12px;
          // color: var(--muted);
          margin-top: 2px;
        }
        .scanline {
          margin-top: 6px;
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pill {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 999px;
          background: var(--chip);
          color: var(--accent2);
          font-weight: 700;
        }
        .pill.gray {
          background: #f3f4f6;
          color: #374151;
          font-weight: 600;
        }
        .cta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex: 0 0 auto;
        }
        .doc-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: #fff;
          font-size: 12px;
          font-weight: 800;
          color: var(--accent2);
          cursor: pointer;
          white-space: nowrap;
        }
        .doc-pill:hover {
          background: var(--chip);
        }
        .detail {
          border-top: 1px solid var(--border);
          padding: 10px 12px;
          background: #fafafa;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .detail-box {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
        }
        .label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .text {
          font-size: 13px;
          margin-top: 6px;
          line-height: 1.35;
          color: #111827;
        }
        .long {
          max-height: none;
          overflow: visible;
          padding-right: 6px;
        }
        .structured-summary-container {
          max-height: none;
          overflow: visible;
        }

        /* Structured Summary Styles - Clean Professional UI */
        .structured-summary {
          padding: 0;
        }

        .summary-header-block {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-title-row {
          margin-bottom: 4px;
        }

        .summary-doc-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }

        .summary-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .summary-source-badge {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .summary-date-text {
          font-size: 11px;
          color: #9ca3af;
        }

        .summary-block {
          margin-bottom: 16px;
        }

        .summary-block-header {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .summary-block-header svg {
          display: block;
          flex-shrink: 0;
        }

        .block-header-icon {
          color: #9ca3af;
          display: flex;
          align-items: center;
        }

        .findings-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .finding-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .finding-row:last-child {
          border-bottom: none;
        }

        .finding-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          line-height: 1;
        }

        .finding-icon-wrapper svg {
          display: block;
        }

        .finding-text {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          display: flex;
          align-items: center;
        }

        .indicator-icon {
          flex-shrink: 0;
        }

        .indicator-icon.danger {
          color: #dc2626;
        }

        .indicator-icon.warning {
          color: #d97706;
        }

        .indicator-icon.normal {
          color: #16a34a;
        }

        .finding-text {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .recommendation-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
        }

        .recommendation-row svg {
          display: block;
          flex-shrink: 0;
        }

        .rec-bullet {
          flex-shrink: 0;
          color: #3b82f6;
          display: flex;
          align-items: center;
        }

        .recommendation-text {
          flex: 1;
          font-size: 14px;
          color: #374151;
          font-weight: 600;
          line-height: 1.4;
        }

        .status-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        .summary-disclaimer-text {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
          line-height: 1.5;
        }

        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        details[open] summary {
          background: #f9fafb;
        }
        details[open] .t {
          color: #0f172a;
        }
        .whats-new-list::-webkit-scrollbar {
          width: 8px;
        }
        .whats-new-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .whats-new-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          transition: background 0.2s;
        }
        .whats-new-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
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
        .summary-text-wrapper {
          font-size: 12px;
          line-height: 1.3;
          color: #374151;
          font-weight: 400;
          flex: 1;
          margin-bottom: 8px;
          display: block;
        }
        .summary-text {
          display: inline;
        }

        /* Comfortable, readable text with subtle background hints */
        .inline-summary :global(span[style*="color:yellow"]) {
          color: #374151 !important; /* Standard readable text color */
          font-weight: 500 !important;
          background-color: rgba(
            251,
            191,
            36,
            0.1
          ) !important; /* Very subtle yellow tint */
          padding: 1px 4px !important;
          border-radius: 3px !important;
          margin: 0 1px !important;
          display: inline-block !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
        }

        .inline-summary :global(span[style*="color:red"]) {
          color: #374151 !important; /* Standard readable text color */
          font-weight: 500 !important;
          background-color: rgba(
            252,
            165,
            165,
            0.1
          ) !important; /* Very subtle red tint */
          padding: 1px 4px !important;
          border-radius: 3px !important;
          margin: 0 1px !important;
          display: inline-block !important;
          font-size: 11px !important;
          line-height: 1.4 !important;
        }

        .modal-summary :global(span[style*="color:yellow"]) {
          color: #1f2937 !important; /* Slightly darker for better modal contrast */
          font-weight: 500 !important;
          background-color: rgba(
            251,
            191,
            36,
            0.15
          ) !important; /* Slightly more visible */
          padding: 2px 6px !important;
          border-radius: 4px !important;
          margin: 0 2px !important;
          display: inline-block !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
        }

        .modal-summary :global(span[style*="color:red"]) {
          color: #1f2937 !important; /* Slightly darker for better modal contrast */
          font-weight: 500 !important;
          background-color: rgba(
            252,
            165,
            165,
            0.15
          ) !important; /* Slightly more visible */
          padding: 2px 6px !important;
          border-radius: 4px !important;
          margin: 0 2px !important;
          display: inline-block !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
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

        /* Patient Intake Submissions Styles */
        .intake-submissions-section {
          margin-top: 16px;
          border: 1px solid #c7d2fe;
          border-radius: 8px;
          background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
          overflow: hidden;
        }
        .intake-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .intake-header:hover {
          background-color: rgba(99, 102, 241, 0.1);
        }
        .intake-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #4338ca;
        }
        .intake-list {
          border-top: 1px solid #c7d2fe;
          max-height: 400px;
          overflow-y: auto;
        }
        .intake-item {
          padding: 12px 14px;
          border-bottom: 1px solid #e0e7ff;
          background: white;
        }
        .intake-item:last-child {
          border-bottom: none;
        }
        .intake-item:hover {
          background: #f8fafc;
        }
        .intake-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .intake-date {
          font-size: 11px;
          font-weight: 600;
          color: #4338ca;
        }
        .intake-lang {
          font-size: 10px;
          padding: 2px 8px;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 12px;
        }
        .intake-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .intake-row {
          display: flex;
          gap: 8px;
          font-size: 11px;
          line-height: 1.4;
        }
        .intake-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 110px;
          flex-shrink: 0;
        }
        .intake-value {
          color: #374151;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .appt-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 10px;
          margin-right: 4px;
        }
        .therapy-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #f3e8ff;
          color: #7c3aed;
          border-radius: 4px;
          font-size: 10px;
          margin-right: 4px;
        }
        .therapy-badge.effect-much-better {
          background: #d1fae5;
          color: #059669;
        }
        .therapy-badge.effect-slightly-better {
          background: #fef3c7;
          color: #d97706;
        }
        .therapy-badge.effect-no-change {
          background: #f3f4f6;
          color: #6b7280;
        }
        .adl-status-better {
          color: #059669;
        }
        .adl-status-worse {
          color: #dc2626;
        }
        .adl-status-same {
          color: #6b7280;
        }
        .adl-list {
          font-weight: normal;
          color: #6b7280;
        }
        .loading-intakes {
          padding: 16px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          font-style: italic;
        }
        .brief-summary-btn {
          background: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
        .brief-summary-btn:hover {
          background: #e0f2fe;
          color: #075985;
        }

        /* Structured Summary Styles */
        .structured-summary-container {
          max-height: none;
          overflow: visible;
        }

        .structured-summary {
          font-size: 12px;
          line-height: 1.5;
        }

        .summary-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-header-title {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .summary-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #6b7280;
        }

        .summary-source {
          color: #3b82f6;
          font-weight: 500;
        }

        .summary-date {
          color: #9ca3af;
        }

        .summary-section {
          margin-bottom: 16px;
        }

        .summary-section-title {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .summary-findings {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .finding-item {
          display: flex;
          align-items: flex-start;
          padding: 8px 10px;
          border-left: 3px solid;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
          transition: all 0.2s ease;
        }

        .finding-item:hover {
          transform: translateX(2px);
        }

        .finding-value {
          color: #374151;
          flex: 1;
        }

        .summary-recommendations {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          padding: 8px 10px;
          border-left: 3px solid #3b82f6;
          background-color: #eff6ff;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
        }

        .recommendation-value {
          color: #374151;
          flex: 1;
        }

        .summary-status-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 500;
          color: #374151;
        }

        .summary-disclaimer {
          margin-top: 16px;
          padding: 10px 12px;
          background: #fefce8;
          border: 1px solid #fef08a;
          border-radius: 6px;
          font-size: 10px;
          color: #854d0e;
          line-height: 1.4;
          font-style: italic;
        }

        /* View reference details collapsible */
        .reference-details-toggle {
          font-size: 11px;
          color: #3b82f6;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 12px;
          font-weight: 500;
        }

        .reference-details-toggle:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Brief Summary Modal */}
      <Dialog
        open={briefSummaryModalOpen}
        onOpenChange={setBriefSummaryModalOpen}
      >
        <DialogContent className="w-[40vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Brief Summary
            </DialogTitle>
          </DialogHeader>
          <div className="text-gray-700 leading-relaxed">
            {selectedBriefSummary ? (
              <div className="space-y-3">
                {renderFormattedSummary(selectedBriefSummary)}
              </div>
            ) : (
              <div className="text-gray-500 italic">
                No brief summary available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsNewSection;
