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

// Legacy format with items array
interface LegacyStructuredShortSummary {
  header: SummaryHeader;
  summary: {
    items: SummaryItem[];
  };
}

// New format with key-value pairs
interface NewStructuredShortSummary {
  header: SummaryHeader;
  summary: Record<string, string[]>;
}

// Union type for both formats
type StructuredShortSummary =
  | LegacyStructuredShortSummary
  | NewStructuredShortSummary;

// Types for new structured long summary response
interface LongSummaryContentBlock {
  type: "paragraph" | "bullets";
  content?: string;
  items?: string[];
}

interface LongSummarySection {
  heading: string;
  content_blocks?: LongSummaryContentBlock[];
  // Legacy support
  paragraphs?: string[];
  bullet_points?: { text: string; sub_bullets?: string[] }[];
}

interface StructuredLongSummary {
  sections: LongSummarySection[];
  content_type?: string;
  // Legacy support
  metadata?: {
    document_type?: string;
    document_date?: string;
    patient_name?: string;
    provider?: string;
    claim_number?: string;
  };
  original_bullet_count?: number;
  formatted_bullet_count?: number;
}

// Types for new structured brief summary response
interface BriefSummaryAtAGlanceItem {
  item: string;
}

interface BriefSummaryDynamicSection {
  field_name: string;
  field_type: string;
  content: string[];
  priority: number;
}

interface StructuredBriefSummary {
  summary_title: string;
  at_a_glance: BriefSummaryAtAGlanceItem[];
  dynamic_sections: BriefSummaryDynamicSection[];
}

// Type for simple key-value brief summary format
type SimpleBriefSummary = Record<string, string[]>;

// Known field names for simple brief summary (in priority order)
const BRIEF_SUMMARY_FIELD_CONFIG: Record<
  string,
  {
    priority: number;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    icon:
      | "critical"
      | "finding"
      | "diagnosis"
      | "recommendation"
      | "medication"
      | "status"
      | "default";
  }
> = {
  "Critical Findings": {
    priority: 1,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
    icon: "critical",
  },
  "Key Findings": {
    priority: 2,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
    icon: "finding",
  },
  Findings: {
    priority: 2,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
    icon: "finding",
  },
  Diagnosis: {
    priority: 3,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    iconColor: "text-purple-600",
    icon: "diagnosis",
  },
  Impressions: {
    priority: 3,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    iconColor: "text-purple-600",
    icon: "diagnosis",
  },
  Recommendations: {
    priority: 4,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
    icon: "recommendation",
  },
  "Treatment Plan": {
    priority: 4,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
    icon: "recommendation",
  },
  Medications: {
    priority: 5,
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-800",
    iconColor: "text-indigo-600",
    icon: "medication",
  },
  "Work Status": {
    priority: 6,
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
    iconColor: "text-teal-600",
    icon: "status",
  },
  "MMI Status": {
    priority: 6,
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
    iconColor: "text-teal-600",
    icon: "status",
  },
};

// Get icon for simple brief summary field
const getSimpleBriefIcon = (iconType: string) => {
  switch (iconType) {
    case "critical":
      return <AlertOctagon size={16} />;
    case "finding":
      return <FileSearch size={16} />;
    case "diagnosis":
      return <Stethoscope size={16} />;
    case "recommendation":
      return <ClipboardList size={16} />;
    case "medication":
      return <FilePlus size={16} />;
    case "status":
      return <BadgeCheck size={16} />;
    default:
      return <FileText size={16} />;
  }
};

// Light color palette for brief summary sections (matches PILL_COLORS structure)
const BRIEF_SUMMARY_COLORS = [
  {
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
  },
  {
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
  },
  {
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600",
  },
  {
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    iconColor: "text-purple-600",
  },
  {
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
  },
  {
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-800",
    iconColor: "text-cyan-600",
  },
  {
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-800",
    iconColor: "text-indigo-600",
  },
  {
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
    iconColor: "text-teal-600",
  },
  {
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-800",
    iconColor: "text-pink-600",
  },
  {
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    iconColor: "text-orange-600",
  },
];

// Simple hash function to get consistent color index for same key (duplicate for module scope)
const hashFieldName = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Get config for a field name (with fallback using hash-based coloring for unknown fields)
const getFieldConfig = (fieldName: string) => {
  // Check for exact match first
  if (BRIEF_SUMMARY_FIELD_CONFIG[fieldName]) {
    return BRIEF_SUMMARY_FIELD_CONFIG[fieldName];
  }

  // Check for partial match
  const fieldLower = fieldName.toLowerCase();
  if (fieldLower.includes("critical")) {
    return BRIEF_SUMMARY_FIELD_CONFIG["Critical Findings"];
  }
  if (fieldLower.includes("finding")) {
    return BRIEF_SUMMARY_FIELD_CONFIG["Key Findings"];
  }
  if (fieldLower.includes("diagnosis") || fieldLower.includes("impression")) {
    return BRIEF_SUMMARY_FIELD_CONFIG["Diagnosis"];
  }
  if (fieldLower.includes("recommendation") || fieldLower.includes("plan")) {
    return BRIEF_SUMMARY_FIELD_CONFIG["Recommendations"];
  }
  if (fieldLower.includes("medication")) {
    return BRIEF_SUMMARY_FIELD_CONFIG["Medications"];
  }
  if (
    fieldLower.includes("status") ||
    fieldLower.includes("work") ||
    fieldLower.includes("mmi")
  ) {
    return BRIEF_SUMMARY_FIELD_CONFIG["Work Status"];
  }

  // Use hash-based color for unknown fields - ensures all fields get a colored background
  const colorIndex = hashFieldName(fieldLower) % BRIEF_SUMMARY_COLORS.length;
  const hashColor = BRIEF_SUMMARY_COLORS[colorIndex];

  return {
    priority: 99,
    bgColor: hashColor.bgColor,
    borderColor: hashColor.borderColor,
    textColor: hashColor.textColor,
    iconColor: hashColor.iconColor,
    icon: "default" as const,
  };
};

