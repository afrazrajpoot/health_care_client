"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import IntakeModal from "@/components/staff-components/IntakeModal";
import ManualTaskModal from "@/components/ManualTaskModal";
import { ProgressTracker } from "@/components/ProgressTracker";
import { useTasks } from "../custom-hooks/staff-hooks/useTasks";
import { useFileUpload } from "../custom-hooks/staff-hooks/useFileUpload";
import { AlertCircle, X } from "lucide-react";

// Import new components
import StaffDashboardHeader from "@/components/staff-components/StaffDashboardHeader";
import PatientDrawer from "@/components/staff-components/PatientDrawer";
import PatientHeader from "@/components/staff-components/PatientHeader";
import TaskSummary from "@/components/staff-components/TaskSummary";
import QuestionnaireSummary from "@/components/staff-components/QuestionnaireSummary";
import TasksTable from "@/components/staff-components/TasksTable";
import QuickNotesSection from "@/components/staff-components/QuickNotesSection";
import QuickNoteModal from "@/components/staff-components/QuickNoteModal";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
}

interface Task {
  id: string;
  description: string;
  department: string;
  status: string;
  dueDate?: string;
  patient: string;
  priority?: string;
  quickNotes?: any;
  assignee?: string;
  actions?: string[];
}

interface PatientQuiz {
  id: string;
  patientName: string;
  dob: string;
  doi?: string;
  lang: string;
  bodyAreas?: string;
  newAppointments?: any;
  refill?: any;
  adl?: any;
  therapies?: any;
  claimNumber?: string;
  createdAt: string;
}

