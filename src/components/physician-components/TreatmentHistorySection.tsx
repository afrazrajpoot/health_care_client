// components/physician-components/TreatmentHistorySection.tsx
import { useTreatmentHistory } from "@/app/custom-hooks/staff-hooks/physician-hooks/useTreatmentHistory";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  referralDoctor?: string; // Fixed potential misspelling
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
}
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
const ChevronDownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 transition-transform"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 transition-transform"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
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
  console.log("Current mode:", mode);
  // ✅ Get body part snapshots directly from documentData
  const bodyPartSnapshots = documentData?.body_part_snapshots || [];
  console.log("Body part snapshots:", bodyPartSnapshots);
  // State for expanded/collapsed body parts
  const [expandedBodyParts, setExpandedBodyParts] = React.useState<{
    [key: string]: boolean;
  }>({});
  // State for timeline visibility per body part
  const [showTimeline, setShowTimeline] = React.useState<{
    [key: string]: boolean;
  }>({});

  // State for summarize modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  // Handle section header click (only for collapse/expand)
  const handleSectionHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };
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
      // Fallback for older browsers
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
  // Get content for a specific body part
  const getBodyPartContent = (bodyPartId: string): string => {
    const bodyPartSnapshots = documentData?.body_part_snapshots || [];
    const snapshotsForBodyPart = bodyPartSnapshots.filter(
      (snapshot) =>
        snapshot.bodyPart === bodyPartId ||
        (mode === "gm" && !snapshot.bodyPart)
    );
    if (snapshotsForBodyPart.length === 0) return "";
    const sortedSnapshots = sortSnapshotsByDate(snapshotsForBodyPart);
    const latestSnapshot = sortedSnapshots[0];
    // Mode-aware label: For GM, use dx as disease name if bodyPart is null
    const displayLabel =
      mode === "gm" && !bodyPartId
        ? latestSnapshot.dx || latestSnapshot.condition || "General Health"
        : bodyPartId;
    let content = `TREATMENT HISTORY - ${displayLabel}\n`;
    content += "=".repeat(40) + "\n\n";
    // Latest snapshot
    content += `LATEST (${formatDate(latestSnapshot.document_report_date)}):\n`;
    if (
      latestSnapshot.dx &&
      latestSnapshot.dx !== "Not specified" &&
      latestSnapshot.dx !== ""
    ) {
      content += `Diagnosis: ${latestSnapshot.dx}\n`;
    }
    // For "gm", add condition/symptoms if available (from your JSON data)
    if (mode === "gm" && latestSnapshot.condition) {
      content += `Condition: ${latestSnapshot.condition} (${latestSnapshot.conditionSeverity})\n`;
    }
    if (mode === "gm" && latestSnapshot.symptoms) {
      content += `Symptoms: ${latestSnapshot.symptoms}\n`;
    }
    if (mode === "gm" && latestSnapshot.medications) {
      content += `Medications: ${latestSnapshot.medications}\n`;
    }
    if (mode === "gm" && latestSnapshot.comorbidities) {
      content += `Comorbidities: ${latestSnapshot.comorbidities}\n`;
    }
    if (mode === "gm" && latestSnapshot.keyFindings) {
      content += `Key Findings: ${latestSnapshot.keyFindings}\n`;
    }
    if (mode === "gm" && latestSnapshot.treatmentApproach) {
      content += `Treatment Approach: ${latestSnapshot.treatmentApproach}\n`;
    }
    if (mode === "gm" && latestSnapshot.clinicalSummary) {
      content += `Clinical Summary: ${latestSnapshot.clinicalSummary}\n`;
    }
    if (mode === "gm" && latestSnapshot.adlsAffected) {
      content += `ADLs Affected: ${latestSnapshot.adlsAffected}\n`;
    }
    if (mode === "gm" && latestSnapshot.functionalLimitations) {
      content += `Functional Limitations: ${latestSnapshot.functionalLimitations}\n`;
    }
    if (
      latestSnapshot.recommended &&
      latestSnapshot.recommended !== "Not specified" &&
      latestSnapshot.recommended !== ""
    ) {
      content += `Treatment Plan: ${latestSnapshot.recommended}\n`;
    }
    if (
      latestSnapshot.consultingDoctor &&
      latestSnapshot.consultingDoctor !== "Not specified" &&
      latestSnapshot.consultingDoctor !== ""
    ) {
      content += `Consulting Doctor: ${latestSnapshot.consultingDoctor}\n`;
    }
    if (
      latestSnapshot.referralDoctor &&
      latestSnapshot.referralDoctor !== "Not specified" &&
      latestSnapshot.referralDoctor !== ""
    ) {
      content += `Referral Doctor: ${latestSnapshot.referralDoctor}\n`;
    }
    if (
      latestSnapshot.urDecision &&
      latestSnapshot.urDecision !== "Not specified" &&
      latestSnapshot.urDecision !== ""
    ) {
      content += `UR Decision: ${latestSnapshot.urDecision}\n`;
    }
    // Timeline if multiple snapshots
    if (sortedSnapshots.length > 1) {
      content += `\nTIMELINE (${sortedSnapshots.length} entries):\n`;
      content += "-".repeat(30) + "\n";
      sortedSnapshots.forEach((snapshot, index) => {
        content += `\n${formatDate(snapshot.document_report_date)}:\n`;
        if (
          snapshot.recommended &&
          snapshot.recommended !== "Not specified" &&
          snapshot.recommended !== ""
        ) {
          content += ` Treatment Plan: ${snapshot.recommended}\n`;
        }
        if (
          snapshot.consultingDoctor &&
          snapshot.consultingDoctor !== "Not specified" &&
          snapshot.consultingDoctor !== ""
        ) {
          content += ` Consulting Doctor: ${snapshot.consultingDoctor}\n`;
        }
      });
    }
    return content;
  };
  // Get content for all body parts
  const getAllBodyPartsContent = (): string => {
    const bodyPartSnapshots = documentData?.body_part_snapshots || [];
    if (bodyPartSnapshots.length === 0) {
      return "TREATMENT HISTORY\nNo body part treatment history available";
    }
    const groupedBodyParts = bodyPartSnapshots.reduce((acc, snapshot) => {
      // Mode-aware key: For "gm" with null bodyPart, group under dx (disease name)
      const bodyPartKey =
        snapshot.bodyPart ||
        (mode === "gm"
          ? snapshot.dx || snapshot.condition || "General Health"
          : "Unknown Body Part");
      if (!acc[bodyPartKey]) {
        acc[bodyPartKey] = [];
      }
      acc[bodyPartKey].push(snapshot);
      return acc;
    }, {} as Record<string, BodyPartSnapshot[]>);
    let content = "TREATMENT HISTORY BY BODY PART\n";
    content += "=".repeat(50) + "\n\n";
    Object.entries(groupedBodyParts).forEach(([bodyPart, snapshots]) => {
      const sortedSnapshots = sortSnapshotsByDate(snapshots);
      const latestSnapshot = sortedSnapshots[0];
      content += `${bodyPart.toUpperCase()}\n`;
      content += "-".repeat(30) + "\n";
      // Latest snapshot
      content += `Latest (${formatDate(
        latestSnapshot.document_report_date
      )}):\n`;
      if (
        latestSnapshot.dx &&
        latestSnapshot.dx !== "Not specified" &&
        latestSnapshot.dx !== ""
      ) {
        content += ` Diagnosis: ${latestSnapshot.dx}\n`;
      }
      // For "gm", add condition/symptoms
      if (mode === "gm" && latestSnapshot.condition) {
        content += ` Condition: ${latestSnapshot.condition}\n`;
      }
      if (mode === "gm" && latestSnapshot.symptoms) {
        content += ` Symptoms: ${latestSnapshot.symptoms}\n`;
      }
      if (mode === "gm" && latestSnapshot.medications) {
        content += ` Medications: ${latestSnapshot.medications}\n`;
      }
      if (mode === "gm" && latestSnapshot.comorbidities) {
        content += ` Comorbidities: ${latestSnapshot.comorbidities}\n`;
      }
      if (mode === "gm" && latestSnapshot.keyFindings) {
        content += ` Key Findings: ${latestSnapshot.keyFindings}\n`;
      }
      if (mode === "gm" && latestSnapshot.treatmentApproach) {
        content += ` Treatment Approach: ${latestSnapshot.treatmentApproach}\n`;
      }
      if (mode === "gm" && latestSnapshot.clinicalSummary) {
        content += ` Clinical Summary: ${latestSnapshot.clinicalSummary}\n`;
      }
      if (mode === "gm" && latestSnapshot.adlsAffected) {
        content += ` ADLs Affected: ${latestSnapshot.adlsAffected}\n`;
      }
      if (mode === "gm" && latestSnapshot.functionalLimitations) {
        content += ` Functional Limitations: ${latestSnapshot.functionalLimitations}\n`;
      }
      if (
        latestSnapshot.recommended &&
        latestSnapshot.recommended !== "Not specified" &&
        latestSnapshot.recommended !== ""
      ) {
        content += ` Treatment Plan: ${latestSnapshot.recommended}\n`;
      }
      if (
        latestSnapshot.consultingDoctor &&
        latestSnapshot.consultingDoctor !== "Not specified" &&
        latestSnapshot.consultingDoctor !== ""
      ) {
        content += ` Consulting Doctor: ${latestSnapshot.consultingDoctor}\n`;
      }
      // Summary of timeline entries
      if (sortedSnapshots.length > 1) {
        content += ` Timeline Entries: ${sortedSnapshots.length}\n`;
      }
      content += "\n";
    });
    content += `Total Body Parts: ${Object.keys(groupedBodyParts).length}\n`;
    content += `Total Snapshots: ${bodyPartSnapshots.length}\n`;
    return content;
  };
  const handleCopyClick = async (e: React.MouseEvent, bodyPartId?: string) => {
    e.stopPropagation();
    const sectionId = bodyPartId
      ? `section-bodypart-${bodyPartId}`
      : "section-treatment";
    // For "gm", adjust ID if grouping under dx/condition
    const adjustedId =
      mode === "gm" && !bodyPartId
        ? `section-${(
          bodyPartSnapshots[0]?.dx ||
          bodyPartSnapshots[0]?.condition ||
          "general-health"
        )
          .toLowerCase()
          .replace(/\s+/g, "-")}`
        : sectionId;
    // Get the content to copy based on what's being copied
    const contentToCopy = bodyPartId
      ? getBodyPartContent(bodyPartId)
      : getAllBodyPartsContent();
    // Copy to clipboard
    const success = await copyToClipboard(contentToCopy);
    if (success) {
      // Notify parent component with adjusted ID
      onCopySection(adjustedId);
    }
  };
  const toggleBodyPart = (bodyPartId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedBodyParts((prev) => ({
      ...prev,
      [bodyPartId]: !prev[bodyPartId],
    }));
  };
  const toggleTimeline = (bodyPartId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowTimeline((prev) => ({
      ...prev,
      [bodyPartId]: !prev[bodyPartId],
    }));
  };
  // Helper to parse and sort snapshots by report_date (descending for latest first)
  const sortSnapshotsByDate = (
    snapshots: BodyPartSnapshot[]
  ): BodyPartSnapshot[] => {
    return [...snapshots].sort((a, b) => {
      const dateA = a.document_report_date
        ? new Date(a.document_report_date).getTime()
        : 0;
      const dateB = b.document_report_date
        ? new Date(b.document_report_date).getTime()
        : 0;
      return dateB - dateA; // Descending
    });
  };

  // Group body part snapshots by body part name for better organization
  const groupedBodyParts = bodyPartSnapshots.reduce((acc, snapshot) => {
    // Mode-aware key: For "gm", use dx as disease name if bodyPart is null
    const bodyPart =
      snapshot.bodyPart ||
      (mode === "gm"
        ? snapshot.dx || snapshot.condition || "General Health"
        : "Unknown Body Part");
    if (!acc[bodyPart]) {
      acc[bodyPart] = [];
    }
    acc[bodyPart].push(snapshot);
    return acc;
  }, {} as Record<string, BodyPartSnapshot[]>);

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
      // Prepare context from all body parts
      const context = Object.entries(groupedBodyParts)
        .map(([bodyPart, snapshots]) => {
          const sortedSnapshots = sortSnapshotsByDate(snapshots);
          const latest = sortedSnapshots[0];

          let bodyPartContext = `${bodyPart}: `;
          const details = [];

          if (latest.dx && latest.dx !== "Not specified") details.push(`Dx: ${latest.dx}`);
          if (mode === "gm" && latest.condition) details.push(`Condition: ${latest.condition}`);
          if (mode === "gm" && latest.symptoms) details.push(`Symptoms: ${latest.symptoms}`);
          if (latest.recommended && latest.recommended !== "Not specified") details.push(`Treatment: ${latest.recommended}`);
          if (latest.consultingDoctor && latest.consultingDoctor !== "Not specified") details.push(`Doctor: ${latest.consultingDoctor}`);

          bodyPartContext += details.join("; ");
          return bodyPartContext;
        })
        .join("\n");

      const response = await fetch("/api/openai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context,
          maxWords: 300,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              accumulatedText += content;
              setSummaryText(accumulatedText);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setIsGeneratingSummary(false);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
      setSummaryText("Failed to generate summary. Please try again.");
      setIsGeneratingSummary(false);
    }
  };

  return (
    <>
      <div className="section">
        {/* Section Header - Only this part should be clickable for collapse/expand */}
        <div className="section-header" onClick={handleSectionHeaderClick}>
          <div className="section-title">
            <MedicalIcon />
            <h3 className="text-black">Treatment History by Body Part</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSummarize();
              }}
              className="bg-blue-500 text-[0.8vw] hover:bg-blue-700 text-white px-2 py-1 rounded-md"
            >
              Summarize
            </button>
          </div>
          <div className="header-actions">
            <button
              className={`copy-btn ${copied["section-treatment"] ? "copied" : ""
                }`}
              onClick={(e) => handleCopyClick(e)}
              title="Copy All Body Parts"
            >
              {copied["section-treatment"] ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button
              className="collapse-btn"
              onClick={handleSectionHeaderClick}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            </button>
          </div>
        </div>
        {/* Section Content - This part should NOT trigger collapse/expand */}
        {!isCollapsed && (
          <div className="section-content" onClick={(e) => e.stopPropagation()}>
            {/* Summary Stats */}

            {/* Body Part Snapshots */}
            {Object.entries(groupedBodyParts).map(([bodyPart, snapshots]) => {
              const sortedSnapshots = sortSnapshotsByDate(snapshots);
              const latestSnapshot = sortedSnapshots[0];
              const hasMultiple = sortedSnapshots.length > 1;
              return (
                <div key={bodyPart} className="bodypart-group">
                  {/* Body Part Header - Clickable for expanding/collapsing that specific body part */}
                  <div
                    className="bodypart-header"
                    onClick={(e) => toggleBodyPart(bodyPart, e)}
                  >
                    <button
                      className="bodypart-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBodyPart(bodyPart);
                      }}
                    >
                      {expandedBodyParts[bodyPart] ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )}
                    </button>
                    <h4 className="bodypart-name">{bodyPart}</h4>
                    <span className="snapshot-count">
                      {snapshots.length}{" "}
                      {snapshots.length === 1 ? "snapshot" : "snapshots"}
                    </span>
                    <button
                      className={`copy-btn small ${copied[`section-bodypart-${bodyPart}`] ? "copied" : ""
                        }`}
                      onClick={(e) => handleCopyClick(e, bodyPart)}
                      title={`Copy ${bodyPart} Details`}
                    >
                      {copied[`section-bodypart-${bodyPart}`] ? (
                        <CheckIcon />
                      ) : (
                        <CopyIcon />
                      )}
                    </button>
                  </div>
                  {/* Body Part Details - This part should NOT trigger any toggles */}
                  {expandedBodyParts[bodyPart] && (
                    <div
                      className="bodypart-details"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Latest Snapshot Card */}
                      {latestSnapshot && (
                        <div className="snapshot-card latest">
                          <div className="snapshot-meta">
                            <span className="snapshot-date">
                              Latest:{" "}
                              {formatDate(latestSnapshot.document_report_date)}
                            </span>
                          </div>
                          <div className="snapshot-content">
                            <ul>
                              {latestSnapshot.dx &&
                                latestSnapshot.dx !== "Not specified" &&
                                latestSnapshot.dx !== "" && (
                                  <li>
                                    <strong>Diagnosis:</strong>{" "}
                                    {latestSnapshot.dx}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.condition &&
                                latestSnapshot.condition !== "Not specified" &&
                                latestSnapshot.condition !== "" && (
                                  <li>
                                    <strong>Condition:</strong>{" "}
                                    {latestSnapshot.condition} (
                                    {latestSnapshot.conditionSeverity})
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.symptoms &&
                                latestSnapshot.symptoms !== "Not specified" &&
                                latestSnapshot.symptoms !== "" && (
                                  <li>
                                    <strong>Symptoms:</strong>{" "}
                                    {latestSnapshot.symptoms}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.medications &&
                                latestSnapshot.medications !==
                                "Not specified" &&
                                latestSnapshot.medications !== "" && (
                                  <li>
                                    <strong>Medications:</strong>{" "}
                                    {latestSnapshot.medications}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.comorbidities &&
                                latestSnapshot.comorbidities !==
                                "Not specified" &&
                                latestSnapshot.comorbidities !== "" && (
                                  <li>
                                    <strong>Comorbidities:</strong>{" "}
                                    {latestSnapshot.comorbidities}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.keyFindings &&
                                latestSnapshot.keyFindings !==
                                "Not specified" &&
                                latestSnapshot.keyFindings !== "" && (
                                  <li>
                                    <strong>Key Findings:</strong>{" "}
                                    {latestSnapshot.keyFindings}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.treatmentApproach &&
                                latestSnapshot.treatmentApproach !==
                                "Not specified" &&
                                latestSnapshot.treatmentApproach !== "" && (
                                  <li>
                                    <strong>Treatment Approach:</strong>{" "}
                                    {latestSnapshot.treatmentApproach}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.clinicalSummary &&
                                latestSnapshot.clinicalSummary !==
                                "Not specified" &&
                                latestSnapshot.clinicalSummary !== "" && (
                                  <li>
                                    <strong>Clinical Summary:</strong>{" "}
                                    {latestSnapshot.clinicalSummary}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.adlsAffected &&
                                latestSnapshot.adlsAffected !==
                                "Not specified" &&
                                latestSnapshot.adlsAffected !== "" && (
                                  <li>
                                    <strong>ADLs Affected:</strong>{" "}
                                    {latestSnapshot.adlsAffected}
                                  </li>
                                )}
                              {mode === "gm" &&
                                latestSnapshot.functionalLimitations &&
                                latestSnapshot.functionalLimitations !==
                                "Not specified" &&
                                latestSnapshot.functionalLimitations !== "" && (
                                  <li>
                                    <strong>Functional Limitations:</strong>{" "}
                                    {latestSnapshot.functionalLimitations}
                                  </li>
                                )}
                              {latestSnapshot.recommended &&
                                latestSnapshot.recommended !==
                                "Not specified" &&
                                latestSnapshot.recommended !== "" && (
                                  <li>
                                    <strong>Treatment Plan:</strong>{" "}
                                    {latestSnapshot.recommended}
                                  </li>
                                )}
                              {latestSnapshot.consultingDoctor &&
                                latestSnapshot.consultingDoctor !==
                                "Not specified" &&
                                latestSnapshot.consultingDoctor !== "" && (
                                  <li>
                                    <strong>Consulting Doctor:</strong>{" "}
                                    {latestSnapshot.consultingDoctor}
                                  </li>
                                )}
                              {latestSnapshot.referralDoctor &&
                                latestSnapshot.referralDoctor !==
                                "Not specified" &&
                                latestSnapshot.referralDoctor !== "" && (
                                  <li>
                                    <strong>Referral Doctor:</strong>{" "}
                                    {latestSnapshot.referralDoctor}
                                  </li>
                                )}
                              {latestSnapshot.urDecision &&
                                latestSnapshot.urDecision !== "Not specified" &&
                                latestSnapshot.urDecision !== "" && (
                                  <li>
                                    <strong>UR Decision:</strong>{" "}
                                    {latestSnapshot.urDecision}
                                  </li>
                                )}
                            </ul>
                          </div>
                        </div>
                      )}
                      {/* Timeline Dropdown/Button - Only show if multiple snapshots */}
                      {hasMultiple && (
                        <div className="timeline-toggle">
                          <button
                            className="timeline-btn"
                            onClick={(e) => toggleTimeline(bodyPart, e)}
                          >
                            <TimelineIcon />
                            {showTimeline[bodyPart] ? "Hide" : "View"} Timeline
                          </button>
                        </div>
                      )}
                      {/* Timeline Section */}
                      {hasMultiple && showTimeline[bodyPart] && (
                        <div className="timeline-section">
                          <div className="timeline">
                            {sortedSnapshots.map((snapshot, index) => (
                              <div
                                key={snapshot.id || index}
                                className="timeline-item"
                              >
                                <div className="timeline-date">
                                  {formatDate(snapshot.document_report_date)}
                                </div>
                                <div className="timeline-content">
                                  {snapshot.recommended &&
                                    snapshot.recommended !== "Not specified" &&
                                    snapshot.recommended !== "" && (
                                      <div className="timeline-entry">
                                        <strong>Treatment Plan:</strong>{" "}
                                        {snapshot.recommended}
                                      </div>
                                    )}
                                  {snapshot.consultingDoctor &&
                                    snapshot.consultingDoctor !==
                                    "Not specified" &&
                                    snapshot.consultingDoctor !== "" && (
                                      <div className="timeline-entry">
                                        <strong>Consulting Doctor:</strong>{" "}
                                        {snapshot.consultingDoctor}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {bodyPartSnapshots.length === 0 && (
              <div className="no-data">
                <ul>
                  <li>No body part treatment history available</li>
                </ul>
              </div>
            )}
          </div>
        )}
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
                <span className="ml-3 text-gray-600">Generating summary...</span>
              </div>
            )}
            {summaryText && (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {summaryText}
                  </p>
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
