// components/physician-components/PatientQuizSection.tsx
import { usePatientQuiz } from "@/app/custom-hooks/staff-hooks/physician-hooks/usePatientQuiz";
import React from "react";
// import { usePatientQuiz } from "@/hooks/usePatientQuiz";

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

interface Appt {
  date: string;
  type: string;
  other: string;
}

interface PatientQuiz {
  id: string;
  patientName: string;
  dob: string;
  doi: string;
  lang: string;
  newAppt: string;
  appts: Appt[];
  pain: number;
  workDiff: string;
  trend: string;
  workAbility: string;
  barrier: string;
  adl: string[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  brief_summary?: { [key: string]: string[] };
  summary_snapshot?: {
    diagnosis: string;
    diagnosis_history: string;
    key_concern: string;
    key_concern_history: string;
    next_step: string;
    next_step_history: string;
    has_changes: boolean;
  };
  summary_snapshots?: {
    id: string;
    dx: string;
    keyConcern: string;
    nextStep: string;
    documentId: string;
  }[];
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
  patient_quiz?: PatientQuiz | null;
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

interface PatientQuizSectionProps {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
}

const PatientQuizSection: React.FC<PatientQuizSectionProps> = ({
  documentData,
  copied,
  onCopySection,
}) => {
  const {
    isAccordionOpen,
    accordionBodyRef,
    toggleAccordion,
    formatDate,
    quiz,
    sectionId,
  } = usePatientQuiz(documentData);

  if (!quiz) {
    return null;
  }

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
          className={`w-4 h-4 transition-transform duration-300 ${
            isAccordionOpen ? "rotate-180" : "rotate-0"
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
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-purple-200 transition-colors ${
              copied[sectionId]
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

export default PatientQuizSection;
