// components/WhatsNewSection.tsx
import { DocumentData } from "@/app/custom-hooks/staff-hooks/physician-hooks/types";
import {
  useQuickNotesToggle,
  useWhatsNewData,
} from "@/app/custom-hooks/staff-hooks/physician-hooks/useWhatsNewData";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Activity,
  FileText,
  Stethoscope,
  Zap,
  Shield,
  Clock,
  Eye,
  Copy,
  Check,
  XCircle,
  Calendar,
  User,
  FileCheck,
  ExternalLink,
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
interface SummaryItem {
  field: string;
  collapsed: string;
  expanded: string;
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
    items: SummaryItem[];
  };
}

// Field label mapping
const FIELD_LABELS: Record<string, string> = {
  findings: "Finding",
  diagnosis: "Diagnosis",
  body_parts: "Body Parts",
  physical_exam: "Physical Exam",
  vital_signs: "Vital Signs",
  medications: "Medications",
  recommendations: "Recommendation",
  rationale: "Rationale",
  mmi_status: "MMI Status",
  work_status: "Work Status",
  med_legal: "Med-Legal",
  imaging: "Imaging",
};

// Get indicator color based on field type
const getFieldIndicatorColor = (field: string): string => {
  if (field === "findings" || field === "diagnosis") return "#ef4444"; // Red
  if (field === "recommendations" || field === "rationale") return "#3b82f6"; // Blue
  if (field === "mmi_status" || field === "work_status") return "#f59e0b"; // Amber
  return "#6b7280"; // Gray
};

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
    if (!documentData || !(documentData as any)?.documents?.[0])
      return "Unknown Patient";

    const firstDoc = (documentData as any).documents[0];
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
          className={`inline-block ${
            isInModal ? "text-gray-800" : "text-gray-900"
          }`}
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }

    return <span className="inline-block">{text}</span>;
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

  // State for expanded items
  const [expandedItems, setExpandedItems] = useState<
    Record<string, Set<number>>
  >({});

  // State for showing source-specific details
  const [showSourceDetails, setShowSourceDetails] = useState<
    Record<string, boolean>
  >({});

  // Toggle expanded state for a specific item
  const toggleItemExpanded = (docId: string, itemIndex: number) => {
    setExpandedItems((prev) => {
      const docItems = prev[docId] || new Set();
      const newDocItems = new Set(docItems);
      if (newDocItems.has(itemIndex)) {
        newDocItems.delete(itemIndex);
      } else {
        newDocItems.add(itemIndex);
      }
      return { ...prev, [docId]: newDocItems };
    });
  };

  // Helper function to render expanded text with bullet points
  const renderExpandedText = (text: string) => {
    if (!text) return null;

    // Check if text contains bullet points
    const hasBullets = text.includes("•") || /^\s*[-*]\s/m.test(text);

    if (hasBullets) {
      // Split by newlines and render as list
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      return (
        <ul className="space-y-1.5 mt-2 pt-2 border-t border-gray-100">
          {lines.map((line, idx) => {
            // Remove bullet character if present
            const cleanLine = line.replace(/^[•\-*]\s*/, "");
            return (
              <li
                key={idx}
                className="text-sm text-gray-700 leading-relaxed flex items-start gap-2"
              >
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{cleanLine}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    // Render as normal text if no bullets
    return (
      <p className="text-sm text-gray-700 leading-relaxed mt-2 pt-2 border-t border-gray-100">
        {text}
      </p>
    );
  };

  // Determine if document is QME/PQME/AME/IME type
  const isQMEType = (title: string, sourceType: string) => {
    const text = `${title} ${sourceType}`.toLowerCase();
    return (
      text.includes("qme") ||
      text.includes("pqme") ||
      text.includes("ame") ||
      text.includes("ime") ||
      text.includes("qualified medical")
    );
  };

  // Get default visible fields based on document type
  const getDefaultVisibleFields = (isQME: boolean): string[] => {
    const baseFields = ["findings", "recommendations"];
    if (isQME) {
      return [...baseFields, "work_status", "mmi_status"];
    }
    return baseFields;
  };

  // Render structured short summary with collapsible items
  const renderStructuredShortSummary = (
    summary: StructuredShortSummary,
    docId: string
  ) => {
    const { header, summary: summaryContent } = summary;
    const expandedItemsSet = expandedItems[docId] || new Set();
    const showDetails = showSourceDetails[docId] || false;
    const isQME = isQMEType(header.title, header.source_type);
    const defaultFields = getDefaultVisibleFields(isQME);

    // Filter items based on visibility
    const defaultItems = summaryContent.items.filter((item) =>
      defaultFields.includes(item.field)
    );
    const additionalItems = summaryContent.items.filter(
      (item) => !defaultFields.includes(item.field)
    );
    const visibleItems = defaultItems; // Always show only default items in main container

    return (
      <div className="space-y-0">
        {/* Default Summary Items in ONE Container */}
        {visibleItems && visibleItems.length > 0 && (
          <div className="space-y-0">
            {visibleItems.map((item, idx) => {
              const isExpanded = expandedItemsSet.has(idx);
              const label = FIELD_LABELS[item.field] || item.field;
              const indicatorColor = getFieldIndicatorColor(item.field);

              return (
                <div key={idx}>
                  {/* Item Row */}
                  <div
                    className="flex items-start gap-3 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleItemExpanded(docId, idx)}
                  >
                    {/* Label Column */}
                    <div className="w-32 flex-shrink-0">
                      <span
                        className="text-xs font-semibold uppercase tracking-wide inline-block"
                        style={{ color: indicatorColor }}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {item.collapsed}
                      </p>
                      {isExpanded &&
                        item.expanded &&
                        renderExpandedText(item.expanded)}
                    </div>
                  </div>

                  {/* Divider between items (not after last item) */}
                  {idx < visibleItems.length - 1 && (
                    <div className="border-b border-gray-100" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Toggle button and additional details section */}
        {additionalItems.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() =>
                setShowSourceDetails((prev) => ({
                  ...prev,
                  [docId]: !prev[docId],
                }))
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Shield size={14} />
              <span>Verify & View Source-Specific Details</span>
              {showDetails ? (
                <ChevronDownIcon size={14} className="rotate-180" />
              ) : (
                <ChevronDownIcon size={14} />
              )}
            </button>

            {/* Additional fields in separate colored container */}
            {showDetails && (
              <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="space-y-0">
                  {additionalItems.map((item, idx) => {
                    const isExpanded = expandedItemsSet.has(
                      visibleItems.length + idx
                    );
                    const label = FIELD_LABELS[item.field] || item.field;
                    const indicatorColor = getFieldIndicatorColor(item.field);

                    return (
                      <div key={idx}>
                        {/* Item Row */}
                        <div
                          className="flex items-start gap-3 py-3 cursor-pointer hover:bg-blue-100/30 transition-colors rounded"
                          onClick={() =>
                            toggleItemExpanded(docId, visibleItems.length + idx)
                          }
                        >
                          {/* Label Column */}
                          <div className="w-32 flex-shrink-0">
                            <span
                              className="text-xs font-semibold uppercase tracking-wide inline-block"
                              style={{ color: indicatorColor }}
                            >
                              {label}
                            </span>
                          </div>

                          {/* Content Column */}
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {item.collapsed}
                            </p>
                            {isExpanded && item.expanded && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                {renderExpandedText(item.expanded)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Divider between items (not after last item) */}
                        {idx < additionalItems.length - 1 && (
                          <div className="border-b border-blue-100" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        {header.disclaimer && (
          <div className="text-xs text-gray-500 italic mt-4 pt-3 border-t border-gray-200">
            {header.disclaimer}
          </div>
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
    if (!documentData || !(documentData as any)?.documents) return [];

    return (documentData as any).documents
      .map((doc: any, docIndex: number) => {
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
      .filter((group: any) => {
        if (!group.shortSummary) return false;
        if (mode && group.docMode) {
          return group.docMode === mode;
        }
        return true;
      });
  }, [documentData, mode]);

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
    if (!text)
      return (
        <div className="text-sm text-gray-500 italic text-center py-5">
          No summary available
        </div>
      );

    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (line.includes("**") && line.includes("**")) {
        const parts = line.split("**");
        return (
          <div key={index} className="mb-3">
            {parts.map((part, partIndex) =>
              partIndex % 2 === 1 ? (
                <strong key={partIndex} className="text-blue-600 font-semibold">
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
        <div key={index} className="mb-3">
          {line}
        </div>
      );
    });
  };

  useEffect(() => {
    const verifiedIds = documentGroups
      .filter((g: any) => g.status === "verified")
      .map((g: any) => g.docId);
    setViewedWhatsNew((prev) => {
      const newSet = new Set(prev);
      verifiedIds.forEach((id: any) => newSet.add(id));
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

    const group = documentGroups.find((g: any) => g.docId === groupId);
    if (!group || !group.shortSummary) {
      toast.error("No summary found to copy", {
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    let textToCopy = "";

    // Handle structured summary
    if (isStructuredSummary((group as any).shortSummary)) {
      const { header, summary: summaryContent } = group.shortSummary;

      let parts: string[] = [];
      parts.push(`📋 ${header.title}`);
      parts.push(
        `Source: ${header.source_type} • Author: ${header.author} • Date: ${header.date}`
      );
      parts.push("");

      if (summaryContent.items?.length > 0) {
        summaryContent.items.forEach((item: SummaryItem) => {
          const label = FIELD_LABELS[item.field] || item.field;
          parts.push(`${label.toUpperCase()}:`);
          parts.push(`${item.collapsed}`);
          parts.push("");
        });
      }

      parts.push("These findings have been reviewed by Physician");
      textToCopy = parts.join("\n");
    } else {
      // Handle string summary - Remove HTML tags when copying to clipboard
      const cleanText =
        typeof (group as any).shortSummary === "string"
          ? (group as any).shortSummary.replace(/<[^>]*>/g, "")
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
    setViewedWhatsNew(new Set(documentGroups.map((group: any) => group.docId)));
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
        `https://api.doclatch.com/api/documents/preview/${encodeURIComponent(
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
      .map((group: any) => {
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
        <div className="mt-0">
          <div className="flex flex-col gap-2.5">
            {documentGroups.map((group: any, groupIndex: number) => {
              const isViewed = isGroupViewed(group.docId);
              const isGroupCopied = copied[`whatsnew-${group.docId}`];
              const isLoading = isLoadingForGroup(group);
              const isPreviewLoading = isPreviewLoadingForGroup(group);
              const formattedDate = formatDisplayDate(group.reportDate);

              // Get icon based on document type
              const getIcon = () => {
                const type = (group.documentType || "").toLowerCase();
                if (type.includes("mri"))
                  return <FileText size={16} className="text-blue-600" />;
                if (type.includes("emg") || type.includes("ncs"))
                  return <Zap size={16} className="text-yellow-600" />;
                if (type.includes("ortho"))
                  return <Shield size={16} className="text-green-600" />;
                if (type.includes("pt") || type.includes("physical therapy"))
                  return <Activity size={16} className="text-purple-600" />;
                if (type.includes("report"))
                  return <FileCheck size={16} className="text-indigo-600" />;
                if (type.includes("consultation"))
                  return <Stethoscope size={16} className="text-teal-600" />;
                return <FileText size={16} className="text-gray-600" />;
              };

              // Get badges based on document type and summary items
              const getBadges = (
                summary: string | StructuredShortSummary,
                doc: any
              ) => {
                const badges: Array<{ text: string; variant: string }> = [];

                // Always show status badge
                if (isViewed) {
                  badges.push({ text: "Reviewed", variant: "success" });
                }

                // Add document type badges based on content
                if (isStructuredSummary(summary)) {
                  const hasTask = summary.summary.items?.some(
                    (item) =>
                      item.field === "recommendations" ||
                      item.field === "rationale"
                  );
                  if (hasTask) {
                    badges.push({ text: "Task", variant: "blue" });
                  }
                }

                badges.push({ text: "Source", variant: "gray" });

                return badges;
              };

              const badges = getBadges(group.shortSummary || "", group.doc);

              // Get indicator dot color based on document type or priority
              const getIndicatorDotColor = (
                summary: string | StructuredShortSummary
              ) => {
                if (isStructuredSummary(summary)) {
                  // Check if has critical findings
                  const hasFindings = summary.summary.items?.some(
                    (item) =>
                      item.field === "findings" || item.field === "diagnosis"
                  );
                  const hasMMI = summary.summary.items?.some(
                    (item) =>
                      item.field === "mmi_status" ||
                      item.field === "work_status"
                  );

                  if (hasFindings) return "#ef4444"; // Red for findings
                  if (hasMMI) return "#f59e0b"; // Yellow for MMI/Work status
                  return "#3b82f6"; // Blue for other docs
                }
                return "#6b7280"; // Gray default
              };

              const indicatorColor = getIndicatorDotColor(
                group.shortSummary || ""
              );

              return (
                <details
                  key={group.docId}
                  className="bg-white border border-gray-200 rounded-lg m-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
                  <summary className="list-none cursor-pointer p-4 flex gap-3 items-start hover:bg-gray-50 transition-colors">
                    {/* Indicator Dot */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: indicatorColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base font-semibold text-gray-900">
                              {extractDocumentTitle(
                                (group as any).shortSummary,
                                (group as any).documentType
                              )}
                            </h3>
                            {isViewed && (
                              <div className="flex-shrink-0">
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              </div>
                            )}
                          </div>

                          {/* Subtitle with type and author */}
                          {isStructuredSummary(group.shortSummary) && (
                            <div className="text-xs text-gray-600 mb-1.5">
                              {group.shortSummary.header.date} -{" "}
                              {group.shortSummary.header.source_type} -{" "}
                              {group.shortSummary.header.author}
                            </div>
                          )}

                          {!isStructuredSummary(group.shortSummary) && (
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-gray-400" />
                                <span>{formattedDate}</span>
                              </div>
                              {(group as any).consultingDoctor && (
                                <div className="flex items-center gap-1">
                                  <User size={12} className="text-gray-400" />
                                  <span className="truncate">
                                    {(group as any).consultingDoctor}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 items-center flex-shrink-0">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePreviewClick(e, group.doc);
                            }}
                            title="View Original Document"
                          >
                            <ExternalLink size={12} />
                            <span>View</span>
                          </button>
                          <div className="flex items-center">
                            <ChevronDownIcon
                              size={16}
                              className="text-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </summary>
                  <div className="border-t border-border p-4 bg-gray-50">
                    {/* Show header info for structured summaries */}
                    {isStructuredSummary(group.shortSummary) && (
                      <div className="mb-3 flex items-center gap-2 flex-wrap">
                        {badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              badge.variant === "success"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : badge.variant === "blue"
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                          >
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      {expandedLongSummary === group.docId &&
                      group.longSummary ? (
                        <div className="bg-white border border-border rounded-xl p-4">
                          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-3">
                            Long Summary
                          </div>
                          <div className="text-sm leading-relaxed text-gray-900">
                            {renderFormattedSummary(
                              formatLongSummaryWithColors(
                                group.longSummary || group.briefSummary || ""
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-border rounded-xl p-4">
                          <div className="text-sm leading-relaxed text-gray-900">
                            {isStructuredSummary(group.shortSummary)
                              ? renderStructuredShortSummary(
                                  group.shortSummary,
                                  group.docId
                                )
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
                    <div className="flex gap-2 flex-wrap mt-4 pt-3 border-t border-gray-100">
                      {group.longSummary && (
                        <button
                          onClick={(e) => handleReadMoreClick(e, group)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 min-h-[32px]"
                          title={
                            expandedLongSummary === group.docId
                              ? "Show brief summary"
                              : "Read detailed summary"
                          }
                        >
                          <FileText size={12} />
                          <span>
                            {expandedLongSummary === group.docId
                              ? "Show Brief"
                              : "Read More"}
                          </span>
                        </button>
                      )}

                      {(group.briefSummary || group.longSummary) && (
                        <button
                          onClick={(e) => handleBriefSummaryClick(e, group)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 min-h-[32px]"
                          title="View Document Summary"
                        >
                          <Eye size={12} />
                          <span>Summary</span>
                        </button>
                      )}

                      <button
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 min-h-[32px] ${
                          isGroupCopied
                            ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopyClick(e, group.docId);
                        }}
                        title="Copy to Clipboard"
                      >
                        {isGroupCopied ? (
                          <>
                            <Check size={12} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 min-h-[32px] ${
                          isViewed
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkViewed(e, group);
                        }}
                        disabled={isLoading}
                        title="Mark as Reviewed"
                      >
                        {isLoading ? (
                          <>
                            <Clock size={12} />
                            <span>Loading...</span>
                          </>
                        ) : isViewed ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Reviewed</span>
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            <span>Mark Reviewed</span>
                          </>
                        )}
                      </button>

                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 min-h-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePreviewClick(e, group.doc);
                        }}
                        disabled={isPreviewLoading}
                        title="Preview Document"
                      >
                        {isPreviewLoading ? (
                          <>
                            <Clock size={12} />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink size={12} />
                            <span>Preview</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
            {documentGroups.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <CheckCircle2 size={20} className="text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  All Caught Up!
                </div>
                <div className="text-xs text-gray-500">
                  No significant changes since last visit
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Brief Summary Modal */}
      <Dialog
        open={briefSummaryModalOpen}
        onOpenChange={setBriefSummaryModalOpen}
      >
        <DialogContent className="w-[45vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 mb-1">
                  Document Summary
                </DialogTitle>
                {selectedDocumentInfo && (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {selectedDocumentInfo.patientName && (
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{selectedDocumentInfo.patientName}</span>
                      </div>
                    )}
                    {selectedDocumentInfo.reportDate && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{selectedDocumentInfo.reportDate}</span>
                      </div>
                    )}
                    {selectedDocumentInfo.documentType && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                        {selectedDocumentInfo.documentType}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="text-gray-700 leading-relaxed">
            {selectedBriefSummary ? (
              <div className="space-y-3">
                {renderFormattedSummary(selectedBriefSummary)}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <FileText size={20} className="text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  No Summary Available
                </div>
                <div className="text-xs text-gray-500">
                  This document doesn't have a summary yet.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsNewSection;
