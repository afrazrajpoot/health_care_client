// app/dashboard/page.tsx (complete fixed version)
"use client";

import IntakeModal from "@/components/staff-components/IntakeModal";
import TaskTable from "@/components/staff-components/TaskTable";
import FailedDocuments from "@/components/staff-components/FailedDocuments";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import { ProgressTracker } from "@/components/ProgressTracker";

import { useEffect, useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/navigation/sidebar";
import ManualTaskModal from "@/components/ManualTaskModal";
import { useTasks } from "../custom-hooks/staff-hooks/useTasks";
import { useOfficePulse } from "../custom-hooks/staff-hooks/useOfficePulse";
import { useFailedDocuments } from "../custom-hooks/staff-hooks/useFailedDocuments";
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with close button */}
        <div className="relative bg-gradient-to-r from-teal-600 to-teal-700 p-6 pb-8">
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
              Document Limit Reached
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Your current plan has reached its document processing limit. To
            continue processing more documents, please upgrade to a higher plan
            for additional capacity.
          </p>

          <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
            <p className="text-sm text-teal-900 font-medium">
              💡 Upgrading gives you:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-teal-800">
              <li>• Increased document limits</li>
              <li>• Priority processing</li>
              <li>• Advanced features</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
          >
            Got It
          </button>
          {/* <button
            onClick={onUpgrade}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm"
          >
            Upgrade Plan
          </button> */}
        </div>
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
    isFileModalOpen,
    snapInputRef,
    formatSize,
    handleSnap,
    handleCancel,
    handleSubmit,
    setIsFileModalOpen,
    paymentError,
    clearPaymentError,
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
    handleRowClick,
    handleUpdateInputChange,
    handleUpdateSubmit,
    setIsUpdateModalOpen,
  } = useFailedDocuments();
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
    fetchOfficePulse(); // This will refresh the office pulse data
  }, [
    fetchTasks,
    modeState,
    urlClaim,
    fetchFailedDocuments,
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
  }, [
    modeState,
    urlClaim,
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
    setTotalCount,
  ]);

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
            Helvetica, Arial;
          background: var(--bg);
          color: var(--text);
        }
        .wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 8px;
          font-size: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 5;
          padding-bottom: 6px;
        }
        h1 {
          font-size: 20px;
          margin: 0;
        }
        .btn {
          padding: 6px 10px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
        }
        .btn.primary {
          background: var(--accent);
          color: #fff;
        }
        .btn.light {
          background: #eef2ff;
          color: #1e3a8a;
          border: 1px solid #c7d2fe;
        }
        .filter {
          padding: 6px 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
        }
        .ttab.active {
          background: var(--accent);
          color: #fff;
        }
        .card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-bottom: 8px;
        }
        h2 {
          margin: 0 0 8px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          border-bottom: 1px solid var(--border);
          padding: 6px 8px;
          text-align: left;
          font-size: 11px;
        }
        td.ur-reason-cell {
          max-width: 200px;
          min-width: 160px;
          text-transform: capitalize;
          line-height: 1.4;
          white-space: normal;
          word-wrap: break-word;
        }
        .pill {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .pill.pending {
          background: #fef3c7;
          color: #92400e;
        }
        .pill.waiting {
          background: #e0e7ff;
          color: #3730a3;
        }
        .pill.done {
          background: #dcfce7;
          color: #166534;
        }
        .muted {
          color: #6b7280;
          font-size: 12px;
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
          gap: 6px;
          margin-bottom: 6px;
        }
        .collapse-btn {
          font-size: 11px;
          padding: 3px 6px;
          min-height: auto;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .kpi {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }
        .kpi h4 {
          font-size: 11px;
          margin: 0 0 4px 0;
          color: var(--muted);
        }
        .kpi .val {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
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
        .kpi {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .mini-table th,
        .mini-table td {
          padding: 3px 6px;
          font-size: 11px;
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
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
        }
        .submit-btn {
          background: var(--accent);
          color: #fff;
          border: none;
        }
        .cancel-btn {
          background: #f3f4f6;
          color: var(--text);
          border: 1px solid var(--border);
        }
        .no-data {
          text-align: center;
          padding: 20px;
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
          className={`sidebar-container fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="h-full">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>

        <div
          className={`toggle-btn fixed top-4 z-50 h-8 w-8 cursor-pointer flex items-center justify-center transition-all duration-300 rounded-full ${isSidebarOpen
            ? "left-64 bg-transparent hover:bg-transparent shadow-none"
            : "left-4 bg-gray-200 hover:bg-gray-300 shadow-md"
            }`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          <div className="flex flex-col items-center justify-center w-4 h-4">
            <div
              className={`w-4 h-0.5 bg-gray-700 mb-1 transition-all duration-200 ${isSidebarOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
            ></div>
            <div
              className={`w-4 h-0.5 bg-gray-700 mb-1 transition-all duration-200 ${isSidebarOpen ? "opacity-0" : ""
                }`}
            ></div>
            <div
              className={`w-4 h-0.5 bg-gray-700 transition-all duration-200 ${isSidebarOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
            ></div>
          </div>
        </div>

        <div
          className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-0" : "ml-0"
            }`}
        >
          <div className="p-6">
            {/* {session?.user?.role === "Staff" && ( */}
            <button
              ref={createSnapLinkButtonRef}
              className="snaplink-btn"
              onClick={() => snapInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </span>
              ) : (
                "📁 DocLatch"
              )}
            </button>
            {/* )} */}
            <input
              type="file"
              ref={snapInputRef}
              multiple
              className="hidden"
              onChange={handleSnap}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          <div className="wrap">
            <div className="header">
              <h1>🧭 DocLatch Staff Dashboard — Mission Control v6.3</h1>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <label
                  className="muted"
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    fontSize: "12px",
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
                      fontSize: "12px",
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
                    fontSize: "12px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={dense}
                    onChange={(e) => setDense(e.target.checked)}
                  />
                  Dense
                </label>
                <button className="btn light">Dept Settings</button>
                <button
                  ref={createLinkButtonRef}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold py-[0.3vw] px-[0.3vw] rounded-md hover:from-teal-700 hover:to-teal-600 transition-all duration-200"
                  onClick={() => setShowModal(true)}
                >
                  Create Intake Link
                </button>
                {session?.user?.role === "Physician" && (
                  <button
                    ref={addManualTaskButtonRef}
                    className="bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold py-[0.3vw] px-[0.3vw] rounded-md hover:from-teal-700 hover:to-teal-600 transition-all duration-200"
                    onClick={() => setShowTaskModal(true)}
                  >
                    + Add Manual Task
                  </button>
                )}
                <button
                  className="btn light"
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
                >
                  {loading ? "Refreshing..." : "Refresh Tasks"}
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
                <div className="card">
                  <h2>
                    📊 Office Pulse
                    <button
                      className="btn light"
                      onClick={() =>
                        setIsOfficePulseCollapsed(!isOfficePulseCollapsed)
                      }
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        minHeight: "auto",
                      }}
                    >
                      {isOfficePulseCollapsed ? "▼ Expand" : "▲ Collapse"}
                    </button>
                  </h2>
                  {!isOfficePulseCollapsed && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr",
                        gap: "12px",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <table className="mini-table">
                          <thead>
                            <tr>
                              <th>Department</th>
                              <th>Open</th>
                              <th>Overdue</th>
                              <th>Unclaimed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pulse ? (
                              pulse.depts.map(
                                (rowOrObj: any, index: number) => {
                                  if (
                                    typeof rowOrObj === "object" &&
                                    "department" in rowOrObj
                                  ) {
                                    const dept = rowOrObj;
                                    return (
                                      <tr key={index}>
                                        <td>{dept.department}</td>
                                        <td>{dept.open}</td>
                                        <td>{dept.overdue}</td>
                                        <td>{dept.unclaimed}</td>
                                      </tr>
                                    );
                                  } else {
                                    const row = rowOrObj as [
                                      string,
                                      number,
                                      number,
                                      number,
                                      number
                                    ];
                                    return (
                                      <tr key={index}>
                                        <td>{row[0]}</td>
                                        <td>{row[1]}</td>
                                        <td>{row[2]}</td>
                                        <td>{row[4]}</td>
                                      </tr>
                                    );
                                  }
                                }
                              )
                            ) : (
                              <tr>
                                <td colSpan={4} className="no-data">
                                  No pulse data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="kpi relative">
                        <button
                          onClick={fetchWorkflowStats}
                          className="btn light absolute top-0 right-0"
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            minHeight: "auto",
                          }}
                        >
                          🔄 Refresh
                        </button>
                        {workflowStats ? (
                          workflowStats.labels.map(
                            (label: string, index: number) => (
                              <div key={index} className="text-gray-700">
                                <h4>{label}</h4>
                                <div className="val">
                                  {workflowStats.vals[index]}
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          <div className="tile">
                            <h4>No Workflow Stats</h4>
                            <div className="val">—</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h2>
                    🧩 Task & Workflow Tracker
                    <button
                      className="btn light"
                      onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        minHeight: "auto",
                      }}
                    >
                      {isFiltersCollapsed ? "▼ Show Filters" : "▲ Hide Filters"}
                    </button>
                    {/* show all tasks ( this will reset the url params and the url becomes `/staff-dashboard`) */}
                  </h2>
                  <div className="muted" style={{ marginBottom: "8px" }}>
                    Tabs keep this compact. Use Overdue to triage. Search
                    filters by task/patient. Quick Notes allow multiple
                    timestamped entries per task.
                  </div>
                  <div className="filters">
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {/* {filteredTabs.map((tab) => (
                        <button
                          key={tab.pane}
                          className={`filter ttab ${
                            currentPane === tab.pane ? "active" : ""
                          }`}
                          onClick={() => handleTabClick(tab)}
                        >
                          {tab.text}
                        </button>
                      ))} */}
                    </div>
                    {!isFiltersCollapsed && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* <button
                            className={`filter ttab ${
                              filters.viewMode === "all" ? "active" : ""
                            }`}
                            onClick={() =>
                              setFilters((p) => ({
                                ...p,
                                viewMode: "all",
                                status: "",
                                overdueOnly: false,
                                priority: "",
                                dueDate: "",
                              }))
                            }
                          >
                            Show All
                          </button> */}
                          {/* <button
                            className={`filter ttab ${
                              filters.viewMode === "urgent" ? "active" : ""
                            }`}
                            onClick={() =>
                              setFilters((p) => ({
                                ...p,
                                viewMode: "urgent",
                                overdueOnly: true,
                                priority: "high",
                                dueDate: "today",
                              }))
                            }
                          >
                            Urgent & Due Soon
                          </button> */}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            placeholder="Search tasks/patients…"
                            value={filters.search}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                search: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 10px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                              minWidth: "220px",
                            }}
                          />
                          <span className="muted">Dept:</span>
                          <select
                            value={filters.dept}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                dept: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="">All</option>
                            {departments.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <span className="muted">Status:</span>
                          <select
                            value={filters.status}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                status: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="">All</option>
                            <option value="in progress">in progress</option>
                            <option value="Completed">Completed</option>
                            <option value="overdue">Overdue</option>
                          </select>
                          <span className="muted">Priority:</span>
                          <select
                            value={filters.priority || ""}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                priority: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="">All</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <span className="muted">Due:</span>
                          <select
                            value={filters.dueDate || ""}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                dueDate: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="">All</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                          </select>
                          {/* <span className="muted">Type:</span>
                          <select
                            value={filters.taskType || ""}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                taskType: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="">All</option>
                            <option value="intake">Intake</option>
                            <option value="review">Review</option>
                            <option value="approval">Approval</option>
                          </select> */}
                          {/* <span className="muted">Assigned:</span>
                          <select
                            value={filters.assignedTo || ""}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                assignedTo: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="">All</option>
                            <option value="me">Me</option>
                            <option value="unassigned">Unassigned</option>
                          </select> */}
                          <span className="muted">Sort:</span>
                          <select
                            value={filters.sortBy || "dueDate"}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                sortBy: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="dueDate">Due Date</option>
                            <option value="priority">Priority</option>
                            <option value="createdAt">Created</option>
                            <option value="taskType">Type</option>
                          </select>
                          <span className="muted">Order:</span>
                          <select
                            value={filters.sortOrder || "desc"}
                            onChange={(e) =>
                              setFilters((p) => ({
                                ...p,
                                sortOrder: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="asc">Asc</option>
                            <option value="desc">Desc</option>
                          </select>
                          <button
                            className="filter"
                            onClick={() =>
                              setFilters({
                                search: "",
                                overdueOnly: false,
                                myDeptOnly: false,
                                dept: "",
                                status: "",
                                priority: "",
                                dueDate: "",
                                taskType: "",
                                assignedTo: "",
                                sortBy: "dueDate",
                                sortOrder: "desc",
                                viewMode: "all",
                              })
                            }
                          >
                            Clear
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {tasks.length === 0 ? (
                    <div className="no-data">No tasks available</div>
                  ) : (
                    <>
                      <TaskTable
                        currentPane={currentPane}
                        tasks={tasks}
                        filters={filters}
                        mode={modeState}
                        onClaim={toggleClaim}
                        onComplete={completeTask}
                        onSaveNote={saveNote}
                        getPresets={getPresets}
                      />
                      {/* Pagination Controls */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "12px",
                          padding: "8px",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div className="muted">
                          Showing {(currentPage - 1) * pageSize + 1} -{" "}
                          {Math.min(currentPage * pageSize, totalCount)} of{" "}
                          {totalCount} tasks
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <button
                            className="btn light"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                          >
                            Previous
                          </button>
                          <span className="muted">
                            Page {currentPage} of{" "}
                            {Math.ceil(totalCount / pageSize) || 1}
                          </span>
                          <button
                            className="btn light"
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={
                              currentPage >= Math.ceil(totalCount / pageSize)
                            }
                            style={{
                              opacity:
                                currentPage >= Math.ceil(totalCount / pageSize)
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            Next
                          </button>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            style={{
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          >
                            <option value="10">10 per page</option>
                            <option value="20">20 per page</option>
                            <option value="50">50 per page</option>
                            <option value="100">100 per page</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {failedDocuments && failedDocuments.length > 0 && (
                  <FailedDocuments
                    documents={failedDocuments}
                    onRowClick={handleRowClick}
                  />
                )}
              </>
            )}
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

      <Dialog open={isFileModalOpen} onOpenChange={setIsFileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selected Files ({selectedFiles.length})</DialogTitle>
            <DialogDescription>
              Review your selected files before submitting for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto">
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span
                    className="text-sm truncate flex-1 mr-2"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ({formatSize(file.size)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="flex space-x-2">
            <button
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </span>
              ) : (
                "Submit for Processing"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <PaymentErrorModal
        isOpen={!!paymentError}
        onClose={clearPaymentError}
        onUpgrade={handleUpgrade}
      /> */}
    </>
  );
}
