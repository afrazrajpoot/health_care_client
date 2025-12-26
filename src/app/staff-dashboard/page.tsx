"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import IntakeModal from "@/components/staff-components/IntakeModal";
import ManualTaskModal from "@/components/ManualTaskModal";
import { ProgressTracker } from "@/components/ProgressTracker";
import { useSocket } from "@/providers/SocketProvider";
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
import FailedDocuments from "@/components/staff-components/FailedDocuments";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import { useFailedDocuments } from "../custom-hooks/staff-hooks/useFailedDocuments";

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
  const [patientIntakeUpdate, setPatientIntakeUpdate] = useState<any>(null);
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
  const [showDocumentSuccessPopup, setShowDocumentSuccessPopup] =
    useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize] = useState(10);
  const [taskTotalCount, setTaskTotalCount] = useState(0);
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

  // Fetch recent patients function
  const fetchRecentPatients = useCallback(
    async (searchQuery: string = "") => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ mode: "wc" });
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }
        const response = await fetch(`/api/get-recent-patients?${params}`);
        if (!response.ok) throw new Error("Failed to fetch patients");
        const data = await response.json();
        setRecentPatients(data);
        // Update selected patient if it still exists in the new list
        // Use functional update to avoid dependency on selectedPatient
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
    },
    [] // Remove selectedPatient from dependencies to prevent infinite loop
  );

  // Fetch recent patients on mount and when search changes
  useEffect(() => {
    fetchRecentPatients(patientSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientSearchQuery]); // Only depend on patientSearchQuery, not fetchRecentPatients

  // Fetch failed documents on mount only
  useEffect(() => {
    fetchFailedDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Function to fetch patient tasks - filter by selected patient with pagination
  const fetchPatientTasks = useCallback(
    async (patient: RecentPatient, page: number = 1, pageSize: number = 10) => {
      try {
        // Fetch tasks based on current view (open or completed)
        const statusFilter = showCompletedTasks ? "completed" : undefined;

        const taskParams = new URLSearchParams({
          mode: "wc",
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        // Filter by patient name first (most reliable)
        taskParams.append("search", patient.patientName);

        // Also add claim filter if available for better matching
        if (patient.claimNumber && patient.claimNumber !== "Not specified") {
          taskParams.append("claim", patient.claimNumber);
        }

        // Add status filter if showing completed tasks
        if (statusFilter) {
          taskParams.append("status", statusFilter);
        }

        const response = await fetch(`/api/tasks?${taskParams}`);
        if (!response.ok) throw new Error("Failed to fetch tasks");

        const data = await response.json();
        const tasks = data.tasks || [];
        const totalCount = data.totalCount || 0;

        if (Array.isArray(tasks) && tasks.length > 0) {
          // Additional client-side filtering by patient name to ensure accuracy
          const filteredTasks = tasks.filter((task: Task) => {
            const taskPatientName = task.patient?.toLowerCase() || "";
            const selectedPatientName = patient.patientName.toLowerCase();
            return (
              taskPatientName.includes(selectedPatientName) ||
              selectedPatientName.includes(taskPatientName)
            );
          });

          setPatientTasks(filteredTasks);
          setTaskTotalCount(totalCount);
        } else {
          setPatientTasks([]);
          setTaskTotalCount(0);
        }
      } catch (error) {
        console.error("Error fetching patient tasks:", error);
        setPatientTasks([]);
        setTaskTotalCount(0);
      }
    },
    [showCompletedTasks]
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

        // Use Promise.allSettled to handle errors gracefully and prevent one failure from blocking the other
        const [quizResult, intakeUpdateResult] = await Promise.allSettled([
          fetch(`/api/patient-intakes?${quizParams}`),
          fetch(`/api/patient-intake-update?${quizParams}`),
        ]);

        if (isCancelled) return;

        // Handle quiz response
        if (quizResult.status === "fulfilled" && quizResult.value.ok) {
          try {
            const quizData = await quizResult.value.json();
            if (
              quizData?.success &&
              quizData?.data &&
              quizData.data.length > 0
            ) {
              setPatientQuiz(quizData.data[0]);
            } else {
              setPatientQuiz(null);
            }
          } catch (error) {
            console.error("Error parsing quiz response:", error);
            setPatientQuiz(null);
          }
        } else if (quizResult.status === "rejected") {
          console.error("Error fetching quiz:", quizResult.reason);
          setPatientQuiz(null);
        }

        // Handle intake update response
        if (
          intakeUpdateResult.status === "fulfilled" &&
          intakeUpdateResult.value.ok
        ) {
          try {
            const intakeUpdateData = await intakeUpdateResult.value.json();
            if (intakeUpdateData?.success && intakeUpdateData?.data) {
              setPatientIntakeUpdate(intakeUpdateData.data);
            } else {
              setPatientIntakeUpdate(null);
            }
          } catch (error) {
            console.error("Error parsing intake update response:", error);
            setPatientIntakeUpdate(null);
          }
        } else if (intakeUpdateResult.status === "rejected") {
          console.error(
            "Error fetching intake update:",
            intakeUpdateResult.reason
          );
          setPatientIntakeUpdate(null);
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

  // Generate questionnaire summary chips from PatientIntakeUpdate (AI-generated points) and patient quiz
  const getQuestionnaireChips = () => {
    const chips: Array<{
      text: string;
      type: "blue" | "amber" | "red" | "green";
    }> = [];

    // Use AI-generated points from PatientIntakeUpdate if available
    if (patientIntakeUpdate) {
      // Add ADL effect points
      if (
        patientIntakeUpdate.adlEffectPoints &&
        Array.isArray(patientIntakeUpdate.adlEffectPoints)
      ) {
        patientIntakeUpdate.adlEffectPoints.forEach((point: string) => {
          if (point && point.trim()) {
            // Determine chip type based on content
            const lowerPoint = point.toLowerCase();
            let type: "blue" | "amber" | "red" | "green" = "blue";
            if (
              lowerPoint.includes("worse") ||
              lowerPoint.includes("decreased") ||
              lowerPoint.includes("limited") ||
              lowerPoint.includes("difficulty")
            ) {
              type = "red";
            } else if (
              lowerPoint.includes("improved") ||
              lowerPoint.includes("better") ||
              lowerPoint.includes("increased")
            ) {
              type = "green";
            } else if (
              lowerPoint.includes("unchanged") ||
              lowerPoint.includes("same")
            ) {
              type = "green";
            } else {
              type = "amber";
            }
            chips.push({ text: point.trim(), type });
          }
        });
      }

      // Add intake patient points
      if (
        patientIntakeUpdate.intakePatientPoints &&
        Array.isArray(patientIntakeUpdate.intakePatientPoints)
      ) {
        patientIntakeUpdate.intakePatientPoints.forEach((point: string) => {
          if (point && point.trim()) {
            // Determine chip type based on content
            const lowerPoint = point.toLowerCase();
            let type: "blue" | "amber" | "red" | "green" = "blue";
            if (
              lowerPoint.includes("refill") ||
              lowerPoint.includes("medication")
            ) {
              type = "blue";
            } else if (
              lowerPoint.includes("appointment") ||
              lowerPoint.includes("consult")
            ) {
              type = "blue";
            } else if (
              lowerPoint.includes("improved") ||
              lowerPoint.includes("better")
            ) {
              type = "green";
            } else if (
              lowerPoint.includes("worse") ||
              lowerPoint.includes("pain")
            ) {
              type = "red";
            } else {
              type = "amber";
            }
            chips.push({ text: point.trim(), type });
          }
        });
      }
    }

    // Fallback to patient quiz parsing if no AI-generated points available
    if (chips.length === 0 && patientQuiz) {
      try {
        if (patientQuiz.refill) {
          const refill =
            typeof patientQuiz.refill === "string"
              ? JSON.parse(patientQuiz.refill)
              : patientQuiz.refill;
          if (
            refill &&
            (refill.requested ||
              refill.needed ||
              Object.keys(refill).length > 0)
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
            chips.push({ text: "New appointment scheduled", type: "blue" });
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
                  (typeof a === "string" &&
                    a.toLowerCase().includes("unchanged"))
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
    }

    return chips;
  };

  const questionnaireChips = getQuestionnaireChips();

  // Format claim number
  const formatClaimNumber = (claim: string) => {
    if (!claim || claim === "Not specified") return "";
    return `Claim #${claim}`;
  };

  // Get physician ID helper
  const getPhysicianId = useCallback(() => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? (session.user.id as string) || null
      : session.user.physicianId || null;
  }, [session]);

  // Handle progress complete - only show popup, don't call APIs
  const handleProgressComplete = useCallback(() => {
    // Show popup instantly when progress reaches 100%
    setShowDocumentSuccessPopup(true);
  }, []);

  // Handle popup OK button click - just reload the page
  const handlePopupOkClick = useCallback(() => {
    // Close popup and reload the page
    setShowDocumentSuccessPopup(false);
    window.location.reload();
  }, []);

  // Instant detection of 100% progress - show popup immediately (page reloads on OK click)
  useEffect(() => {
    if (!selectedPatient) {
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
      console.log("🚀 Progress reached 100% - showing popup instantly");
      progressCompleteHandledRef.current = true;

      // Show popup immediately (APIs will be called when user clicks OK)
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
  ]);

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
        await fetchPatientTasks(selectedPatient, taskPage, taskPageSize);
      }
    } catch (error) {
      console.error("Error saving quick note:", error);
      throw error;
    }
  };

  // Tasks to display (already filtered by API based on showCompletedTasks)
  const displayedTasks = patientTasks;

  // Calculate pagination info
  const totalPages = Math.ceil(taskTotalCount / taskPageSize);
  const hasNextPage = taskPage < totalPages;
  const hasPrevPage = taskPage > 1;

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
          onSearchChange={setPatientSearchQuery}
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
                          ? `Completed Tasks (${taskTotalCount})`
                          : `Open Tasks & Required Actions (${taskTotalCount})`}
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

                    {/* Pagination Controls */}
                    {taskTotalCount > taskPageSize && (
                      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          Showing {(taskPage - 1) * taskPageSize + 1} to{" "}
                          {Math.min(taskPage * taskPageSize, taskTotalCount)} of{" "}
                          {taskTotalCount} tasks
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setTaskPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={!hasPrevPage}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                              hasPrevPage
                                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            }`}
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {taskPage} of {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setTaskPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={!hasNextPage}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                              hasNextPage
                                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Failed Documents Section - Always show if data exists */}
                  {failedDocuments.length > 0 && (
                    <div className="mt-6">
                      {/* <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-slate-900 m-0">
                          Failed Documents ({failedDocuments.length})
                        </h3>
                      </div> */}
                      <FailedDocuments
                        documents={failedDocuments}
                        onRowClick={handleRowClick}
                        onDocumentDeleted={removeFailedDocument}
                        mode={initialMode}
                        physicianId={getPhysicianId() || undefined}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-10 text-center">
                <p className="text-sm text-gray-500 m-0">
                  Select a patient to view their details
                </p>
              </section>

              {/* Failed Documents Section - Show even when no patient selected */}
              {failedDocuments.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-slate-900 m-0">
                      Failed Documents ({failedDocuments.length})
                    </h3>
                  </div>
                  <FailedDocuments
                    documents={failedDocuments}
                    onRowClick={handleRowClick}
                    onDocumentDeleted={removeFailedDocument}
                    mode={initialMode}
                    physicianId={getPhysicianId() || undefined}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Modals */}
      <IntakeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedPatient={selectedPatient}
      />

      {/* Document Success Popup */}
      {showDocumentSuccessPopup && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Document Successfully Submitted!
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Your document has been processed and verified successfully.
            </p>
            <button
              onClick={handlePopupOkClick}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}

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
        defaultDocumentId={
          selectedPatient?.documentIds && selectedPatient.documentIds.length > 0
            ? selectedPatient.documentIds[0] // Use the first document ID (most recent)
            : ""
        }
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

      {/* Update Document Modal */}
      <UpdateDocumentModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        selectedDoc={selectedDoc}
        formData={updateFormData}
        onInputChange={handleUpdateInputChange}
        onSubmit={handleUpdateSubmit}
        isLoading={updateLoading}
      />
    </>
  );
}