export default function StaffDashboardPatient() {
  const { data: session } = useSession();
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<RecentPatient | null>(
    null
  );
  const [patientTasks, setPatientTasks] = useState<Task[]>([]);
  const [patientQuiz, setPatientQuiz] = useState<PatientQuiz | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Task status and assignee management (for selectable chips)
  const [taskStatuses, setTaskStatuses] = useState<{
    [taskId: string]: string;
  }>({});
  const [taskAssignees, setTaskAssignees] = useState<{
    [taskId: string]: string;
  }>({});

  // Initialize task statuses and assignees when tasks are loaded
  useEffect(() => {
    setTaskStatuses((prev) => {
      const updated = { ...prev };
      patientTasks.forEach((task) => {
        if (!updated[task.id]) {
          updated[task.id] = task.status || "Pending";
        }
      });
      return updated;
    });

    setTaskAssignees((prev) => {
      const updated = { ...prev };
      patientTasks.forEach((task) => {
        if (!updated[task.id]) {
          updated[task.id] = task.assignee || "Unclaimed";
        }
      });
      return updated;
    });
  }, [patientTasks]);

  // Handle status chip click
  const handleStatusChipClick = async (taskId: string, status: string) => {
    setTaskStatuses((prev) => ({ ...prev, [taskId]: status }));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const task = patientTasks.find((t) => t.id === taskId);
        if (task) {
          setTaskStatuses((prev) => ({ ...prev, [taskId]: task.status }));
        }
        console.error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      const task = patientTasks.find((t) => t.id === taskId);
      if (task) {
        setTaskStatuses((prev) => ({ ...prev, [taskId]: task.status }));
      }
    }
  };

  // Handle assignee chip click
  const handleAssigneeChipClick = async (taskId: string, assignee: string) => {
    setTaskAssignees((prev) => ({ ...prev, [taskId]: assignee }));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignee }),
      });

      if (!response.ok) {
        const task = patientTasks.find((t) => t.id === taskId);
        if (task) {
          setTaskAssignees((prev) => ({
            ...prev,
            [taskId]: task.assignee || "Unclaimed",
          }));
        }
        console.error("Failed to update task assignee");
      }
    } catch (error) {
      console.error("Error updating task assignee:", error);
      const task = patientTasks.find((t) => t.id === taskId);
      if (task) {
        setTaskAssignees((prev) => ({
          ...prev,
          [taskId]: task.assignee || "Unclaimed",
        }));
      }
    }
  };

  // Get status options based on current status
  const getStatusOptions = (task: Task): string[] => {
    const currentStatus = taskStatuses[task.id] || task.status;
    const baseOptions = [
      "Pending",
      "In Progress",
      "Waiting Callback",
      "Completed",
    ];

    if (
      currentStatus.toLowerCase().includes("signature") ||
      currentStatus.toLowerCase().includes("physician")
    ) {
      return ["Physician Signature", "Reviewed", "Signed", "Completed"];
    }
    if (currentStatus.toLowerCase().includes("scheduling")) {
      return ["Pending Scheduling", "Left VM", "Scheduled", "Completed"];
    }
    if (
      currentStatus.toLowerCase().includes("appeal") ||
      currentStatus.toLowerCase().includes("authorization")
    ) {
      return ["In Progress", "Left VM", "Waiting Callback", "Completed"];
    }

    return baseOptions;
  };

  // Get assignee options
  const getAssigneeOptions = (task: Task): string[] => {
    return [
      "Unclaimed",
      "Assigned: MA",
      "Assigned: Admin",
      "Assigned: Scheduler",
      "Physician",
    ];
  };

  // Departments list for task creation
  const departments = [
    "Medical/Clinical",
    "Scheduling & Coordination",
    "Administrative / Compliance",
    "Authorizations & Denials",
  ];

  // Use tasks hook for task management
  const initialMode = "wc" as const;
  const { handleCreateManualTask, fetchTasks } = useTasks(initialMode);

  // File upload functionality
  const router = useRouter();
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
  } = useFileUpload(initialMode);

  // Task summary statistics
  const taskStats = {
    open: patientTasks.filter(
      (t) => t.status !== "Completed" && t.status !== "completed"
    ).length,
    urgent: patientTasks.filter(
      (t) =>
        t.priority === "high" || (t.dueDate && new Date(t.dueDate) < new Date())
    ).length,
    dueToday: patientTasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const today = new Date();
      return (
        due.toDateString() === today.toDateString() &&
        t.status !== "Completed" &&
        t.status !== "completed"
      );
    }).length,
    completed: patientTasks.filter(
      (t) => t.status === "Completed" || t.status === "completed"
    ).length,
  };

  // Fetch recent patients
  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/get-recent-patients?mode=wc");
        if (!response.ok) throw new Error("Failed to fetch patients");
        const data = await response.json();
        setRecentPatients(data);
        if (data.length > 0 && !selectedPatient) {
          setSelectedPatient(data[0]);
        }
      } catch (error) {
        console.error("Error fetching recent patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPatients();
  }, []);

  // Function to fetch patient tasks - filter by selected patient
  const fetchPatientTasks = useCallback(async (patient: RecentPatient) => {
    try {
      // Fetch open tasks
      const openTaskParams = new URLSearchParams({
        mode: "wc",
        page: "1",
        pageSize: "100",
      });

      // Filter by patient name first (most reliable)
      openTaskParams.append("search", patient.patientName);

      // Also add claim filter if available for better matching
      if (patient.claimNumber && patient.claimNumber !== "Not specified") {
        openTaskParams.append("claim", patient.claimNumber);
      }

      // Fetch completed tasks separately (all completed statuses)
      const completedStatuses = ["completed", "done", "closed"];
      const completedTaskParams = completedStatuses.map((status) => {
        const params = new URLSearchParams({
          mode: "wc",
          page: "1",
          pageSize: "100",
          status: status,
        });
        params.append("search", patient.patientName);
        if (patient.claimNumber && patient.claimNumber !== "Not specified") {
          params.append("claim", patient.claimNumber);
        }
        return fetch(`/api/tasks?${params}`);
      });

      // Fetch both open and all completed tasks in parallel
      const [openResponse, ...completedResponses] = await Promise.all([
        fetch(`/api/tasks?${openTaskParams}`),
        ...completedTaskParams,
      ]);

      if (!openResponse.ok) throw new Error("Failed to fetch open tasks");
      const completedResponsesOk = completedResponses.every((r) => r.ok);
      if (!completedResponsesOk)
        throw new Error("Failed to fetch completed tasks");

      const openData = await openResponse.json();
      const completedDataArray = await Promise.all(
        completedResponses.map((r) => r.json())
      );

      // Combine all completed tasks from different statuses
      const allCompletedTasks = completedDataArray.flatMap(
        (data) => data.tasks || []
      );

      // Combine both open and completed tasks
      const allTasks = [...(openData.tasks || []), ...allCompletedTasks];

      if (Array.isArray(allTasks) && allTasks.length > 0) {
        // Additional client-side filtering by patient name to ensure accuracy
        const filteredTasks = allTasks.filter((task: Task) => {
          const taskPatientName = task.patient?.toLowerCase() || "";
          const selectedPatientName = patient.patientName.toLowerCase();
          return (
            taskPatientName.includes(selectedPatientName) ||
            selectedPatientName.includes(taskPatientName)
          );
        });

        // Remove duplicates based on task ID
        const uniqueTasks = filteredTasks.filter(
          (task, index, self) =>
            index === self.findIndex((t) => t.id === task.id)
        );

        setPatientTasks(uniqueTasks);
      } else {
        setPatientTasks([]);
      }
    } catch (error) {
      console.error("Error fetching patient tasks:", error);
      setPatientTasks([]);
    }
  }, []);

  // Fetch patient tasks and quiz when patient is selected
  useEffect(() => {
    if (!selectedPatient) {
      setPatientTasks([]);
      setPatientQuiz(null);
      setLoadingPatientData(false);
      return;
    }

    // Clear data immediately for instant UI update
    setPatientTasks([]);
    setPatientQuiz(null);
    setLoadingPatientData(true);

    const fetchPatientData = async () => {
      try {
        await fetchPatientTasks(selectedPatient);

        // Fetch patient quiz
        const quizParams = new URLSearchParams({
          patientName: selectedPatient.patientName,
        });
        if (selectedPatient.dob) {
          const dobDate = selectedPatient.dob.split("T")[0];
          quizParams.append("dob", dobDate);
        }
        if (
          selectedPatient.claimNumber &&
          selectedPatient.claimNumber !== "Not specified"
        ) {
          quizParams.append("claimNumber", selectedPatient.claimNumber);
        }

        const quizResponse = await fetch(`/api/patient-intakes?${quizParams}`);
        if (quizResponse.ok) {
          const quizData = await quizResponse.json();
          if (quizData?.success && quizData?.data && quizData.data.length > 0) {
            setPatientQuiz(quizData.data[0]);
          } else {
            setPatientQuiz(null);
          }
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoadingPatientData(false);
      }
    };

    fetchPatientData();
  }, [selectedPatient, fetchPatientTasks]);

  // Format DOB for display
  const formatDOB = (dob: string) => {
    if (!dob) return "";
    try {
      const date = new Date(dob);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dob;
    }
  };

  // Generate questionnaire summary chips from patient quiz
  const getQuestionnaireChips = () => {
    if (!patientQuiz) return [];

    const chips: Array<{
      text: string;
      type: "blue" | "amber" | "red" | "green";
    }> = [];

    try {
      if (patientQuiz.refill) {
        const refill =
          typeof patientQuiz.refill === "string"
            ? JSON.parse(patientQuiz.refill)
            : patientQuiz.refill;
        if (
          refill &&
          (refill.requested || refill.needed || Object.keys(refill).length > 0)
        ) {
          chips.push({ text: "Medication refill requested", type: "blue" });
        }
      }

      if (patientQuiz.therapies) {
        const therapies =
          typeof patientQuiz.therapies === "string"
            ? JSON.parse(patientQuiz.therapies)
            : patientQuiz.therapies;
        const therapyArray = Array.isArray(therapies)
          ? therapies
          : typeof therapies === "object"
          ? Object.values(therapies)
          : [];
        if (
          therapyArray.some(
            (t: any) =>
              t?.missed ||
              t?.status === "missed" ||
              (typeof t === "string" && t.toLowerCase().includes("missed"))
          )
        ) {
          chips.push({ text: "Missed PT session", type: "amber" });
        }
      }

      if (patientQuiz.newAppointments) {
        const newApps =
          typeof patientQuiz.newAppointments === "string"
            ? JSON.parse(patientQuiz.newAppointments)
            : patientQuiz.newAppointments;
        const appsArray = Array.isArray(newApps)
          ? newApps
          : typeof newApps === "object"
          ? Object.values(newApps)
          : [];
        if (appsArray.length > 0) {
          chips.push({ text: "New MRI completed", type: "blue" });
        }
      }

      if (patientQuiz.adl) {
        const adls = Array.isArray(patientQuiz.adl)
          ? patientQuiz.adl
          : typeof patientQuiz.adl === "string"
          ? JSON.parse(patientQuiz.adl)
          : typeof patientQuiz.adl === "object"
          ? Object.values(patientQuiz.adl)
          : [];

        if (
          adls.length === 0 ||
          (Array.isArray(adls) &&
            adls.every(
              (a: any) =>
                !a ||
                a === "unchanged" ||
                (typeof a === "string" && a.toLowerCase().includes("unchanged"))
            ))
        ) {
          chips.push({ text: "ADLs unchanged", type: "green" });
        } else {
          chips.push({ text: "ADLs changed", type: "amber" });
        }
      } else {
        chips.push({ text: "ADLs unchanged", type: "green" });
      }

      chips.push({ text: "No ER visits", type: "green" });
    } catch (error) {
      console.error("Error parsing patient quiz data:", error);
      chips.push({ text: "ADLs unchanged", type: "green" });
      chips.push({ text: "No ER visits", type: "green" });
    }

    return chips;
  };

  const questionnaireChips = getQuestionnaireChips();

  // Format claim number
  const formatClaimNumber = (claim: string) => {
    if (!claim || claim === "Not specified") return "";
    return `Claim #${claim}`;
  };

  // Handle progress complete - refresh patient data after upload
  const handleProgressComplete = useCallback(() => {
    if (selectedPatient) {
      fetchPatientTasks(selectedPatient);

      const quizParams = new URLSearchParams({
        patientName: selectedPatient.patientName,
      });
      if (selectedPatient.dob) {
        const dobDate = selectedPatient.dob.split("T")[0];
        quizParams.append("dob", dobDate);
      }
      if (
        selectedPatient.claimNumber &&
        selectedPatient.claimNumber !== "Not specified"
      ) {
        quizParams.append("claimNumber", selectedPatient.claimNumber);
      }
      fetch(`/api/patient-intakes?${quizParams}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
        })
        .then((quizData) => {
          if (quizData?.success && quizData?.data && quizData.data.length > 0) {
            setPatientQuiz(quizData.data[0]);
          }
        })
        .catch((error) => {
          console.error("Error refreshing patient quiz:", error);
        });
    }
  }, [selectedPatient, fetchPatientTasks]);

  // Handle upgrade for payment errors
  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);

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
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quickNotes: {
            ...quickNotes,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save quick note");
      }

      // Refresh tasks after saving
      if (selectedPatient) {
        await fetchPatientTasks(selectedPatient);
      }
    } catch (error) {
      console.error("Error saving quick note:", error);
      throw error;
    }
  };

  // Get open tasks
  const openTasks = patientTasks.filter(
    (t) =>
      t.status !== "Completed" &&
      t.status !== "completed" &&
      t.status !== "Done" &&
      t.status !== "Closed"
  );

  // Get completed tasks
  const completedTasks = patientTasks.filter(
    (t) =>
      t.status === "Completed" ||
      t.status === "completed" ||
      t.status === "Done" ||
      t.status === "Closed"
  );

  // Tasks to display based on toggle
  const displayedTasks = showCompletedTasks ? completedTasks : openTasks;

  return (
    <>
      <ProgressTracker onComplete={handleProgressComplete} />

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
        onChange={handleSnap}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
        />

        <section className="flex flex-col gap-3.5 h-full overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
          {selectedPatient ? (
            <>
              {loadingPatientData ? (
                <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-5 text-center">
                  <p className="text-sm text-gray-500 m-0">
                    Loading patient data...
                  </p>
                </section>
              ) : (
                <>
                  <PatientHeader
                    patient={selectedPatient}
                    formatDOB={formatDOB}
                    formatClaimNumber={formatClaimNumber}
                    completedTasks={taskStats.completed}
                  />

                  <TaskSummary
                    open={taskStats.open}
                    urgent={taskStats.urgent}
                    dueToday={taskStats.dueToday}
                    completed={taskStats.completed}
                  />

                  <QuestionnaireSummary chips={questionnaireChips} />

                  <QuickNotesSection
                    tasks={patientTasks}
                    onTaskClick={handleTaskClick}
                  />

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-bold text-slate-900 m-0">
                        {showCompletedTasks
                          ? `Completed Tasks (${completedTasks.length})`
                          : `Open Tasks & Required Actions (${openTasks.length})`}
                      </h3>
                      <button
                        onClick={() =>
                          setShowCompletedTasks(!showCompletedTasks)
                        }
                        className={`px-4 py-2 rounded-lg border border-gray-200 cursor-pointer text-[13px] font-medium transition-all duration-200 ${
                          showCompletedTasks
                            ? "bg-green-700 text-white"
                            : "bg-white text-slate-900 hover:bg-gray-50"
                        }`}
                      >
                        {showCompletedTasks
                          ? "Show Open Tasks"
                          : "Show Completed Tasks"}
                      </button>
                    </div>
                    <TasksTable
                      tasks={displayedTasks}
                      taskStatuses={taskStatuses}
                      taskAssignees={taskAssignees}
                      onStatusClick={handleStatusChipClick}
                      onAssigneeClick={handleAssigneeChipClick}
                      onTaskClick={handleTaskClick}
                      getStatusOptions={getStatusOptions}
                      getAssigneeOptions={getAssigneeOptions}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-10 text-center">
              <p className="text-sm text-gray-500 m-0">
                Select a patient to view their details
              </p>
            </section>
          )}
        </section>
      </main>

      {/* Modals */}
      <IntakeModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <ManualTaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        departments={departments}
        defaultClaim={
          selectedPatient?.claimNumber &&
          selectedPatient.claimNumber !== "Not specified"
            ? selectedPatient.claimNumber
            : ""
        }
        defaultPatient={selectedPatient?.patientName || ""}
        defaultDocumentId=""
        onSubmit={handleManualTaskSubmit}
      />

      <PaymentErrorModal
        isOpen={!!paymentError}
        onClose={clearPaymentError}
        onUpgrade={handleUpgrade}
        errorMessage={paymentError || undefined}
        ignoredFiles={ignoredFiles}
      />

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={showQuickNoteModal}
        task={selectedTaskForQuickNote}
        onClose={() => setShowQuickNoteModal(false)}
        onSave={handleSaveQuickNote}
      />
    </>
  );
}
