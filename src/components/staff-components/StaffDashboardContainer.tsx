"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import IntakeModal from "@/components/staff-components/IntakeModal";
import ManualTaskModal from "@/components/ManualTaskModal";
import { useSocket } from "@/providers/SocketProvider";
import { useTasks } from "../../app/custom-hooks/staff-hooks/useTasks";
import { useFileUpload } from "../../app/custom-hooks/staff-hooks/useFileUpload";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

// Import new components
import StaffDashboardHeader from "@/components/staff-components/StaffDashboardHeader";
import PatientDrawer from "@/components/staff-components/PatientDrawer";
import TasksSection from "@/components/staff-components/TasksSection";
import StaffDashboardModals from "@/components/staff-components/StaffDashboardModals";
import { useFailedDocuments } from "../../app/custom-hooks/staff-hooks/useFailedDocuments";
import { Sidebar } from "@/components/navigation/sidebar";

// Import utilities
import {
  fetchRecentPatients as fetchRecentPatientsUtil,
  fetchPatientTasks as fetchPatientTasksUtil,
  fetchPatientData as fetchPatientDataUtil,
  updateTaskStatus,
  updateTaskAssignee,
  saveQuickNote,
  formatDOB as formatDOBUtil,
  formatClaimNumber as formatClaimNumberUtil,
  getPhysicianId as getPhysicianIdUtil,
  initializeTaskStatuses,
  calculateTaskStats,
  getStatusOptions as getStatusOptionsUtil,
  getAssigneeOptions as getAssigneeOptionsUtil,
  getQuestionnaireChips as getQuestionnaireChipsUtil,
  DEPARTMENTS,
  TASK_PAGE_SIZE,
  RecentPatient,
  Task,
  PatientQuiz,
  QuestionnaireChip,
  TaskStats,
} from "@/utils/staffDashboardUtils";

