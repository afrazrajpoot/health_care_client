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
  History,
  BookOpen,
  FileSearch,
  FileJson,
  Tag,
  Info,
  BadgeCheck,
  AlertOctagon,
  FileWarning,
  FileClock,
  FileX,
  FilePlus,
  FileMinus,
  FileImage,
  Loader2,
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
import { useDispatch } from "react-redux";
import { dashboardApi, useVerifyDocumentMutation } from "@/redux/dashboardApi";

// Types for new structured short summary response
interface Citation {
  chunk_id: number;
  statement: string;
  confidence: number;
  page_number: number;
  source_text: string;
  text_snippet: string;
  paragraph_index: number;
  confidence_level: string;
}

interface SummaryItem {
  field: string;
  collapsed: string;
  expanded: string;
  citations?: Citation[];
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

// Helper to convert snake_case to Title Case
const formatKeyLabel = (key: string): string => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// Get color for different field types
const getFieldColor = (key: string): string => {
  const keyLower = key.toLowerCase();
  if (keyLower.includes("diagnosis") || keyLower.includes("finding"))
    return "#dc2626";
  if (keyLower.includes("medication") || keyLower.includes("prescription"))
    return "#7c3aed";
  if (keyLower.includes("recommendation") || keyLower.includes("plan"))
    return "#2563eb";
  if (keyLower.includes("procedure") || keyLower.includes("test"))
    return "#d97706";
  if (keyLower.includes("vital") || keyLower.includes("allerg"))
    return "#db2777";
  if (keyLower.includes("authorization") || keyLower.includes("status"))
    return "#059669";
  if (keyLower.includes("follow") || keyLower.includes("next"))
    return "#0891b2";
  if (keyLower.includes("unclear") || keyLower.includes("note"))
    return "#6b7280";
  if (keyLower.includes("metadata")) return "#9ca3af";
  return "#374151";
};

// Get background color for section headers
const getFieldBgColor = (key: string): string => {
  const keyLower = key.toLowerCase();
  if (keyLower.includes("diagnosis") || keyLower.includes("finding"))
    return "#fef2f2";
  if (keyLower.includes("medication") || keyLower.includes("prescription"))
    return "#f5f3ff";
  if (keyLower.includes("recommendation") || keyLower.includes("plan"))
    return "#eff6ff";
  if (keyLower.includes("procedure") || keyLower.includes("test"))
    return "#fffbeb";
  if (keyLower.includes("vital") || keyLower.includes("allerg"))
    return "#fdf2f8";
  if (keyLower.includes("authorization") || keyLower.includes("status"))
    return "#ecfdf5";
  if (keyLower.includes("follow") || keyLower.includes("next"))
    return "#ecfeff";
  if (keyLower.includes("metadata")) return "#f9fafb";
  return "#f9fafb";
};

// Render a single value (handles primitives, arrays, and objects)
const renderDynamicValue = (
  value: any,
  depth: number = 0,
  parentKey?: string,
): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic text-sm">Not specified</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={`text-sm font-medium ${value ? "text-green-600" : "text-red-500"}`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    return <span className="text-sm text-gray-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400 italic text-sm">None</span>;
    }

    // Check if array contains objects or primitives
    const hasObjects = value.some(
      (item) => typeof item === "object" && item !== null,
    );

    if (hasObjects) {
      return (
        <div className="space-y-1.5">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-md px-3 py-2 border border-gray-100 shadow-sm"
            >
              {typeof item === "object" && item !== null ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(item).map(([subKey, subValue]) => (
                    <div key={subKey} className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">
                        {formatKeyLabel(subKey)}:
                      </span>
                      <span className="text-sm text-gray-800 font-medium">
                        {renderDynamicValue(subValue, depth + 1)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-700">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Simple array of primitives - render as compact bullet list
    return (
      <ul className="space-y-0.5">
        {value.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-gray-700"
          >
            <span className="text-gray-400 mt-1 text-xs">•</span>
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(value).map(([subKey, subValue]) => (
          <div key={subKey} className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">
              {formatKeyLabel(subKey)}:
            </span>
            <span className="text-sm text-gray-800 font-medium">
              {renderDynamicValue(subValue, depth + 1)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm">{String(value)}</span>;
};

// Parse and render dynamic brief summary JSON
const renderDynamicBriefSummary = (summary: any): React.ReactNode => {
  // Try to parse if it's a string
  let data = summary;
  if (typeof summary === "string") {
    try {
      data = JSON.parse(summary);
    } catch {
      // Not JSON, return as plain text
      return (
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      );
    }
  }

  if (!data || typeof data !== "object") {
    return <div className="text-sm text-gray-700">{String(summary)}</div>;
  }

  // Filter out metadata keys
  const filteredEntries = Object.entries(data).filter(
    ([key]) => !key.startsWith("_") && key !== "extraction_metadata",
  );

  if (filteredEntries.length === 0) {
    return (
      <div className="text-gray-500 italic text-center py-4">
        No summary data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredEntries.map(([key, value]) => {
        const labelColor = getFieldColor(key);
        const bgColor = getFieldBgColor(key);
        const isEmpty =
          value === null ||
          value === undefined ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "object" &&
            value !== null &&
            Object.keys(value).length === 0);

        if (isEmpty) return null;

        return (
          <div
            key={key}
            className="rounded-lg overflow-hidden border border-gray-100"
          >
            {/* Section Header */}
            <div
              className="px-3 py-2 border-b border-gray-100"
              style={{ backgroundColor: bgColor }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: labelColor }}
              >
                {formatKeyLabel(key)}
              </span>
            </div>
            {/* Section Content */}
            <div className="px-3 py-2 bg-white">
              {renderDynamicValue(value, 0, key)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Get indicator color based on field type
const getFieldIndicatorColor = (field: string): string => {
  if (field === "findings" || field === "diagnosis") return "#ef4444"; // Red
  if (field === "recommendations" || field === "rationale") return "#3b82f6"; // Blue
  if (field === "mmi_status" || field === "work_status") return "#f59e0b"; // Amber
  return "#6b7280"; // Gray
};

// Get field icon based on type
const getFieldIcon = (field: string) => {
  const fieldLower = field.toLowerCase();

  if (fieldLower.includes("finding") || fieldLower.includes("diagnosis")) {
    return <FileSearch size={14} className="text-red-500" />;
  }
  if (fieldLower.includes("recommendation") || fieldLower.includes("plan")) {
    return <ClipboardList size={14} className="text-blue-500" />;
  }
  if (fieldLower.includes("medication") || fieldLower.includes("prescription")) {
    return <FilePlus size={14} className="text-purple-500" />;
  }
  if (fieldLower.includes("status") || fieldLower.includes("work")) {
    return <BadgeCheck size={14} className="text-amber-500" />;
  }
  if (fieldLower.includes("exam") || fieldLower.includes("physical")) {
    return <Stethoscope size={14} className="text-green-500" />;
  }
  if (fieldLower.includes("vital") || fieldLower.includes("sign")) {
    return <Activity size={14} className="text-pink-500" />;
  }
  if (fieldLower.includes("imaging") || fieldLower.includes("scan")) {
    return <FileImage size={14} className="text-indigo-500" />;
  }

  return <FileText size={14} className="text-gray-500" />;
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
    new Set(),
  );
  const [expandedLongSummary, setExpandedLongSummary] = useState<string | null>(
    null,
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
  const dispatch = useDispatch();
  const [verifyDocument] = useVerifyDocumentMutation();
  const [isVerifyingGlobal, setIsVerifyingGlobal] = useState(false);

  // State for expanded items
  const [expandedItems, setExpandedItems] = useState<
    Record<string, Set<number>>
  >({});

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

  // Helper function to render expanded text with bullet points
  const renderExpandedText = (text: string, citations?: Citation[]) => {
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
        <ul className="space-y-2 mt-2 pt-2 border-t border-gray-100">
          {lines.map((line, idx) => {
            // Remove bullet character if present
            const cleanLine = line.replace(/^[•\-*]\s*/, "");

            // Find matching citation
            const citation = citations?.find((c) => {
              const normalizedStatement = c.statement
                .trim()
                .replace(/\s+/g, " ");
              const normalizedLine = cleanLine.trim().replace(/\s+/g, " ");
              return (
                normalizedStatement === normalizedLine ||
                normalizedLine.includes(normalizedStatement)
              );
            });

            return (
              <li key={idx} className="text-sm text-gray-700 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{cleanLine}</span>
                </div>
                {citation && (
                  <div className="mt-2 ml-6 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                          {citation.page_number}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Page {citation.page_number}
                        </span>
                      </div>
                    </div>
                    <div className="italic text-gray-600">
                      "{citation.source_text}"
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    // Render as normal text if no bullets
    const citation = citations?.find((c) => {
      const normalizedStatement = c.statement.trim().replace(/\s+/g, " ");
      const normalizedText = text.trim().replace(/\s+/g, " ");
      return normalizedStatement === normalizedText;
    });

    return (
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
        {citation && (
          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                {citation.page_number}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Page {citation.page_number}
              </span>
            </div>
            <div className="italic text-gray-600">
              "{citation.source_text}"
            </div>
          </div>
        )}
      </div>
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
    docId: string,
  ) => {
    const { header, summary: summaryContent } = summary;
    const expandedItemsSet = expandedItems[docId] || new Set();
    const isQME = isQMEType(header.title, header.source_type);
    const defaultFields = getDefaultVisibleFields(isQME);

    // Get all items (show all fields now, since we removed the verify button)
    const allItems = summaryContent.items || [];

    return (
      <div className="space-y-0">
        {/* All Summary Items in ONE Container */}
        {allItems.length > 0 && (
          <div className="space-y-0">
            {allItems.map((item, idx) => {
              const isExpanded = expandedItemsSet.has(idx);
              const label = FIELD_LABELS[item.field] || item.field;
              const indicatorColor = getFieldIndicatorColor(item.field);
              const Icon = getFieldIcon(item.field);

              return (
                <div key={idx}>
                  {/* Item Row - Key-Value Layout */}
                  <div
                    className="flex items-start py-2.5 cursor-pointer hover:bg-gray-50/50 transition-colors group"
                    onClick={() => {
                      if (item.expanded) {
                        toggleItemExpanded(docId, idx);
                      }
                    }}
                  >
                    {/* Key Column (Heading) */}
                    <div className="w-32 flex-shrink-0">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider inline-block"
                        style={{ color: indicatorColor }}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Value Column (Description) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {item.collapsed}
                          </p>
                          {isExpanded &&
                            item.expanded &&
                            renderExpandedText(item.expanded, item.citations)}
                        </div>

                        {/* Expand/Collapse Indicator */}
                        {item.expanded && (
                          <div className="flex-shrink-0 pt-0.5">
                            <ChevronDownIcon
                              size={14}
                              className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-blue-500" : "group-hover:text-gray-600"}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider between items (not after last item) */}
                  {idx < allItems.length - 1 && (
                    <div className="border-b border-gray-100" />
                  )}
                </div>
              );
            })}
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
    shortSummary: any,
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
    summary: any,
  ): summary is StructuredShortSummary => {
    return (
      summary &&
      typeof summary === "object" &&
      summary.header &&
      summary.summary
    );
  };

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

        // Filter out verified documents
        if (group.status === "verified") return false;

        if (mode && group.docMode) {
          return group.docMode === mode;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        // Sort by reportDate, most recent first
        if (!a.reportDate && !b.reportDate) return 0;
        if (!a.reportDate) return 1;
        if (!b.reportDate) return -1;

        const dateA = new Date(a.reportDate).getTime();
        const dateB = new Date(b.reportDate).getTime();

        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateB - dateA; // Descending order
      });
  }, [documentData, mode]);

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not provided";
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const year = date.getUTCFullYear();
      return `${month}-${day}-${year}`;
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
              ),
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
        `Source: ${header.source_type} • Author: ${header.author} • Date: ${header.date}`,
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

  const handleMarkViewed = async (e: React.MouseEvent, group: any) => {
    e.stopPropagation();

    const groupId = group.docId;
    const docId = group.doc?.document_id;
    const summary_card = group.shortSummary;
    if (!docId) return;

    if (viewedWhatsNew.has(groupId)) return;
    if (loadingDocs.has(docId)) return;

    const needsVerification = group.doc.status !== "verified";

    if (needsVerification) {
      setLoadingDocs((prev) => new Set([...prev, docId]));
      setIsVerifyingGlobal(true);
    }
    try {
      if (needsVerification) {
        await verifyDocument({
          document_id: docId,
          summary_card: summary_card,
        }).unwrap();

        // Force immediate refetch of treatment history
        dispatch(dashboardApi.util.invalidateTags(["TreatmentHistory"]));

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
      setIsVerifyingGlobal(false);
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL
        }/api/documents/preview/${encodeURIComponent(doc.blob_path)}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        },
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

  // Extract meaningful document title from short summary
  const extractDocumentTitle = (
    shortSummary: string | StructuredShortSummary,
    fallbackType: string,
  ): string => {
    if (!shortSummary) return fallbackType || "Document";

    // Handle structured summary
    if (isStructuredSummary(shortSummary)) {
      return shortSummary.header?.title || fallbackType || "Document";
    }

    // Handle string summary
    if (typeof shortSummary === "string") {
      const firstPart = shortSummary.split("|")[0]?.trim();
      if (firstPart && firstPart.length > 0 && firstPart.length < 100) {
        return (
          firstPart.replace(/<[^>]*>/g, "").trim() || fallbackType || "Document"
        );
      }
    }

    return fallbackType || "Document";
  };

  // Get document type icon
  const getDocumentIcon = (documentType: string) => {
    const type = (documentType || "").toLowerCase();

    if (type.includes("mri") || type.includes("imaging")) {
      return <FileImage size={18} className="text-blue-600" />;
    }
    if (type.includes("emg") || type.includes("ncs")) {
      return <Zap size={18} className="text-yellow-600" />;
    }
    if (type.includes("ortho") || type.includes("surgery")) {
      return <Shield size={18} className="text-green-600" />;
    }
    if (type.includes("pt") || type.includes("physical")) {
      return <Activity size={18} className="text-purple-600" />;
    }
    if (type.includes("report")) {
      return <FileCheck size={18} className="text-indigo-600" />;
    }
    if (type.includes("consultation")) {
      return <Stethoscope size={18} className="text-teal-600" />;
    }
    if (type.includes("qme") || type.includes("ime")) {
      return <BadgeCheck size={18} className="text-red-600" />;
    }

    return <FileText size={18} className="text-gray-600" />;
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
              const documentIcon = getDocumentIcon(group.documentType);

              return (
                <details
                  key={group.docId}
                  className="bg-white border border-gray-200 rounded-xl m-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  open={openCards.has(group.docId)}
                  onToggle={(e) => {
                    const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                    if (isOpen) {
                      setOpenCards(new Set([group.docId]));
                      if (expandedLongSummary && expandedLongSummary !== group.docId) {
                        setExpandedLongSummary(null);
                      }
                    } else {
                      setOpenCards((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(group.docId);
                        return newSet;
                      });
                      if (expandedLongSummary === group.docId) {
                        setExpandedLongSummary(null);
                      }
                    }
                  }}
                >
                  <summary className="list-none cursor-pointer p-4 flex gap-3 items-start hover:bg-gray-50/50 transition-colors duration-200">
                    {/* Document Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {documentIcon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {extractDocumentTitle(
                                (group as any).shortSummary,
                                (group as any).documentType,
                              )}
                            </h3>
                            {isViewed && (
                              <BadgeCheck size={16} className="text-green-600 flex-shrink-0" />
                            )}
                          </div>

                          {/* Document Info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              <span>{formattedDate}</span>
                            </div>
                            {(group as any).consultingDoctor && (
                              <div className="flex items-center gap-1">
                                <User size={12} className="text-gray-400" />
                                <span className="truncate max-w-[200px]">
                                  {(group as any).consultingDoctor}
                                </span>
                              </div>
                            )}
                            {isStructuredSummary(group.shortSummary) && (
                              <div className="flex items-center gap-1">
                                <Tag size={12} className="text-gray-400" />
                                <span>{group.shortSummary.header.source_type}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center flex-shrink-0">
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors ${isPreviewLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                              }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePreviewClick(e, group.doc);
                            }}
                            disabled={isPreviewLoading}
                            title="View Original Document"
                          >
                            {isPreviewLoading ? (
                              <>
                                <Clock size={12} className="animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink size={12} />
                                <span>View</span>
                              </>
                            )}
                          </button>
                          <div className="flex items-center">
                            <ChevronDownIcon
                              size={16}
                              className="text-gray-400 transition-transform duration-200 group-open:rotate-180"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </summary>
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 gap-2">
                      {expandedLongSummary === group.docId &&
                        group.longSummary ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={14} className="text-gray-500" />
                            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                              Detailed Summary
                            </div>
                          </div>
                          <div className="text-sm leading-relaxed text-gray-900">
                            {renderFormattedSummary(
                              formatLongSummaryWithColors(
                                group.longSummary || group.briefSummary || "",
                              ),
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          {isStructuredSummary(group.shortSummary) ? (
                            renderStructuredShortSummary(
                              group.shortSummary,
                              group.docId,
                            )
                          ) : (
                            <div className="text-sm leading-relaxed text-gray-900">
                              {typeof group.shortSummary === "string"
                                ? group.shortSummary
                                : "No summary available"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-4 pt-3 border-t border-gray-200">
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
                          <BookOpen size={12} />
                          <span>
                            {expandedLongSummary === group.docId
                              ? "Show Brief"
                              : "Read More"}
                          </span>
                        </button>
                      )}

                      <button
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 min-h-[32px] ${isGroupCopied
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
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 min-h-[32px] ${isViewed
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
                            <Clock size={12} className="animate-spin" />
                            <span>Processing...</span>
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 min-h-[32px]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBriefSummaryClick(e, group);
                        }}
                        title="View Document Summary"
                      >
                        <Eye size={12} />
                        <span>Summary</span>
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
            {documentGroups.length === 0 && (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <CheckCircle2 size={24} className="text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  All Caught Up!
                </div>
                <div className="text-xs text-gray-500">
                  No new documents to review
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
                {renderDynamicBriefSummary(selectedBriefSummary)}
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

      {/* Global Verification Loader Modal */}
      <Dialog open={isVerifyingGlobal} onOpenChange={() => { }}>
        <DialogContent className="max-w-[300px] p-8 flex flex-col items-center justify-center border-none shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          <div className="relative flex items-center justify-center w-20 h-20 mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <Loader2 size={32} className="text-blue-600 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Verifying Document</h3>
            <p className="text-sm text-gray-500">Updating treatment history...</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsNewSection;