// components/physician-components/TreatmentHistorySection.tsx
import { useTreatmentHistory } from "@/app/custom-hooks/staff-hooks/physician-hooks/useTreatmentHistory";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Define TypeScript interfaces for treatment history events
interface TreatmentEvent {
  date: string;
  event: string;
  details: string;
}

interface TreatmentHistory {
  musculoskeletal_system: TreatmentEvent[];
  cardiovascular_system: TreatmentEvent[];
  pulmonary_respiratory: TreatmentEvent[];
  neurological: TreatmentEvent[];
  gastrointestinal: TreatmentEvent[];
  metabolic_endocrine: TreatmentEvent[];
  other_systems: TreatmentEvent[];
  general_treatments: TreatmentEvent[];
}

interface TreatmentHistorySummary {
  total_events: number;
  categories_with_events: number;
  most_active_category: string | null;
  most_active_category_count: number;
  latest_event_date: string | null;
  oldest_event_date: string | null;
}

// Define TypeScript interfaces for body part snapshots - Extended for GM fields
interface BodyPartSnapshot {
  id: string;
  bodyPart: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  urDecision?: string;
  recommended?: string;
  aiOutcome?: string;
  consultingDoctor?: string;
  document_id?: string;
  document_created_at?: string;
  document_report_date?: string;
  referralDoctor?: string;
  condition?: string;
  conditionSeverity?: string;
  symptoms?: string;
  medications?: string;
  chronicCondition?: boolean;
  comorbidities?: string;
  lifestyleRecommendations?: string;
  keyFindings?: string;
  treatmentApproach?: string;
  clinicalSummary?: string;
  adlsAffected?: string;
  functionalLimitations?: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  body_part_snapshots?: BodyPartSnapshot[];
  whats_new?: { [key: string]: string };
  quick_notes_snapshots?: {
    details: string;
    timestamp: string;
    one_line_note: string;
    status_update: string;
  }[];
  adl?: {
    adls_affected: string;
    adls_affected_history: string;
    work_restrictions: string;
    work_restrictions_history: string;
    has_changes: boolean;
  };
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: {
    type: string;
    date: string;
    summary: string;
    brief_summary?: string;
    document_id?: string;
  }[];
  patient_quiz?: {
    id: string;
    patientName: string;
    dob: string;
    doi: string;
    lang: string;
    newAppt: string;
    appts: Array<{
      date: string;
      type: string;
      other: string;
    }>;
    pain: number;
    workDiff: string;
    trend: string;
    workAbility: string;
    barrier: string;
    adl: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: {
    [key: string]: {
      type: string;
      date: string;
      summary: string;
      brief_summary?: string;
      document_id?: string;
    };
  };
  allVerified?: boolean;
  gcs_file_link?: string;
  blob_path?: string;
  // 🆕 Treatment history fields
  treatment_history?: TreatmentHistory;
  treatment_history_summary?: TreatmentHistorySummary;
}

// Icon components
const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const MedicalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

const TimelineIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1.73 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <path d="M3.27 6.96L12 12.01l8.73-5.05"></path>
    <path d="M12 22.08V12"></path>
  </svg>
);

interface TreatmentHistorySectionProps {
  documentData: DocumentData | null;
  mode: "wc" | "gm";
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string, index?: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const TreatmentHistorySection: React.FC<TreatmentHistorySectionProps> = ({
  documentData,
  mode,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}) => {
  console.log("Document data:", documentData);
  console.log("Treatment history data:", documentData?.treatment_history);
  
  // State for expanded/collapsed treatment history categories
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>({});

  // State for expanded event details
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});

  // State for summarize modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Initialize expanded categories on mount
  useEffect(() => {
    if (documentData?.treatment_history) {
      const initialExpanded: { [key: string]: boolean } = {};
      Object.keys(documentData.treatment_history).forEach(category => {
        initialExpanded[category] = true; // Default to expanded
      });
      setExpandedCategories(initialExpanded);
    }
  }, [documentData]);

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Content copied to clipboard");
      toast.success("✅ Copied to clipboard", {
        duration: 3000,
        position: "top-right",
      });
      return true;
    } catch (err) {
      console.error("Failed to copy: ", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        console.log("Content copied to clipboard (fallback)");
        return true;
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
        return false;
      }
    }
  };

  // Get treatment history content for copying
  const getTreatmentHistoryContent = (): string => {
    const history = documentData?.treatment_history;
    if (!history) return "No treatment history available";

    let content = "TREATMENT HISTORY TIMELINE\n";
    content += "=".repeat(40) + "\n\n";

    Object.entries(history).forEach(([category, events]) => {
      if (events.length > 0) {
        content += `${category.replace(/_/g, ' ').toUpperCase()}:\n`;
        content += "-".repeat(30) + "\n";
        
        events.forEach((event:any, index:any) => {
          content += `${index + 1}. ${event.date}: ${event.event}\n`;
          content += `   Details: ${event.details}\n\n`;
        });
        content += "\n";
      }
    });

    return content;
  };

  // Get content for a specific category
  const getCategoryContent = (category: string): string => {
    const history = documentData?.treatment_history;
    const events = history?.[category as keyof TreatmentHistory] || [];
    
    if (events.length === 0) return `No events for ${category.replace(/_/g, ' ')}`;

    let content = `${category.replace(/_/g, ' ').toUpperCase()}\n`;
    content += "=".repeat(40) + "\n\n";

    events.forEach((event, index) => {
      content += `${index + 1}. ${event.date}: ${event.event}\n`;
      content += `   Details: ${event.details}\n\n`;
    });

    return content;
  };

  const handleCopyClick = async (e: React.MouseEvent, category?: string) => {
    e.stopPropagation();
    const sectionId = category 
      ? `section-treatment-${category}`
      : "section-treatment";
    
    const contentToCopy = category 
      ? getCategoryContent(category)
      : getTreatmentHistoryContent();
    
    const success = await copyToClipboard(contentToCopy);
    if (success) {
      onCopySection(sectionId);
    }
  };

  const toggleCategory = (category: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleEvent = (eventId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Get color classes for categories (cycling through colors)
  const getColorClasses = (index: number): string => {
    const colors = [
      "bg-orange-50 hover:bg-orange-100",
      "bg-blue-50 hover:bg-blue-100",
      "bg-emerald-50 hover:bg-emerald-100",
      "bg-purple-50 hover:bg-purple-100",
      "bg-teal-50 hover:bg-teal-100",
      "bg-yellow-50 hover:bg-yellow-100",
      "bg-red-50 hover:bg-red-100",
      "bg-indigo-50 hover:bg-indigo-100",
    ];
    return colors[index % colors.length];
  };

  // Format date to MM/YYYY format
  const formatDateShort = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Handle summarize button click
  const handleSummarize = async () => {
    setShowSummaryModal(true);
    setIsGeneratingSummary(true);
    setSummaryText("");

    try {
      // Use treatment history summary if available
      const summary = documentData?.treatment_history_summary;
      if (summary) {
        let generatedSummary = `Treatment History Summary\n\n`;
        generatedSummary += `Total Events: ${summary.total_events}\n`;
        generatedSummary += `Categories with Events: ${summary.categories_with_events}\n`;
        
        if (summary.most_active_category) {
          generatedSummary += `Most Active Category: ${summary.most_active_category.replace(/_/g, ' ')} (${summary.most_active_category_count} events)\n`;
        }
        
        if (summary.latest_event_date) {
          generatedSummary += `Latest Event: ${formatDate(summary.latest_event_date)}\n`;
        }
        
        if (summary.oldest_event_date) {
          generatedSummary += `Oldest Event: ${formatDate(summary.oldest_event_date)}\n`;
        }

        generatedSummary += `\nSummary by Category:\n`;

        const history = documentData?.treatment_history;
        if (history) {
          Object.entries(history).forEach(([category, events]) => {
            if (events.length > 0) {
              generatedSummary += `\n${category.replace(/_/g, ' ').toUpperCase()}:\n`;
              generatedSummary += `  Total events: ${events.length}\n`;
              
              // Add the most recent event from each category
              const mostRecent = events[0]; // Events are already sorted by date
              generatedSummary += `  Most recent: ${mostRecent.date} - ${mostRecent.event}\n`;
            }
          });
        }

        setSummaryText(generatedSummary);
        setIsGeneratingSummary(false);
      } else {
        // Fallback to generating summary from treatment history
        const history = documentData?.treatment_history;
        if (history) {
          let generatedSummary = `Treatment History Overview\n\n`;
          
          let totalEvents = 0;
          Object.entries(history).forEach(([category, events]) => {
            if (events.length > 0) {
              totalEvents += events.length;
              generatedSummary += `${category.replace(/_/g, ' ')}: ${events.length} events\n`;
            }
          });
          
          generatedSummary += `\nTotal Events: ${totalEvents}\n`;
          setSummaryText(generatedSummary);
        } else {
          setSummaryText("No treatment history data available for summarization.");
        }
        setIsGeneratingSummary(false);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
      setSummaryText("Failed to generate summary. Please try again.");
      setIsGeneratingSummary(false);
    }
  };

  // Get human-readable category names
  const getCategoryName = (category: string): string => {
    const categoryNames: { [key: string]: string } = {
      musculoskeletal_system: "Musculoskeletal System",
      cardiovascular_system: "Cardiovascular System",
      pulmonary_respiratory: "Pulmonary & Respiratory",
      neurological: "Neurological",
      gastrointestinal: "Gastrointestinal",
      metabolic_endocrine: "Metabolic & Endocrine",
      other_systems: "Other Systems",
      general_treatments: "General Treatments",
    };
    return categoryNames[category] || category.replace(/_/g, ' ');
  };

  // Get icon for category
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      musculoskeletal_system: "🦴",
      cardiovascular_system: "❤️",
      pulmonary_respiratory: "🫁",
      neurological: "🧠",
      gastrointestinal: "🍽️",
      metabolic_endocrine: "⚖️",
      other_systems: "🩺",
      general_treatments: "💊",
    };
    return icons[category] || "📋";
  };

  const history = documentData?.treatment_history;
  const summary = documentData?.treatment_history_summary;

  return (
    <>
      <div className="section">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-title">
            <MedicalIcon />
            <h3 className="text-black">Treatment History Timeline</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSummarize();
              }}
              className="bg-blue-500 text-[0.8vw] hover:bg-blue-700 text-white px-2 py-1 rounded-md ml-2"
            >
              Summarize
            </button>
          </div>
          <div className="header-actions">
            <button
              className={`copy-btn ${copied["section-treatment"] ? "copied" : ""}`}
              onClick={(e) => handleCopyClick(e)}
              title="Copy All Treatment History"
            >
              {copied["section-treatment"] ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>

        {/* Section Content */}
        <div className="section-content" onClick={(e) => e.stopPropagation()}>
          {/* Summary Stats */}
          {summary && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{summary.total_events}</div>
                  <div className="text-sm text-blue-600">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{summary.categories_with_events}</div>
                  <div className="text-sm text-blue-600">Categories</div>
                </div>
                {summary.most_active_category && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.most_active_category_count}</div>
                    <div className="text-sm text-blue-600">
                      {getCategoryName(summary.most_active_category)}
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {summary.latest_event_date ? formatDateShort(summary.latest_event_date) : "—"}
                  </div>
                  <div className="text-sm text-blue-600">Latest Event</div>
                </div>
              </div>
            </div>
          )}

          {/* Treatment History Categories */}
          <div className="space-y-4">
            {history ? (
              Object.entries(history).map(([category, events], index) => {
                if (events.length === 0) return null;
                
                const categoryName = getCategoryName(category);
                const categoryIcon = getCategoryIcon(category);
                const isExpanded = expandedCategories[category] !== false; // Default to true

                return (
                  <div
                    key={category}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Category Header */}
                    <div
                      className={`p-4 cursor-pointer transition-colors ${getColorClasses(index)} flex justify-between items-center`}
                      onClick={(e) => toggleCategory(category, e)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{categoryIcon}</span>
                        <div>
                          <span className="font-semibold text-gray-800">
                            {categoryName}
                          </span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {events.length} {events.length === 1 ? 'event' : 'events'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`copy-btn small ${copied[`section-treatment-${category}`] ? "copied" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyClick(e, category);
                          }}
                          title={`Copy ${categoryName} History`}
                        >
                          {copied[`section-treatment-${category}`] ? (
                            <CheckIcon />
                          ) : (
                            <CopyIcon />
                          )}
                        </button>
                        <span className="text-gray-500 font-bold text-sm">
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </div>
                    </div>

                    {/* Category Events */}
                    {isExpanded && (
                      <div className="p-4 pt-2 border-t border-gray-100">
                        <div className="space-y-3">
                          {events.map((event:any, eventIndex:any) => {
                            const eventId = `${category}-${eventIndex}`;
                            const isExpandedEvent = expandedEvents[eventId];
                            
                            return (
                              <div
                                key={eventId}
                                className="bg-gray-50 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={(e) => toggleEvent(eventId, e)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                        {event.date}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {event.event}
                                      </span>
                                    </div>
                                    {isExpandedEvent && (
                                      <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                                        {event.details}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-gray-400 font-bold text-sm ml-2 flex-shrink-0">
                                    {isExpandedEvent ? "▾" : "▸"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                <div className="mb-2">
                  <TimelineIcon />
                </div>
                <p className="font-medium">No treatment history available</p>
                <p className="text-sm mt-1">
                  Treatment history will appear here once generated from patient documents
                </p>
              </div>
            )}
          </div>

          {/* Empty State */}
          {history && Object.values(history).every(events => events.length === 0) && (
            <div className="p-6 text-center text-gray-500">
              <div className="mb-2">
                <TimelineIcon />
              </div>
              <p className="font-medium">No treatment events found</p>
              <p className="text-sm mt-1">
                Treatment events will appear here as they are extracted from documents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MedicalIcon />
              Treatment History Summary
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isGeneratingSummary && !summaryText && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">
                  Generating summary...
                </span>
              </div>
            )}
            {summaryText && (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-gray-800 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {summaryText}
                  </pre>
                </div>
                {isGeneratingSummary && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <div className="animate-pulse">Generating...</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSummaryModal(false)}
            >
              Close
            </Button>
            {summaryText && !isGeneratingSummary && (
              <Button
                onClick={() => {
                  copyToClipboard(summaryText);
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <CopyIcon />
                <span className="ml-2">Copy Summary</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>


         <style jsx>{`
        .section {
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }
        .section-header {
          padding: 20px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          font-weight: 600;
          color: black;
          margin: 0;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .section-content {
          padding: 0 20px 20px 20px;
          background: white;
        }
        .summary-stats {
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #f1f5f9;
          border-radius: 6px;
        }
        .stat-text {
          font-size: 12px;
          color: #475569;
          font-weight: 500;
        }
        .bodypart-group {
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .bodypart-header {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .bodypart-header:hover {
          background: #f1f5f9;
        }
        .bodypart-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: color 0.2s;
        }
        .bodypart-toggle-btn:hover {
          color: #374151;
        }
        .bodypart-name {
          font-size: 14px;
          margin: 0;
          font-weight: 600;
          color: #374151;
          flex: 1;
        }
        .snapshot-count {
          font-size: 12px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .bodypart-details {
          background: white;
          padding: 12px;
        }
        .snapshot-card {
          background: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          border-left: 3px solid #3b82f6;
        }
        .snapshot-card.latest {
          margin-bottom: 12px;
          border-left-color: #10b981;
        }
        .snapshot-card:last-child {
          margin-bottom: 0;
        }
        .snapshot-meta {
          margin-bottom: 8px;
        }
        .snapshot-date {
          font-size: 11px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .snapshot-content ul {
          margin: 0;
          padding-left: 0;
        }
        .snapshot-content li {
          margin-bottom: 4px;
          font-size: 13px;
          line-height: 1.4;
          color: #374151;
          list-style: none;
          padding-left: 0;
        }
        .snapshot-content li:last-child {
          margin-bottom: 0;
        }
        .timeline-toggle {
          margin-bottom: 12px;
        }
        .timeline-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }
        .timeline-btn:hover {
          background: #e5e7eb;
        }
        .timeline-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .timeline-date {
          min-width: 80px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .timeline-content {
          flex: 1;
        }
        .timeline-entry {
          margin-bottom: 4px;
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }
        .timeline-entry:last-child {
          margin-bottom: 0;
        }
        .no-data {
          padding: 16px;
          background: #f1f5f9;
          border-radius: 6px;
          text-align: center;
        }
        .no-data ul {
          margin: 0;
          padding: 0;
        }
        .no-data li {
          color: #6b7280;
          list-style: none;
          font-size: 14px;
        }
        .copy-btn {
          font-size: 12px;
          color: #475569;
          background: #e2e8f0;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .copy-btn.small {
          padding: 4px 6px;
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
        .w-3.5 {
          width: 0.875rem;
          height: 0.875rem;
        }
        .w-4 {
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </>
  );
};

export default TreatmentHistorySection;





