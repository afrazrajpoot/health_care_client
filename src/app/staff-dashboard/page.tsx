// app/dashboard/page.tsx (complete fixed version)
"use client";

import IntakeModal from "@/components/staff-components/IntakeModal";
import TaskTable from "@/components/staff-components/TaskTable";
import FailedDocuments from "@/components/staff-components/FailedDocuments";
import DuplicatePatients from "@/components/staff-components/DuplicatePatients";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import UpdateDuplicateModal from "@/components/staff-components/UpdateDuplicateModal";
import { ProgressTracker } from "@/components/ProgressTracker";
import StyledTaskTracker from "@/components/staff-components/StyledTaskTracker";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/navigation/sidebar";
import ManualTaskModal from "@/components/ManualTaskModal";
import { useTasks } from "../custom-hooks/staff-hooks/useTasks";
import { useOfficePulse } from "../custom-hooks/staff-hooks/useOfficePulse";
import { useFailedDocuments } from "../custom-hooks/staff-hooks/useFailedDocuments";
import { useDuplicatePatients } from "../custom-hooks/staff-hooks/useDuplicatePatients";
import useOnboarding from "../custom-hooks/staff-hooks/useOnboarding";
import { useUIState } from "../custom-hooks/staff-hooks/useUIState";
import { useFileUpload } from "../custom-hooks/staff-hooks/useFileUpload";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
// OnboardingTour component
const OnboardingTour = ({
  isOpen,
  onClose,
  currentStep,
  onNext,
  onPrevious,
  steps,
  stepPositions,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  steps: any[];
  stepPositions: any[];
}) => {
  if (!isOpen || currentStep >= steps.length) return null;

  const currentStepData = steps[currentStep];
  const position = stepPositions[currentStep] || { top: "50%", left: "50%" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4 relative"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
          zIndex: 101,
        }}
      >
        <div
          className="absolute w-4 h-4 bg-white rotate-45"
          style={{
            top: position.arrowTop || "-8px",
            left: position.arrowLeft || "50%",
            transform: "translateX(-50%)",
          }}
        ></div>

        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">{currentStepData.title}</h3>
          <p className="text-gray-600 text-sm">{currentStepData.content}</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={onPrevious}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={onNext}
                className="px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Simple fallback PaymentErrorModal component
// In app/dashboard/page.tsx - Update the PaymentErrorModal component

