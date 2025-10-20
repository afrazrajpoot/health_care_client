// pages/PhysicianCard.tsx (or app/physician-card/page.tsx)
"use client";

import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import SearchBar from "@/components/SearchBar";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
// import SearchBar from "@/components/SearchBar"; // Adjust path as needed

// Define TypeScript interfaces for data structures
interface Patient {
  id?: number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface PatientQuiz {
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
}

interface SummarySnapshotItem {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
}

interface SummarySnapshot {
  diagnosis: string;
  diagnosis_history: string;
  key_concern: string;
  key_concern_history: string;
  next_step: string;
  next_step_history: string;
  has_changes: boolean;
}

interface WhatsNew {
  [key: string]: string;
}

interface QuickNoteSnapshot {
  details: string;
  timestamp: string;
  one_line_note: string;
  status_update: string;
}

interface ADL {
  adls_affected: string;
  adls_affected_history: string;
  work_restrictions: string;
  work_restrictions_history: string;
  has_changes: boolean;
}

interface DocumentSummary {
  type: string;
  date: string;
  summary: string;
  brief_summary?: string;
  document_id?: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  brief_summary?: { [key: string]: string[] };
  summary_snapshot?: SummarySnapshot;
  summary_snapshots?: SummarySnapshotItem[];
  whats_new?: WhatsNew;
  quick_notes_snapshots?: QuickNoteSnapshot[]; // ✅ Added interface for quick notes snapshots
  adl?: ADL;
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: DocumentSummary[];
  patient_quiz?: PatientQuiz | null;
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: { [key: string]: DocumentSummary };
  allVerified?: boolean;
  gcs_file_link?: string; // Signed GCS URL for view file
  blob_path?: string; // Blob path for preview (e.g., "uploads/filename.ext")
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

// What's New Component
const WhatsNewSection = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) => {
  // Get summary of what's new for collapsed view
  const getWhatsNewSummary = () => {
    if (!documentData?.whats_new) return "No significant changes";
    const entries = Object.entries(documentData.whats_new).filter(
      ([_, value]) => value && value.trim() !== "" && value.trim() !== " "
    );
    if (entries.length === 0) return "No significant changes";
    return entries
      .map(([key]) => key.toUpperCase().replace(/_/g, " "))
      .join(", ");
  };

  // ✅ Helper to format timestamp to readable date/time
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(); // e.g., "10/18/2025, 9:52:51 AM"
    } catch {
      return timestamp;
    }
  };

  // ✅ Get ALL quick notes (including previous/empty ones), sorted latest first
  const getAllQuickNotes = () => {
    const quickNotes = documentData?.quick_notes_snapshots || [];
    return quickNotes.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ); // Descending (latest first)
  };

  // ✅ Get quick notes summary for collapsed view (count all)
  const getQuickNotesSummary = () => {
    const allNotes = getAllQuickNotes();
    if (allNotes.length === 0) return "No quick notes";
    return `${allNotes.length} note${allNotes.length > 1 ? "s" : ""}`;
  };

  // ✅ State for quick notes dropdown
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);

  const toggleQuickNotes = () => {
    setIsQuickNotesOpen((prev) => !prev);
  };

  // ✅ Check if a note is empty
  const isNoteEmpty = (note: QuickNoteSnapshot) => {
    return (
      !note.status_update?.trim() &&
      !note.one_line_note?.trim() &&
      !note.details?.trim()
    );
  };

  return (
    <section
      className="p-5 bg-amber-50 border-b border-blue-200"
      aria-labelledby="whatsnew-title"
    >
      <h3
        className="flex gap-2 items-center justify-between mb-3 text-base font-semibold cursor-pointer"
        id="whatsnew-title"
        onClick={onToggle}
      >
        <span className="flex gap-2 items-center">
          ⚡ What's New Since Last Visit
          {isCollapsed && (
            <span className="text-sm font-normal text-gray-600">
              ({getWhatsNewSummary()})
            </span>
          )}
        </span>
        <span className="text-sm">{isCollapsed ? "▼" : "▲"}</span>
      </h3>
      {!isCollapsed && (
        <>
          {/* ✅ Existing Whats New Items */}
          <ul className="m-0 p-0 grid gap-2 list-none" role="list">
            {documentData?.whats_new &&
              Object.entries(documentData.whats_new).map(([key, value]) => {
                if (!value || value.trim() === "" || value.trim() === " ") {
                  return null;
                }
                const label = key.toUpperCase().replace(/_/g, " ");
                return (
                  <li
                    key={key}
                    className="flex gap-2 items-start p-3 border border-dashed border-amber-300 bg-white rounded-lg"
                  >
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-400 text-xs font-bold whitespace-nowrap flex-shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 min-w-0">{value}</div>
                  </li>
                );
              })}
            {(!documentData?.whats_new ||
              Object.values(documentData.whats_new || {}).every(
                (val) => !val || val.trim() === "" || val.trim() === " "
              )) && (
                <li className="p-3 text-gray-500 text-center">
                  No significant changes since last visit
                </li>
              )}
          </ul>

          {/* ✅ Quick Notes Dropdown - Show if any notes exist (including empty/previous) */}
          {getAllQuickNotes().length > 0 && (
            <div className="mt-4">
              <button
                onClick={toggleQuickNotes}
                className="flex items-center gap-2 w-full justify-between p-3 border border-amber-300 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-amber-800">
                  📝 Quick Notes ({getAllQuickNotes().length})
                </span>
                <span
                  className={`text-sm transition-transform ${isQuickNotesOpen ? "rotate-180" : ""
                    }`}
                >
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${isQuickNotesOpen ? "max-h-96" : "max-h-0"
                  }`}
              >
                <ul className="m-0 p-4 grid gap-2 list-none border border-amber-300 bg-white rounded-b-lg">
                  {getAllQuickNotes().map((note, index) => (
                    <li
                      key={index}
                      className={`p-3 border border-dashed border-amber-200 rounded-lg ${isNoteEmpty(note) ? "opacity-50 bg-gray-50" : ""
                        }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {formatTimestamp(note.timestamp)}
                      </div>
                      <div className="font-semibold">
                        {note.status_update ||
                          (isNoteEmpty(note) ? "No Update" : "Note Added")}
                      </div>
                      {note.one_line_note && (
                        <div className="text-sm mt-1">{note.one_line_note}</div>
                      )}
                      {note.details && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          {note.details}
                        </div>
                      )}
                      {isNoteEmpty(note) && !note.status_update && (
                        <div className="text-xs text-gray-400 mt-1 italic">
                          No details added
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-amber-200 transition-colors ${copied["section-whatsnew"]
                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                : "border-amber-200 bg-white text-gray-900"
                }`}
              onClick={() => onCopySection("section-whatsnew")}
              title="Copy Section"
            >
              {copied["section-whatsnew"] ? <CheckIcon /> : <CopyIcon />}
              Copy Section
            </button>
          </div>
        </>
      )}
    </section>
  );
};

// Treatment History Snapshot Component (Using Summary Snapshot Data)
const TreatmentHistorySection = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string, index?: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) => {
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0);
  const [expandedSnapshots, setExpandedSnapshots] = useState<{
    [key: number]: boolean;
  }>({});

  const snapshots = documentData?.summary_snapshots || [];

  useEffect(() => {
    setCurrentSnapshotIndex(0); // Reset to latest on data change
  }, [documentData]);

  const toggleSnapshot = (index: number) => {
    setExpandedSnapshots((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePreviousSnapshot = () => {
    if (currentSnapshotIndex < snapshots.length - 1) {
      setCurrentSnapshotIndex((prev) => prev + 1);
    }
  };

  const handleLatestSnapshot = () => {
    setCurrentSnapshotIndex(0);
  };

  const getTreatmentSummary = () => {
    if (snapshots.length === 0) return "No snapshots available";
    const diagnoses = snapshots
      .map((snapshot) => snapshot.dx)
      .filter((dx) => dx && dx.trim() !== "");
    return diagnoses.length > 0
      ? diagnoses.join(", ")
      : "No diagnoses specified";
  };

  return (
    <section
      className="p-5 bg-blue-50 border-b border-blue-200"
      aria-labelledby="treatment-title"
    >
      <h3
        className="flex gap-2 items-center justify-between mb-3 text-base font-semibold cursor-pointer"
        id="treatment-title"
        onClick={onToggle}
      >
        <span className="flex gap-2 items-center">
          📌 Treatment History Snapshot
          {isCollapsed && (
            <span className="text-sm font-normal text-gray-600">
              ({getTreatmentSummary()})
            </span>
          )}
        </span>
        <span className="text-sm">{isCollapsed ? "▼" : "▲"}</span>
      </h3>
      {!isCollapsed && (
        <>
          {snapshots.length > 1 && (
            <div className="flex gap-2 mb-4">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50"
                onClick={handleLatestSnapshot}
                disabled={currentSnapshotIndex === 0}
              >
                Latest
              </button>
              <button
                className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 text-sm disabled:opacity-50"
                onClick={handlePreviousSnapshot}
                disabled={currentSnapshotIndex >= snapshots.length - 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 self-center">
                {currentSnapshotIndex + 1} of {snapshots.length}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {snapshots.map((snapshot, index) => (
              <div
                key={snapshot.id || index}
                className="border border-blue-200 bg-white rounded-lg overflow-hidden"
              >
                <div
                  className="p-3 bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleSnapshot(index)}
                >
                  <span className="font-semibold text-gray-700">
                    📍 {snapshot.dx || `Diagnosis ${index + 1}`}
                  </span>
                  <span className="text-sm">
                    {expandedSnapshots[index] ? "▲" : "▼"}
                  </span>
                </div>
                {expandedSnapshots[index] && (
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Dx:
                      </span>
                      <span className="text-sm">
                        {snapshot.dx || "Not specified"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Key Concern:
                      </span>
                      <span className="text-sm">
                        {snapshot.keyConcern || "Not specified"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Next Step:
                      </span>
                      <span className="text-sm">
                        {snapshot.nextStep || "Not specified"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {snapshots.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No treatment history snapshots available
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-blue-200 transition-colors ${copied[`section-treatment-${currentSnapshotIndex}`]
                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                : "border-blue-200 bg-white text-gray-900"
                }`}
              onClick={() =>
                onCopySection("section-treatment", currentSnapshotIndex)
              }
              title="Copy Section"
            >
              {copied[`section-treatment-${currentSnapshotIndex}`] ? (
                <CheckIcon />
              ) : (
                <CopyIcon />
              )}
              Copy Section
            </button>
          </div>
        </>
      )}
    </section>
  );
};

// ADL Component
const ADLSection = ({
  documentData,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) => {
  return (
    <section
      className="p-5 bg-green-50 border-b border-blue-200"
      aria-labelledby="adl-title"
    >
      <h3
        className="flex gap-2 items-center justify-between mb-3 text-base font-semibold cursor-pointer"
        id="adl-title"
        onClick={onToggle}
      >
        <span className="flex gap-2 items-center">
          🧩 ADL & Work Status
          {isCollapsed && (
            <span className="text-sm font-normal text-gray-600">
              (
              {documentData?.adl?.adls_affected
                ? "Restrictions"
                : "No restrictions"}
              )
            </span>
          )}
        </span>
        <span className="text-sm">{isCollapsed ? "▼" : "▲"}</span>
      </h3>
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="border border-green-200 bg-white rounded-lg p-3">
              <h4 className="m-0 mb-2 text-sm text-green-800 font-semibold">
                ADLs Affected
              </h4>
              <div className="whitespace-pre-wrap">
                {documentData?.adl?.adls_affected || "Not specified"}
              </div>
            </div>
            <div className="border border-green-200 bg-white rounded-lg p-3">
              <h4 className="m-0 mb-2 text-sm text-green-800 font-semibold">
                Work Restrictions
              </h4>
              <div className="whitespace-pre-wrap">
                {documentData?.adl?.work_restrictions || "Not specified"}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-green-200 transition-colors ${copied["section-adl"]
                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                : "border-green-200 bg-white text-gray-900"
                }`}
              onClick={() => onCopySection("section-adl")}
              title="Copy Section"
            >
              {copied["section-adl"] ? <CheckIcon /> : <CopyIcon />}
              Copy Section
            </button>
          </div>
        </>
      )}
    </section>
  );
};

// Patient Quiz Section
const PatientQuizSection = ({
  documentData,
  copied,
  onCopySection,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const accordionBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bodyEl = accordionBodyRef.current;
    if (bodyEl) {
      bodyEl.style.maxHeight = isAccordionOpen
        ? `${bodyEl.scrollHeight}px`
        : "0px";
    }
  }, [isAccordionOpen, documentData]);

  useEffect(() => {
    const handleResize = () => {
      if (isAccordionOpen && accordionBodyRef.current) {
        accordionBodyRef.current.style.maxHeight = `${accordionBodyRef.current.scrollHeight}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAccordionOpen]);

  const toggleAccordion = () => {
    setIsAccordionOpen((prev) => !prev);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const quiz = documentData?.patient_quiz;

  if (!quiz) {
    return null;
  }

  const sectionId = "section-patient-quiz";

  return (
    <section
      className="p-5 bg-purple-50 border-b border-blue-200"
      aria-labelledby="quiz-title"
    >
      <div
        className="flex justify-between items-center cursor-pointer py-1"
        role="button"
        aria-expanded={isAccordionOpen}
        aria-controls="quiz-body"
        id="quiz-title"
        onClick={toggleAccordion}
      >
        <h3 className="flex gap-2 items-center m-0 text-base font-semibold">
          🧠 ADL Form
        </h3>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isAccordionOpen ? "rotate-180" : "rotate-0"
            }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div
        id="quiz-body"
        className="overflow-hidden transition-all duration-300"
        ref={accordionBodyRef}
        role="region"
        aria-label="Patient quiz details"
      >
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">Language</div>
            <div>{quiz.lang}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">New Appt</div>
            <div>{quiz.newAppt === "yes" ? "Yes" : "No"}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">Pain Level</div>
            <div>{quiz.pain}/10</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">
              Work Difficulty
            </div>
            <div>{quiz.workDiff === "yes" ? "Yes" : "No"}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">Trend</div>
            <div>{quiz.trend}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">
              Work Ability
            </div>
            <div>{quiz.workAbility}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">Barrier</div>
            <div>{quiz.barrier}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">
              ADLs Affected
            </div>
            <div>{quiz.adl.join(", ") || "None"}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">
              Upcoming Appts
            </div>
            <div>
              {quiz.appts.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {quiz.appts.map((appt, idx) => (
                    <li key={idx}>
                      {formatDate(appt.date)} - {appt.type}
                      {appt.other && ` (${appt.other})`}
                    </li>
                  ))}
                </ul>
              ) : (
                "None"
              )}
            </div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">Created</div>
            <div>{formatDate(quiz.createdAt)}</div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-gray-600 text-xs font-medium">Updated</div>
            <div>{formatDate(quiz.updatedAt)}</div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-purple-200 transition-colors ${copied[sectionId]
              ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
              : "border-purple-200 bg-white text-gray-900"
              }`}
            onClick={() => onCopySection(sectionId)}
            title="Copy Section"
          >
            {copied[sectionId] ? <CheckIcon /> : <CopyIcon />}
            Copy Section
          </button>
        </div>
      </div>
    </section>
  );
};

// Document Summary Component
// Document Summary Component
const DocumentSummarySection = ({
  documentData,
  openModal,
  handleShowPrevious,
  copied,
  onCopySection,
  isCollapsed,
  onToggle,
}: {
  documentData: DocumentData | null;
  openModal: (briefSummary: string) => void;
  handleShowPrevious: (type: string) => void;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const accordionBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bodyEl = accordionBodyRef.current;
    if (bodyEl) {
      bodyEl.style.maxHeight = isAccordionOpen
        ? ` ${bodyEl.scrollHeight}px`
        : "0px";
    }
  }, [isAccordionOpen, documentData]);

  useEffect(() => {
    const handleResize = () => {
      if (isAccordionOpen && accordionBodyRef.current) {
        accordionBodyRef.current.style.maxHeight = `${accordionBodyRef.current.scrollHeight}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAccordionOpen]);

  const toggleAccordion = () => {
    setIsAccordionOpen((prev) => !prev);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Utility function to keep only latest by type
  const getUniqueLatestSummaries = (summaries) => {
    if (!summaries) return [];

    // Group by type and pick latest by date
    const latestMap = summaries.reduce((acc, summary) => {
      const existing = acc[summary.type];
      if (!existing || new Date(summary.date) > new Date(existing.date)) {
        acc[summary.type] = summary;
      }
      return acc;
    }, {});

    return Object.values(latestMap);
  };
  const uniqueSummaries = getUniqueLatestSummaries(
    documentData?.document_summaries
  );

  // Function to handle file preview (opens in new tab) - direct to backend API
  const handlePreviewFile = () => {
    const blobPath = documentData?.blob_path;
    if (blobPath) {
      const previewUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/preview/${encodeURIComponent(
        blobPath
      )}`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Function to handle view original file (e.g., download or open signed URL) - uses document-level gcs_file_link
  const handleViewFile = () => {
    const gcsUrl = documentData?.gcs_file_link;
    if (gcsUrl) {
      window.open(gcsUrl, "_blank", "noopener,noreferrer"); // Opens signed GCS URL (may download based on type)
    }
  };

  const handleToggleAccordion = () => {
    onToggle();
    setIsAccordionOpen(!isAccordionOpen);
  };

  // Update isAccordionOpen based on isCollapsed prop
  useEffect(() => {
    setIsAccordionOpen(!isCollapsed);
  }, [isCollapsed]);

  const getDocumentSummary = () => {
    const summaries = documentData?.document_summaries || [];
    if (summaries.length === 0) return "No documents";
    const types = [...new Set(summaries.map((s: any) => s.type))];
    return `${summaries.length} documents (${types.join(", ")})`;
  };

  return (
    <section className="p-5 bg-gray-100" aria-labelledby="doc-title">
      <div
        className="flex justify-between items-center cursor-pointer py-1"
        role="button"
        aria-expanded={isAccordionOpen}
        aria-controls="doc-body"
        id="doc-title"
        onClick={handleToggleAccordion}
      >
        <h3 className="flex gap-2 items-center m-0 text-base font-semibold">
          📄 Document Summary
          {isCollapsed && (
            <span className="text-sm font-normal text-gray-600">
              ({getDocumentSummary()})
            </span>
          )}
          {documentData?.document_summaries &&
            documentData.document_summaries.length > 1 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {documentData.document_summaries.length} reports
              </span>
            )}
        </h3>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isAccordionOpen ? "rotate-180" : "rotate-0"
            }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div
        id="doc-body"
        className="overflow-hidden transition-all duration-300"
        ref={accordionBodyRef}
        role="region"
        aria-label="Parsed documents"
      >
        {uniqueSummaries.length > 0 ? (
          uniqueSummaries.map((summary, index) => {
            const hasPrevious =
              documentData.previous_summaries &&
              documentData.previous_summaries[summary.type];
            const sectionId = `section-summary-${index}`;

            return (
              <div key={index} className="my-3">
                <div className="border border-blue-200 bg-white rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <div className="text-gray-600 text-xs">Type</div>
                        <div>{summary.type}</div>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <div className="text-gray-600 text-xs">Date</div>
                        <div>{formatDate(summary.date)}</div>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <div className="text-gray-600 text-xs">Summary</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">{summary.summary}</div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2 items-end">
                      <button
                        onClick={() => openModal(summary.brief_summary || "")}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Summary
                      </button>
                      {documentData?.blob_path && ( // Use document-level blob_path
                        <button
                          onClick={handlePreviewFile}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Preview File
                        </button>
                      )}
                      {documentData?.gcs_file_link && ( // Use document-level gcs_file_link (signed URL)
                        <button
                          onClick={handleViewFile}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          Download File
                        </button>
                      )}
                      {hasPrevious && (
                        <button
                          onClick={() => handleShowPrevious(summary.type)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Previous Summary
                        </button>
                      )}
                      <button
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${copied[sectionId]
                          ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                          : "border-blue-200 bg-white text-gray-900"
                          }`}
                        onClick={() => onCopySection(sectionId)}
                        title="Copy Section"
                      >
                        {copied[sectionId] ? <CheckIcon /> : <CopyIcon />}
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center p-3">
            No component summaries available
          </div>
        )}
      </div>
    </section>
  );
};
export default function PhysicianCard() {
  const [theme, setTheme] = useState<"clinical" | "standard">("clinical");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verifyTime, setVerifyTime] = useState<string>("—");
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [showPreviousSummary, setShowPreviousSummary] =
    useState<boolean>(false);
  const [previousSummary, setPreviousSummary] =
    useState<DocumentSummary | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [files, setFiles] = useState<File[]>([]);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({
    whatsNew: false, // Start expanded to show initially
    treatmentHistory: true, // Start collapsed
    adlWorkStatus: true, // Start collapsed
    documentSummary: true, // Start collapsed
  });

  // Toggle section collapse state
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const { data: session, status } = useSession();
  console.log("Session data:", session);

  // Toast management
  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Handle upload and queue
  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });

    try {
      setLoading(true);
      const response = await fetch("/api/extract-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        addToast(`Failed to queue files: ${errorText}`, "error");
        return;
      }

      const data = await response.json();
      const taskIds = data.task_ids || [];
      files.forEach((file, index) => {
        const taskId = taskIds[index] || "unknown";
        addToast(
          `File "${file.name}" successfully queued for processing. Task ID: ${taskId}`,
          "success"
        );
      });

      // Clear files
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      addToast("Network error uploading files", "error");
    } finally {
      setLoading(false);
    }
  };

  // Compute physician ID safely
  const getPhysicianId = (): string | null => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? session.user.id
      : session.user.physicianId;
  };

  // Handle patient selection from recommendations
  const handlePatientSelect = (patient: Patient) => {
    console.log("Patient selected:", patient);
    setSelectedPatient(patient);

    // Fetch document data for the selected patient
    fetchDocumentData(patient);
  };

  // Flatten grouped summaries into array and prepare previous
  const processAggregatedSummaries = (
    groupedDocumentSummary: {
      [key: string]: { date: string; summary: string }[];
    },
    groupedBriefSummary: { [key: string]: string[] }
  ): {
    document_summaries: DocumentSummary[];
    previous_summaries: { [key: string]: DocumentSummary };
  } => {
    const document_summaries: DocumentSummary[] = [];
    const previousByType: { [key: string]: DocumentSummary } = {};

    Object.entries(groupedDocumentSummary).forEach(([type, sumEntries]) => {
      // Sort entries by date descending
      sumEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const briefEntries = groupedBriefSummary[type] || [];
      // Assume brief entries are in same order, sort if needed
      // For simplicity, pair by index

      sumEntries.forEach((entry, idx) => {
        const brief =
          briefEntries[idx] || (briefEntries.length > 0 ? briefEntries[0] : "");
        document_summaries.push({
          type,
          date: entry.date,
          summary: entry.summary,
          brief_summary: brief,
        });
      });

      // Set previous if more than one
      if (sumEntries.length > 1) {
        const prevEntry = sumEntries[1];
        const prevBrief =
          briefEntries[1] || (briefEntries.length > 0 ? briefEntries[0] : "");
        previousByType[type] = {
          type,
          date: prevEntry.date,
          summary: prevEntry.summary,
          brief_summary: prevBrief,
        };
      }
    });

    // Sort all summaries by date desc
    document_summaries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return { document_summaries, previous_summaries: previousByType };
  };

  // Fetch document data from API
  const fetchDocumentData = async (patientInfo: Patient) => {
    const physicianId = getPhysicianId();
    if (!physicianId) {
      console.error("No physician ID available for document fetch");
      setError("Session not ready. Please refresh.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        patient_name: patientInfo.patientName || patientInfo.name || "",
        dob: patientInfo.dob,
        doi: patientInfo.doi,
        claim_number: patientInfo.claimNumber,
        physicianId: physicianId,
      });

      console.log("Fetching document data with params:", params.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/document?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const data: any = await response.json();
      console.log("Document data received:", data);

      if (!data.documents || data.documents.length === 0) {
        setDocumentData(null);
        setError(
          "No documents found. The document may not have complete patient information (patient name, DOB, DOI, claim number)."
        );
        return;
      }

      const aggDoc = data.documents[0];
      const processedData: DocumentData = { ...aggDoc };

      // Set patient_quiz
      processedData.patient_quiz = data.patient_quiz;

      // Compute allVerified based on status
      processedData.allVerified =
        !!aggDoc.status && aggDoc.status.toLowerCase() === "verified";

      // Process grouped summaries
      const { document_summaries, previous_summaries } =
        processAggregatedSummaries(
          aggDoc.document_summary || {},
          aggDoc.brief_summary || {}
        );
      processedData.document_summaries = document_summaries;
      processedData.previous_summaries = previous_summaries;

      // Handle summary_snapshots array
      processedData.summary_snapshots = aggDoc.summary_snapshots || [];

      // Handle adl - set history if needed, but since aggregated from latest medical, no previous here
      if (processedData.adl) {
        const adlData = processedData.adl;
        adlData.adls_affected_history =
          adlData.adls_affected || "Not specified";
        adlData.work_restrictions_history =
          adlData.work_restrictions || "Not specified";
        adlData.has_changes = false;
      }

      // Set merge_metadata if total_documents >1
      if (data.total_documents > 1) {
        processedData.merge_metadata = {
          total_documents_merged: data.total_documents,
          is_merged: true,
          latest_document_date: aggDoc.created_at || "",
          previous_document_date: "", // Not available in aggregated, could fetch separately if needed
        };
      }

      // ✅ Ensure quick_notes_snapshots is set (from API data)
      processedData.quick_notes_snapshots = aggDoc.quick_notes_snapshots || [];

      setDocumentData(processedData);
    } catch (err: unknown) {
      console.error("Error fetching document data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle verify toggle with API call
  const handleVerifyToggle = async () => {
    if (documentData?.allVerified) return; // Already all verified, no action

    setIsVerified((prev) => !prev);
    if (!isVerified) {
      if (!selectedPatient || !documentData) {
        setError("No patient data available to verify.");
        setIsVerified(false);
        return;
      }

      try {
        setVerifyLoading(true);
        const verifyParams = new URLSearchParams({
          patient_name:
            selectedPatient.patientName || selectedPatient.name || "",
          dob: selectedPatient.dob,
          doi: selectedPatient.doi,
          claim_number: selectedPatient.claimNumber,
        });

        const response = await fetch(`/api/verify-document?${verifyParams}`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`Failed to verify document: ${response.status}`);
        }

        const verifyData = await response.json();
        console.log("Verification response:", verifyData);

        // Optionally refetch document data to update status
        await fetchDocumentData(selectedPatient);

        const d = new Date();
        const opts: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        };
        setVerifyTime(d.toLocaleString(undefined, opts));
      } catch (err: unknown) {
        console.error("Error verifying document:", err);
        setError(err instanceof Error ? err.message : "Verification failed");
        setIsVerified(false); // Revert on error
      } finally {
        setVerifyLoading(false);
      }
    }
  };

  // Handle copy text
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: Show toast or feedback
      console.log(`${fieldName} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Handle section copy
  const handleSectionCopy = async (
    sectionId: string,
    snapshotIndex?: number
  ) => {
    let text = "";
    const doc = documentData;

    switch (sectionId) {
      case "section-snapshot":
        const snapshots = doc?.summary_snapshots || [];
        const currentIdx = snapshotIndex || 0;
        const currentSnap = snapshots[currentIdx];
        if (currentSnap) {
          text = `Summary Snapshot\nDx: ${currentSnap.dx || "Not specified"
            }\nKey Concern: ${currentSnap.keyConcern || "Not specified"
            }\nNext Step: ${currentSnap.nextStep || "Not specified"}`;
        }
        break;
      case "section-whatsnew":
        text = "What's New Since Last Visit\n";
        const wn = doc?.whats_new;
        if (wn) {
          Object.entries(wn).forEach(([key, value]) => {
            if (value && value.trim() !== "" && value.trim() !== " ") {
              const label = key.toUpperCase().replace(/_/g, " ");
              text += `${label}: ${value}\n`;
            }
          });
        }
        if (!text.includes(":")) {
          text += "No significant changes since last visit";
        }
        // ✅ Append quick notes to copy text (sorted)
        const sortedNotes = (doc?.quick_notes_snapshots || [])
          .filter(
            (note) =>
              note.status_update?.trim() ||
              note.one_line_note?.trim() ||
              note.details?.trim()
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        if (sortedNotes.length > 0) {
          text += "\nQuick Notes:\n";
          sortedNotes.forEach((note) => {
            text += `- ${formatTimestamp(note.timestamp)}: ${note.status_update || "Note"
              } - ${note.one_line_note || ""} (${note.details || ""})\n`;
          });
        }
        break;
      case "section-adl":
        text = `ADL / Work Status\nADLs Affected: ${doc?.adl?.adls_affected || "Not specified"
          }\nWork Restrictions: ${doc?.adl?.work_restrictions || "Not specified"
          }`;
        break;
      case "section-patient-quiz":
        if (doc?.patient_quiz) {
          const q = doc.patient_quiz;
          text = `Patient Quiz\nLanguage: ${q.lang}\nNew Appt: ${q.newAppt
            }\nPain Level: ${q.pain}/10\nWork Difficulty: ${q.workDiff}\nTrend: ${q.trend
            }\nWork Ability: ${q.workAbility}\nBarrier: ${q.barrier
            }\nADLs Affected: ${q.adl.join(", ")}\nUpcoming Appts:\n`;
          q.appts.forEach((appt) => {
            text += `- ${appt.date} - ${appt.type} (${appt.other})\n`;
          });
          text += `Created: ${formatDate(q.createdAt)}\nUpdated: ${formatDate(
            q.updatedAt
          )}`;
        } else {
          text = "No patient quiz data available";
        }
        break;
      default:
        if (sectionId.startsWith("section-summary-")) {
          const index = parseInt(sectionId.split("-")[2]);
          const summary = doc?.document_summaries?.[index];
          if (summary) {
            text = `${summary.type} - ${formatDate(summary.date)}\n${summary.summary
              }`;
          }
        }
        break;
    }

    if (!text) return;

    await handleCopy(text, sectionId);

    // Clear previous timer if any
    if (timersRef.current[sectionId]) {
      clearTimeout(timersRef.current[sectionId]);
      delete timersRef.current[sectionId];
    }

    // Set copied state
    setCopied((prev) => ({ ...prev, [sectionId]: true }));

    // Set timer to reset
    timersRef.current[sectionId] = setTimeout(() => {
      setCopied((prev) => {
        const newCopied = { ...prev };
        delete newCopied[sectionId];
        return newCopied;
      });
      delete timersRef.current[sectionId];
    }, 2000);
  };

  // Handle show previous summary
  const handleShowPrevious = (type: string) => {
    const previous = documentData?.previous_summaries?.[type];
    if (previous) {
      setPreviousSummary(previous);
      setShowPreviousSummary(true);
      setShowModal(false);
    }
  };

  // Handle modal open
  const openModal = (briefSummary: string) => {
    setSelectedBriefSummary(briefSummary);
    setShowModal(true);
    setShowPreviousSummary(false);
  };

  // Auto-set verified if all documents are verified
  useEffect(() => {
    if (documentData?.allVerified) {
      setIsVerified(true);
    }
  }, [documentData?.allVerified]);

  // Handle theme switch
  const switchTheme = (val: "clinical" | "standard") => {
    setTheme(val);
  };

  // Format date from ISO string to MM/DD/YYYY
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // ✅ Helper for timestamp formatting (used in copy handler)
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Format date for display (Visit date)
  const getVisitDate = (): string => {
    return documentData?.created_at ? formatDate(documentData.created_at) : "—";
  };

  // Get current patient info for display
  const getCurrentPatientInfo = (): Patient => {
    if (documentData) {
      return {
        patientName: documentData.patient_name || "Select a patient",
        dob: documentData.dob || "—",
        doi: documentData.doi || "—",
        claimNumber: documentData.claim_number || "—",
      };
    }
    if (selectedPatient) {
      return {
        patientName:
          selectedPatient.patientName ||
          selectedPatient.name ||
          "Select a patient",
        dob: selectedPatient.dob || "—",
        doi: selectedPatient.doi || "—",
        claimNumber: selectedPatient.claimNumber || "—",
      };
    }
    return {
      patientName: "Select a patient",
      dob: "—",
      doi: "—",
      claimNumber: "—",
    };
  };

  const currentPatient = getCurrentPatientInfo();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access the physician card.</p>
      </div>
    );
  }

  const physicianId = getPhysicianId();

  return (
    <LayoutWrapper>
      <div
        className={`min-h-screen p-6 font-sans ${theme === "standard" ? "bg-gray-100" : "bg-blue-50"
          } text-gray-900`}
      >
        <div className="max-w-5xl mx-auto">
          {/* Search Bar */}
          <SearchBar
            physicianId={physicianId}
            onPatientSelect={handlePatientSelect}
          />

          {/* Upload Section */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {files.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                <span className="text-sm text-gray-600">
                  Selected: {files.map((f) => f.name).join(", ")}
                </span>
                <button
                  onClick={handleUpload}
                  className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
                  disabled={loading}
                >
                  Queue for Processing
                </button>
                <button
                  onClick={() => {
                    setFiles([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading patient data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="text-red-500 font-semibold mb-2">Error</div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() =>
                  selectedPatient && fetchDocumentData(selectedPatient)
                }
                className="mt-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="font-bold">Kebilo Physician Dashboard</div>
            <select
              id="theme"
              className="bg-indigo-50 text-gray-900 border border-blue-200 rounded-lg p-2 font-semibold focus:outline-none"
              value={theme}
              onChange={(e) =>
                switchTheme(e.target.value as "clinical" | "standard")
              }
            >
              <option value="clinical">Clinical Light</option>
              <option value="standard">Standard Light</option>
            </select>
          </div>

          {!selectedPatient && !documentData ? (
            <div className="bg-white border border-blue-200 rounded-2xl shadow-sm p-8 text-center">
              <div className="text-gray-500 text-lg mb-4">
                👆 Search for a patient above to get started
              </div>
              <p className="text-gray-400">
                Type a patient name in the search bar to view their physician
                card
              </p>
            </div>
          ) : (
            <div
              className="bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden"
              role="region"
              aria-label="Physician-facing card"
            >
              {/* Header with merge indicator */}
              <div className="grid grid-cols-[1fr_auto] gap-3 items-center p-5 bg-blue-50 border-b border-blue-200">
                <div
                  className="flex flex-wrap gap-x-4 gap-y-2"
                  aria-label="Patient summary"
                >
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    Patient: <b>{currentPatient.patientName}</b>
                  </div>
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    DOB: {formatDate(currentPatient.dob)}
                  </div>
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    Claim #: {currentPatient.claimNumber}
                  </div>
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    DOI: {formatDate(currentPatient.doi)}
                  </div>
                  {documentData?.merge_metadata?.is_merged && (
                    <div className="bg-amber-100 border border-amber-300 px-2 py-1 rounded-full text-sm">
                      🔄 Combined{" "}
                      {documentData.merge_metadata.total_documents_merged}{" "}
                      visits
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="bg-blue-100 text-gray-900 border border-blue-200 px-2 py-1 rounded-full text-xs font-bold">
                    PR‑2
                  </span>
                  <span className="bg-indigo-50 text-gray-900 border border-blue-200 px-2 py-1 rounded-full text-xs font-bold">
                    Visit: {getVisitDate()}
                  </span>
                </div>
              </div>

              {/* Physician Verified Row - Only show for Physicians */}
              {session.user.role === "Physician" && (
                <div className="flex justify-between items-center p-3 border-b border-blue-200 bg-gray-50">
                  <div className="flex gap-2 items-center text-sm">
                    <label
                      className="relative inline-block w-14 h-8"
                      aria-label="Physician Verified"
                    >
                      <input
                        id="verifyToggle"
                        type="checkbox"
                        className="opacity-0 w-0 h-0"
                        checked={isVerified}
                        onChange={handleVerifyToggle}
                        disabled={verifyLoading || documentData?.allVerified}
                      />
                      <span
                        className={`absolute inset-0 bg-gray-300 border border-blue-200 rounded-full cursor-pointer transition duration-200 ${isVerified ? "bg-green-100 border-green-300" : ""
                          } ${verifyLoading || documentData?.allVerified
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                          }`}
                      >
                        <span
                          className={`absolute h-6 w-6 bg-white rounded-full top-0.5 left-0.5 transition-transform duration-200 ${isVerified ? "translate-x-6" : ""
                            } shadow`}
                        ></span>
                      </span>
                    </label>
                    {verifyLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    )}
                    <span
                      id="verifyBadge"
                      className={`px-2 py-1 rounded-full border border-green-300 bg-green-50 text-green-800 font-bold ${isVerified ? "inline-block" : "hidden"
                        }`}
                    >
                      Verified ✓
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm">
                    Last verified: <span id="verifyTime">{verifyTime}</span>
                  </div>
                </div>
              )}

              {/* Render Sub-Components - Using Treatment History as Summary Snapshot */}
              <WhatsNewSection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
                isCollapsed={collapsedSections.whatsNew}
                onToggle={() => toggleSection("whatsNew")}
              />
              <TreatmentHistorySection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
                isCollapsed={collapsedSections.treatmentHistory}
                onToggle={() => toggleSection("treatmentHistory")}
              />
              <ADLSection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
                isCollapsed={collapsedSections.adlWorkStatus}
                onToggle={() => toggleSection("adlWorkStatus")}
              />
              <DocumentSummarySection
                documentData={documentData}
                openModal={openModal}
                handleShowPrevious={handleShowPrevious}
                copied={copied}
                onCopySection={handleSectionCopy}
                isCollapsed={collapsedSections.documentSummary}
                onToggle={() => toggleSection("documentSummary")}
              />
              <PatientQuizSection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
              />
            </div>
          )}

          {/* Refresh button - only show when patient is selected */}
          {selectedPatient && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => fetchDocumentData(selectedPatient)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                disabled={loading}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"
              } animate-in slide-in-from-top-2 duration-300`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Brief Summary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Brief Summary</h3>
              <p className="text-gray-700 whitespace-pre-wrap mb-6">
                {selectedBriefSummary}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Summary Modal */}
      {showPreviousSummary && previousSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Previous {previousSummary.type} Summary
              </h3>
              <div className="grid grid-cols-[140px_1fr] gap-2 mb-6">
                <div className="text-gray-600 text-xs">Date</div>
                <div>{formatDate(previousSummary.date)}</div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 mb-6">
                <div className="text-gray-600 text-xs">Summary</div>
                <div>{previousSummary.summary}</div>
              </div>
              <button
                onClick={() => openModal(previousSummary.brief_summary || "")}
                className="mr-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                View Brief
              </button>
              <button
                onClick={() => setShowPreviousSummary(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
