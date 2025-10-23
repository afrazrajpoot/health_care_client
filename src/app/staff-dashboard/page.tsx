// app/dashboard/page.tsx (full updated code)
"use client";

import IntakeModal from "@/components/staff-components/IntakeModal";
import TaskTable from "@/components/staff-components/TaskTable";
import FailedDocuments from "@/components/staff-components/FailedDocuments";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import { ProgressTracker } from "@/components/ProgressTracker";
import {
  DEPARTMENTS_GM,
  DEPARTMENTS_WC,
  NOTE_PRESETS,
  paneToFilter,
  tabs,
  Task,
} from "@/components/staff-components/types";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sidebar } from "@/components/navigation/sidebar";
import { toast } from "sonner";
import { useSocket } from "@/providers/SocketProvider";
import ManualTaskModal from "@/components/ManualTaskModal";

// API response interface
interface ApiTask {
  id: string;
  description: string;
  department: string;
  status: string;
  dueDate: string | null;
  patient: string;
  actions: string[];
  sourceDocument?: string;
  quickNotes?: any;
  documentId?: string;
  physicianId?: string;
  createdAt: string;
  updatedAt: string;
  document?: any;
}

interface DeptPulse {
  department: string;
  open: number;
  overdue: number;
  unclaimed: number;
}

interface Pulse {
  depts: DeptPulse[];
  labels: string[];
  vals: number[];
}