// Check if brief summary is simple key-value format
const isSimpleBriefSummary = (data: any): data is SimpleBriefSummary => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  // Check if all values are arrays of strings
  const entries = Object.entries(data);
  if (entries.length === 0) return false;

  return entries.every(
    ([key, value]) =>
      typeof key === "string" &&
      Array.isArray(value) &&
      value.every((item) => typeof item === "string"),
  );
};

// Render simple brief summary with professional styling
const renderSimpleBriefSummary = (
  summary: SimpleBriefSummary,
): React.ReactNode => {
  // Get entries and sort by priority
  const entries = Object.entries(summary)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key, value]) => ({
      fieldName: key,
      items: value,
      config: getFieldConfig(key),
    }))
    .sort((a, b) => a.config.priority - b.config.priority);

  if (entries.length === 0) {
    return (
      <div className="text-gray-500 italic text-center py-4">
        No summary data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(({ fieldName, items, config }, idx) => {
        const isCritical = fieldName.toLowerCase().includes("critical");

        return (
          <div
            key={idx}
            className={`rounded-lg overflow-hidden border ${config.borderColor} ${isCritical ? "ring-1 ring-red-300" : ""}`}
          >
            {/* Section Header */}
            <div
              className={`px-4 py-2.5 ${config.bgColor} border-b ${config.borderColor} flex items-center gap-2`}
            >
              <span className={config.iconColor}>
                {getSimpleBriefIcon(config.icon)}
              </span>
              <span className={`text-sm font-semibold ${config.textColor}`}>
                {fieldName}
              </span>
              {isCritical && (
                <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">
                  Priority
                </span>
              )}
            </div>

            {/* Section Content */}
            <div className="p-4 bg-white">
              <ul className="space-y-2">
                {items.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <span
                      className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}
                    >
                      •
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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

// Check if brief summary is in new structured format
const isStructuredBriefSummary = (
  summary: any,
): summary is StructuredBriefSummary => {
  return (
    summary &&
    typeof summary === "object" &&
    typeof summary.summary_title === "string" &&
    Array.isArray(summary.at_a_glance) &&
    Array.isArray(summary.dynamic_sections)
  );
};

// Get field type styling for brief summary dynamic sections
const getBriefSectionStyles = (
  fieldType: string,
): {
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
} => {
  switch (fieldType.toLowerCase()) {
    case "critical":
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        iconColor: "text-red-600",
      };
    case "important":
      return {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-800",
        iconColor: "text-amber-600",
      };
    case "info":
      return {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        iconColor: "text-blue-600",
      };
    case "success":
      return {
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
        iconColor: "text-green-600",
      };
    case "warning":
      return {
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        textColor: "text-orange-800",
        iconColor: "text-orange-600",
      };
    default:
      return {
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-800",
        iconColor: "text-gray-600",
      };
  }
};

// Get icon for brief summary section based on field type
const getBriefSectionIcon = (fieldType: string, fieldName: string) => {
  const nameLower = fieldName.toLowerCase();

  // Check field name first for more specific icons
  if (nameLower.includes("critical") || nameLower.includes("alert")) {
    return <AlertOctagon size={16} />;
  }
  if (nameLower.includes("treatment") || nameLower.includes("plan")) {
    return <ClipboardList size={16} />;
  }
  if (nameLower.includes("diagnosis") || nameLower.includes("finding")) {
    return <FileSearch size={16} />;
  }
  if (nameLower.includes("medication") || nameLower.includes("prescription")) {
    return <FilePlus size={16} />;
  }
  if (nameLower.includes("recommendation")) {
    return <CheckCircle2 size={16} />;
  }
  if (nameLower.includes("status") || nameLower.includes("work")) {
    return <BadgeCheck size={16} />;
  }
  if (nameLower.includes("vital") || nameLower.includes("sign")) {
    return <Activity size={16} />;
  }

  // Fall back to field type
  switch (fieldType.toLowerCase()) {
    case "critical":
      return <AlertOctagon size={16} />;
    case "important":
      return <AlertTriangle size={16} />;
    case "info":
      return <Info size={16} />;
    case "success":
      return <CheckCircle2 size={16} />;
    case "warning":
      return <AlertCircle size={16} />;
    default:
      return <FileText size={16} />;
  }
};

// Render structured brief summary
const renderStructuredBriefSummary = (
  summary: StructuredBriefSummary,
): React.ReactNode => {
  const { summary_title, at_a_glance, dynamic_sections } = summary;

  // Sort dynamic sections by priority
  const sortedSections = [...dynamic_sections].sort(
    (a, b) => (a.priority || 999) - (b.priority || 999),
  );

  return (
    <div className="space-y-4">
      {/* Summary Title */}
      {summary_title && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-blue-900">
              {summary_title}
            </h3>
          </div>
        </div>
      )}

      {/* At a Glance Section */}
      {at_a_glance && at_a_glance.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Eye size={14} className="text-gray-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              At a Glance
            </span>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {at_a_glance.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-gray-700"
                >
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dynamic Sections */}
      {sortedSections && sortedSections.length > 0 && (
        <div className="space-y-3">
          {sortedSections.map((section, idx) => {
            const styles = getBriefSectionStyles(section.field_type);
            const icon = getBriefSectionIcon(
              section.field_type,
              section.field_name,
            );

            return (
              <div
                key={idx}
                className={`rounded-lg overflow-hidden border ${styles.borderColor}`}
              >
                {/* Section Header */}
                <div
                  className={`px-4 py-2.5 ${styles.bgColor} border-b ${styles.borderColor} flex items-center gap-2`}
                >
                  <span className={styles.iconColor}>{icon}</span>
                  <span className={`text-sm font-semibold ${styles.textColor}`}>
                    {section.field_name}
                  </span>
                  {section.priority === 1 && (
                    <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">
                      Priority
                    </span>
                  )}
                </div>
                {/* Section Content */}
                <div className="p-4 bg-white">
                  {section.content && section.content.length > 0 ? (
                    <ul className="space-y-2">
                      {section.content.map((item, contentIdx) => (
                        <li
                          key={contentIdx}
                          className="flex items-start gap-2.5 text-sm text-gray-700"
                        >
                          <span
                            className={`mt-0.5 flex-shrink-0 ${styles.iconColor}`}
                          >
                            •
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No content available
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {(!at_a_glance || at_a_glance.length === 0) &&
        (!dynamic_sections || dynamic_sections.length === 0) && (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <FileText size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No summary data available</p>
          </div>
        )}
    </div>
  );
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

  // Check if it's the new structured brief summary format
  if (isStructuredBriefSummary(data)) {
    return renderStructuredBriefSummary(data);
  }

  // Check if it's the simple key-value brief summary format
  if (isSimpleBriefSummary(data)) {
    return renderSimpleBriefSummary(data);
  }

  // Fall back to legacy format handling
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

// Light color palette for summary card pills
const PILL_COLORS = [
  {
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
  {
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  {
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  {
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
  },
  {
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
  },
  {
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    borderColor: "border-teal-200",
  },
  {
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
    borderColor: "border-pink-200",
  },
  {
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
];

// Simple hash function to get consistent color index for same key
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Get pill styling for summary card keys - uses consistent color based on key name
const getKeyPillStyle = (
  key: string,
): { bgColor: string; textColor: string; borderColor: string } => {
  const colorIndex = hashString(key.toLowerCase()) % PILL_COLORS.length;
  return PILL_COLORS[colorIndex];
};

// Format field key for display (convert SNAKE_CASE to Title Case)
const formatFieldKey = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Parse and check if long summary is structured
const parseLongSummary = (
  longSummary: any,
): StructuredLongSummary | string | null => {
  if (!longSummary) return null;

  // If it's already an object with the expected structure (new format with sections)
  if (typeof longSummary === "object" && Array.isArray(longSummary.sections)) {
    return longSummary as StructuredLongSummary;
  }

  // If it's a string, try to parse it as JSON
  if (typeof longSummary === "string") {
    try {
      const parsed = JSON.parse(longSummary);
      if (Array.isArray(parsed.sections)) {
        return parsed as StructuredLongSummary;
      }
    } catch {
      // Not JSON, return as plain string
      return longSummary;
    }
  }

  return longSummary;
};

// Check if long summary is structured
const isStructuredLongSummary = (
  summary: any,
): summary is StructuredLongSummary => {
  return (
    summary && typeof summary === "object" && Array.isArray(summary.sections)
  );
};

// Get section icon based on heading
const getSectionIcon = (heading: string) => {
  const headingLower = heading.toLowerCase();

  if (headingLower.includes("overview") || headingLower.includes("report")) {
    return <FileText size={14} className="text-blue-500" />;
  }
  if (
    headingLower.includes("patient") ||
    headingLower.includes("information")
  ) {
    return <User size={14} className="text-indigo-500" />;
  }
  if (headingLower.includes("diagnosis") || headingLower.includes("finding")) {
    return <FileSearch size={14} className="text-red-500" />;
  }
  if (headingLower.includes("clinical") || headingLower.includes("status")) {
    return <Activity size={14} className="text-green-500" />;
  }
  if (
    headingLower.includes("medication") ||
    headingLower.includes("prescription")
  ) {
    return <FilePlus size={14} className="text-purple-500" />;
  }
  if (headingLower.includes("legal") || headingLower.includes("conclusion")) {
    return <Shield size={14} className="text-amber-500" />;
  }
  if (headingLower.includes("work") || headingLower.includes("employment")) {
    return <BadgeCheck size={14} className="text-teal-500" />;
  }
  if (
    headingLower.includes("recommendation") ||
    headingLower.includes("plan")
  ) {
    return <ClipboardList size={14} className="text-blue-600" />;
  }
  if (headingLower.includes("critical") || headingLower.includes("alert")) {
    return <AlertOctagon size={14} className="text-red-600" />;
  }
  if (headingLower.includes("imaging") || headingLower.includes("scan")) {
    return <FileImage size={14} className="text-cyan-500" />;
  }
  if (headingLower.includes("history")) {
    return <History size={14} className="text-gray-500" />;
  }

  return <BookOpen size={14} className="text-gray-500" />;
};

// Get section header color based on heading
const getSectionHeaderColor = (heading: string): string => {
  const headingLower = heading.toLowerCase();

  if (headingLower.includes("critical") || headingLower.includes("alert")) {
    return "#dc2626";
  }
  if (headingLower.includes("diagnosis") || headingLower.includes("finding")) {
    return "#ef4444";
  }
  if (
    headingLower.includes("recommendation") ||
    headingLower.includes("plan")
  ) {
    return "#2563eb";
  }
  if (headingLower.includes("medication")) {
    return "#7c3aed";
  }
  if (headingLower.includes("legal") || headingLower.includes("conclusion")) {
    return "#d97706";
  }
  if (headingLower.includes("work") || headingLower.includes("status")) {
    return "#059669";
  }
  if (headingLower.includes("clinical")) {
    return "#0891b2";
  }

  return "#374151";
};

// Render structured long summary
const renderStructuredLongSummary = (
  summary: StructuredLongSummary,
): React.ReactNode => {
  const { metadata, sections, content_type } = summary;

  return (
    <div className="space-y-4">
      {/* Content Type Badge (if no metadata) */}
      {content_type && !metadata && (
        <div className="flex justify-end">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full uppercase">
            {content_type}
          </span>
        </div>
      )}

      {/* Metadata Header (legacy support) */}
      {metadata && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              {metadata.document_type || "Document"}
            </span>
            {content_type && (
              <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full uppercase">
                {content_type}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {metadata.patient_name && (
              <div className="flex items-center gap-2">
                <User size={12} className="text-gray-400" />
                <span className="text-gray-600">Patient:</span>
                <span className="font-medium text-gray-900">
                  {metadata.patient_name}
                </span>
              </div>
            )}
            {metadata.document_date && (
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-gray-400" />
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {metadata.document_date}
                </span>
              </div>
            )}
            {metadata.provider && (
              <div className="flex items-center gap-2">
                <Stethoscope size={12} className="text-gray-400" />
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium text-gray-900">
                  {metadata.provider}
                </span>
              </div>
            )}
            {metadata.claim_number && (
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-gray-400" />
                <span className="text-gray-600">Claim #:</span>
                <span className="font-medium text-gray-900">
                  {metadata.claim_number}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {sections && sections.length > 0 && (
        <div className="space-y-3">
          {sections.map((section, sectionIdx) => {
            const sectionIcon = getSectionIcon(section.heading);
            const headerColor = getSectionHeaderColor(section.heading);

            // Check if using new content_blocks format or legacy format
            const hasContentBlocks =
              section.content_blocks && section.content_blocks.length > 0;
            const hasLegacyContent =
              (section.paragraphs && section.paragraphs.length > 0) ||
              (section.bullet_points && section.bullet_points.length > 0);

            return (
              <div
                key={sectionIdx}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  {sectionIcon}
                  <span
                    className="text-sm font-semibold"
                    style={{ color: headerColor }}
                  >
                    {section.heading}
                  </span>
                </div>

                {/* Section Content */}
                <div className="p-4 space-y-3">
                  {/* New content_blocks format */}
                  {hasContentBlocks &&
                    section.content_blocks!.map((block, blockIdx) => {
                      if (block.type === "paragraph" && block.content) {
                        return (
                          <p
                            key={blockIdx}
                            className="text-sm text-gray-700 leading-relaxed"
                          >
                            {block.content}
                          </p>
                        );
                      }
                      if (
                        block.type === "bullets" &&
                        block.items &&
                        block.items.length > 0
                      ) {
                        return (
                          <ul key={blockIdx} className="space-y-2">
                            {block.items.map((item, itemIdx) => (
                              <li
                                key={itemIdx}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <span className="text-blue-500 mt-0.5 flex-shrink-0">
                                  •
                                </span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return null;
                    })}

                  {/* Legacy format: Paragraphs */}
                  {!hasContentBlocks &&
                    section.paragraphs &&
                    section.paragraphs.length > 0 && (
                      <div className="space-y-2">
                        {section.paragraphs.map((paragraph, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-sm text-gray-700 leading-relaxed"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}

                  {/* Legacy format: Bullet Points */}
                  {!hasContentBlocks &&
                    section.bullet_points &&
                    section.bullet_points.length > 0 && (
                      <ul className="space-y-2">
                        {section.bullet_points.map((bullet, bIdx) => (
                          <li key={bIdx} className="text-sm text-gray-700">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5 flex-shrink-0">
                                •
                              </span>
                              <div className="flex-1">
                                <span className="leading-relaxed">
                                  {bullet.text}
                                </span>
                                {/* Sub-bullets */}
                                {bullet.sub_bullets &&
                                  bullet.sub_bullets.length > 0 && (
                                    <ul className="mt-1.5 ml-3 space-y-1">
                                      {bullet.sub_bullets.map(
                                        (subBullet, sbIdx) => (
                                          <li
                                            key={sbIdx}
                                            className="flex items-start gap-2 text-xs text-gray-600"
                                          >
                                            <span className="text-gray-400 mt-0.5">
                                              ◦
                                            </span>
                                            <span>{subBullet}</span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                  {/* Empty section fallback */}
                  {!hasContentBlocks && !hasLegacyContent && (
                    <p className="text-sm text-gray-400 italic">
                      No content available
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty sections fallback */}
      {(!sections || sections.length === 0) && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <FileText size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No detailed summary available</p>
        </div>
      )}
    </div>
  );
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
  if (
    fieldLower.includes("medication") ||
    fieldLower.includes("prescription")
  ) {
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
            <div className="italic text-gray-600">"{citation.source_text}"</div>
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

    // Check if it's the new format (summary is Record<string, string[]>)
    const isNewFormat =
      summaryContent &&
      typeof summaryContent === "object" &&
      !Array.isArray(summaryContent) &&
      !("items" in summaryContent);

    if (isNewFormat) {
      // Render new format using the simple brief summary renderer
      const summaryData = summaryContent as Record<string, string[]>;

      // Filter out empty arrays and sort by priority
      const entries = Object.entries(summaryData)
        .filter(([, value]) => Array.isArray(value) && value.length > 0)
        .map(([key, value]) => ({
          fieldName: key,
          items: value as string[],
          config: getFieldConfig(key),
        }))
        .sort((a, b) => a.config.priority - b.config.priority);

      return (
        <div className="space-y-3">
          {/* Header Info */}
          {header && (
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={12} className="text-gray-400" />
                  <span>{header.date}</span>
                  <span className="text-gray-300">•</span>
                  <User size={12} className="text-gray-400" />
                  <span className="truncate max-w-[200px]">
                    {header.author}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Sections */}
          {entries.length > 0 ? (
            entries.map(({ fieldName, items, config }, idx) => {
              const isCritical = fieldName.toLowerCase().includes("critical");

              return (
                <div
                  key={idx}
                  className={`rounded-lg overflow-hidden border ${config.borderColor} ${isCritical ? "ring-1 ring-red-300" : ""}`}
                >
                  {/* Section Header */}
                  <div
                    className={`px-3 py-2 ${config.bgColor} border-b ${config.borderColor} flex items-center gap-2`}
                  >
                    <span className={config.iconColor}>
                      {getSimpleBriefIcon(config.icon)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${config.textColor}`}
                    >
                      {fieldName}
                    </span>
                    {isCritical && (
                      <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded-full uppercase">
                        Priority
                      </span>
                    )}
                  </div>

                  {/* Section Content */}
                  <div className="p-3 bg-white">
                    <ul className="space-y-1.5">
                      {items.map((item, itemIdx) => (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span
                            className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}
                          >
                            •
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-gray-500 italic text-center py-4">
              No summary data available
            </div>
          )}

          {/* Disclaimer */}
          {header?.disclaimer && (
            <div className="text-[10px] text-gray-400 italic pt-2 border-t border-gray-100">
              {header.disclaimer}
            </div>
          )}
        </div>
      );
    }

    // Legacy format rendering
    const legacySummary = summaryContent as { items: SummaryItem[] };
    const allItems = legacySummary?.items || [];

    return (
      <div className="space-y-3">
        {/* Header Info */}
        {header && (
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} className="text-gray-400" />
                <span>{header.date}</span>
                <span className="text-gray-300">•</span>
                <User size={12} className="text-gray-400" />
                <span className="truncate max-w-[200px]">{header.author}</span>
              </div>
            </div>
          </div>
        )}

        {/* All Summary Items */}
        {allItems.length > 0 && (
          <div className="space-y-2.5">
            {allItems.map((item, idx) => {
              const isExpanded = expandedItemsSet.has(idx);
              const label =
                FIELD_LABELS[item.field] || formatFieldKey(item.field);
              const pillStyle = getKeyPillStyle(item.field);

              return (
                <div key={idx} className="group">
                  {/* Item Row */}
                  <div
                    className="flex items-start gap-3 cursor-pointer hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => {
                      if (item.expanded) {
                        toggleItemExpanded(docId, idx);
                      }
                    }}
                  >
                    {/* Key Pill */}
                    <div className="flex-shrink-0 pt-0.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${pillStyle.bgColor} ${pillStyle.textColor} ${pillStyle.borderColor}`}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Value Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-relaxed">
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
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        {header?.disclaimer && (
          <div className="text-[10px] text-gray-400 italic pt-2 border-t border-gray-100">
            {header.disclaimer}
          </div>
        )}
      </div>
    );
  };

  // Long summary color palette for hash-based fallback
  const LONG_SUMMARY_COLORS = [
    { text: "#dc2626", bg: "#fef2f2", border: "border-red-200" }, // Red
    { text: "#2563eb", bg: "#eff6ff", border: "border-blue-200" }, // Blue
    { text: "#059669", bg: "#ecfdf5", border: "border-green-200" }, // Green
    { text: "#7c3aed", bg: "#f5f3ff", border: "border-purple-200" }, // Purple
    { text: "#d97706", bg: "#fffbeb", border: "border-amber-200" }, // Amber
    { text: "#0891b2", bg: "#ecfeff", border: "border-cyan-200" }, // Cyan
    { text: "#4f46e5", bg: "#eef2ff", border: "border-indigo-200" }, // Indigo
    { text: "#0d9488", bg: "#f0fdfa", border: "border-teal-200" }, // Teal
    { text: "#db2777", bg: "#fdf2f8", border: "border-pink-200" }, // Pink
    { text: "#ea580c", bg: "#fff7ed", border: "border-orange-200" }, // Orange
  ];

  // Hash function for long summary headings
  const hashHeading = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Get color for heading based on content (dynamic - works with any heading)
  const getHeadingColor = (heading: string): string => {
    const headingLower = heading.toLowerCase();

    // Critical/Findings - Red
    if (headingLower.includes("finding") || headingLower.includes("impression"))
      return "#dc2626";
    if (
      headingLower.includes("diagnosis") ||
      headingLower.includes("assessment")
    )
      return "#ef4444";

    // Recommendations/Plan - Blue
    if (
      headingLower.includes("recommendation") ||
      headingLower.includes("plan")
    )
      return "#2563eb";

    // Medications - Purple
    if (
      headingLower.includes("medication") ||
      headingLower.includes("prescription")
    )
      return "#7c3aed";

    // History - Cyan
    if (headingLower.includes("history") || headingLower.includes("complaint"))
      return "#0891b2";

    // Exam/Technique/Procedure - Green
    if (
      headingLower.includes("exam") ||
      headingLower.includes("physical") ||
      headingLower.includes("technique") ||
      headingLower.includes("procedure")
    )
      return "#059669";

    // Patient/Provider/Document Info - Indigo
    if (
      headingLower.includes("patient") ||
      headingLower.includes("provider") ||
      headingLower.includes("author") ||
      headingLower.includes("signed") ||
      headingLower.includes("document") ||
      headingLower.includes("overview")
    )
      return "#4f46e5";

    // Work/Status - Amber
    if (headingLower.includes("work") || headingLower.includes("status"))
      return "#d97706";

    // Vitals/Allergies - Pink
    if (headingLower.includes("vital") || headingLower.includes("allerg"))
      return "#db2777";

    // Imaging/Lab/Clinical - Slate Blue
    if (
      headingLower.includes("imaging") ||
      headingLower.includes("lab") ||
      headingLower.includes("indication") ||
      headingLower.includes("clinical")
    )
      return "#6366f1";

    // Summary/Conclusion - Teal
    if (headingLower.includes("summary") || headingLower.includes("conclusion"))
      return "#0d9488";

    // Request/Details - Sky Blue
    if (headingLower.includes("request") || headingLower.includes("detail"))
      return "#0284c7";

    // Medical Necessity/Justification - Orange
    if (
      headingLower.includes("necessity") ||
      headingLower.includes("justification")
    )
      return "#ea580c";

    // Hash-based fallback for unknown headings
    const colorIndex = hashHeading(headingLower) % LONG_SUMMARY_COLORS.length;
    return LONG_SUMMARY_COLORS[colorIndex].text;
  };

  // Get background color for heading (dynamic - works with any heading)
  const getHeadingBgColor = (heading: string): string => {
    const headingLower = heading.toLowerCase();

    // Critical/Findings - Red bg
    if (headingLower.includes("finding") || headingLower.includes("impression"))
      return "#fef2f2";
    if (
      headingLower.includes("diagnosis") ||
      headingLower.includes("assessment")
    )
      return "#fef2f2";

    // Recommendations/Plan - Blue bg
    if (
      headingLower.includes("recommendation") ||
      headingLower.includes("plan")
    )
      return "#eff6ff";

    // Medications - Purple bg
    if (
      headingLower.includes("medication") ||
      headingLower.includes("prescription")
    )
      return "#f5f3ff";

    // History - Cyan bg
    if (headingLower.includes("history") || headingLower.includes("complaint"))
      return "#ecfeff";

    // Exam/Technique/Procedure - Green bg
    if (
      headingLower.includes("exam") ||
      headingLower.includes("physical") ||
      headingLower.includes("technique") ||
      headingLower.includes("procedure")
    )
      return "#ecfdf5";

    // Patient/Provider/Document Info - Indigo bg
    if (
      headingLower.includes("patient") ||
      headingLower.includes("provider") ||
      headingLower.includes("author") ||
      headingLower.includes("signed") ||
      headingLower.includes("document") ||
      headingLower.includes("overview")
    )
      return "#eef2ff";

    // Work/Status - Amber bg
    if (headingLower.includes("work") || headingLower.includes("status"))
      return "#fffbeb";

    // Vitals/Allergies - Pink bg
    if (headingLower.includes("vital") || headingLower.includes("allerg"))
      return "#fdf2f8";

    // Imaging/Lab/Clinical - Indigo bg
    if (
      headingLower.includes("imaging") ||
      headingLower.includes("lab") ||
      headingLower.includes("indication") ||
      headingLower.includes("clinical")
    )
      return "#eef2ff";

    // Summary/Conclusion - Teal bg
    if (headingLower.includes("summary") || headingLower.includes("conclusion"))
      return "#f0fdfa";

    // Request/Details - Sky bg
    if (headingLower.includes("request") || headingLower.includes("detail"))
      return "#f0f9ff";

    // Medical Necessity/Justification - Orange bg
    if (
      headingLower.includes("necessity") ||
      headingLower.includes("justification")
    )
      return "#fff7ed";

    // Hash-based fallback for unknown headings
    const colorIndex = hashHeading(headingLower) % LONG_SUMMARY_COLORS.length;
    return LONG_SUMMARY_COLORS[colorIndex].bg;
  };

  // Get border color for heading
  const getHeadingBorderColor = (heading: string): string => {
    const headingLower = heading.toLowerCase();

    if (
      headingLower.includes("finding") ||
      headingLower.includes("impression") ||
      headingLower.includes("diagnosis") ||
      headingLower.includes("assessment")
    )
      return "border-red-200";
    if (
      headingLower.includes("recommendation") ||
      headingLower.includes("plan")
    )
      return "border-blue-200";
    if (
      headingLower.includes("medication") ||
      headingLower.includes("prescription")
    )
      return "border-purple-200";
    if (headingLower.includes("history") || headingLower.includes("complaint"))
      return "border-cyan-200";
    if (
      headingLower.includes("exam") ||
      headingLower.includes("physical") ||
      headingLower.includes("technique") ||
      headingLower.includes("procedure")
    )
      return "border-green-200";
    if (
      headingLower.includes("patient") ||
      headingLower.includes("provider") ||
      headingLower.includes("author") ||
      headingLower.includes("signed") ||
      headingLower.includes("document") ||
      headingLower.includes("overview")
    )
      return "border-indigo-200";
    if (headingLower.includes("work") || headingLower.includes("status"))
      return "border-amber-200";
    if (headingLower.includes("vital") || headingLower.includes("allerg"))
      return "border-pink-200";
    if (
      headingLower.includes("imaging") ||
      headingLower.includes("lab") ||
      headingLower.includes("indication") ||
      headingLower.includes("clinical")
    )
      return "border-indigo-200";
    if (headingLower.includes("summary") || headingLower.includes("conclusion"))
      return "border-teal-200";
    if (headingLower.includes("request") || headingLower.includes("detail"))
      return "border-sky-200";
    if (
      headingLower.includes("necessity") ||
      headingLower.includes("justification")
    )
      return "border-orange-200";

    // Hash-based fallback for unknown headings
    const colorIndex = hashHeading(headingLower) % LONG_SUMMARY_COLORS.length;
    return LONG_SUMMARY_COLORS[colorIndex].border;
  };

  // Get icon for long summary section heading
  const getLongSummaryIcon = (heading: string) => {
    const headingLower = heading.toLowerCase();

    if (headingLower.includes("finding") || headingLower.includes("impression"))
      return <FileSearch size={14} />;
    if (
      headingLower.includes("diagnosis") ||
      headingLower.includes("assessment")
    )
      return <Stethoscope size={14} />;
    if (
      headingLower.includes("recommendation") ||
      headingLower.includes("plan")
    )
      return <ClipboardList size={14} />;
    if (
      headingLower.includes("medication") ||
      headingLower.includes("prescription")
    )
      return <FilePlus size={14} />;
    if (headingLower.includes("history") || headingLower.includes("complaint"))
      return <History size={14} />;
    if (
      headingLower.includes("exam") ||
      headingLower.includes("physical") ||
      headingLower.includes("technique") ||
      headingLower.includes("procedure")
    )
      return <Activity size={14} />;
    if (
      headingLower.includes("patient") ||
      headingLower.includes("provider") ||
      headingLower.includes("author") ||
      headingLower.includes("signed")
    )
      return <User size={14} />;
    if (headingLower.includes("document") || headingLower.includes("overview"))
      return <FileText size={14} />;
    if (headingLower.includes("work") || headingLower.includes("status"))
      return <BadgeCheck size={14} />;
    if (headingLower.includes("vital")) return <Activity size={14} />;
    if (headingLower.includes("allerg")) return <AlertCircle size={14} />;
    if (headingLower.includes("imaging") || headingLower.includes("lab"))
      return <FileImage size={14} />;
    if (
      headingLower.includes("indication") ||
      headingLower.includes("clinical")
    )
      return <Info size={14} />;
    if (headingLower.includes("summary") || headingLower.includes("conclusion"))
      return <BookOpen size={14} />;
    if (headingLower.includes("request") || headingLower.includes("detail"))
      return <FileCheck size={14} />;
    if (
      headingLower.includes("necessity") ||
      headingLower.includes("justification")
    )
      return <Shield size={14} />;

    return <FileText size={14} />;
  };

  // Dynamic heading detection for plain text long summaries
  const isLikelyHeading = (
    line: string,
    nextLine: string | undefined,
    prevLine: string | undefined,
  ): boolean => {
    const trimmedLine = line.trim();
    const trimmedNextLine = nextLine?.trim() || "";

    // Empty lines are not headings
    if (!trimmedLine) return false;

    // Lines of only dashes are separators, not headings
    if (/^[-=]+$/.test(trimmedLine)) return false;

    // If next line is a separator (dashes), current line is a heading
    if (/^[-=]{3,}$/.test(trimmedNextLine)) return true;

    // Lines that are short (< 60 chars), don't start with bullet, and don't end with period
    // are likely headings if followed by content
    const isShort = trimmedLine.length < 60;
    const doesntStartWithBullet = !trimmedLine.startsWith("•");
    const doesntEndWithPeriod = !trimmedLine.endsWith(".");
    const doesntContainColon =
      !trimmedLine.includes(":") || trimmedLine.endsWith(":");
    const startsWithCapital = /^[A-Z]/.test(trimmedLine);
    const isAllCapsOrTitleCase =
      /^[A-Z][A-Za-z\s\/\-&]+$/.test(trimmedLine) ||
      /^[A-Z\s\/\-&]+$/.test(trimmedLine);

    // Check for common heading patterns
    const commonHeadingPatterns = [
      /^(Author|Signed|Prepared)\s*(By)?:/i,
      /Information$/i,
      /^(Clinical|Medical|Patient|Exam|Report|Document)/i,
      /^(Findings|Impression|Diagnosis|Assessment)/i,
      /^(Recommendations?|Plan|Treatment)/i,
      /^(Technique|Method|Procedure)/i,
      /^(History|Background|Overview)/i,
      /^(Summary|Conclusion|Results?)/i,
      /^(Medications?|Prescriptions?)/i,
      /^(Work|MMI|Disability)\s*Status/i,
    ];

    const matchesCommonPattern = commonHeadingPatterns.some((pattern) =>
      pattern.test(trimmedLine),
    );

    if (matchesCommonPattern) return true;

    // Short, title-case lines without periods that appear between blank lines
    if (
      isShort &&
      doesntStartWithBullet &&
      doesntEndWithPeriod &&
      startsWithCapital &&
      isAllCapsOrTitleCase
    ) {
      return true;
    }

    return false;
  };

  // Render plain text long summary with professional formatting (dynamic heading detection)
  const renderPlainTextLongSummary = (summary: string): React.ReactNode => {
    if (!summary) return null;

    // Clean up the summary (minimal cleaning to preserve structure)
    const cleanedSummary = summary
      .replace(/[\[\]"]/g, "")
      .replace(/\{/g, "")
      .replace(/\}/g, "");

    // Define section type
    type SectionType = { heading: string; content: string[] };

    // Split into lines
    const lines = cleanedSummary.split("\n");
    const sections: SectionType[] = [];
    let currentSection: SectionType | null = null;
    let skipNextLine = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const nextLine = lines[index + 1];
      const prevLine = lines[index - 1];

      // Skip separator lines (dashes)
      if (/^[-=]{3,}$/.test(trimmedLine)) {
        skipNextLine = false;
        return;
      }

      // Skip empty lines
      if (!trimmedLine) return;

      // Check if this line is a heading using dynamic detection
      const isHeading = isLikelyHeading(trimmedLine, nextLine, prevLine);

      if (isHeading) {
        // Save previous section if exists
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        // Start new section (clean up the heading - remove trailing colons for consistency)
        const cleanHeading = trimmedLine.replace(/:$/, "").trim();
        currentSection = { heading: cleanHeading, content: [] } as SectionType;
      } else if (currentSection) {
        currentSection.content.push(trimmedLine);
      } else {
        // Content before any heading - create an intro section
        if (!sections.length) {
          currentSection = {
            heading: "",
            content: [trimmedLine],
          } as SectionType;
        } else if (sections[0].heading === "") {
          sections[0].content.push(trimmedLine);
        } else {
          sections.unshift({
            heading: "",
            content: [trimmedLine],
          } as SectionType);
        }
      }
    });

    // Don't forget the last section
    if (currentSection && (currentSection as SectionType).content.length > 0) {
      sections.push(currentSection);
    }

    // If no sections were detected, render as simple formatted text
    if (
      sections.length === 0 ||
      (sections.length === 1 && !sections[0].heading)
    ) {
      return (
        <div className="space-y-3">
          {lines
            .filter((line) => line.trim() && !/^[-=]{3,}$/.test(line.trim()))
            .map((line, idx) => {
              const trimmedLine = line.trim();
              const isBullet = trimmedLine.startsWith("•");
              if (isBullet) {
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{trimmedLine.replace(/^•\s*/, "")}</span>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                  {trimmedLine}
                </p>
              );
            })}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sections.map((section, sectionIdx) => {
          if (!section.heading && section.content.length === 0) return null;

          const headingColor = getHeadingColor(section.heading);
          const headingBgColor = getHeadingBgColor(section.heading);
          const borderColor = getHeadingBorderColor(section.heading);
          const icon = getLongSummaryIcon(section.heading);

          return (
            <div
              key={sectionIdx}
              className={`rounded-xl overflow-hidden border ${borderColor} shadow-sm`}
            >
              {/* Section Heading */}
              {section.heading && (
                <div
                  className={`px-4 py-3 border-b ${borderColor} flex items-center gap-2.5`}
                  style={{ backgroundColor: headingBgColor }}
                >
                  <span style={{ color: headingColor }}>{icon}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: headingColor }}
                  >
                    {section.heading}
                  </span>
                </div>
              )}

              {/* Section Content */}
              {section.content.length > 0 && (
                <div className="p-4 bg-white space-y-2.5">
                  {section.content.map((line, lineIdx) => {
                    const isBullet = line.startsWith("•");
                    if (isBullet) {
                      return (
                        <div
                          key={lineIdx}
                          className="flex items-start gap-2.5 text-sm text-gray-700"
                        >
                          <span
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: headingColor }}
                          >
                            •
                          </span>
                          <span className="leading-relaxed">
                            {line.replace(/^•\s*/, "")}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <p
                        key={lineIdx}
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Function to format long summary with colors (legacy support)
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
      toast.error("Document preview not available");
      return;
    }

    const token = session?.user?.fastapi_token;
    if (!token) {
      console.error("No auth token available for preview");
      toast.error("Authentication required. Please sign in again.");
      return;
    }

    const docId = doc.document_id;
    if (!docId || loadingPreviews.has(docId)) return;

    setLoadingPreviews((prev) => new Set([...prev, docId]));

    try {
      const previewUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL
      }/api/documents/preview/${encodeURIComponent(doc.blob_path)}`;

      console.log("Preview request:", { url: previewUrl, hasToken: !!token });

      const response = await fetch(previewUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`Preview failed: ${response.status}`, errorText);
        throw new Error(`Failed to fetch preview: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error fetching preview:", error);
      toast.error("Failed to load document preview");
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
                      if (
                        expandedLongSummary &&
                        expandedLongSummary !== group.docId
                      ) {
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
                              <BadgeCheck
                                size={16}
                                className="text-green-600 flex-shrink-0"
                              />
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
                                <span>
                                  {group.shortSummary.header.source_type}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center flex-shrink-0">
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors ${
                              isPreviewLoading
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
                            {(() => {
                              const parsedLong = parseLongSummary(
                                group.longSummary,
                              );
                              if (isStructuredLongSummary(parsedLong)) {
                                return renderStructuredLongSummary(parsedLong);
                              }
                              // Use professional plain text renderer for string summaries
                              const summaryText =
                                typeof parsedLong === "string"
                                  ? parsedLong
                                  : group.longSummary ||
                                    group.briefSummary ||
                                    "";
                              return renderPlainTextLongSummary(summaryText);
                            })()}
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
                        <span>Quick Overview</span>
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
      <Dialog open={isVerifyingGlobal} onOpenChange={() => {}}>
        <DialogContent className="max-w-[300px] p-8 flex flex-col items-center justify-center border-none shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          <div className="relative flex items-center justify-center w-20 h-20 mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <Loader2 size={32} className="text-blue-600 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Verifying Document
            </h3>
            <p className="text-sm text-gray-500">
              Updating treatment history...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsNewSection;
