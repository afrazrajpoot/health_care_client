import React, { useState } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Stethoscope,
  User,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";

// Define interfaces for the new data structure
interface ContentItem {
  field: string;
  collapsed: string;
  expanded: string;
}

interface ReportEntry {
  report_date: string;
  physician: string;
  title?: string;
  content: ContentItem[];
  gcs_file_link?: string;
  blob_path?: string;
}

interface TreatmentHistoryData {
  [key: string]: ReportEntry[];
}

interface DocumentData {
  treatment_history?: TreatmentHistoryData;
  [key: string]: any;
}

interface TreatmentHistoryProps {
  documentData: DocumentData | null;
  onSelectDocument?: (docId: string | null) => void;
  selectedDocumentId?: string | null;
}

interface SystemConfigItem {
  name: string;
  color: string;
  id: string;
}

const TreatmentHistory: React.FC<TreatmentHistoryProps> = ({
  documentData,
  onSelectDocument,
  selectedDocumentId,
}) => {
  const { data: session } = useSession();
  const [expandedSystems, setExpandedSystems] = useState<
    Record<string, boolean>
  >({});
  const [expandedReports, setExpandedReports] = useState<
    Record<string, boolean>
  >({});
  const [expandedContentItems, setExpandedContentItems] = useState<
    Record<string, boolean>
  >({});

  // Toggle body system expansion
  const toggleSystem = (systemId: string) => {
    setExpandedSystems((prev) => ({
      ...prev,
      [systemId]: !prev[systemId],
    }));
  };

  // Toggle report expansion
  const toggleReport = (systemId: string, reportIndex: number) => {
    const key = `${systemId}-${reportIndex}`;
    setExpandedReports((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle content item expansion
  const toggleContentItem = (
    systemId: string,
    reportIndex: number,
    itemIndex: number,
  ) => {
    const key = `${systemId}-${reportIndex}-${itemIndex}`;
    setExpandedContentItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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

  // Color mapping for systems
  const systemColors: Record<string, string> = {
    orange: "bg-orange-50 border-orange-100 text-orange-800",
    green: "bg-green-50 border-green-100 text-green-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
    teal: "bg-teal-50 border-teal-100 text-teal-800",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-800",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-800",
    gray: "bg-gray-50 border-gray-100 text-gray-800",
    red: "bg-red-50 border-red-100 text-red-800",
    pink: "bg-pink-50 border-pink-100 text-pink-800",
  };

  const systemIconColors: Record<string, string> = {
    orange: "text-orange-500",
    green: "text-green-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
    teal: "text-teal-500",
    yellow: "text-yellow-500",
    indigo: "text-indigo-500",
    gray: "text-gray-500",
    red: "text-red-500",
    pink: "text-pink-500",
  };

  // Map your system keys to the UI format
  const systemConfig: Record<string, SystemConfigItem> = {
    musculoskeletal_system: {
      name: "🦴 Musculoskeletal System",
      color: "orange",
      id: "musculoskeletal_system",
    },
    cardiovascular_system: {
      name: "❤️ Cardiovascular System",
      color: "blue",
      id: "cardiovascular_system",
    },
    pulmonary_respiratory: {
      name: "🫁 Pulmonary / Respiratory",
      color: "green",
      id: "pulmonary_respiratory",
    },
    neurological: {
      name: "🧠 Neurological",
      color: "purple",
      id: "neurological",
    },
    gastrointestinal: {
      name: "🧬 Gastrointestinal",
      color: "teal",
      id: "gastrointestinal",
    },
    metabolic_endocrine: {
      name: "⚖️ Metabolic / Endocrine",
      color: "yellow",
      id: "metabolic_endocrine",
    },
    general_treatments: {
      name: "💊 General Treatments",
      color: "indigo",
      id: "general_treatments",
    },
    other_systems: {
      name: "📋 Other Systems",
      color: "gray",
      id: "other_systems",
    },
    psychiatric_mental_health: {
      name: "🧠 Psychiatric / Mental Health",
      color: "purple",
      id: "psychiatric_mental_health",
    },
    dental_oral: {
      name: "🦷 Dental / Oral",
      color: "blue",
      id: "dental_oral",
    },
    dermatological: {
      name: "🩹 Dermatological",
      color: "orange",
      id: "dermatological",
    },
    ent_head_neck: {
      name: "👂 ENT / Head & Neck",
      color: "teal",
      id: "ent_head_neck",
    },
    genitourinary_renal: {
      name: "🫘 Genitourinary / Renal",
      color: "yellow",
      id: "genitourinary_renal",
    },
    hematologic_lymphatic: {
      name: "🩸 Hematologic / Lymphatic",
      color: "red",
      id: "hematologic_lymphatic",
    },
    immune_allergy: {
      name: "🛡️ Immune / Allergy",
      color: "green",
      id: "immune_allergy",
    },
    ophthalmologic: {
      name: "👁️ Ophthalmologic",
      color: "blue",
      id: "ophthalmologic",
    },
    reproductive_obstetric_gynecologic: {
      name: "🩺 Reproductive / OB-GYN",
      color: "pink",
      id: "reproductive_obstetric_gynecologic",
    },
    sleep_disorders: {
      name: "😴 Sleep Disorders",
      color: "indigo",
      id: "sleep_disorders",
    },
  };

  // Field Labels Mapping (similar to WhatsNewSection)
  const FIELD_LABELS: Record<string, string> = {
    findings: "Key Findings",
    diagnosis: "Diagnosis",
    recommendations: "Recommendations",
    work_status: "Work Status",
    mmi_status: "MMI Status",
    // Add more mappings as needed
  };

  const getFieldLabel = (field: string) =>
    FIELD_LABELS[field.toLowerCase()] ||
    field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const getFieldColor = (field: string) => {
    const f = field.toLowerCase();
    if (f.includes("finding")) return "text-red-600 bg-red-50 border-red-100";
    if (f.includes("recommendation"))
      return "text-blue-600 bg-blue-50 border-blue-100";
    if (f.includes("diagnosis"))
      return "text-purple-600 bg-purple-50 border-purple-100";
    return "text-gray-700 bg-gray-50 border-gray-100";
  };

  const handleDocumentOpen = async (
    e: React.MouseEvent,
    link?: string,
    blobPath?: string,
  ) => {
    e.stopPropagation();

    if (blobPath) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/documents/preview/${encodeURIComponent(blobPath)}`,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.fastapi_token}`,
            },
          },
        );

        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
          return;
        }
      } catch (error) {
        console.error("Error fetching preview:", error);
      }
    }

    if (link) {
      window.open(link, "_blank");
      return;
    }
  };

  const treatmentHistory = documentData?.treatment_history || {};

  // Filter systems that have data
  const activeSystems = Object.entries(treatmentHistory).filter(
    ([key, reports]) => {
      return Array.isArray(reports) && reports.length > 0 && systemConfig[key];
    },
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-6">
      <div className="border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
        <ClipboardList className="text-blue-600" size={24} />
        <h3 className="text-lg font-bold text-gray-800">
          Comprehensive Treatment History
        </h3>
      </div>

      {activeSystems.length > 0 ? (
        <div className="space-y-4">
          {activeSystems.map(([systemKey, reports]) => {
            const config = systemConfig[systemKey];
            const isSystemExpanded = expandedSystems[config.id];

            return (
              <div
                key={config.id}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${isSystemExpanded ? "shadow-md ring-1 ring-blue-100" : "hover:border-blue-200"}`}
              >
                {/* System Header */}
                <div
                  className={`p-4 cursor-pointer flex justify-between items-center select-none ${isSystemExpanded ? "bg-gray-50" : "bg-white"
                    }`}
                  onClick={() => toggleSystem(config.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 text-base">
                      {config.name}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium text-xs border border-gray-200">
                      {reports.length} Reports
                    </span>
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${isSystemExpanded ? "rotate-180" : ""}`}
                  >
                    <ChevronDown className="text-gray-400" size={20} />
                  </div>
                </div>

                {/* System Content (List of Reports) */}
                {isSystemExpanded && (
                  <div className="p-4 bg-white border-t border-gray-100 animate-fadeIn space-y-3">
                    {reports.map((report, reportIndex) => {
                      const isReportExpanded =
                        expandedReports[`${config.id}-${reportIndex}`];

                      return (
                        <div
                          key={reportIndex}
                          className={`border rounded-lg overflow-hidden transition-all ${selectedDocumentId === (report as any).document_id ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'border-gray-100'}`}
                          onClick={() => {
                            if ((report as any).document_id && onSelectDocument) {
                              onSelectDocument((report as any).document_id);
                            }
                          }}
                        >
                          {/* Report Header */}
                          <div
                            className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isReportExpanded ? "bg-gray-50 border-b border-gray-100" : ""}`}
                            onClick={() => toggleReport(config.id, reportIndex)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Calendar size={14} className="text-gray-400" />
                                {report.report_date}
                              </div>
                              <div className="w-px h-4 bg-gray-300"></div>
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                <User size={14} className="text-blue-400" />
                                {report.physician}
                              </div>
                              {/* {report.title && (
                                <>
                                  <div className="w-px h-4 bg-gray-300"></div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <FileText
                                      size={14}
                                      className="text-gray-400"
                                    />
                                    {report.title}
                                  </div>
                                </>
                              )} */}
                            </div>
                            <div className="flex items-center gap-3">
                              {report.gcs_file_link && (
                                <button
                                  className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-blue-600 hover:shadow-sm"
                                  onClick={(e) =>
                                    handleDocumentOpen(
                                      e,
                                      report.gcs_file_link,
                                      report.blob_path,
                                    )
                                  }
                                  title="Open Document"
                                >
                                  <FileText size={16} />
                                </button>
                              )}
                              <ChevronRight
                                size={16}
                                className={`text-gray-400 transition-transform duration-200 ${isReportExpanded ? "rotate-90" : ""}`}
                              />
                            </div>
                          </div>

                          {/* Report Content (Key-Value Items) */}
                          {isReportExpanded && (
                            <div className="p-3 bg-gray-50/50 space-y-2">
                              {report.content?.map((item, itemIndex) => {
                                const isItemExpanded =
                                  expandedContentItems[
                                  `${config.id}-${reportIndex}-${itemIndex}`
                                  ];
                                const colorClass = getFieldColor(item.field);

                                return (
                                  <div
                                    key={itemIndex}
                                    className="bg-white border border-gray-100 rounded-md shadow-sm overflow-hidden"
                                  >
                                    <div
                                      className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                      onClick={() =>
                                        toggleContentItem(
                                          config.id,
                                          reportIndex,
                                          itemIndex,
                                        )
                                      }
                                    >
                                      <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 flex items-start gap-3">
                                          <div className="min-w-[140px] flex-shrink-0 pt-0.5">
                                            <span
                                              className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${colorClass}`}
                                            >
                                              {getFieldLabel(item.field)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700 leading-relaxed pt-0.5">
                                            {item.collapsed}
                                          </p>
                                        </div>
                                        {item.expanded &&
                                          item.expanded !== item.collapsed && (
                                            <ChevronDown
                                              size={16}
                                              className={`text-gray-400 mt-1 flex-shrink-0 transition-transform duration-200 ${isItemExpanded ? "rotate-180" : ""}`}
                                            />
                                          )}
                                      </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isItemExpanded &&
                                      item.expanded &&
                                      item.expanded !== item.collapsed && (
                                        <div className="px-3 pb-3 pt-0 text-sm text-gray-600 bg-gray-50/30">
                                          {renderExpandedText(item.expanded)}
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                              {report.content.length === 0 && (
                                <div className="text-center py-2 text-gray-400 text-xs italic">
                                  No details available.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-3">
            <ClipboardList className="text-gray-300" size={32} />
          </div>
          <p className="text-lg font-medium text-gray-900">
            No treatment history available
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
            Treatment records will appear here once documents are processed and
            verified.
          </p>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;