export default function StaffDashboardContainer() {
  const { data: session } = useSession();
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<RecentPatient | null>(
    null
  );
  const [patientTasks, setPatientTasks] = useState<Task[]>([]);
  const [patientQuiz, setPatientQuiz] = useState<PatientQuiz | null>(null);
  const [patientIntakeUpdate, setPatientIntakeUpdate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [showFilePopup, setShowFilePopup] = useState(false);
  interface FileDetails {
    name: string;
    size: number;
    type: string;
  }

  const [fileDetailsPopup, setFileDetailsPopup] = useState<FileDetails[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [patientDrawerCollapsed, setPatientDrawerCollapsed] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [selectedTaskForQuickNote, setSelectedTaskForQuickNote] =
    useState<Task | null>(null);
  const [quickNoteData, setQuickNoteData] = useState({
    status_update: "",
    details: "",
    one_line_note: "",
  });
  const [showDocumentSuccessPopup, setShowDocumentSuccessPopup] =
    useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const taskPageSize = TASK_PAGE_SIZE;
  const [taskTotalCount, setTaskTotalCount] = useState(0);
  const [taskTypeFilter, setTaskTypeFilter] = useState<
    "all" | "internal" | "external"
  >("all");
  const progressCompleteHandledRef = useRef(false);

  // Get socket data for instant progress detection
  const { progressData, queueProgressData, isProcessing } = useSocket();

  // Task status and assignee management (for selectable chips)
  const [taskStatuses, setTaskStatuses] = useState<{
    [taskId: string]: string;
  }>({});
  const [taskAssignees, setTaskAssignees] = useState<{
    [taskId: string]: string;
  }>({});

  // Initialize task statuses and assignees when tasks are loaded
  useEffect(() => {
    const { updatedStatuses, updatedAssignees } =
      initializeTaskStatuses(patientTasks);
    setTaskStatuses(updatedStatuses);
    setTaskAssignees(updatedAssignees);
  }, [patientTasks]);

  // Handle status chip click - memoized
  const handleStatusChipClick = useCallback(
    async (taskId: string, status: string) => {
      setTaskStatuses((prev) => ({ ...prev, [taskId]: status }));

      const result = await updateTaskStatus(taskId, status, patientTasks);
      if (!result.success) {
        const task = patientTasks.find((t) => t.id === taskId);
        if (task) {
          setTaskStatuses((prev) => ({ ...prev, [taskId]: task.status }));
        }
      }
    },
    [patientTasks]
  );

  // Handle assignee chip click - memoized
  const handleAssigneeChipClick = useCallback(
    async (taskId: string, assignee: string) => {
      setTaskAssignees((prev) => ({ ...prev, [taskId]: assignee }));

      const result = await updateTaskAssignee(taskId, assignee, patientTasks);
      if (!result.success) {
        const task = patientTasks.find((t) => t.id === taskId);
        if (task) {
          setTaskAssignees((prev) => ({
            ...prev,
            [taskId]: task.assignee || "Unclaimed",
          }));
        }
      }
    },
    [patientTasks]
  );

  // Get status options based on current status - memoized
  const getStatusOptions = useCallback((task: Task): string[] => {
    return getStatusOptionsUtil(task);
  }, []);

  // Get assignee options - memoized
  const getAssigneeOptions = useCallback((task: Task): string[] => {
    return getAssigneeOptionsUtil(task);
  }, []);

  // Use tasks hook for task management
  const initialMode = "wc" as const;
  const { handleCreateManualTask, fetchTasks } = useTasks(initialMode);

  // Failed documents hook
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
    setUpdateFormData,
  } = useFailedDocuments();

  // File upload functionality
  const router = useRouter();
  const {
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
  } = useFileUpload(initialMode);

  // Task summary statistics - memoized for performance
  const taskStats: TaskStats = useMemo(
    () => calculateTaskStats(patientTasks),
    [patientTasks]
  );

  // Questionnaire chips - memoized for performance
  const questionnaireChips = useMemo(
    () => getQuestionnaireChipsUtil(patientIntakeUpdate, patientQuiz),
    [patientIntakeUpdate, patientQuiz]
  );

  // Departments - memoized as constant
  const departments = useMemo(() => DEPARTMENTS, []);

  // Physician ID - memoized for performance
  const physicianId = useMemo(() => getPhysicianIdUtil(session), [session]);

  // Total pages calculation - memoized
  const totalPages = useMemo(
    () => Math.ceil(taskTotalCount / taskPageSize),
    [taskTotalCount, taskPageSize]
  );

  // Pagination helpers - memoized
  const hasNextPage = useMemo(
    () => taskPage < totalPages,
    [taskPage, totalPages]
  );
  const hasPrevPage = useMemo(() => taskPage > 1, [taskPage]);

  // Displayed tasks - memoized
  const displayedTasks = useMemo(() => patientTasks, [patientTasks]);

  // Fetch recent patients function - memoized
  const fetchRecentPatients = useCallback(async (searchQuery: string = "") => {
    try {
      setLoading(true);
      const data = await fetchRecentPatientsUtil(searchQuery);
      setRecentPatients(data);
      // Update selected patient if it still exists in the new list
      setSelectedPatient((currentSelected) => {
        if (data.length > 0) {
          if (currentSelected) {
            const updatedPatient = data.find(
              (p: RecentPatient) =>
                p.patientName === currentSelected.patientName &&
                p.claimNumber === currentSelected.claimNumber
            );
            if (updatedPatient) {
              return updatedPatient;
            }
          }
          // Only set first patient if no current selection
          if (!currentSelected) {
            return data[0];
          }
        }
        return currentSelected;
      });
    } catch (error) {
      console.error("Error fetching recent patients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recent patients on mount and when search changes
  useEffect(() => {
    fetchRecentPatients(patientSearchQuery);
  }, [patientSearchQuery, fetchRecentPatients]);

  // Fetch failed documents on mount only
  useEffect(() => {
    fetchFailedDocuments();
  }, [fetchFailedDocuments]);

  // Handle initial page loading
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Show loading for at least 1 second for better UX
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPageLoading(false);
      } catch (error) {
        console.error("Error initializing page:", error);
        setPageLoading(false);
      }
    };

    initializePage();
  }, []);

  // Function to fetch patient tasks - memoized
  const fetchPatientTasks = useCallback(
    async (patient: RecentPatient, page: number = 1, pageSize: number = 10) => {
      try {
        const { tasks, totalCount } = await fetchPatientTasksUtil(
          patient,
          page,
          pageSize,
          showCompletedTasks,
          taskTypeFilter
        );
        setPatientTasks(tasks);
        setTaskTotalCount(totalCount);
      } catch (error) {
        console.error("Error fetching patient tasks:", error);
        setPatientTasks([]);
        setTaskTotalCount(0);
      }
    },
    [showCompletedTasks, taskTypeFilter]
  );

  // Fetch patient tasks and quiz when patient is selected
  useEffect(() => {
    if (!selectedPatient) {
      setPatientTasks([]);
      setPatientQuiz(null);
      setPatientIntakeUpdate(null);
      setLoadingPatientData(false);
      return;
    }

    // Clear data immediately for instant UI update
    setPatientTasks([]);
    setPatientQuiz(null);
    setPatientIntakeUpdate(null);
    setLoadingPatientData(true);

    let isCancelled = false;

    const fetchPatientData = async () => {
      try {
        // Reset to page 1 when patient or view changes
        setTaskPage(1);
        await fetchPatientTasks(selectedPatient, 1, taskPageSize);
        if (isCancelled) return;

        // Fetch patient quiz and intake update data
        const { patientQuiz: quiz, patientIntakeUpdate: intakeUpdate } =
          await fetchPatientDataUtil(selectedPatient);

        if (!isCancelled) {
          setPatientQuiz(quiz);
          setPatientIntakeUpdate(intakeUpdate);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching patient data:", error);
        }
      } finally {
        if (!isCancelled) {
          setLoadingPatientData(false);
        }
      }
    };

    fetchPatientData();

    // Cleanup function to cancel requests if component unmounts or patient changes
    return () => {
      isCancelled = true;
    };
  }, [selectedPatient, fetchPatientTasks, taskPageSize]);

  // Refetch tasks when page, view (completed/open), or type filter changes
  useEffect(() => {
    if (selectedPatient) {
      // Reset to page 1 when filter changes
      setTaskPage(1);
      fetchPatientTasks(selectedPatient, 1, taskPageSize);
    }
  }, [taskTypeFilter, fetchPatientTasks, selectedPatient, taskPageSize]);

  // Refetch tasks when page or view (completed/open) changes
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientTasks(selectedPatient, taskPage, taskPageSize);
    }
  }, [
    taskPage,
    showCompletedTasks,
    fetchPatientTasks,
    selectedPatient,
    taskPageSize,
  ]);

  // Format DOB for display - memoized
  const formatDOB = useCallback((dob: string) => {
    return formatDOBUtil(dob);
  }, []);

  // Format claim number - memoized
  const formatClaimNumber = useCallback((claim: string) => {
    return formatClaimNumberUtil(claim);
  }, []);

  // Handle progress complete - memoized
  const handleProgressComplete = useCallback(async () => {
    // Fetch updated data in realtime instead of just showing popup
    console.log("🔄 Progress complete - fetching updated data...");

    // Fetch tasks and failed documents in parallel
    const fetchPromises: Promise<void>[] = [];

    if (selectedPatient) {
      fetchPromises.push(
        fetchPatientTasks(selectedPatient, taskPage, taskPageSize)
      );
      fetchPromises.push(fetchRecentPatients(patientSearchQuery));
    }

    // Fetch failed documents
    fetchPromises.push(fetchFailedDocuments());

    try {
      await Promise.all(fetchPromises);
      console.log("✅ Data refreshed successfully after upload complete");
    } catch (error) {
      console.error("❌ Error refreshing data after upload:", error);
    }

    // Show success popup
    setShowDocumentSuccessPopup(true);
  }, [
    selectedPatient,
    fetchPatientTasks,
    taskPage,
    taskPageSize,
    fetchRecentPatients,
    patientSearchQuery,
    fetchFailedDocuments,
  ]);

  // Handle popup OK button click - memoized
  const handlePopupOkClick = useCallback(() => {
    // Close popup - data is already refreshed, no need to reload
    setShowDocumentSuccessPopup(false);
  }, []);

  // Handle upgrade for payment errors - memoized
  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);

  // Get socket data including current phase
  const { currentPhase } = useSocket();

  // Show progress popup when extract API is successful (processing phase starts)
  const progressPopupShownRef = useRef(false);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    // Don't show success popup if there's a payment error (ignored files)
    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      return;
    }

    // Show progress popup when processing phase starts (extract API successful)
    if (currentPhase === "processing" && !progressPopupShownRef.current) {
      console.log("🚀 Extract API successful - showing progress popup");
      progressPopupShownRef.current = true;
      // Note: Progress popup is shown in StaffDashboardModals component
      // No need to call handleProgressComplete here as we want to show progress, not completion
    }

    // Reset when not processing
    if (!isProcessing) {
      progressPopupShownRef.current = false;
    }
  }, [currentPhase, isProcessing, selectedPatient, paymentError, ignoredFiles]);

  // Instant detection of 100% progress - show success popup
  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    // Don't show success popup if there's a payment error (ignored files)
    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      return;
    }

    // Reset the ref when not processing or when progress is reset (new upload started)
    if (!isProcessing || (!progressData && !queueProgressData)) {
      progressCompleteHandledRef.current = false;
      return;
    }

    // Check if progress reached 100% and status is completed
    const progressComplete =
      (progressData?.progress === 100 &&
        progressData?.status === "completed") ||
      queueProgressData?.status === "completed";

    const allFilesProcessed = progressData
      ? progressData.processed_count >= progressData.total_files
      : true;

    if (
      progressComplete &&
      allFilesProcessed &&
      !progressCompleteHandledRef.current
    ) {
      console.log("🚀 Progress reached 100% - showing success popup instantly");
      progressCompleteHandledRef.current = true;

      // Show success popup immediately (APIs will be called when user clicks OK)
      handleProgressComplete();
    }
  }, [
    progressData?.progress,
    progressData?.status,
    progressData?.processed_count,
    progressData?.total_files,
    queueProgressData?.status,
    isProcessing,
    selectedPatient,
    handleProgressComplete,
    progressData,
    queueProgressData,
    paymentError,
    ignoredFiles,
  ]);

  // Clear success popup when there's a payment error (ignored files)
  useEffect(() => {
    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      // Dismiss the success/progress popup when there's an error
      setShowDocumentSuccessPopup(false);
      progressCompleteHandledRef.current = false;
    }
  }, [paymentError, ignoredFiles]);

  // PaymentErrorModal component
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

    if (!hasIgnoredFiles && !errorMessage) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
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

  // Handle manual task submission
  const handleManualTaskSubmit = useCallback(
    async (formData: any) => {
      try {
        if (selectedPatient) {
          if (!formData.patientName) {
            formData.patientName = selectedPatient.patientName;
          }
          if (
            !formData.claim &&
            selectedPatient.claimNumber &&
            selectedPatient.claimNumber !== "Not specified"
          ) {
            formData.claim = selectedPatient.claimNumber;
          }
          // Set documentId if not already set and patient has documentIds
          if (
            !formData.documentId &&
            selectedPatient.documentIds &&
            selectedPatient.documentIds.length > 0
          ) {
            formData.documentId = selectedPatient.documentIds[0]; // Use the first document ID
          }
        }

        if (!formData.claim) {
          formData.claim = `Recommendation-${new Date()
            .toISOString()
            .slice(0, 10)}`;
        }

        await handleCreateManualTask(
          formData,
          initialMode,
          selectedPatient?.claimNumber || ""
        );

        if (selectedPatient) {
          await fetchPatientTasks(selectedPatient);
        }
      } catch (error) {
        console.error("Error creating manual task:", error);
        throw error;
      }
    },
    [selectedPatient, handleCreateManualTask, initialMode, fetchPatientTasks]
  );

  // Handle task click (for quick notes)
  const handleTaskClick = (task: Task) => {
    setSelectedTaskForQuickNote(task);
    setShowQuickNoteModal(true);
  };

  // Handle saving quick notes
  const handleSaveQuickNote = async (
    taskId: string,
    quickNotes: {
      status_update: string;
      details: string;
      one_line_note: string;
    }
  ) => {
    const result = await saveQuickNote(taskId, quickNotes);
    if (result.success && selectedPatient) {
      await fetchPatientTasks(selectedPatient, taskPage, taskPageSize);
    } else if (!result.success) {
      throw result.error;
    }
  };

  // Pagination helpers - use memoized values
  const totalPagesMemo = useMemo(
    () => Math.ceil(taskTotalCount / taskPageSize),
    [taskTotalCount, taskPageSize]
  );
  const hasNextPageMemo = useMemo(
    () => taskPage < totalPagesMemo,
    [taskPage, totalPagesMemo]
  );
  const hasPrevPageMemo = useMemo(() => taskPage > 1, [taskPage]);

  // Displayed tasks - use memoized value
  const displayedTasksMemo = useMemo(() => patientTasks, [patientTasks]);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #f7f9fc;
          --card: #ffffff;
          --text: #0f172a;
          --muted: #6b7280;
          --line: #e5e7eb;
          --blue: #2563eb;
          --red: #dc2626;
          --amber: #d97706;
          --green: #15803d;
          --radius: 14px;
          --shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
          --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial;
        }

        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          font-family: var(--font);
          background: var(--bg);
          color: var(--text);
          font-size: 13px;
          overflow: hidden;
        }

        #__next {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar for navigation */}
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <StaffDashboardHeader
            onCreateIntakeLink={() => setShowModal(true)}
            onAddTask={() => setShowTaskModal(true)}
            onUploadDocument={() => snapInputRef.current?.click()}
          />

          <input
            type="file"
            ref={snapInputRef}
            multiple
            max={10}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const filesArray = Array.from(e.target.files);
                const fileDetails = filesArray.map((file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                }));
                setFileDetailsPopup(fileDetails as FileDetails[]);
                setPendingFiles(filesArray);
                setShowFilePopup(true);
              }
            }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />

          {/* File Details Popup */}
          {showFilePopup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <h2 className="text-lg font-bold mb-4">File Details</h2>
                {fileDetailsPopup.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No files selected
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {fileDetailsPopup.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm bg-gray-50 rounded-lg p-3 relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {(file.size / 1024).toFixed(2)} KB •{" "}
                              {file.type || "Unknown type"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Remove file from both arrays
                              setFileDetailsPopup((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                              setPendingFiles((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowFilePopup(false);
                      setFileDetailsPopup([]);
                      setPendingFiles([]);
                      if (snapInputRef.current) {
                        snapInputRef.current.value = "";
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Show toast with loader
                      toast("Your documents are in queue and ready to upload", {
                        description: "Please wait while we prepare your files for upload",
                        duration: 60000, // 1 minute
                        position: "top-center",
                        action: {
                          label: "Close",
                          onClick: () => {},
                        },
                      });

                      setShowFilePopup(false);
                      // Upload the pending files (which may have been filtered)
                      if (pendingFiles.length > 0) {
                        // Create a DataTransfer to set files on input
                        const dataTransfer = new DataTransfer();
                        pendingFiles.forEach((file) =>
                          dataTransfer.items.add(file)
                        );
                        if (snapInputRef.current) {
                          snapInputRef.current.files = dataTransfer.files;
                          const event = {
                            target: snapInputRef.current,
                          } as React.ChangeEvent<HTMLInputElement>;
                          handleSnap(event);
                        }
                      }
                      setFileDetailsPopup([]);
                      setPendingFiles([]);
                    }}
                    disabled={uploading || isProcessing || fileDetailsPopup.length === 0}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {(uploading || isProcessing) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {uploading ? "Uploading..." : isProcessing ? "Processing..." : "Uploading..."}
                      </>
                    ) : (
                      "Upload"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <main className="p-4 max-w-[1280px] mx-auto w-full grid grid-cols-[auto_1fr] gap-4 box-border h-[calc(100vh-50px)] overflow-hidden flex-1 max-md:grid-cols-1">
            <PatientDrawer
              patients={recentPatients}
              selectedPatient={selectedPatient}
              loading={loading}
              collapsed={patientDrawerCollapsed}
              onToggle={() =>
                setPatientDrawerCollapsed(!patientDrawerCollapsed)
              }
              onSelectPatient={setSelectedPatient}
              formatDOB={formatDOB}
              formatClaimNumber={formatClaimNumber}
              onSearchChange={setPatientSearchQuery}
            />

            <section className="flex flex-col gap-3.5 h-full overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
              <TasksSection
                selectedPatient={selectedPatient}
                displayedTasks={displayedTasksMemo}
                taskTotalCount={taskTotalCount}
                taskPage={taskPage}
                taskPageSize={taskPageSize}
                totalPages={totalPagesMemo}
                hasNextPage={hasNextPageMemo}
                hasPrevPage={hasPrevPageMemo}
                showCompletedTasks={showCompletedTasks}
                taskStatuses={taskStatuses}
                taskAssignees={taskAssignees}
                failedDocuments={
                  Array.isArray(failedDocuments) ? failedDocuments : []
                }
                loadingPatientData={loadingPatientData}
                patientIntakeUpdate={patientIntakeUpdate}
                patientQuiz={patientQuiz}
                taskStats={taskStats}
                questionnaireChips={questionnaireChips}
                physicianId={physicianId}
                getStatusOptions={getStatusOptions}
                getAssigneeOptions={getAssigneeOptions}
                formatDOB={formatDOB}
                formatClaimNumber={formatClaimNumber}
                onShowCompletedTasksChange={setShowCompletedTasks}
                onTaskPageChange={setTaskPage}
                onStatusClick={handleStatusChipClick}
                onAssigneeClick={handleAssigneeChipClick}
                onTaskClick={handleTaskClick}
                onFailedDocumentDeleted={removeFailedDocument}
                onFailedDocumentRowClick={handleRowClick}
              />
            </section>
          </main>
        </div>
      </div>

      <StaffDashboardModals
        showModal={showModal}
        showTaskModal={showTaskModal}
        showQuickNoteModal={showQuickNoteModal}
        showDocumentSuccessPopup={showDocumentSuccessPopup}
        paymentError={paymentError}
        ignoredFiles={ignoredFiles}
        selectedPatient={selectedPatient}
        selectedTaskForQuickNote={selectedTaskForQuickNote}
        departments={departments}
        isUpdateModalOpen={isUpdateModalOpen}
        selectedDoc={selectedDoc}
        updateFormData={updateFormData}
        updateLoading={updateLoading}
        onCloseModal={() => setShowModal(false)}
        onCloseTaskModal={() => setShowTaskModal(false)}
        onCloseQuickNoteModal={() => setShowQuickNoteModal(false)}
        onCloseDocumentSuccessPopup={() => setShowDocumentSuccessPopup(false)}
        onClearPaymentError={clearPaymentError}
        onUpgrade={handleUpgrade}
        onManualTaskSubmit={handleManualTaskSubmit}
        onSaveQuickNote={handleSaveQuickNote}
        onCloseUpdateModal={() => setIsUpdateModalOpen(false)}
        onUpdateInputChange={(field: string, value: string) => {
          // Create a synthetic event for the handleUpdateInputChange function
          const syntheticEvent = {
            target: { name: field, value },
          } as React.ChangeEvent<HTMLInputElement>;
          handleUpdateInputChange(syntheticEvent);
        }}
        onUpdateSubmit={handleUpdateSubmit}
      />

      {/* Loading State - Professional Full-page Loader */}
      {pageLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            {/* Animated Logo/Icon */}
            <div className="relative">
              {/* Outer pulsing ring */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 animate-ping"
                style={{ width: "80px", height: "80px" }}
              ></div>

              {/* Rotating gradient ring */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
                  <defs>
                    <linearGradient
                      id="staffLoaderGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="50%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="url(#staffLoaderGradient)"
                    strokeWidth="4"
                    strokeDasharray="60 180"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Inner pulsing dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Staff Dashboard
              </h3>
              <p className="text-sm text-gray-600">
                Preparing your workspace...
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