const PaymentErrorModal = ({
  isOpen,
  onClose,
  onUpgrade,
  errorMessage,
  ignoredFiles,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  errorMessage?: string;
  ignoredFiles?: any[];
}) => {
  if (!isOpen) return null;

  const hasIgnoredFiles = ignoredFiles && ignoredFiles.length > 0;

  // Only show modal for ignored files or other errors, not for document limit errors
  if (!hasIgnoredFiles && !errorMessage) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header with close button */}
        <div
          className={`relative p-6 pb-8 flex-shrink-0 ${
            hasIgnoredFiles
              ? "bg-gradient-to-r from-orange-600 to-red-600"
              : "bg-gradient-to-r from-red-600 to-red-700"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <AlertCircle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {hasIgnoredFiles ? "Files Not Uploaded" : "Upload Error"}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {hasIgnoredFiles ? (
            <>
              <p className="text-gray-700 leading-relaxed">
                {errorMessage ||
                  `${ignoredFiles.length} file${
                    ignoredFiles.length > 1 ? "s" : ""
                  } could not be uploaded:`}
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ignoredFiles.map((file, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                        <AlertCircle className="text-red-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-900 break-words">
                          {file.filename}
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {file.reason}
                        </p>
                        {file.existing_file && (
                          <p className="text-xs text-red-600 mt-1">
                            Already uploaded as:{" "}
                            <span className="font-medium">
                              {file.existing_file}
                            </span>
                          </p>
                        )}
                        {file.document_id && (
                          <p className="text-xs text-gray-500 mt-1">
                            Document ID: {file.document_id}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700 leading-relaxed">
                {errorMessage ||
                  "An error occurred during upload. Please try again."}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Notes Options (same as TaskRows.tsx)
const quickNoteOptions = {
  "Scheduling-Related": {
    "Outbound Scheduling": [
      "Called patient – left voicemail.",
      "Called patient – scheduled appointment.",
      "Called patient – patient declined appointment.",
      "Unable to reach patient – no voicemail available.",
      "Text message sent – awaiting response.",
      "Email sent – awaiting response.",
      "Patient reports appointment already scheduled elsewhere.",
      "Specialist office contacted – awaiting available dates.",
      "Specialist office contacted – appointment confirmed.",
      "Specialist office requested updated referral/authorization.",
      "Specialist office does not accept patient's insurance.",
    ],
    "Inbound Scheduling": [
      "Outside office sent appointment date – updated in system.",
      "Outside office cancelled/rescheduled appointment.",
      "Specialist requested additional documentation before scheduling.",
    ],
  },
  "Lab / Imaging Follow-Up": {
    "Lab Results": [
      "Lab results received – forwarded to provider.",
      "Critical lab flagged – provider notified.",
    ],
    "Imaging Follow-Up": [
      "Imaging report received – provider notified.",
      "Imaging center requesting updated order.",
      "Imaging center unable to proceed – insurance issue.",
      "Patient instructed to schedule imaging.",
      "Patient completed imaging – awaiting report.",
    ],
  },
  "Pharmacy / Medication": {
    "Pharmacy Requests": [
      "Pharmacy requested clarification – forwarded to provider.",
      "Pharmacy refill request received – sent to provider.",
      "Medication not covered – pharmacy requested alternative.",
    ],
    "Prior Authorization": [
      "Prior authorization required – beginning process.",
      "Prior authorization submitted.",
      "Prior authorization approved.",
      "Prior authorization denied – provider notified.",
    ],
  },
  "Insurance / Care Coordination": {
    "Insurance Issues": [
      "Insurance requested additional documentation.",
      "Insurance denied request – report uploaded for provider.",
      "Insurance authorization received – ready to schedule.",
      "Patient's insurance inactive – requested updated information.",
    ],
    "Authorization & Forms": [
      "Insurance form completed and faxed.",
      "Insurance form incomplete – need missing details.",
    ],
  },
  "Hospital / ER Records": {
    "Hospital Reports": [
      "Hospital discharge summary received – forwarded to provider.",
      "ED visit report received – provider notified.",
      "Hospital requested follow-up appointment.",
    ],
    "Care Transition": [
      "Care transition call made – left voicemail.",
      "Care transition call completed – appointment scheduled.",
    ],
  },
  "Specialist Reports": {
    "Consult Reports": [
      "Consult report received – provider notified.",
      "Consult report recommends follow-up – scheduling patient.",
      "Consult report recommends new medication – awaiting provider decision.",
    ],
    "Specialist Requests": [
      "Specialist requested updated labs/imaging.",
      "Specialist requested new referral.",
    ],
  },
  "Administrative Documents": {
    "Forms Processing": [
      "Form received – routed to provider.",
      "Form completed – faxed/emailed.",
      "Form incomplete – need missing patient information.",
    ],
    "Form Status": [
      "Employer requested additional information.",
      "Patient notified form is ready for pick-up.",
    ],
  },
  "Attempt / Outcome": {
    "Completion Status": [
      "Completed as requested.",
      "Unable to complete – missing documentation.",
      "Unable to complete – requires provider review.",
      "Task resolved – no further action needed.",
    ],
    "Pending Status": [
      "Pending patient response.",
      "Pending outside office response.",
      "Pending insurance response.",
    ],
  },
  "Patient Communication": {
    "Notification Methods": [
      "Patient notified via phone.",
      "Patient notified via text.",
      "Patient notified via patient portal.",
      "Patient notified via email.",
    ],
    "Patient Response": [
      "Patient acknowledged and understands.",
      "Patient needs clarification – routed to provider.",
    ],
  },
  Escalation: {
    "Escalation Types": [
      "Escalated to provider.",
      "Escalated to supervisor.",
      "Requires clinical decision – provider notified.",
      "Requires insurance specialist – forwarded.",
      "Requires follow-up from management.",
    ],
  },
};

// Quick Notes Form Component
const QuickNotesForm = ({
  taskId,
  taskDept,
  quickNotesData,
  onUpdate,
  onSave,
  onCancel,
}: {
  taskId: string;
  taskDept: string;
  quickNotesData: {
    category: string;
    subcategory: string;
    note: string;
    customNote: string;
  };
  onUpdate: (data: {
    category: string;
    subcategory: string;
    note: string;
    customNote: string;
  }) => void;
  onSave: (note: string) => void;
  onCancel: () => void;
}) => {
  const availableSubcategories = quickNotesData.category
    ? Object.keys(
        quickNoteOptions[
          quickNotesData.category as keyof typeof quickNoteOptions
        ] || {}
      )
    : [];

  const availableNotes =
    quickNotesData.category && quickNotesData.subcategory
      ? (
          quickNoteOptions[
            quickNotesData.category as keyof typeof quickNoteOptions
          ] as any
        )?.[quickNotesData.subcategory] || []
      : [];

  const handleSave = () => {
    const finalNote = quickNotesData.note || quickNotesData.customNote;
    if (finalNote.trim()) {
      onSave(finalNote);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <select
          value={quickNotesData.category}
          onChange={(e) => {
            onUpdate({
              ...quickNotesData,
              category: e.target.value,
              subcategory: "",
              note: "",
            });
          }}
          style={{
            padding: "6px 8px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "12px",
            minWidth: "150px",
          }}
        >
          <option value="">Select Category</option>
          {Object.keys(quickNoteOptions).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {availableSubcategories.length > 0 && (
          <select
            value={quickNotesData.subcategory}
            onChange={(e) => {
              onUpdate({
                ...quickNotesData,
                subcategory: e.target.value,
                note: "",
              });
            }}
            style={{
              padding: "6px 8px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              minWidth: "150px",
            }}
          >
            <option value="">Select Subcategory</option>
            {availableSubcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        )}

        {availableNotes.length > 0 && (
          <select
            value={quickNotesData.note}
            onChange={(e) => {
              onUpdate({
                ...quickNotesData,
                note: e.target.value,
              });
            }}
            style={{
              padding: "6px 8px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "12px",
              minWidth: "200px",
            }}
          >
            <option value="">Select Quick Note</option>
            {availableNotes.map((note: string, index: number) => (
              <option key={index} value={note}>
                {note}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Or enter custom note"
          value={quickNotesData.customNote}
          onChange={(e) => {
            onUpdate({
              ...quickNotesData,
              customNote: e.target.value,
            });
          }}
          style={{
            padding: "6px 8px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "12px",
            flex: "1",
            minWidth: "200px",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!quickNotesData.note && !quickNotesData.customNote.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            background: "#6366f1",
            color: "white",
            cursor:
              !quickNotesData.note && !quickNotesData.customNote.trim()
                ? "not-allowed"
                : "pointer",
            opacity:
              !quickNotesData.note && !quickNotesData.customNote.trim()
                ? 0.6
                : 1,
            fontSize: "12px",
          }}
        >
          Save Note
        </button>
      </div>
    </div>
  );
};

// In the main Dashboard component, keep the PaymentErrorModal usage as before:

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlClaim = searchParams.get("claim") || "";
  const urlPatient = searchParams.get("patient_name") || "";
  const urlDocumentId = searchParams.get("document_id") || "";
  const { data: session } = useSession();
  const initialMode = "wc" as const;
  const {
    currentPane,
    setCurrentPane,
    filters,
    setFilters,
    dense,
    setDense,
    showModal,
    setShowModal,
    showTaskModal,
    setShowTaskModal,
    isOfficePulseCollapsed,
    setIsOfficePulseCollapsed,
    isFiltersCollapsed,
    setIsFiltersCollapsed,
    isSidebarOpen,
    setIsSidebarOpen,
    modeState,
    setModeState,
    filteredTabs,
    departments,
    getPresets,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCount,
    setTotalCount,
  } = useUIState(initialMode);
  const {
    selectedFiles,
    uploading,
    snapInputRef,
    formatSize,
    handleSnap,
    handleCancel,
    handleSubmit,
    paymentError,
    clearPaymentError,
    ignoredFiles,
    removeFile,
  } = useFileUpload(modeState);
  const {
    tasks,
    loading,
    fetchTasks,
    toggleClaim,
    completeTask,
    saveNote,
    handleCreateManualTask,
  } = useTasks(initialMode);
  const { pulse, workflowStats, fetchOfficePulse, fetchWorkflowStats } =
    useOfficePulse();
  const {
    failedDocuments,
    isUpdateModalOpen,
    selectedDoc,
    updateFormData,
    updateLoading,
    fetchFailedDocuments,
    removeFailedDocument,
    handleRowClick,
    handleUpdateInputChange,
    handleUpdateSubmit,
    setIsUpdateModalOpen,
  } = useFailedDocuments();

  const {
    duplicateDocuments,
    isUpdateModalOpen: isDuplicateModalOpen,
    selectedDoc: selectedDuplicateDoc,
    updateFormData: duplicateFormData,
    updateLoading: duplicateUpdateLoading,
    fetchDuplicateDocuments,
    handleRowClick: handleDuplicateRowClick,
    handleUpdateInputChange: handleDuplicateInputChange,
    handleUpdateSubmit: handleDuplicateSubmit,
    setIsUpdateModalOpen: setIsDuplicateModalOpen,
  } = useDuplicatePatients();

  const {
    showOnboarding,
    currentStep,
    stepPositions,
    onboardingSteps,
    createLinkButtonRef,
    addManualTaskButtonRef,
    createSnapLinkButtonRef,
    startOnboarding,
    nextStep,
    previousStep,
    closeOnboarding,
  } = useOnboarding();

  const [initialized] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [loadingButtons, setLoadingButtons] = useState<{
    [taskId: string]: "claim" | "complete" | "note" | null;
  }>({});
  const [showQuickNotes, setShowQuickNotes] = useState<{
    [taskId: string]: boolean;
  }>({});
  const [quickNotesData, setQuickNotesData] = useState<{
    [taskId: string]: {
      category: string;
      subcategory: string;
      note: string;
      customNote: string;
    };
  }>({});

  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);

  const handleManualTaskSubmit = useCallback(
    async (formData: any) => {
      try {
        // Auto-fill from URL search params if present (fallback in case modal didn't set)
        if (urlClaim && !formData.claim) {
          formData.claim = urlClaim;
        }
        if (urlPatient && !formData.patientName) {
          formData.patientName = urlPatient;
        }
        if (urlDocumentId && !formData.documentId) {
          formData.documentId = urlDocumentId;
        }
        // If no URL data and no user-provided claim, use recommendation data
        if (!formData.claim && !urlClaim) {
          formData.claim = `Recommendation-${new Date()
            .toISOString()
            .slice(0, 10)}`;
        }
        // Extend for other potential URL params (e.g., dept) if needed
        // Example: if (searchParams.get("dept") && !formData.department) { formData.department = searchParams.get("dept")!; }

        await handleCreateManualTask(formData, modeState, urlClaim);
        await fetchTasks(modeState, urlClaim);
      } catch (error) {
        console.error("Error creating manual task:", error);
        throw error; // Re-throw to let modal handle
      }
    },
    [
      handleCreateManualTask,
      modeState,
      urlClaim,
      fetchTasks,
      urlPatient,
      urlDocumentId,
    ]
  );

  const handleProgressComplete = useCallback(() => {
    const params = {
      page: currentPage,
      pageSize,
      search: filters.search,
      dept: filters.dept,
      status: filters.status,
      overdueOnly: filters.overdueOnly,
      priority: filters.priority || undefined,
      dueDate: filters.dueDate || undefined,
      taskType: filters.taskType || undefined,
      assignedTo: filters.assignedTo || undefined,
      sortBy: filters.sortBy || "dueDate",
      sortOrder: filters.sortOrder || "desc",
    };
    fetchTasks(modeState, urlClaim, params).then((result) => {
      if (result) {
        setTotalCount(result.totalCount);
      }
    });
    fetchFailedDocuments();
    fetchDuplicateDocuments(modeState, urlPatient);
    fetchOfficePulse(); // This will refresh the office pulse data
  }, [
    fetchTasks,
    modeState,
    urlClaim,
    urlPatient,
    fetchFailedDocuments,
    fetchDuplicateDocuments,
    fetchOfficePulse,
    currentPage,
    pageSize,
    filters,
    setTotalCount,
  ]);

  // Initialize default filters
  useEffect(() => {
    if (!initialized) {
      setFilters({
        search: "",
        dept: "",
        status: "",
        overdueOnly: false,
        myDeptOnly: false,
        priority: "",
        dueDate: "",
        taskType: "",
        assignedTo: "",
        sortBy: "dueDate",
        sortOrder: "desc",
        viewMode: "urgent",
      });
    }
  }, [initialized, setFilters]);

  useEffect(() => {
    const params = {
      page: currentPage,
      pageSize,
      search: filters.search,
      dept: filters.dept,
      status: filters.status,
      overdueOnly: filters.overdueOnly,
      priority: filters.priority || undefined,
      dueDate: filters.dueDate || undefined,
      taskType: filters.taskType || undefined,
      assignedTo: filters.assignedTo || undefined,
      sortBy: filters.sortBy || "dueDate",
      sortOrder: filters.sortOrder || "desc",
    };
    fetchTasks(modeState, urlClaim, params).then((result) => {
      if (result) {
        setTotalCount(result.totalCount);
      }
    });
    fetchOfficePulse();
    fetchWorkflowStats();
    fetchFailedDocuments();
    fetchDuplicateDocuments(modeState, urlPatient);
  }, [
    modeState,
    urlClaim,
    urlPatient,
    currentPage,
    pageSize,
    filters.search,
    filters.dept,
    filters.status,
    filters.overdueOnly,
    filters.priority,
    filters.dueDate,
    filters.taskType,
    filters.assignedTo,
    filters.sortBy,
    filters.sortOrder,
    fetchTasks,
    fetchOfficePulse,
    fetchWorkflowStats,
    fetchFailedDocuments,
    fetchDuplicateDocuments,
    setTotalCount,
  ]);

  // Add tooltip positioning on mount and hover
  useEffect(() => {
    const positionTooltip = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tooltipParent = target.closest(".task-tooltip");
      if (!tooltipParent) return;

      const tooltip = tooltipParent.querySelector(
        ".tooltip-text"
      ) as HTMLElement;
      if (!tooltip) return;

      const rect = tooltipParent.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Position tooltip below the element
      tooltip.style.position = "fixed";
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.left = `${rect.left}px`;

      // Adjust if tooltip goes off-screen to the right
      if (rect.left + tooltipRect.width > window.innerWidth) {
        tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
      }

      // Adjust if tooltip goes off-screen to the left
      if (rect.left < 0) {
        tooltip.style.left = "10px";
      }
    };

    const tooltips = document.querySelectorAll(".task-tooltip");
    tooltips.forEach((tooltip) => {
      tooltip.addEventListener("mouseenter", positionTooltip as EventListener);
    });

    return () => {
      tooltips.forEach((tooltip) => {
        tooltip.removeEventListener(
          "mouseenter",
          positionTooltip as EventListener
        );
      });
    };
  }, [tasks]);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #f9fafb;
          --panel: #ffffff;
          --border: #e5e7eb;
          --accent: #2563eb;
          --accent2: #0ea5e9;
          --muted: #6b7280;
          --text: #111827;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial, sans-serif;
          background: var(--bg);
          color: var(--text);
        }
        .wrap {
          width: 100%;
          padding: 20px 40px;
          font-size: 14px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        h1 {
          font-size: 24px;
          margin: 0;
          font-weight: bold;
          color: #1f2937;
        }
        .btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn.primary {
          background: #2563eb;
          color: #fff;
        }
        .btn.primary:hover {
          background: #1d4ed8;
        }
        .btn.light {
          background: #f3f4f6;
          color: #1f2937;
          border: 1px solid #d1d5db;
        }
        .btn.light:hover {
          background: #e5e7eb;
        }
        .filter {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #f9fafb;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        .filter:hover {
          background: #e5e7eb;
        }
        .filter.active {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .ttab.active {
          background: var(--accent);
          color: #fff;
        }
        .card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }
        h2 {
          margin: 0 0 24px;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: bold;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          border-bottom: 1px solid var(--border);
          padding: 10px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        td {
          border-bottom: 1px solid #f3f4f6;
          padding: 12px 16px;
          text-align: left;
          font-size: 13px;
          color: #1f2937;
        }
        tr:hover {
          background: #f9fafb;
        }
        td.ur-reason-cell {
          max-width: 200px;
          min-width: 160px;
          text-transform: capitalize;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
        }
        .truncate-cell {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: help;
          transition: color 0.2s;
        }
        .truncate-cell:hover {
          color: #1f2937;
          text-decoration: underline;
          text-decoration-style: dotted;
        }
        .truncate-cell-long {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: help;
          transition: color 0.2s;
        }
        .truncate-cell-long:hover {
          color: #1f2937;
          text-decoration: underline;
          text-decoration-style: dotted;
        }
        .truncate-cell-short {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: help;
          transition: color 0.2s;
        }
        .truncate-cell-short:hover {
          color: #1f2937;
          text-decoration: underline;
          text-decoration-style: dotted;
        }
        .task-tooltip {
          position: relative;
          display: inline-block;
          cursor: help;
        }
        .task-tooltip .tooltip-text {
          visibility: hidden;
          width: max-content;
          max-width: 600px;
          min-width: 200px;
          background-color: #1f2937;
          color: #fff;
          text-align: left;
          border-radius: 8px;
          padding: 12px 16px;
          position: fixed;
          z-index: 99999;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          pointer-events: none;
          margin-top: -10px;
        }
        .task-tooltip .tooltip-text::after {
          content: "";
          position: absolute;
          bottom: 100%;
          left: 20px;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: transparent transparent #1f2937 transparent;
        }
        .task-tooltip:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
        /* Custom Scrollbar for Task Table */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:active {
          background: #718096;
        }
        .pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .pill.pending,
        .pill.medium {
          background: #fef3c7;
          color: #92400e;
        }
        .pill.waiting {
          background: #e0e7ff;
          color: #3730a3;
        }
        .pill.done,
        .pill.low {
          background: #dcfce7;
          color: #166534;
        }
        .pill.signature,
        .pill.high {
          background: #ef4444;
          color: #fff;
        }
        .pill.completed {
          background: #10b981;
          color: #fff;
        }
        .muted {
          color: #6b7280;
          font-size: 14px;
        }
        /* Quick Notes */
        .qnote {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .qnote select,
        .qnote input {
          padding: 6px 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
        }
        .qnote .save {
          padding: 6px 10px;
          border: none;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }
        .notechip {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          background: #eef2ff;
          color: #1e3a8a;
          border: 1px solid #c7d2fe;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
          margin: 2px 2px 0 0;
        }
        /* Aggregator */
        #aggScroll {
          max-height: 55vh;
          overflow: auto;
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        #aggScroll table {
          margin: 0;
        }
        #aggEmpty {
          padding: 10px;
          color: var(--muted);
        }
        /* Floating SnapLink button */
        .snaplink-btn {
          position: fixed;
          top: 24px;
          left: 5vw;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          color: #fff;
          font-weight: 700;
          border: none;
          border-radius: 50px;
          padding: 16px 28px;
          font-size: 16px;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
          cursor: pointer;
          transition: all 0.25s ease;
          z-index: 10;
        }
        .snaplink-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
        }
        .snaplink-btn::before {
          content: "⚡ ";
        }
        .snap-toast {
          position: fixed;
          top: 90px;
          left: 24px;
          background: #111827;
          color: #fff;
          padding: 10px 14px;
          border-radius: 10px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
          font-size: 13px;
          z-index: 1001;
        }
        .hidden {
          display: none;
        }
        .filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
        .collapse-btn {
          font-size: 14px;
          padding: 6px 12px;
          min-height: auto;
          background: #f3f4f6;
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
        }
        .kpi {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }
        .kpi h4 {
          font-size: 12px;
          margin: 0 0 4px 0;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .kpi .val {
          font-size: 18px;
          font-weight: 700;
          color: #2563eb;
        }
        .tile {
          padding: 6px;
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
        }
        .tile h4 {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--muted);
        }
        .tile .val {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }
        .taskpane {
          display: block;
        }
        .dense td,
        .dense th {
          padding: 4px;
        }
        .dense .btn,
        .dense .filter {
          padding: 4px 8px;
        }
        .mini-table th {
          padding: 12px 8px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .mini-table td {
          padding: 16px 8px;
          font-size: 14px;
        }
        .mini-table th.red-header {
          color: #ef4444;
        }
        .clickable-number {
          font-weight: bold;
          color: #2563eb;
          cursor: pointer;
        }
        .clickable-number:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .red-number {
          font-weight: bold;
          color: #ef4444;
          cursor: pointer;
        }
        .red-number:hover {
          color: #dc2626;
          text-decoration: underline;
        }
        /* Additional styles for failed docs */
        .failed-row {
          cursor: pointer;
        }
        .failed-row:hover {
          background: #f3f4f6;
        }
        /* Styles for file list in modal */
        .file-list {
          list-style: none;
          padding: 0;
          margin: 8px 0;
          max-height: 200px;
          overflow-y: auto;
        }
        .file-item {
          font-size: 12px;
          margin-bottom: 4px;
          padding: 4px;
          background: #f3f4f6;
          border-radius: 4px;
        }
        .submit-btn,
        .cancel-btn {
          margin-right: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .submit-btn {
          background: #2563eb;
          color: #fff;
          border: none;
        }
        .submit-btn:hover {
          background: #1d4ed8;
        }
        .cancel-btn {
          background: #f3f4f6;
          color: var(--text);
          border: 1px solid var(--border);
        }
        .cancel-btn:hover {
          background: #e5e7eb;
        }
        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
          font-style: italic;
        }
        /* Onboarding Help Button */
        .onboarding-help-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .onboarding-help-btn:hover {
          background: var(--accent2);
          transform: scale(1.05);
        }
        /* Left Sidebar Styles */
        .layout {
          display: flex;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        #leftSidebar {
          position: relative;
          width: 260px;
          min-width: 260px;
          height: 100vh;
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 20px;
          overflow-y: auto;
          transition: all 0.25s;
        }
        #leftSidebar.collapsed {
          width: 60px;
          min-width: 60px;
          padding: 20px 8px;
        }
        #leftSidebar.collapsed h3 {
          display: none;
        }
        #leftSidebar.collapsed button {
          font-size: 0;
          height: 40px;
        }
        #leftSidebar.collapsed button::before {
          font-size: 18px;
          content: "📁";
        }
        #leftSidebar h3 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #1e293b;
        }
        #leftSidebar button {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          text-align: left;
          background: #f3f4f6;
          color: #1e293b;
          font-size: 14px;
          transition: all 0.2s;
        }
        #leftSidebar button:hover {
          background: #e5e7eb;
        }
        #leftSidebar button.active {
          background: #2563eb;
          color: white;
        }
        .mainContent {
          flex: 1;
          padding: 25px;
          position: relative;
          overflow-x: auto;
          overflow-y: auto;
          background: #f7f9fc;
        }
        .topbar {
          background: white;
          padding: 15px 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        .searchbar input {
          width: 260px;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
        }
        .filters select,
        #staffLogin {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          margin-left: 10px;
          font-size: 14px;
        }
        #collapseToggle {
          position: absolute;
          left: 260px;
          top: 10px;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          background: #2563eb;
          color: white;
          cursor: pointer;
          transition: left 0.25s;
          z-index: 20;
        }
        #leftSidebar.collapsed ~ #collapseToggle {
          left: 70px;
        }
        .floating-intake-btn {
          position: fixed;
          bottom: 25px;
          right: 25px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          color: white;
          padding: 14px 22px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: bold;
          border: none;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
          z-index: 9999;
        }
        .floating-intake-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }
        /* Task Card Styles */
        .taskcard {
          background: white;
          padding: 18px;
          border-radius: 12px;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border-left: 6px solid #2563eb;
        }
        .task-header {
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .task-actions {
          margin-top: 10px;
        }
        .btn {
          padding: 8px 14px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          margin-right: 10px;
          font-size: 13px;
          transition: all 0.2s;
        }
        .btn-view {
          background: #e2e8f0;
          color: #1e293b;
        }
        .btn-view:hover {
          background: #cbd5e1;
        }
        .btn-complete {
          background: #3b82f6;
          color: white;
        }
        .btn-complete:hover {
          background: #2563eb;
        }
        .btn-claim {
          background: #10b981;
          color: white;
        }
        .btn-claim:hover {
          background: #059669;
        }
        .btn-assign {
          background: #f59e0b;
          color: white;
        }
        .btn-assign:hover {
          background: #d97706;
        }
        .activity-history {
          margin-top: 10px;
          font-size: 13px;
          color: #475569;
        }
        .history-entry {
          padding: 3px 0;
        }
        /* Upload Button Styles - DocLatch */
        .upload-btn-new {
          position: fixed;
          bottom: 25px;
          left: 25px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 26px;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          z-index: 9999;
          animation: floating 3s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes floating {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .upload-btn-new:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .upload-btn-new:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          animation: none;
        }
      `}</style>
      <ProgressTracker onComplete={handleProgressComplete} />

      <OnboardingTour
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        currentStep={currentStep}
        onNext={nextStep}
        onPrevious={previousStep}
        steps={onboardingSteps}
        stepPositions={stepPositions}
      />

      <button
        className="onboarding-help-btn"
        onClick={startOnboarding}
        title="Show onboarding tour"
      >
        ?
      </button>

      <div className="flex min-h-screen relative">
        <div
          className={`sidebar-container fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>

        <div
          className={`toggle-btn fixed top-4 z-50 h-8 w-8 cursor-pointer flex items-center justify-center transition-all duration-300 rounded-full ${
            isSidebarOpen
              ? "left-64 bg-transparent hover:bg-transparent shadow-none"
              : "left-4 bg-gray-200 hover:bg-gray-300 shadow-md"
          }`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          <div className="flex flex-col items-center justify-center w-4 h-4">
            <div
              className={`w-4 h-0.5 bg-gray-700 mb-1 transition-all duration-200 ${
                isSidebarOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            ></div>
            <div
              className={`w-4 h-0.5 bg-gray-700 mb-1 transition-all duration-200 ${
                isSidebarOpen ? "opacity-0" : ""
              }`}
            ></div>
            <div
              className={`w-4 h-0.5 bg-gray-700 transition-all duration-200 ${
                isSidebarOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            ></div>
          </div>
        </div>

        <div className="layout">
          {/* Left Sidebar - Global Tasks */}
          <div
            id="leftSidebar"
            className={isLeftSidebarCollapsed ? "collapsed" : ""}
          >
            <h3>Global Tasks</h3>
            <button
              className={filters.viewMode === "all" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "all" })}
            >
              📌 All Tasks
            </button>
            <button
              className={filters.viewMode === "signature" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "signature" })}
            >
              🔴 Signature Required
            </button>
            <button
              className={filters.viewMode === "denials" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "denials" })}
            >
              🟠 Denials & Appeals
            </button>
            <button
              className={filters.viewMode === "approvals" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "approvals" })}
            >
              🟦 Approvals to Schedule
            </button>
            <button
              className={filters.viewMode === "scheduling" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "scheduling" })}
            >
              🟩 Scheduling Tasks
            </button>
            <button
              className={filters.viewMode === "admin" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "admin" })}
            >
              📁 Administrative Tasks
            </button>
            <button
              className={filters.viewMode === "provider" ? "active" : ""}
              onClick={() => setFilters({ ...filters, viewMode: "provider" })}
            >
              ⚕️ Provider Action Required
            </button>
          </div>
          <button
            id="collapseToggle"
            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            title={
              isLeftSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
            }
          >
            {isLeftSidebarCollapsed ? "⇥" : "⇤"}
          </button>

          <div className="mainContent">
            {/* Topbar with Search and Filters */}
            <div className="topbar">
              <div className="searchbar">
                <input
                  type="text"
                  placeholder="Search tasks…"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
              <div className="filters">
                <select
                  value={filters.dept || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dept: e.target.value })
                  }
                >
                  <option value="">Dept: All</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={filters.dueDate || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dueDate: e.target.value })
                  }
                >
                  <option value="">Due: All</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select id="staffLogin">
                  <option disabled selected>
                    Login as…
                  </option>
                  <option>Maria</option>
                  <option>Monica</option>
                  <option>Marc</option>
                  <option>Sonia</option>
                </select>
              </div>
            </div>

            {/* Upload Button - DocLatch */}
            <button
              ref={createSnapLinkButtonRef}
              className="upload-btn-new"
              onClick={() => snapInputRef.current?.click()}
              disabled={uploading}
              title="Upload Documents to DocLatch"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              ) : (
                "📁"
              )}
            </button>
            <input
              type="file"
              ref={snapInputRef}
              multiple
              max={10}
              className="hidden"
              onChange={handleSnap}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />

            {/* Create Intake Link Button */}
            <button
              ref={createLinkButtonRef}
              className="floating-intake-btn"
              onClick={() => setShowModal(true)}
            >
              Create Intake Link
            </button>

            <div className="wrap">
              {/* Add Font Awesome CDN */}
              <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
              />

              <div className="header" style={{ marginBottom: "20px" }}>
                <h1 className="text-2xl font-bold text-gray-800">
                  DocLatch Mission Control
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <label
                    className="muted"
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      fontSize: "14px",
                    }}
                  >
                    Mode:
                    <select
                      value={modeState}
                      onChange={(e) =>
                        setModeState(e.target.value as "wc" | "gm")
                      }
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="wc">Workers&apos; Comp</option>
                      <option value="gm">General Medicine</option>
                    </select>
                  </label>
                  <label
                    className="muted"
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      fontSize: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={dense}
                      onChange={(e) => setDense(e.target.checked)}
                    />
                    Dense
                  </label>
                  {session?.user?.role === "Physician" && (
                    <button
                      ref={addManualTaskButtonRef}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      onClick={() => setShowTaskModal(true)}
                    >
                      <i className="fas fa-plus"></i>
                      Add Manual Task
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    title="Department Settings"
                  >
                    <i className="fas fa-cog"></i>
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => {
                      const params = {
                        page: currentPage,
                        pageSize,
                        search: filters.search,
                        dept: filters.dept,
                        status: filters.status,
                        overdueOnly: filters.overdueOnly,
                        priority: filters.priority || undefined,
                        dueDate: filters.dueDate || undefined,
                        taskType: filters.taskType || undefined,
                        assignedTo: filters.assignedTo || undefined,
                        sortBy: filters.sortBy || "dueDate",
                        sortOrder: filters.sortOrder || "desc",
                      };
                      fetchTasks(modeState, urlClaim, params).then((result) => {
                        if (result) {
                          setTotalCount(result.totalCount);
                        }
                      });
                    }}
                    disabled={loading}
                    title="Refresh Data"
                  >
                    <i
                      className={`fas fa-sync-alt ${
                        loading ? "animate-spin" : ""
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              {loading && (
                <div className="card">
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                    Loading tasks...
                  </div>
                </div>
              )}

              {!loading && (
                <>
                  {/* Task Cards */}
                  <div>
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task) => {
                        // Determine task type icon and color based on department
                        const getTaskTypeInfo = (
                          dept: string,
                          taskText: string
                        ) => {
                          const deptLower = dept.toLowerCase();
                          const taskLower = taskText.toLowerCase();

                          if (
                            deptLower.includes("scheduling") ||
                            taskLower.includes("schedule")
                          ) {
                            return {
                              icon: "🟦",
                              type: "scheduling",
                              color: "#3b82f6",
                            };
                          }
                          if (
                            deptLower.includes("authorization") ||
                            deptLower.includes("rfa") ||
                            deptLower.includes("imr") ||
                            taskLower.includes("authorization")
                          ) {
                            return {
                              icon: "🟠",
                              type: "authorization",
                              color: "#f59e0b",
                            };
                          }
                          if (
                            taskLower.includes("signature") ||
                            taskLower.includes("sign")
                          ) {
                            return {
                              icon: "🔴",
                              type: "signature",
                              color: "#ef4444",
                            };
                          }
                          if (
                            deptLower.includes("follow") ||
                            taskLower.includes("follow")
                          ) {
                            return {
                              icon: "🟡",
                              type: "followup",
                              color: "#eab308",
                            };
                          }
                          if (
                            deptLower.includes("admin") ||
                            deptLower.includes("compliance") ||
                            deptLower.includes("billing")
                          ) {
                            return {
                              icon: "🟢",
                              type: "admin",
                              color: "#10b981",
                            };
                          }
                          return {
                            icon: "📋",
                            type: "default",
                            color: "#2563eb",
                          };
                        };

                        const taskInfo = getTaskTypeInfo(task.dept, task.task);
                        const isClaimed = task.statusText === "in progress";
                        const isCompleted =
                          task.statusText?.toLowerCase() === "done" ||
                          task.statusText?.toLowerCase() === "completed" ||
                          task.statusClass === "completed";
                        const isClaimLoading =
                          loadingButtons[task.id] === "claim";
                        const isCompleteLoading =
                          loadingButtons[task.id] === "complete";
                        const isNoteLoading =
                          loadingButtons[task.id] === "note";

                        const handleClaim = async () => {
                          setLoadingButtons((prev) => ({
                            ...prev,
                            [task.id]: "claim",
                          }));
                          try {
                            await toggleClaim(task.id);
                          } catch (error) {
                            console.error("Error toggling claim:", error);
                          } finally {
                            setLoadingButtons((prev) => {
                              const newState = { ...prev };
                              delete newState[task.id];
                              return newState;
                            });
                          }
                        };

                        const handleComplete = async () => {
                          if (isCompleted) return;
                          setLoadingButtons((prev) => ({
                            ...prev,
                            [task.id]: "complete",
                          }));
                          try {
                            await completeTask(task.id);
                          } catch (error) {
                            console.error("Error completing task:", error);
                          } finally {
                            setLoadingButtons((prev) => {
                              const newState = { ...prev };
                              delete newState[task.id];
                              return newState;
                            });
                          }
                        };

                        return (
                          <div
                            key={task.id}
                            className="taskcard"
                            data-type={taskInfo.type}
                            style={{
                              background: "white",
                              padding: "18px",
                              borderRadius: "12px",
                              margin: "20px 0",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                              borderLeft: `6px solid ${taskInfo.color}`,
                            }}
                          >
                            <div
                              className="task-header"
                              style={{
                                fontSize: "15px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                              }}
                            >
                              {taskInfo.icon} {task.dept} Task — {task.task}
                            </div>

                            {/* Task Description Section Box */}
                            <div
                              style={{
                                background: "#f8f9fa",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "12px",
                                marginBottom: "12px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#6b7280",
                                  marginBottom: "6px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Task Description
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#1e293b",
                                  lineHeight: "1.5",
                                }}
                              >
                                {task.task}
                              </div>
                            </div>

                            {task.patient && task.patient !== "—" && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#475569",
                                  marginBottom: "8px",
                                }}
                              >
                                Patient:{" "}
                                {typeof task.patient === "string"
                                  ? task.patient
                                  : (task.patient as any)?.name || "—"}
                              </div>
                            )}

                            <div
                              style={{
                                fontSize: "13px",
                                color: "#475569",
                                marginBottom: "8px",
                              }}
                            >
                              Due: {task.due}{" "}
                              {task.overdue && (
                                <span
                                  style={{
                                    color: "#ef4444",
                                    fontWeight: "bold",
                                  }}
                                >
                                  • Overdue
                                </span>
                              )}
                            </div>

                            <div
                              className="task-actions"
                              style={{
                                marginTop: "10px",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                alignItems: "center",
                              }}
                            >
                              <button
                                className="btn btn-claim"
                                onClick={handleClaim}
                                disabled={isClaimLoading || isCompleteLoading}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "6px",
                                  border: "none",
                                  cursor:
                                    isClaimLoading || isCompleteLoading
                                      ? "not-allowed"
                                      : "pointer",
                                  background: "#10b981",
                                  color: "white",
                                  opacity:
                                    isClaimLoading || isCompleteLoading
                                      ? 0.6
                                      : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexShrink: 0,
                                }}
                              >
                                {isClaimLoading ? (
                                  <>
                                    <div
                                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                                      style={{
                                        width: "14px",
                                        height: "14px",
                                        borderWidth: "2px",
                                      }}
                                    ></div>
                                    {isClaimed
                                      ? "Unclaiming..."
                                      : "Claiming..."}
                                  </>
                                ) : isClaimed ? (
                                  "Unclaim"
                                ) : (
                                  "Claim"
                                )}
                              </button>
                              <button
                                className="btn btn-complete"
                                onClick={handleComplete}
                                disabled={
                                  isCompleted ||
                                  isClaimLoading ||
                                  isCompleteLoading
                                }
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "6px",
                                  border: "none",
                                  cursor:
                                    isCompleted ||
                                    isClaimLoading ||
                                    isCompleteLoading
                                      ? "not-allowed"
                                      : "pointer",
                                  background: "#3b82f6",
                                  color: "white",
                                  opacity:
                                    isCompleted ||
                                    isClaimLoading ||
                                    isCompleteLoading
                                      ? 0.6
                                      : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexShrink: 0,
                                }}
                              >
                                {isCompleteLoading ? (
                                  <>
                                    <div
                                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                                      style={{
                                        width: "14px",
                                        height: "14px",
                                        borderWidth: "2px",
                                      }}
                                    ></div>
                                    Completing...
                                  </>
                                ) : (
                                  "Complete"
                                )}
                              </button>
                              <button
                                className="btn btn-notes"
                                onClick={() => {
                                  if (isNoteLoading) return;
                                  setShowQuickNotes((prev) => ({
                                    ...prev,
                                    [task.id]: !prev[task.id],
                                  }));
                                  if (!quickNotesData[task.id]) {
                                    setQuickNotesData((prev) => ({
                                      ...prev,
                                      [task.id]: {
                                        category: "",
                                        subcategory: "",
                                        note: "",
                                        customNote: "",
                                      },
                                    }));
                                  }
                                }}
                                disabled={
                                  isClaimLoading ||
                                  isCompleteLoading ||
                                  isNoteLoading
                                }
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "6px",
                                  border: "none",
                                  cursor:
                                    isClaimLoading ||
                                    isCompleteLoading ||
                                    isNoteLoading
                                      ? "not-allowed"
                                      : "pointer",
                                  background: "#6366f1",
                                  color: "white",
                                  opacity:
                                    isClaimLoading ||
                                    isCompleteLoading ||
                                    isNoteLoading
                                      ? 0.6
                                      : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexShrink: 0,
                                }}
                              >
                                {isNoteLoading ? (
                                  <>
                                    <div
                                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                                      style={{
                                        width: "14px",
                                        height: "14px",
                                        borderWidth: "2px",
                                      }}
                                    ></div>
                                    Saving...
                                  </>
                                ) : (
                                  "📝 Quick Note"
                                )}
                              </button>
                            </div>

                            {/* Quick Notes Form */}
                            {showQuickNotes[task.id] && (
                              <div
                                style={{
                                  marginTop: "12px",
                                  padding: "12px",
                                  background: "#f8f9fa",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                <QuickNotesForm
                                  taskId={task.id}
                                  taskDept={task.dept}
                                  quickNotesData={
                                    quickNotesData[task.id] || {
                                      category: "",
                                      subcategory: "",
                                      note: "",
                                      customNote: "",
                                    }
                                  }
                                  onUpdate={(data) => {
                                    setQuickNotesData((prev) => ({
                                      ...prev,
                                      [task.id]: data,
                                    }));
                                  }}
                                  onSave={async (note) => {
                                    setLoadingButtons((prev) => ({
                                      ...prev,
                                      [task.id]: "note",
                                    }));
                                    try {
                                      const ts = new Date().toLocaleString();

                                      // Update local state
                                      const updatedTasks = tasks.map((t) =>
                                        t.id === task.id
                                          ? {
                                              ...t,
                                              notes: [
                                                ...(t.notes || []),
                                                { ts, user: "You", line: note },
                                              ],
                                            }
                                          : t
                                      );

                                      // Save to API
                                      const response = await fetch(
                                        `/api/tasks/${task.id}`,
                                        {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            quickNotes: {
                                              status_update:
                                                quickNotesData[task.id]
                                                  ?.category || "",
                                              details:
                                                quickNotesData[task.id]
                                                  ?.subcategory || "",
                                              one_line_note: note,
                                              timestamp:
                                                new Date().toISOString(),
                                            },
                                          }),
                                        }
                                      );

                                      if (!response.ok) {
                                        throw new Error("Failed to save note");
                                      }

                                      setShowQuickNotes((prev) => ({
                                        ...prev,
                                        [task.id]: false,
                                      }));
                                      setQuickNotesData((prev) => {
                                        const newState = { ...prev };
                                        delete newState[task.id];
                                        return newState;
                                      });

                                      // Refresh tasks
                                      await fetchTasks(modeState, urlClaim);
                                    } catch (error) {
                                      console.error(
                                        "Error saving note:",
                                        error
                                      );
                                    } finally {
                                      setLoadingButtons((prev) => {
                                        const newState = { ...prev };
                                        delete newState[task.id];
                                        return newState;
                                      });
                                    }
                                  }}
                                  onCancel={() => {
                                    setShowQuickNotes((prev) => ({
                                      ...prev,
                                      [task.id]: false,
                                    }));
                                  }}
                                />
                              </div>
                            )}

                            {task.notes && task.notes.length > 0 && (
                              <div
                                className="activity-history"
                                style={{
                                  marginTop: "10px",
                                  fontSize: "13px",
                                  color: "#475569",
                                }}
                              >
                                {task.notes
                                  .slice(-3)
                                  .map((note: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="history-entry"
                                      style={{ padding: "3px 0" }}
                                    >
                                      {note.ts} — {note.user}: {note.line}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#6b7280",
                        }}
                      >
                        No tasks available
                      </div>
                    )}
                  </div>

                  {failedDocuments && failedDocuments.length > 0 && (
                    <FailedDocuments
                      documents={failedDocuments}
                      onRowClick={handleRowClick}
                      onDocumentDeleted={removeFailedDocument}
                    />
                  )}

                  {duplicateDocuments && duplicateDocuments.length > 0 && (
                    <DuplicatePatients
                      documents={duplicateDocuments}
                      onRowClick={handleDuplicateRowClick}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <IntakeModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <ManualTaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        departments={departments}
        defaultClaim={urlClaim}
        defaultPatient={urlPatient}
        defaultDocumentId={urlDocumentId}
        onSubmit={handleManualTaskSubmit}
      />

      <UpdateDocumentModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        selectedDoc={selectedDoc}
        formData={updateFormData}
        onInputChange={handleUpdateInputChange}
        onSubmit={handleUpdateSubmit}
        isLoading={updateLoading}
      />

      <UpdateDuplicateModal
        open={isDuplicateModalOpen}
        onOpenChange={setIsDuplicateModalOpen}
        selectedDoc={selectedDuplicateDoc}
        formData={duplicateFormData}
        onInputChange={handleDuplicateInputChange}
        onSubmit={handleDuplicateSubmit}
        isLoading={duplicateUpdateLoading}
      />

      {/* File selection modal removed - files auto-submit with ProgressTracker */}

      <PaymentErrorModal
        isOpen={!!paymentError}
        onClose={clearPaymentError}
        onUpgrade={handleUpgrade}
        errorMessage={paymentError || undefined}
        ignoredFiles={ignoredFiles}
      />
    </>
  );
}