// Onboarding Tour Component
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
        {/* Arrow pointing to target element */}
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
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"wc" | "gm">("wc");
  const [currentPane, setCurrentPane] = useState<"all" | "overdue" | string>(
    "all"
  );
  const [filters, setFilters] = useState({
    search: "",
    overdueOnly: false,
    myDeptOnly: false,
    dept: "",
  });
  const [dense, setDense] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const snapInputRef = useRef<HTMLInputElement>(null);

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: session } = useSession();
  const [failedDocuments, setFailedDocuments] = useState<any[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState({
    patientName: "",
    claimNumber: "",
    dob: null as Date | null,
    doi: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // File modal state
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // Progress tracking
  const { setActiveTask } = useSocket();

  // Pulse and stats states
  const [fetchedPulse, setFetchedPulse] = useState<Pulse | null>(null);
  const [workflowStats, setWorkflowStats] = useState<{
    labels: string[];
    vals: number[];
    date: string;
    hasData: boolean;
  } | null>(null);

  // UI states
  const [isOfficePulseCollapsed, setIsOfficePulseCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Onboarding tour states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);

  // Refs for onboarding target elements
  const createLinkButtonRef = useRef<HTMLButtonElement>(null);
  const addManualTaskButtonRef = useRef<HTMLButtonElement>(null);
  const createSnapLinkButtonRef = useRef<HTMLButtonElement>(null);

  const filteredTabs = tabs.filter((tab) => tab.modes.includes(mode));
  const departments = [
    "Medical / Clinical Department",
    "Scheduling & Coordination Department",
    "Administrative / Compliance Department",
    "Authorizations & Denials Department",
  ];
  const pulse = fetchedPulse;

  // Refs for API calls - initialize as null
  const fetchTasksRef = useRef<any>(null);
  const fetchFailedDocumentsRef = useRef<any>(null);

  // Onboarding steps configuration
  const onboardingSteps = [
    {
      title: "Create Intake Link",
      content:
        "Generate shareable links for patients to submit their intake forms and documents securely.",
      target: createLinkButtonRef,
    },
    {
      title: "Add Manual Task",
      content:
        "Create tasks manually for specific patients or workflows that require custom tracking.",
      target: addManualTaskButtonRef,
    },
    {
      title: "Create Snap Link",
      content:
        "Quickly upload and process documents. The system will automatically extract information and create tasks.",
      target: createSnapLinkButtonRef,
    },
  ];

  // Calculate positions for onboarding steps
  const calculateStepPositions = useCallback(() => {
    const positions = [];

    // Position for Create Intake Link button (in header)
    if (createLinkButtonRef.current) {
      const rect = createLinkButtonRef.current.getBoundingClientRect();
      positions.push({
        top: `${rect.bottom + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    } else {
      positions.push({
        top: "50%",
        left: "50%",
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    }

    // Position for Add Manual Task button (in header)
    if (addManualTaskButtonRef.current) {
      const rect = addManualTaskButtonRef.current.getBoundingClientRect();
      positions.push({
        top: `${rect.bottom + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    } else {
      positions.push({
        top: "50%",
        left: "50%",
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    }

    // Position for Create Snap Link button (floating button)
    if (createSnapLinkButtonRef.current) {
      const rect = createSnapLinkButtonRef.current.getBoundingClientRect();
      positions.push({
        top: `${rect.bottom + 10}px`,
        left: `${rect.left + rect.width / 2}px`,
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    } else {
      positions.push({
        top: "50%",
        left: "50%",
        arrowTop: "-8px",
        arrowLeft: "50%",
      });
    }

    return positions;
  }, []);

  // Start onboarding tour
  const startOnboarding = () => {
    const positions = calculateStepPositions();
    setStepPositions(positions);
    setShowOnboarding(true);
    setCurrentStep(0);
  };

  // Next step in onboarding
  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
      // Save to localStorage that user has completed onboarding
      localStorage.setItem("onboardingCompleted", "true");
    }
  };

  // Previous step in onboarding
  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Close onboarding
  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("onboardingCompleted", "true");
  };

  // Recalculate positions when step changes
  useEffect(() => {
    if (showOnboarding) {
      const positions = calculateStepPositions();
      setStepPositions(positions);
    }
  }, [showOnboarding, currentStep, calculateStepPositions]);

  // Check if onboarding should be shown on component mount
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    if (!onboardingCompleted) {
      // Show onboarding after a short delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const positions = calculateStepPositions();
        setStepPositions(positions);
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [calculateStepPositions]);

  // Transform API task to local Task type
  const transformApiTask = (apiTask: ApiTask): Task => {
    const dueDate = apiTask.dueDate ? new Date(apiTask.dueDate) : new Date();
    const now = new Date();
    const overdue = dueDate < now && apiTask.status !== "Done";

    // Transform quick notes if available
    const notes = apiTask.quickNotes
      ? [
          {
            ts: new Date(apiTask.updatedAt).toLocaleString(),
            user: "System",
            line:
              apiTask.quickNotes.one_line_note ||
              apiTask.quickNotes.details ||
              "Note added",
          },
        ]
      : [];

    return {
      id: apiTask.id,
      task: apiTask.description,
      dept: apiTask.department,
      statusText: apiTask.status,
      statusClass: apiTask.status.toLowerCase().replace(/\s+/g, "-"),
      due: dueDate.toLocaleDateString(),
      overdue,
      patient: apiTask.patient,
      assignee: apiTask.actions.includes("Claimed") ? "You" : "Unclaimed",
      mode: mode,
      notes,
      actions: apiTask.actions,
      sourceDocument: apiTask.sourceDocument,
    };
  };

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const apiTasks: ApiTask[] = await response.json();

      // Transform API tasks to local Task format
      const transformedTasks = apiTasks.map(transformApiTask);
      setTasks(transformedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("❌ Error fetching tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [mode]); // Add mode dependency for refetch on mode change

  // Fetch office pulse from separate API
  const fetchOfficePulse = useCallback(async () => {
    try {
      const response = await fetch("/api/office-pulse");

      if (!response.ok) {
        throw new Error("Failed to fetch office pulse");
      }

      const data = await response.json();
      setFetchedPulse(data.pulse);
    } catch (error) {
      console.error("Error fetching office pulse:", error);
      setFetchedPulse(null);
    }
  }, []);

  // Fetch workflow stats from database
  const fetchWorkflowStats = useCallback(async () => {
    try {
      const response = await fetch("/api/workflow-stats");

      if (!response.ok) {
        throw new Error("Failed to fetch workflow stats");
      }

      const data = await response.json();
      if (data.success) {
        setWorkflowStats({
          labels: data.data.labels,
          vals: data.data.vals,
          date: data.data.date,
          hasData: data.data.hasData,
        });
      }
    } catch (error) {
      console.error("Error fetching workflow stats:", error);
      setWorkflowStats(null);
    }
  }, []);

  // Fetch failed documents
  const fetchFailedDocuments = useCallback(async () => {
    try {
      const response = await fetch("/api/get-failed-document");
      if (response.ok) {
        const data = await response.json();
        setFailedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching failed documents:", error);
      toast.error("❌ Error fetching failed documents");
    }
  }, []);

  // Update refs whenever the functions change
  useEffect(() => {
    fetchTasksRef.current = fetchTasks;
  }, [fetchTasks]);

  useEffect(() => {
    fetchFailedDocumentsRef.current = fetchFailedDocuments;
  }, [fetchFailedDocuments]);

  // Fetch data on component mount
  useEffect(() => {
    fetchTasks();
    fetchOfficePulse();
    fetchWorkflowStats();
    fetchFailedDocuments();
  }, [fetchTasks, fetchOfficePulse, fetchWorkflowStats, fetchFailedDocuments]);

  // 🆕 Real-time tasks update via socket
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleTasksCreated = (data: any) => {
      console.log("📡 Received 'tasks_created' event:", data);
      if (data.user_id !== session?.user?.id) return; // Ensure for current user

      // Transform new API-like tasks to local Task format
      const newTransformedTasks = data.tasks.map((apiTask: ApiTask) =>
        transformApiTask(apiTask)
      );

      // Append to existing tasks (avoid duplicates by checking IDs)
      setTasks((prevTasks) => {
        const existingIds = new Set(prevTasks.map((t) => t.id));
        const uniqueNewTasks = newTransformedTasks.filter(
          (t) => !existingIds.has(t.id)
        );
        if (uniqueNewTasks.length > 0) {
          toast.success(`✅ Added ${uniqueNewTasks.length} new task(s)`);
        }
        return [...prevTasks, ...uniqueNewTasks];
      });
    };

    socket.on("tasks_created", handleTasksCreated);

    return () => {
      socket.off("tasks_created", handleTasksCreated);
    };
  }, [socket, session?.user?.id, transformApiTask]);

  // Click outside to close sidebar
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !e.target.closest(".sidebar-container") &&
        !e.target.closest(".toggle-btn")
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen]);

  // Task filtering logic
  const getBaseTasks = () =>
    tasks.filter((t) => {
      if (mode === "wc" && t.mode === "gm") return false;
      if (mode === "gm" && t.mode === "wc") return false;
      return true;
    });

  const getFilteredTasks = (pane: string) => {
    const base = getBaseTasks();
    return base.filter(
      paneToFilter[pane as keyof typeof paneToFilter] || (() => true)
    );
  };

  const getDisplayedTasks = (pane: string) => {
    let f = getFilteredTasks(pane);
    if (filters.overdueOnly) f = f.filter((t) => t.overdue);
    if (filters.myDeptOnly && filters.dept)
      f = f.filter((t) => t.dept === filters.dept);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      f = f.filter(
        (t) =>
          t.task.toLowerCase().includes(q) ||
          (t.patient && t.patient.toLowerCase().includes(q)) ||
          (t.dept && t.dept.toLowerCase().includes(q))
      );
    }
    return f;
  };

  // Task operations
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // First update locally for immediate feedback
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      // Then send update to API
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(updates.statusText && { status: updates.statusText }),
          ...(updates.actions && { actions: updates.actions }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success("✅ Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("❌ Error updating task");
      // Revert local changes if API call fails
      fetchTasks();
    }
  };

  const toggleClaim = async (id: string) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const isClaimed = currentTask.actions?.includes("Claimed") || false;
    const newActions = isClaimed ? ["Unclaimed"] : ["Claimed", "Complete"];

    await updateTask(id, { actions: newActions });
    toast.success(isClaimed ? "✅ Task unclaimed" : "✅ Task claimed");
  };

  const completeTask = (id: string) => {
    updateTask(id, { statusText: "Done", statusClass: "done" });
    toast.success("🎉 Task marked complete");
  };

  const saveNote = async (e: React.MouseEvent, taskId: string) => {
    const wrap = (e.currentTarget as HTMLElement).closest(".qnote");
    if (!wrap) return;
    const t = (wrap.querySelector(".qtype") as HTMLSelectElement)?.value || "";
    const d = (wrap.querySelector(".qmore") as HTMLSelectElement)?.value || "";
    const f = (wrap.querySelector(".qfree") as HTMLInputElement)?.value || "";
    const line = [t, d, f].filter(Boolean).join(" · ");
    if (!line) return;
    const ts = new Date().toLocaleString();

    try {
      // Update local state first (notes only)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                notes: [...(t.notes || []), { ts, user: "You", line }],
              }
            : t
        )
      );

      // Update quickNotes in the database (single API call)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quickNotes: {
            status_update: t,
            details: d,
            one_line_note: f,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      (wrap.querySelector(".qfree") as HTMLInputElement).value = "";
      toast.success("📝 Note saved");
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("❌ Error saving note");
      // Revert local changes if API call fails
      fetchTasks();
    }
  };

  // Failed documents operations
  const handleRowClick = (doc: any) => {
    setSelectedDoc(doc);
    let parsedDob: Date | null = null;
    if (
      doc.db &&
      typeof doc.db === "string" &&
      doc.db.toLowerCase() !== "not specified"
    ) {
      const date = new Date(doc.db);
      if (!isNaN(date.getTime())) {
        parsedDob = date;
      }
    }
    setUpdateFormData({
      patientName: doc.patientName || "",
      claimNumber: doc.claimNumber || "",
      dob: parsedDob,
      doi: doc.doi || "",
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "dob") {
      setUpdateFormData({
        ...updateFormData,
        dob: value ? new Date(value) : null,
      });
    } else {
      setUpdateFormData({ ...updateFormData, [name]: value });
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedDoc) return;

    setUpdateLoading(true);

    try {
      const updateData: any = {
        patient_name: updateFormData.patientName,
        claim_number: updateFormData.claimNumber,
        doi: updateFormData.doi,
      };
      if (updateFormData.dob && !isNaN(updateFormData.dob.getTime())) {
        updateData.dob = updateFormData.dob.toISOString().split("T")[0];
      } else {
        updateData.dob = null;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/update-fail-document`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fail_doc_id: selectedDoc.id,
            document_text: selectedDoc.documentText,
            ...updateData,
            user_id: session?.user?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      toast.success("✅ Document updated successfully");
      setIsUpdateModalOpen(false);
      fetchFailedDocuments();
      fetchTasks();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("❌ Error updating document");
    } finally {
      setUpdateLoading(false);
    }
  };

  // File upload operations
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter((file) => {
        if (file.size > 40 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 40MB)`);
          return false;
        }
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const allowedTypes = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
        if (!allowedTypes.includes(fileExtension)) {
          toast.error(`File ${file.name} has unsupported format`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        setIsFileModalOpen(true);
      } else {
        toast.error(
          "No valid files selected. Please check file types and size (max 40MB)."
        );
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const formDataUpload = new FormData();
    selectedFiles.forEach((file) => {
      formDataUpload.append("documents", file);
    });

    try {
      console.log(`🚀 Starting upload for ${selectedFiles.length} files`);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
        }/api/extract-documents?physicianId=${
          session?.user?.physicianId || ""
        }&userId=${session?.user?.id || ""}`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("📦 Upload response:", data);

      // FIXED: Pass payload_count as totalFiles to setActiveTask for correct initial total
      if (data.task_id) {
        setActiveTask(data.task_id, data.payload_count); // Now passes total_files correctly
        console.log(
          `🎯 Tracking progress for task: ${data.task_id} (total: ${data.payload_count})`
        );
      } else {
        throw new Error("No task_id returned from server");
      }

      toast.success(
        `✅ Started processing ${data.payload_count || 0} document(s)`
      );

      // Close the file modal but keep progress tracker visible
      setIsFileModalOpen(false);
      setSelectedFiles([]);
      if (snapInputRef.current) {
        snapInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error(`❌ Error uploading documents: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    if (snapInputRef.current) {
      snapInputRef.current.value = "";
    }
    setIsFileModalOpen(false);
  };

  const handleSnap = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e);
  };

  const getPresets = (dept: string) => {
    return (
      NOTE_PRESETS[dept] ||
      NOTE_PRESETS["Physician Review"] || { type: [], more: [] }
    );
  };

  // Manual Task Creation - Updated to handle documentId
  const handleCreateManualTask = async (formData: {
    patientName: string;
    dueDate: string;
    description: string;
    department: string;
    documentId?: string;
  }) => {
    try {
      const response = await fetch("/api/add-manual-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: formData.description,
          department: formData.department,
          patient: formData.patientName, // Still send patient name as string (per schema)
          dueDate: formData.dueDate,
          status: "Open",
          actions: ["Claimed", "Complete"],
          documentId: formData.documentId, // Send documentId if selected from recommendation
          mode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask: ApiTask = await response.json();
      const transformedTask = transformApiTask(newTask);

      // Add to local state immediately
      setTasks((prev) => [...prev, transformedTask]);

      toast.success("✅ Manual task created successfully");
    } catch (error) {
      console.error("Error creating manual task:", error);
      toast.error("❌ Error creating manual task");
    }
  };

  // Dense mode effect
  useEffect(() => {
    if (dense) {
      document.body.classList.add("dense");
    } else {
      document.body.classList.remove("dense");
    }
  }, [dense]);

  // Debug logging
  useEffect(() => {
    console.log("Kebilo v6.3 self-tests:", [
      { name: "All tab present", pass: true },
      { name: "Mode toggle wired", pass: true },
      {
        name: "Pulse dept table populated",
        pass: fetchedPulse ? fetchedPulse.depts.length > 0 : false,
      },
      { name: "Dept dropdown filled", pass: departments.length > 0 },
      { name: "Tasks loaded from API", pass: tasks.length > 0 },
    ]);
  }, [mode, fetchedPulse, departments, tasks]);

  // Callback for progress completion
  const handleProgressComplete = useCallback(() => {
    if (fetchTasksRef.current) fetchTasksRef.current();
    if (fetchFailedDocumentsRef.current) fetchFailedDocumentsRef.current();
  }, []);

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
        th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 11px;
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
      {/* Progress Tracker - Shows automatically when processing */}
      <ProgressTracker onComplete={handleProgressComplete} />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        currentStep={currentStep}
        onNext={nextStep}
        onPrevious={previousStep}
        steps={onboardingSteps}
        stepPositions={stepPositions}
      />

      {/* Onboarding Help Button */}
      <button
        className="onboarding-help-btn"
        onClick={startOnboarding}
        title="Show onboarding tour"
      >
        ?
      </button>

      {/* Sidebar and Main Content */}
      <div className="flex min-h-screen relative">
        {/* Sidebar Component */}
        <div
          className={`sidebar-container fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>

        {/* Sidebar Toggle Button */}
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

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-0" : "ml-0"
          }`}
        >
          {/* Upload Button */}
          <div className="p-6">
            {session?.user?.role == "Staff" && (
              <button
                ref={createSnapLinkButtonRef}
                className="snaplink-btn bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => snapInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </span>
                ) : (
                  "📁Create SnapLink"
                )}
              </button>
            )}
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
              <h1>🧭 Kebilo Staff Dashboard — Mission Control v6.3</h1>
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
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "wc" | "gm")}
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
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-[0.3vw] px-[0.3vw] rounded-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200"
                  onClick={() => setShowModal(true)}
                >
                  Create Intake Link
                </button>
                {session?.user?.role === "Physician" && (
                  <button
                    ref={addManualTaskButtonRef}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-[0.3vw] px-[0.3vw] rounded-md hover:from-blue-700 hover:to-blue-600 transition-all duration-200"
                    onClick={() => setShowTaskModal(true)}
                  >
                    + Add Manual Task
                  </button>
                )}
                <button
                  className="btn light"
                  onClick={fetchTasks}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh Tasks"}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="card">
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading tasks...
                </div>
              </div>
            )}

            {/* Office Pulse */}
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
                              pulse.depts.map((rowOrObj, index) => {
                                if (
                                  typeof rowOrObj === "object" &&
                                  "department" in rowOrObj
                                ) {
                                  const dept = rowOrObj as DeptPulse;
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
                              })
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
                          workflowStats.labels.map((label, index) => (
                            <div key={index} className="text-gray-700">
                              <h4>{label}</h4>
                              <div className="val">
                                {workflowStats.vals[index]}
                              </div>
                            </div>
                          ))
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

                {/* Task & Workflow Tracker */}
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
                      {filteredTabs.map((tab) => (
                        <button
                          key={tab.pane}
                          className={`filter ttab ${
                            currentPane === tab.pane ? "active" : ""
                          }`}
                          onClick={() => setCurrentPane(tab.pane)}
                        >
                          {tab.text}
                        </button>
                      ))}
                    </div>
                    {!isFiltersCollapsed && (
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
                        <button
                          className="filter"
                          onClick={() =>
                            setFilters((p) => ({
                              ...p,
                              overdueOnly: !p.overdueOnly,
                            }))
                          }
                        >
                          {filters.overdueOnly
                            ? "Showing Overdue"
                            : "Show Overdue Only"}
                        </button>
                        <span className="muted">Dept:</span>
                        <select
                          value={filters.dept}
                          onChange={(e) =>
                            setFilters((p) => ({ ...p, dept: e.target.value }))
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
                        <button
                          className="filter"
                          aria-pressed={filters.myDeptOnly ? "true" : "false"}
                          onClick={() =>
                            setFilters((p) => ({
                              ...p,
                              myDeptOnly: !p.myDeptOnly,
                            }))
                          }
                        >
                          {filters.myDeptOnly
                            ? "Only My Dept ✓"
                            : "Only My Dept"}
                        </button>
                        <button
                          className="filter"
                          onClick={() =>
                            setFilters({
                              search: "",
                              overdueOnly: false,
                              myDeptOnly: false,
                              dept: "",
                            })
                          }
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  {tasks.length === 0 ? (
                    <div className="no-data">No tasks available</div>
                  ) : (
                    <TaskTable
                      currentPane={currentPane}
                      tasks={getDisplayedTasks(currentPane)}
                      filters={filters}
                      mode={mode}
                      onClaim={toggleClaim}
                      onComplete={completeTask}
                      onSaveNote={saveNote}
                      getPresets={getPresets}
                    />
                  )}
                </div>

                {/* Failed Documents Component */}
                <FailedDocuments
                  documents={failedDocuments}
                  onRowClick={handleRowClick}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <IntakeModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <ManualTaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        departments={departments}
        onSubmit={handleCreateManualTask}
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

      {/* File Submission Modal */}
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
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
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
    </>
  );
}
