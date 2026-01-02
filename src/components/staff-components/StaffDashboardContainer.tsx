// app/staff-dashboard/page.tsx (or wherever the main container lives)
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";

import { Sidebar } from "@/components/navigation/sidebar";
import StaffDashboardHeader from "@/components/staff-components/StaffDashboardHeader";
import PatientDrawer from "@/components/staff-components/PatientDrawer";
import TasksSection from "@/components/staff-components/TasksSection";
import StaffDashboardModals from "@/components/staff-components/StaffDashboardModals";
import FileUploadPopup from "@/components/staff-components/FileUploadPopup";
import PaymentErrorModal from "@/components/staff-components/PaymentErrorModal";
// import LoadingSpinner from "@/components/staff-components/LoadingSpinner";
import UploadProgressManager from "@/components/staff-components/UploadProgressManager";
import { useSocket } from "@/providers/SocketProvider";
import { useTasks } from "../../app/custom-hooks/staff-hooks/useTasks";
import { useFileUpload } from "../../app/custom-hooks/staff-hooks/useFileUpload";
import { useFailedDocuments } from "../../app/custom-hooks/staff-hooks/useFailedDocuments";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FileDetails {
  name: string;
  size: number;
  type: string;
}

const UploadToast: React.FC = () => {
  useEffect(() => {
    toast("Upload in Progress 🚀", {
      description: (
        <div className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          <span className="text-sm  text-black">Your documents are queued and being prepared. Hang tight!</span>
        </div>
      ),
      duration: 60000,
      position: "top-center",
      className: "border-l-4 border-blue-500 bg-blue-50 text-blue-800",
      style: {
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      },
      icon: "📁",
      // action: {
      //   label: "View Progress",
      //   onClick: () => {
      //     // Optionally navigate to progress section or open modal
      //     console.log("View upload progress");
      //   },
      // },
    });
  }, []);

  return null;
};

