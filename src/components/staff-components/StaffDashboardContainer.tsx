// app/staff-dashboard/page.tsx (or wherever the main container lives)
"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
  useGetRecentPatientsQuery,
  useGetTasksQuery,
  useUpdateTaskMutation,
  useAddManualTaskMutation,
} from "@/redux/dashboardApi";
import {
  useGetFailedDocumentsQuery,
  useGetPatientIntakesQuery,
  useGetPatientIntakeUpdateQuery,
  useGetTreatmentHistoryQuery,
} from "@/redux/staffApi";
import { useUpdateFailedDocumentMutation } from "@/redux/pythonApi";
import {
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
import { useDispatch } from "react-redux";
import { staffApi } from "@/redux/staffApi";
import { dashboardApi } from "@/redux/dashboardApi";
import { pythonApi } from "@/redux/pythonApi";
import { ProgressTracker } from "../ProgressTracker";

interface FileDetails {
  name: string;
  size: number;
  type: string;
}

const UploadToast: React.FC = () => {
  useEffect(() => {
    const toastId = toast("Upload in Progress 🚀", {
      description: (
        <div className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          <span className="text-sm text-black">
            Your documents are queued and being prepared. Hang tight!
          </span>
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
    });
    // Dismiss toast on unmount
    return () => {
      toast.dismiss(toastId);
    };
  }, []);
  return null;
};

export default function StaffDashboardContainer() {
  const { data: session } = useSession();
  const physicianId = useMemo(() => getPhysicianIdUtil(session), [session]);
  const isStaff = session?.user?.role?.toLowerCase() === "staff";
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<RecentPatient | null>(
    null,
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [fileDetailsPopup, setFileDetailsPopup] = useState<FileDetails[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [patientDrawerCollapsed, setPatientDrawerCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"open" | "completed" | "all">(
    "open",
  );
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [selectedTaskForQuickNote, setSelectedTaskForQuickNote] =
    useState<Task | null>(null);
  const [showDocumentSuccessPopup, setShowDocumentSuccessPopup] =
    useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const taskPageSize = TASK_PAGE_SIZE;
  const [taskTypeFilter, setTaskTypeFilter] = useState<
    "all" | "internal" | "external"
  >("all");
  const [showUploadToast, setShowUploadToast] = useState(false);
  const [isRefreshingAfterUpload, setIsRefreshingAfterUpload] = useState(false);

  // RTK Query Hooks
  const {
    data: recentPatientsData,
    isLoading: isPatientsLoading,
    refetch: refetchPatients,
  } = useGetRecentPatientsQuery(patientSearchQuery, {
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });

  // Memoize task query params to prevent unnecessary re-renders and API calls
  const taskQueryParams = useMemo(() => {
    if (!selectedPatient) return null;
    return {
      patientName: selectedPatient.patientName || "",
      dob: selectedPatient.dob,
      claim: selectedPatient.claimNumber,
      documentIds: selectedPatient.documentIds,
      page: isStaff ? 1 : taskPage, // Fetch all for staff to allow client-side filtering
      pageSize: isStaff ? 1000 : taskPageSize,
      status:
        viewMode === "completed"
          ? "completed"
          : viewMode === "all"
            ? "all"
            : undefined,
      type: taskTypeFilter,
      search: taskSearchQuery,
    };
  }, [
    selectedPatient?.patientName,
    selectedPatient?.dob,
    selectedPatient?.claimNumber,
    selectedPatient?.documentIds,
    taskPage,
    taskPageSize,
    viewMode,
    taskTypeFilter,
    taskSearchQuery,
  ]);
  const {
    data: tasksData,
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useGetTasksQuery(taskQueryParams!, {
    skip: !taskQueryParams,
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });
  // Memoize intake query params to prevent unnecessary re-renders and API calls
  const intakeQueryParams = useMemo(() => {
    if (!selectedPatient) return null;
    return {
      patientName: selectedPatient.patientName || "",
      dob: selectedPatient.dob,
      claimNumber: selectedPatient.claimNumber,
    };
  }, [
    selectedPatient?.patientName,
    selectedPatient?.dob,
    selectedPatient?.claimNumber,
  ]);
  const { data: intakeUpdateData, isLoading: isIntakeUpdateLoading } =
    useGetPatientIntakeUpdateQuery(intakeQueryParams!, {
      skip: !intakeQueryParams,
      refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
      pollingInterval: 0, // Disable automatic polling
    });
  // Memoize treatment history query params
  const treatmentHistoryQueryParams = useMemo(() => {
    if (!selectedPatient || !physicianId) return null;
    return {
      patientName: selectedPatient.patientName || "",
      dob: selectedPatient.dob,
      claimNumber: selectedPatient.claimNumber,
      physicianId: physicianId,
    };
  }, [
    selectedPatient?.patientName,
    selectedPatient?.dob,
    selectedPatient?.claimNumber,
    physicianId,
  ]);
  const { data: treatmentHistoryData, isLoading: isTreatmentHistoryLoading } =
    useGetTreatmentHistoryQuery(treatmentHistoryQueryParams!, {
      skip: !treatmentHistoryQueryParams,
      refetchOnMountOrArgChange: false,
    });
  const [updateTaskMutation] = useUpdateTaskMutation();
  // Derived state
  const recentPatients = useMemo(() => {
    let list = [...(recentPatientsData || [])];

    // If we have a selected patient, ensure they are in the list without changing position if already present
    if (selectedPatient) {
      const selectedPatientName = selectedPatient.patientName
        ?.toLowerCase()
        .trim();
      const selectedPatientDob = selectedPatient.dob
        ? selectedPatient.dob.toString().split("T")[0]
        : "";
      const selectedPatientClaim = selectedPatient.claimNumber;

      const exists = list.some((p) => {
        const pName = p.patientName?.toLowerCase().trim();
        const pDob = p.dob ? p.dob.toString().split("T")[0] : "";
        const pClaim = p.claimNumber;

        const nameMatch = pName === selectedPatientName;
        const dobMatch = pDob === selectedPatientDob;
        const claimMatch =
          !pClaim ||
          pClaim === "Not specified" ||
          !selectedPatientClaim ||
          selectedPatientClaim === "Not specified" ||
          pClaim === selectedPatientClaim;

        return nameMatch && dobMatch && claimMatch;
      });

      if (!exists) {
        // Only prepend if they don't exist at all in the list
        list = [selectedPatient, ...list];
      }
    }
    return list;
  }, [recentPatientsData, selectedPatient]);

  const patientTasks = useMemo(() => {
    return tasksData?.tasks || [];
  }, [tasksData]);
  // taskTotalCount moved below filteredPatientTasks definition
  // Legacy patient quiz is no longer used directly, we rely on patientIntakeUpdate
  const patientQuiz = null;
  const patientIntakeUpdate = intakeUpdateData?.success
    ? intakeUpdateData.data
    : null;
  const loading = isPatientsLoading;
  const loadingPatientDataState = isTasksLoading || isIntakeUpdateLoading;
  // Task status and assignee management
  const [taskStatuses, setTaskStatuses] = useState<{
    [taskId: string]: string;
  }>({});
  const [taskAssignees, setTaskAssignees] = useState<{
    [taskId: string]: string;
  }>({});
  const [reassignConfirmData, setReassignConfirmData] = useState<{
    isOpen: boolean;
    taskId: string;
    currentAssignee: string;
    newAssignee: string;
  } | null>(null);
  const [bulkReassignConfirmData, setBulkReassignConfirmData] = useState<{
    isOpen: boolean;
    taskIds: string[];
    newAssignee: string;
    conflictingDetails: { taskId: string; currentAssignee: string }[];
  } | null>(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  // Filter tasks for Staff role
  const filteredPatientTasks = useMemo(() => {
    if (session?.user?.role?.toLowerCase() !== "staff") {
      return patientTasks;
    }
    return patientTasks.filter((task: any) => {
      const currentAssignee = taskAssignees[task.id] || task.assignee;

      if (!currentAssignee) return false;

      const assigneeLower = currentAssignee.toLowerCase();
      const userNameLower = session?.user?.name?.toLowerCase() || "";
      const userEmailLower = session?.user?.email?.toLowerCase() || "";

      return (
        assigneeLower === userNameLower ||
        (userNameLower && userNameLower.includes(assigneeLower)) ||
        (assigneeLower && assigneeLower.includes(userNameLower)) ||
        assigneeLower === userEmailLower
      );
    });
  }, [
    patientTasks,
    taskAssignees,
    session?.user?.role,
    session?.user?.name,
    session?.user?.email,
  ]);
  const taskTotalCount = useMemo(() => {
    if (isStaff) {
      return filteredPatientTasks.length;
    }
    return tasksData?.totalCount || 0;
  }, [isStaff, filteredPatientTasks.length, tasksData?.totalCount]);
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
    paymentError,
    ignoredFiles,
    uploadError,
    clearPaymentError,
    clearUploadError,
    submitFiles, // Directly expose submitFiles for popup upload
  } = useFileUpload(initialMode);
  // Initialize task statuses and assignees
  useEffect(() => {
    const { updatedStatuses, updatedAssignees } =
      initializeTaskStatuses(patientTasks);
    setTaskStatuses(updatedStatuses);
    setTaskAssignees(updatedAssignees);
  }, [patientTasks]);
  // Memoized callbacks and memos
  const handleSelectPatient = useCallback(
    (patient: RecentPatient) => {
      setSelectedPatient(patient);
      setTaskSearchQuery(""); // Reset search when patient changes
      // Update URL search params
      const params = new URLSearchParams(searchParams.toString());
      if (patient.patientName) {
        params.set("patient_name", patient.patientName);
      } else {
        params.delete("patient_name");
      }
      if (patient.dob) {
        // Normalize DOB to YYYY-MM-DD format (strip time component)
        let dobStr = patient.dob;
        if (dobStr.includes("T")) {
          dobStr = dobStr.split("T")[0];
        }
        params.set("dob", dobStr);
      } else {
        params.delete("dob");
      }
      if (patient.claimNumber && patient.claimNumber !== "Not specified") {
        params.set("claim", patient.claimNumber);
      } else {
        params.delete("claim");
      }
      router.push(`?${params.toString()}`, { scroll: false });

      // Reset pagination when patient changes
      setTaskPage(1);
    },
    [router, searchParams],
  );

  // Reset pagination when patient changes
  useEffect(() => {
    setTaskPage(1);
  }, [
    selectedPatient?.patientName,
    selectedPatient?.dob,
    selectedPatient?.claimNumber,
  ]);
  const handleStatusChipClick = useCallback(
    async (taskId: string, status: string) => {
      try {
        await updateTaskMutation({ taskId, status }).unwrap();
      } catch (error) {
        console.error("Failed to update status:", error);
        toast.error("Failed to update task status");
      }
    },
    [updateTaskMutation],
  );
  const handleAssigneeChipClick = useCallback(
    async (taskId: string, assignee: string) => {
      try {
        await updateTaskMutation({ taskId, assignee }).unwrap();
      } catch (error) {
        console.error("Failed to update assignee:", error);
        toast.error("Failed to update task assignee");
      }
    },
    [updateTaskMutation],
  );
  const handleConfirmReassign = useCallback(async () => {
    if (!reassignConfirmData) return;
    const { taskId, newAssignee } = reassignConfirmData;

    setReassignLoading(true);
    try {
      await updateTaskMutation({ taskId, assignee: newAssignee }).unwrap();
      toast.success(`Task reassigned to ${newAssignee}`);
      setReassignConfirmData(null);
    } catch (error) {
      console.error("Reassign error:", error);
      toast.error("An error occurred while reassigning");
    } finally {
      setReassignLoading(false);
    }
  }, [reassignConfirmData, updateTaskMutation]);
  const handleCancelReassign = useCallback(() => {
    setReassignConfirmData(null);
  }, []);
  const handleBulkAssign = useCallback(
    async (taskIds: string[], assignee: string) => {
      // Filter out tasks that are ALREADY assigned to the target assignee
      const tasksToAssign = taskIds.filter((taskId) => {
        const task = patientTasks.find((t: Task) => t.id === taskId);
        const currentAssignee =
          taskAssignees[taskId] || task?.assignee || "Unclaimed";
        return currentAssignee !== assignee;
      });
      if (tasksToAssign.length === 0) {
        toast.info(`Selected tasks are already assigned to ${assignee}`);
        return;
      }
      // Check for conflicting assignments (assigned to someone else)
      const conflictingDetails: { taskId: string; currentAssignee: string }[] =
        [];

      tasksToAssign.forEach((taskId) => {
        const task = patientTasks.find((t: Task) => t.id === taskId);
        const currentAssignee =
          taskAssignees[taskId] || task?.assignee || "Unclaimed";

        if (currentAssignee !== "Unclaimed" && currentAssignee !== assignee) {
          conflictingDetails.push({ taskId, currentAssignee });
        }
      });
      if (conflictingDetails.length > 0) {
        setBulkReassignConfirmData({
          isOpen: true,
          taskIds: tasksToAssign, // Only reassign the ones that need it
          newAssignee: assignee,
          conflictingDetails,
        });
        return;
      }
      // If no conflicts, proceed with assignment
      try {
        await Promise.all(
          tasksToAssign.map((taskId) =>
            updateTaskMutation({ taskId, assignee }).unwrap(),
          ),
        );
        toast.success(`Assigned ${tasksToAssign.length} tasks to ${assignee}`);
      } catch (error) {
        console.error("Bulk assign error:", error);
        toast.error("Failed to assign some tasks");
      }
    },
    [patientTasks, taskAssignees, updateTaskMutation],
  );
  const handleConfirmBulkReassign = useCallback(async () => {
    if (!bulkReassignConfirmData) return;
    const { taskIds, newAssignee } = bulkReassignConfirmData;

    setReassignLoading(true);
    try {
      await Promise.all(
        taskIds.map((taskId) =>
          updateTaskMutation({ taskId, assignee: newAssignee }).unwrap(),
        ),
      );
      toast.success(`Reassigned ${taskIds.length} tasks to ${newAssignee}`);
      setBulkReassignConfirmData(null);
    } catch (error) {
      console.error("Bulk reassign error:", error);
      toast.error("Failed to reassign some tasks");
    } finally {
      setReassignLoading(false);
    }
  }, [bulkReassignConfirmData, updateTaskMutation]);
  const handleCancelBulkReassign = useCallback(() => {
    setBulkReassignConfirmData(null);
  }, []);
  const getStatusOptions = useCallback(
    (task: Task): string[] => getStatusOptionsUtil(task),
    [],
  );
  const getAssigneeOptions = useCallback(
    (task: Task): string[] => getAssigneeOptionsUtil(task),
    [],
  );
  const taskStats: TaskStats = useMemo(
    () => calculateTaskStats(filteredPatientTasks),
    [filteredPatientTasks],
  );
  const questionnaireChips = useMemo(
    () => getQuestionnaireChipsUtil(patientIntakeUpdate, patientQuiz),
    [patientIntakeUpdate, patientQuiz],
  );
  const departments = useMemo(() => DEPARTMENTS, []);
  const totalPages = useMemo(
    () => Math.ceil(taskTotalCount / taskPageSize),
    [taskTotalCount, taskPageSize],
  );
  const hasNextPage = useMemo(
    () => taskPage < totalPages,
    [taskPage, totalPages],
  );
  const hasPrevPage = useMemo(() => taskPage > 1, [taskPage]);
  const displayedTasks = useMemo(() => {
    if (isStaff) {
      const start = (taskPage - 1) * taskPageSize;
      const end = start + taskPageSize;
      return filteredPatientTasks.slice(start, end);
    }
    return filteredPatientTasks;
  }, [filteredPatientTasks, isStaff, taskPage, taskPageSize]);
  // Initialize selected patient from URL or first patient
  useEffect(() => {
    if (recentPatientsData && !isPatientsLoading) {
      // Priority 1: If we just finished an upload, always pick the newest patient
      if (isRefreshingAfterUpload && recentPatientsData.length > 0) {
        setIsRefreshingAfterUpload(false);
        handleSelectPatient(recentPatientsData[0]);
        return;
      }

      const patientNameFromUrl = searchParams.get("patient_name");
      const dobFromUrl = searchParams.get("dob");
      const claimFromUrl = searchParams.get("claim");

      if (patientNameFromUrl) {
        // Try to find the patient in the recent list
        const urlPatient = recentPatientsData.find((p: RecentPatient) => {
          const nameMatch =
            p.patientName.toLowerCase() === patientNameFromUrl.toLowerCase();
          const dobMatch = !dobFromUrl || p.dob === dobFromUrl;
          const claimMatch = !claimFromUrl || p.claimNumber === claimFromUrl;
          return nameMatch && dobMatch && claimMatch;
        });

        if (urlPatient) {
          setSelectedPatient(urlPatient);
          return;
        }

        // If not found in list but we have parameters, create a "virtual" patient
        // to show their data in the dashboard
        if (
          !selectedPatient ||
          selectedPatient.patientName !== patientNameFromUrl
        ) {
          setSelectedPatient({
            patientName: patientNameFromUrl,
            dob: dobFromUrl || "",
            claimNumber: claimFromUrl || "Not specified",
            documentIds: [],
          } as any);
          return;
        }
      }

      // Priority 3: Default to first patient if no selection and no URL
      if (
        !selectedPatient &&
        !patientNameFromUrl &&
        recentPatientsData.length > 0
      ) {
        handleSelectPatient(recentPatientsData[0]);
      }
    }
  }, [
    recentPatientsData,
    isPatientsLoading,
    searchParams,
    selectedPatient,
    isRefreshingAfterUpload,
    handleSelectPatient,
  ]);
  // Function to refresh all data using tag invalidation
  const refreshAllData = useCallback(() => {
    dispatch(dashboardApi.util.invalidateTags(["Tasks", "Patients"]));
    dispatch(staffApi.util.invalidateTags(["FailedDocuments", "Intakes"]));
    dispatch(pythonApi.util.invalidateTags(["PythonTasks" as any]));
  }, [dispatch]);
  // Close all modals when upload errors occur
  useEffect(() => {
    if (paymentError || ignoredFiles?.length > 0 || uploadError) {
      setShowModal(false);
      setShowTaskModal(false);
      setShowQuickNoteModal(false);
      setShowDocumentSuccessPopup(false);
      setIsUpdateModalOpen(false);
      setShowFilePopup(false); // Also close file popup on errors
    }
  }, [paymentError, ignoredFiles, uploadError]);
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
  const formatDOB = useCallback((dob: string) => formatDOBUtil(dob), []);
  const formatClaimNumber = useCallback(
    (claim: string) => formatClaimNumberUtil(claim),
    [],
  );
  // Handle manual task submit
  const handleManualTaskSubmit = useCallback(
    async (formData: any) => {
      try {
        if (selectedPatient) {
          if (!formData.patientName)
            formData.patientName = selectedPatient.patientName;
          if (
            !formData.claim &&
            selectedPatient.claimNumber &&
            selectedPatient.claimNumber !== "Not specified"
          ) {
            formData.claim = selectedPatient.claimNumber;
          }
          if (
            !formData.documentId &&
            selectedPatient.documentIds &&
            selectedPatient.documentIds.length > 0
          ) {
            formData.documentId = selectedPatient.documentIds[0];
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
          selectedPatient?.claimNumber || "",
        );
        // Refetch tasks after manual task creation
        refetchTasks();
      } catch (error) {
        console.error("Error creating manual task:", error);
        throw error;
      }
    },
    [selectedPatient, handleCreateManualTask, initialMode, refetchTasks],
  );
  const handleTaskClick = (task: Task) => {
    setSelectedTaskForQuickNote(task);
    setShowQuickNoteModal(true);
  };
  const handleSaveQuickNote = async (
    taskId: string,
    quickNotes: {
      status_update: string;
      details: string;
      one_line_note: string;
    },
    status?: string,
  ) => {
    try {
      const payload: any = {
        taskId,
        quickNotes: {
          ...quickNotes,
          timestamp: new Date().toISOString(),
        },
      };
      if (status) {
        payload.status = status;
      }
      await updateTaskMutation(payload).unwrap();
    } catch (error) {
      console.error("Error saving quick note:", error);
      throw error;
    }
  };
  // Data refresh function for progress manager
  const handleRefreshData = useCallback(() => {
    setIsRefreshingAfterUpload(true);
    refreshAllData();
  }, [refreshAllData]);
  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);
  const dashboardHref = useMemo(() => {
    if (selectedPatient && selectedPatient.patientName) {
      const params = new URLSearchParams();
      // Only set patient_name if it has a value
      params.set("patient_name", selectedPatient.patientName);
      if (selectedPatient.dob) {
        // Normalize DOB to YYYY-MM-DD format (strip time component and handle timezone)
        let dobStr = selectedPatient.dob;
        if (dobStr.includes("T")) {
          // If it's an ISO datetime, extract just the date part
          dobStr = dobStr.split("T")[0];
        }
        params.set("dob", dobStr);
      }
      if (
        selectedPatient.claimNumber &&
        selectedPatient.claimNumber !== "Not specified"
      ) {
        params.set("claim", selectedPatient.claimNumber);
      }
      return `/dashboard?${params.toString()}`;
    }
    return "/dashboard";
  }, [selectedPatient]);

  // Function to trigger refresh manually using tag invalidation
  const triggerRefresh = useCallback(() => {
    // Invalidate all relevant tags to trigger automatic refetching
    dispatch(dashboardApi.util.invalidateTags(["Tasks", "Patients"]));
    dispatch(staffApi.util.invalidateTags(["FailedDocuments", "Intakes"]));
    dispatch(pythonApi.util.invalidateTags(["PythonTasks" as any]));

    // Hook clears its own errors
    // Close modals
    setShowModal(false);
    setShowTaskModal(false);
    setShowQuickNoteModal(false);
    setShowDocumentSuccessPopup(false);
    setIsUpdateModalOpen(false);
  }, [dispatch, setIsUpdateModalOpen]);
  // File upload handlers with popup review step
  const validateFileSize = useCallback((file: File): boolean => {
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes
    return file.size <= maxSize;
  }, []);
  const handleFileUpload = useCallback(async () => {
    // Final check for oversized files before upload
    const oversizedFiles = pendingFiles.filter(
      (file) => !validateFileSize(file),
    );
    if (oversizedFiles.length > 0) {
      toast.error("File size limit exceeded", {
        description: `The following files exceed 30MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
        duration: 4000,
        position: "top-center",
      });
      return;
    }
    setShowUploadToast(true);
    setShowFilePopup(false);
    await submitFiles(pendingFiles); // Directly call hook's submitFiles for API upload
    setFileDetailsPopup([]);
    setPendingFiles([]);
  }, [pendingFiles, submitFiles, validateFileSize]);
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
  return (
    <>
      <ProgressTracker />
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
          --font:
            ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
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
        {/* <Sidebar /> */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <StaffDashboardHeader
            onCreateIntakeLink={() => setShowModal(true)}
            onAddTask={() => setShowTaskModal(true)}
            onUploadDocument={() => snapInputRef.current?.click()} // Triggers file selection
            userRole={session?.user?.role}
            dashboardHref={dashboardHref}
          />
          {/* Hidden file input—collects files and shows popup for review */}
          <input
            type="file"
            ref={snapInputRef}
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const filesArray = Array.from(e.target.files);
                if (filesArray.length > 5) {
                  toast.error("Maximum 5 documents allowed at once", {
                    duration: 4000,
                    position: "top-center",
                  });
                  if (snapInputRef.current) snapInputRef.current.value = "";
                  return;
                }
                // Check for oversized files
                const oversizedFiles = filesArray.filter(
                  (file) => !validateFileSize(file),
                );
                if (oversizedFiles.length > 0) {
                  toast.error("File size limit exceeded", {
                    description: `The following files exceed 30MB: ${oversizedFiles.map((f) => f.name).join(", ")}`,
                    duration: 4000,
                    position: "top-center",
                  });
                  if (snapInputRef.current) snapInputRef.current.value = "";
                  return;
                }
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
            showFilePopup={showFilePopup}
            fileDetailsPopup={fileDetailsPopup}
            pendingFiles={pendingFiles}
            uploading={uploading}
            isProcessing={isProcessing}
            onClose={handleCloseFilePopup}
            onUpload={handleFileUpload}
            onCancelFile={handleCancelFile}
            validateFileSize={validateFileSize}
          />
          <main className="p-4 mx-auto w-full grid grid-cols-[auto_1fr] gap-4 box-border h-[calc(100vh-50px)] overflow-hidden flex-1 max-md:grid-cols-1">
            <PatientDrawer
              patients={recentPatients}
              selectedPatient={selectedPatient}
              loading={loading}
              collapsed={patientDrawerCollapsed}
              onToggle={() =>
                setPatientDrawerCollapsed(!patientDrawerCollapsed)
              }
              onSelectPatient={handleSelectPatient}
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
                viewMode={viewMode}
                taskStatuses={taskStatuses}
                taskAssignees={taskAssignees}
                failedDocuments={
                  Array.isArray(failedDocuments) ? failedDocuments : []
                }
                loadingPatientData={loadingPatientDataState}
                patientIntakeUpdate={patientIntakeUpdate}
                patientQuiz={patientQuiz}
                taskStats={taskStats}
                questionnaireChips={questionnaireChips}
                physicianId={physicianId}
                getStatusOptions={getStatusOptions}
                getAssigneeOptions={getAssigneeOptions}
                formatDOB={formatDOB}
                formatClaimNumber={formatClaimNumber}
                onViewModeChange={setViewMode}
                onTaskPageChange={setTaskPage}
                onStatusClick={handleStatusChipClick}
                onAssigneeClick={handleAssigneeChipClick}
                onBulkAssign={handleBulkAssign}
                onTaskClick={handleTaskClick}
                onSaveQuickNote={handleSaveQuickNote}
                onFailedDocumentDeleted={removeFailedDocument}
                onFailedDocumentRowClick={handleRowClick}
                userRole={session?.user?.role}
                treatmentHistoryData={treatmentHistoryData?.data}
                isTreatmentHistoryLoading={isTreatmentHistoryLoading}
                onSearch={setTaskSearchQuery}
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
        paymentError={paymentError} // Pass from hook
        ignoredFiles={ignoredFiles} // Pass from hook
        uploadError={uploadError} // Pass from hook
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
        onCloseDocumentSuccessPopup={triggerRefresh}
        onClearPaymentError={clearPaymentError} // From hook
        onClearUploadError={clearUploadError} // From hook
        onUpgrade={handleUpgrade}
        onManualTaskSubmit={handleManualTaskSubmit}
        onSaveQuickNote={handleSaveQuickNote}
        onCloseUpdateModal={() => setIsUpdateModalOpen(false)}
        onUpdateInputChange={(field: string, value: string) => {
          const syntheticEvent = {
            target: { name: field, value },
          } as React.ChangeEvent<HTMLInputElement>;
          handleUpdateInputChange(syntheticEvent);
        }}
        onUpdateSubmit={handleUpdateSubmit}
        reassignConfirmData={reassignConfirmData}
        onConfirmReassign={handleConfirmReassign}
        onCancelReassign={handleCancelReassign}
        bulkReassignConfirmData={bulkReassignConfirmData}
        onConfirmBulkReassign={handleConfirmBulkReassign}
        onCancelBulkReassign={handleCancelBulkReassign}
        onBulkAssign={handleBulkAssign}
        reassignLoading={reassignLoading}
        onAssignTask={handleAssigneeChipClick}
      />
      {showUploadToast && <UploadToast />}
      {/* {pageLoading && <LoadingSpinner />} */}
    </>
  );
}