export default function StaffDashboardContainer() {
  const { data: session } = useSession();
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<RecentPatient | null>(null);
  const [patientTasks, setPatientTasks] = useState<Task[]>([]);
  const [patientQuiz, setPatientQuiz] = useState<PatientQuiz | null>(null);
  const [patientIntakeUpdate, setPatientIntakeUpdate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [fileDetailsPopup, setFileDetailsPopup] = useState<FileDetails[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [patientDrawerCollapsed, setPatientDrawerCollapsed] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [selectedTaskForQuickNote, setSelectedTaskForQuickNote] = useState<Task | null>(null);
  const [showDocumentSuccessPopup, setShowDocumentSuccessPopup] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const taskPageSize = TASK_PAGE_SIZE;
  const [taskTotalCount, setTaskTotalCount] = useState(0);
  const [taskTypeFilter, setTaskTypeFilter] = useState<"all" | "internal" | "external">("all");
  const [showUploadToast, setShowUploadToast] = useState(false);

  // Task status and assignee management
  const [taskStatuses, setTaskStatuses] = useState<{ [taskId: string]: string }>({});
  const [taskAssignees, setTaskAssignees] = useState<{ [taskId: string]: string }>({});

  // Hooks
  const { isProcessing } = useSocket();
  const initialMode = "wc" as const;
  const { handleCreateManualTask } = useTasks(initialMode);
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
  const router = useRouter();
  const {
    uploading,
    snapInputRef,
    handleSnap,
    clearPaymentError,
    ignoredFiles,
    paymentError,
  } = useFileUpload(initialMode);

  // Initialize task statuses and assignees
  useEffect(() => {
    const { updatedStatuses, updatedAssignees } = initializeTaskStatuses(patientTasks);
    setTaskStatuses(updatedStatuses);
    setTaskAssignees(updatedAssignees);
  }, [patientTasks]);

  // Memoized callbacks and memos
  const handleStatusChipClick = useCallback(
    async (taskId: string, status: string) => {
      setTaskStatuses((prev) => ({ ...prev, [taskId]: status }));
      const result = await updateTaskStatus(taskId, status, patientTasks);
      if (!result.success) {
        const task = patientTasks.find((t) => t.id === taskId);
        if (task) setTaskStatuses((prev) => ({ ...prev, [taskId]: task.status }));
      }
    },
    [patientTasks]
  );

  const handleAssigneeChipClick = useCallback(
    async (taskId: string, assignee: string) => {
      setTaskAssignees((prev) => ({ ...prev, [taskId]: assignee }));
      const result = await updateTaskAssignee(taskId, assignee, patientTasks);
      if (!result.success) {
        const task = patientTasks.find((t) => t.id === taskId);
        if (task) setTaskAssignees((prev) => ({ ...prev, [taskId]: task.assignee || "Unclaimed" }));
      }
    },
    [patientTasks]
  );

  const getStatusOptions = useCallback((task: Task): string[] => getStatusOptionsUtil(task), []);
  const getAssigneeOptions = useCallback((task: Task): string[] => getAssigneeOptionsUtil(task), []);

  const taskStats: TaskStats = useMemo(() => calculateTaskStats(patientTasks), [patientTasks]);
  const questionnaireChips = useMemo(
    () => getQuestionnaireChipsUtil(patientIntakeUpdate, patientQuiz),
    [patientIntakeUpdate, patientQuiz]
  );
  const departments = useMemo(() => DEPARTMENTS, []);
  const physicianId = useMemo(() => getPhysicianIdUtil(session), [session]);
  const totalPages = useMemo(() => Math.ceil(taskTotalCount / taskPageSize), [taskTotalCount, taskPageSize]);
  const hasNextPage = useMemo(() => taskPage < totalPages, [taskPage, totalPages]);
  const hasPrevPage = useMemo(() => taskPage > 1, [taskPage]);
  const displayedTasks = useMemo(() => patientTasks, [patientTasks]);

  // Fetch recent patients
  const fetchRecentPatients = useCallback(async (searchQuery: string = "") => {
    try {
      setLoading(true);
      const data = await fetchRecentPatientsUtil(searchQuery);
      setRecentPatients(data);
      setSelectedPatient((currentSelected) => {
        if (data.length > 0) {
          if (currentSelected) {
            const updatedPatient = data.find(
              (p: RecentPatient) =>
                p.patientName === currentSelected.patientName &&
                p.claimNumber === currentSelected.claimNumber
            );
            if (updatedPatient) return updatedPatient;
          }
          if (!currentSelected) return data[0];
        }
        return currentSelected;
      });
    } catch (error) {
      console.error("Error fetching recent patients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPatients(patientSearchQuery);
  }, [patientSearchQuery, fetchRecentPatients]);

  useEffect(() => {
    fetchFailedDocuments();
  }, [fetchFailedDocuments]);

  // Close all modals when payment error modal is shown
  useEffect(() => {
    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      setShowModal(false);
      setShowTaskModal(false);
      setShowQuickNoteModal(false);
      setShowDocumentSuccessPopup(false);
      setShowFilePopup(false);
      setIsUpdateModalOpen(false);
    }
  }, [paymentError, ignoredFiles]);

  // Page initialization
  useEffect(() => {
    const initializePage = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPageLoading(false);
      } catch (error) {
        console.error("Error initializing page:", error);
        setPageLoading(false);
      }
    };
    initializePage();
  }, []);

  // Fetch patient tasks
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

  // Fetch patient data on selection
  useEffect(() => {
    if (!selectedPatient) {
      setPatientTasks([]);
      setPatientQuiz(null);
      setPatientIntakeUpdate(null);
      setLoadingPatientData(false);
      return;
    }

    setPatientTasks([]);
    setPatientQuiz(null);
    setPatientIntakeUpdate(null);
    setLoadingPatientData(true);

    let isCancelled = false;

    const fetchPatientData = async () => {
      try {
        setTaskPage(1);
        await fetchPatientTasks(selectedPatient, 1, taskPageSize);
        if (isCancelled) return;

        const { patientQuiz: quiz, patientIntakeUpdate: intakeUpdate } = await fetchPatientDataUtil(selectedPatient);

        if (!isCancelled) {
          setPatientQuiz(quiz);
          setPatientIntakeUpdate(intakeUpdate);
        }
      } catch (error) {
        if (!isCancelled) console.error("Error fetching patient data:", error);
      } finally {
        if (!isCancelled) setLoadingPatientData(false);
      }
    };

    fetchPatientData();

    return () => {
      isCancelled = true;
    };
  }, [selectedPatient, fetchPatientTasks, taskPageSize]);

  useEffect(() => {
    if (selectedPatient) {
      setTaskPage(1);
      fetchPatientTasks(selectedPatient, 1, taskPageSize);
    }
  }, [taskTypeFilter, fetchPatientTasks, selectedPatient, taskPageSize]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientTasks(selectedPatient, taskPage, taskPageSize);
    }
  }, [taskPage, showCompletedTasks, fetchPatientTasks, selectedPatient, taskPageSize]);

  const formatDOB = useCallback((dob: string) => formatDOBUtil(dob), []);
  const formatClaimNumber = useCallback((claim: string) => formatClaimNumberUtil(claim), []);

  // Handle manual task submit
  const handleManualTaskSubmit = useCallback(
    async (formData: any) => {
      try {
        if (selectedPatient) {
          if (!formData.patientName) formData.patientName = selectedPatient.patientName;
          if (!formData.claim && selectedPatient.claimNumber && selectedPatient.claimNumber !== "Not specified") {
            formData.claim = selectedPatient.claimNumber;
          }
          if (!formData.documentId && selectedPatient.documentIds && selectedPatient.documentIds.length > 0) {
            formData.documentId = selectedPatient.documentIds[0];
          }
        }
        if (!formData.claim) {
          formData.claim = `Recommendation-${new Date().toISOString().slice(0, 10)}`;
        }

        await handleCreateManualTask(formData, initialMode, selectedPatient?.claimNumber || "");

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

  const handleTaskClick = (task: Task) => {
    setSelectedTaskForQuickNote(task);
    setShowQuickNoteModal(true);
  };

  const handleSaveQuickNote = async (
    taskId: string,
    quickNotes: { status_update: string; details: string; one_line_note: string }
  ) => {
    const result = await saveQuickNote(taskId, quickNotes);
    if (result.success && selectedPatient) {
      await fetchPatientTasks(selectedPatient, taskPage, taskPageSize);
    } else if (!result.success) {
      throw result.error;
    }
  };

  // Data refresh function for progress manager
  const handleRefreshData = useCallback(async () => {
    const fetchPromises: Promise<void>[] = [];
    if (selectedPatient) {
      fetchPromises.push(fetchPatientTasks(selectedPatient, taskPage, taskPageSize));
      fetchPromises.push(fetchRecentPatients(patientSearchQuery));
    }
    fetchPromises.push(fetchFailedDocuments());
    try {
      await Promise.all(fetchPromises);
      console.log("✅ Data refreshed successfully after upload complete");
    } catch (error) {
      console.error("❌ Error refreshing data after upload:", error);
    }
  }, [selectedPatient, fetchPatientTasks, taskPage, taskPageSize, fetchRecentPatients, patientSearchQuery, fetchFailedDocuments]);

  // File upload handlers
  const handleFileUpload = useCallback(() => {
    setShowUploadToast(true);
    setShowFilePopup(false);
    if (pendingFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      pendingFiles.forEach((file) => dataTransfer.items.add(file));
      if (snapInputRef.current) {
        snapInputRef.current.files = dataTransfer.files;
        const event = { target: snapInputRef.current } as React.ChangeEvent<HTMLInputElement>;
        handleSnap(event);
      }
    }
    setFileDetailsPopup([]);
    setPendingFiles([]);
  }, [pendingFiles, snapInputRef, handleSnap]);

  const handleCancelFile = useCallback((index: number) => {
    setFileDetailsPopup((prev) => prev.filter((_, i) => i !== index));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCloseFilePopup = useCallback(() => {
    setShowFilePopup(false);
    setFileDetailsPopup([]);
    setPendingFiles([]);
    if (snapInputRef.current) snapInputRef.current.value = "";
  }, [snapInputRef]);

  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);

  const handleCloseErrorModal = useCallback(() => {
    clearPaymentError();
    // Close all modals when error modal is closed
    setShowModal(false);
    setShowTaskModal(false);
    setShowQuickNoteModal(false);
    setShowDocumentSuccessPopup(false);
    setShowFilePopup(false);
    setIsUpdateModalOpen(false);
  }, [clearPaymentError]);

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

        * { box-sizing: border-box; }
        html, body {
          margin: 0; padding: 0; width: 100%; height: 100%;
          font-family: var(--font); background: var(--bg); color: var(--text);
          font-size: 13px; overflow: hidden;
        }
        #__next { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
      `}</style>

      <div className="flex h-screen overflow-hidden">
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

          <FileUploadPopup
            showFilePopup={showFilePopup as boolean}
            fileDetailsPopup={fileDetailsPopup as FileDetails[]}
            pendingFiles={pendingFiles as File[]}
            uploading={uploading}
            isProcessing={isProcessing}
            snapInputRef={snapInputRef as React.RefObject<HTMLInputElement>}
            onClose={handleCloseFilePopup}
            onUpload={handleFileUpload}
            onCancelFile={handleCancelFile as (index: number) => void}
          />

          <main className="p-4 max-w-[1280px] mx-auto w-full grid grid-cols-[auto_1fr] gap-4 box-border h-[calc(100vh-50px)] overflow-hidden flex-1 max-md:grid-cols-1">
            <PatientDrawer
              patients={recentPatients}
              selectedPatient={selectedPatient}
              loading={loading}
              collapsed={patientDrawerCollapsed}
              onToggle={() => setPatientDrawerCollapsed(!patientDrawerCollapsed)}
              onSelectPatient={setSelectedPatient}
              formatDOB={formatDOB}
              formatClaimNumber={formatClaimNumber}
              onSearchChange={setPatientSearchQuery}
            />

            <section className="flex flex-col gap-3.5 h-full overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
              <TasksSection
                selectedPatient={selectedPatient}
                displayedTasks={displayedTasks}
                taskTotalCount={taskTotalCount}
                taskPage={taskPage}
                taskPageSize={taskPageSize}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                showCompletedTasks={showCompletedTasks}
                taskStatuses={taskStatuses}
                taskAssignees={taskAssignees}
                failedDocuments={Array.isArray(failedDocuments) ? failedDocuments : []}
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

      <UploadProgressManager
        selectedPatient={selectedPatient}
        patientSearchQuery={patientSearchQuery}
        taskPage={taskPage}
        taskPageSize={taskPageSize}
        showDocumentSuccessPopup={showDocumentSuccessPopup}
        setShowDocumentSuccessPopup={setShowDocumentSuccessPopup}
        onRefreshData={handleRefreshData}
      />

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
        onClearPaymentError={handleCloseErrorModal}
        onUpgrade={handleUpgrade}
        onManualTaskSubmit={handleManualTaskSubmit}
        onSaveQuickNote={handleSaveQuickNote}
        onCloseUpdateModal={() => setIsUpdateModalOpen(false)}
        onUpdateInputChange={(field: string, value: string) => {
          const syntheticEvent = { target: { name: field, value } } as React.ChangeEvent<HTMLInputElement>;
          handleUpdateInputChange(syntheticEvent);
        }}
        onUpdateSubmit={handleUpdateSubmit}
      />

      <PaymentErrorModal
        isOpen={!!paymentError || !!(ignoredFiles && ignoredFiles.length > 0)}
        onClose={handleCloseErrorModal}
        onUpgrade={handleUpgrade}
        // errorMessage={paymentError}
        ignoredFiles={ignoredFiles}
      />

      {showUploadToast && <UploadToast />}

      {/* {pageLoading && <LoadingSpinner />} */}
    </>
  );
}