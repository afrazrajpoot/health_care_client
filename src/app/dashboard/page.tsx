"use client";
import { Sidebar } from "@/components/navigation/sidebar";
import ManualTaskModal from "@/components/ManualTaskModal";
import PhysicianOnboardingTour from "@/components/physician-components/PhysicianOnboardingTour";
import TreatmentHistorySection from "@/components/physician-components/TreatmentHistorySection";
import { WelcomeModal } from "@/components/physician-components/WelcomeModal";
import WhatsNewSection from "@/components/physician-components/WhatsNewSection";
import PatientIntakeUpdate from "@/components/physician-components/PatientIntakeUpdate";
import { PatientHeader } from "@/components/physician-components/PatientHeader";
import { LoadingOverlay } from "@/components/physician-components/LoadingOverlay";
import { RecentPatientsPanel } from "@/components/physician-components/RecentPatientsPanel";
import { StaffStatusSection } from "@/components/physician-components/StaffStatusSection";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { handleEncryptedResponse } from "@/lib/decrypt";
import { usePatientData } from "@/hooks/usePatientData";

// Define TypeScript interfaces for data structures
interface Patient {
  id?: string | number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface DocumentSummary {
  type: string;
  date: string;
  summary: string;
  brief_summary?: string;
  document_id?: string;
}

// Custom hook for toasts
const useToasts = () => {
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return { toasts, addToast };
};

// Custom hook for onboarding
const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const staffButtonRef = useRef<HTMLAnchorElement>(null);
  const modeSelectorRef = useRef<HTMLSelectElement>(null);

  const onboardingSteps = useMemo(
    () => [
      {
        title: "Staff Dashboard",
        content:
          "Switch to the Staff Dashboard to manage tasks, upload documents, and track workflow.",
        target: staffButtonRef,
      },
    ],
    []
  );

  const calculateStepPositions = useCallback(() => {
    const positions = [];
    if (staffButtonRef.current) {
      const rect = staffButtonRef.current.getBoundingClientRect();
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

  const startOnboarding = useCallback(() => {
    const positions = calculateStepPositions();
    setStepPositions(positions);
    setShowOnboarding(true);
    setCurrentStep(0);
  }, [calculateStepPositions]);

  const nextStep = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeout(() => {
        const newPositions = calculateStepPositions();
        setStepPositions(newPositions);
      }, 50);
    } else {
      setShowOnboarding(false);
      localStorage.setItem("physicianOnboardingCompleted", "true");
    }
  }, [currentStep, onboardingSteps.length, calculateStepPositions]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeout(() => {
        const newPositions = calculateStepPositions();
        setStepPositions(newPositions);
      }, 50);
    }
  }, [currentStep, calculateStepPositions]);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("physicianOnboardingCompleted", "true");
  }, []);

  // Check if onboarding should be shown on component mount
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem(
      "physicianOnboardingCompleted"
    );
    const welcomeShown = localStorage.getItem("physicianWelcomeShown");
    if (!welcomeShown) {
      setShowWelcomeModal(true);
      localStorage.setItem("physicianWelcomeShown", "true");
    } else if (!onboardingCompleted) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startOnboarding]);

  // Listen for start onboarding event
  useEffect(() => {
    const handleStartOnboarding = () => {
      startOnboarding();
    };
    window.addEventListener("start-onboarding", handleStartOnboarding);
    return () => {
      window.removeEventListener("start-onboarding", handleStartOnboarding);
    };
  }, [startOnboarding]);

  // Recalculate positions when step changes
  useEffect(() => {
    if (showOnboarding) {
      const positions = calculateStepPositions();
      setStepPositions(positions);
    }
  }, [showOnboarding, currentStep, calculateStepPositions]);

  return {
    showOnboarding,
    currentStep,
    stepPositions,
    showWelcomeModal,
    onboardingSteps,
    staffButtonRef,
    modeSelectorRef,
    nextStep,
    previousStep,
    closeOnboarding,
    startOnboarding,
  };
};

// Custom hook for file upload
const useFileUpload = (addToast: (msg: string, type: "success" | "error") => void, session: any, startTwoPhaseTracking: any) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    try {
      const response = await fetch("/api/extract-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.user?.fastapi_token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        addToast(`Failed to queue files: ${errorText}`, "error");
        return;
      }
      const data = await response.json();
      if (data.upload_task_id && data.task_id) {
        startTwoPhaseTracking(data.upload_task_id, data.task_id);
        addToast(
          `Started processing ${files.length} document(s) with two-phase tracking`,
          "success"
        );
      } else {
        const taskIds = data.task_ids || [];
        files.forEach((file, index) => {
          const taskId = taskIds[index] || "unknown";
          addToast(
            `File "${file.name}" successfully queued for processing. Task ID: ${taskId}`,
            "success"
          );
        });
      }
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      addToast("Network error uploading files", "error");
    }
  }, [files, session, startTwoPhaseTracking, addToast]);

  const resetFiles = useCallback(() => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return { files, fileInputRef, handleFileSelect, handleUpload, resetFiles };
};

// Custom hook for search
const useSearch = (mode: "wc" | "gm") => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const getPhysicianId = useCallback((session: any): string | null => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? (session.user.id as string) || null
      : session.user.physicianId || null;
  }, []);

  const fetchSearchResults = useCallback(
    async (query: string, session: any) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const currentPhysicianId = getPhysicianId(session);
      try {
        setSearchLoading(true);
        const response = await fetch(
          `/api/dashboard/recommendation?patientName=${encodeURIComponent(
            query
          )}&claimNumber=${encodeURIComponent(query)}&dob=${encodeURIComponent(
            query
          )}&physicianId=${encodeURIComponent(
            currentPhysicianId || ""
          )}&mode=${encodeURIComponent(mode)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }
        const data: any = await response.json();
        if (data.success && data.data.allMatchingDocuments) {
          const patients: Patient[] = data.data.allMatchingDocuments.map(
            (doc: any) => ({
              id: doc.id,
              patientName: doc.patientName,
              dob: formatDateToString(doc.dob),
              doi: formatDateToString(doc.doi),
              claimNumber: doc.claimNumber || "Not specified",
            })
          );
          setSearchResults(patients);
        } else {
          setSearchResults([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching search results:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [mode, getPhysicianId]
  );

  const formatDateToString = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string, session: any) => {
      fetchSearchResults(query, session);
    }, 300),
    [fetchSearchResults, debounce]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, session: any) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      debouncedSearch(query, session);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  return { searchQuery, searchResults, searchLoading, handleSearchChange, getPhysicianId };
};

// Burger Icon Component
const BurgerIcon = React.memo(() => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
));

// Onboarding Help Button Component
const OnboardingHelpButton = React.memo(({ onClick }: { onClick: () => void }) => (
  <button
    className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center z-40"
    onClick={onClick}
    title="Show onboarding tour"
  >
    ?
  </button>
));

// Upload Section Component
interface UploadSectionProps {
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
  loading: boolean;
}

const UploadSection = React.memo<UploadSectionProps>(
  ({ files, onFileSelect, onUpload, onCancel, loading }) => (
    <div className="mb-3.5">
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,image/*"
        onChange={onFileSelect}
        className="hidden"
      />
      {files.length > 0 && (
        <div className="inline-flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
          <span className="text-sm text-gray-600">
            Selected: {files.map((f) => f.name).join(", ")}
          </span>
          <button
            onClick={onUpload}
            className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm disabled:opacity-50"
            disabled={loading}
          >
            Queue for Processing
          </button>
          <button
            onClick={onCancel}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
);

// Error Display Component
interface ErrorDisplayProps {
  error: string | null;
  onRetry: () => void;
  selectedPatient: Patient | null;
  fetchDocumentData: (patient: Patient, mode: "wc" | "gm") => void;
  mode: "wc" | "gm";
}

const ErrorDisplay = React.memo<ErrorDisplayProps>(
  ({ error, onRetry, selectedPatient, fetchDocumentData, mode }) => (
    <div className="mb-3.5 p-4 bg-red-50 border border-red-300 rounded-xl">
      <div className="text-red-600 font-semibold mb-2">Error</div>
      <p className="text-red-800">{error}</p>
      <button
        onClick={onRetry}
        className="mt-2 bg-red-500 text-white px-3 py-1.5 rounded-md cursor-pointer"
      >
        Retry
      </button>
    </div>
  )
);

// Header Component
interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  staffDashboardHref: string;
  mode: "wc" | "gm";
  onModeChange: (mode: "wc" | "gm") => void;
  session: any;
  staffButtonRef: React.RefObject<HTMLAnchorElement>;
  modeSelectorRef: React.RefObject<HTMLSelectElement>;
}

const Header = React.memo<HeaderProps>(({
  isSidebarOpen,
  onToggleSidebar,
  staffDashboardHref,
  mode,
  onModeChange,
  session,
  staffButtonRef,
  modeSelectorRef,
}) => (
  <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[1000] px-5 py-3 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-4 relative">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        aria-label="Toggle sidebar"
      >
        <BurgerIcon />
      </button>
      <div className="absolute left-1/2 -translate-x-1/2">
        <img
          src="/logo.png"
          alt="DocLatch Logo"
          className="h-20 max-h-20 w-auto"
        />
      </div>
    </div>
    <div className="flex items-center gap-4">
      {session.user.role === "Physician" && (
        <Link href={staffDashboardHref} ref={staffButtonRef}>
          <button className="font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            Staff Dashboard
          </button>
        </Link>
      )}
      <select
        id="mode"
        className="bg-indigo-50 text-gray-900 border border-blue-200 rounded-lg p-2 font-semibold focus:outline-none"
        value={mode}
        onChange={(e) => onModeChange(e.target.value as "wc" | "gm")}
        ref={modeSelectorRef}
        title="Filter search by mode (Workers Comp or General Medicine)"
      >
        <option value="wc">Workers Comp</option>
        <option value="gm">General Medicine</option>
      </select>
    </div>
  </div>
));

// Toast Container Component
interface ToastContainerProps {
  toasts: { id: number; message: string; type: "success" | "error" }[];
}

const ToastContainer = React.memo<ToastContainerProps>(({ toasts }) => (
  <div className="fixed top-4 right-4 space-y-2 z-50">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`p-4 rounded-lg shadow-lg text-white ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } animate-in slide-in-from-top-2 duration-300`}
      >
        {toast.message}
      </div>
    ))}
  </div>
));

// Main Content Component
interface MainContentProps {
  selectedPatient: Patient | null;
  documentData: any;
  taskQuickNotes: any[];
  visitCount: number;
  formatDate: (date: string | undefined) => string;
  currentPatient: Patient;
  collapsedSections: { [key: string]: boolean };
  copied: { [key: string]: boolean };
  onToggleSection: (key: string) => void;
  onCopySection: (id: string, index?: number) => void;
  mode: "wc" | "gm";
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

const MainContent = React.memo<MainContentProps>(({
  selectedPatient,
  documentData,
  taskQuickNotes,
  visitCount,
  formatDate,
  currentPatient,
  collapsedSections,
  copied,
  onToggleSection,
  onCopySection,
  mode,
  error,
  loading,
  onRetry,
}) => (
  <>
    <LoadingOverlay isLoading={loading} />
    {error && <ErrorDisplay error={error} onRetry={onRetry} selectedPatient={selectedPatient} fetchDocumentData={() => {}} mode={mode} />}
    {selectedPatient && documentData && (
      <PatientHeader
        patient={currentPatient}
        visitCount={visitCount}
        formatDate={formatDate}
      />
    )}
    <div className="grid grid-cols-1 gap-3.5">
      <div>
        {!selectedPatient && !documentData ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">
              Click the Recent Patients button to search and select a patient
            </p>
          </div>
        ) : (
          <>
            {documentData && (
              <StaffStatusSection
                documentQuickNotes={documentData.quick_notes_snapshots || []}
                taskQuickNotes={taskQuickNotes}
              />
            )}
            {documentData && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3.5">
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-200">
                  <div>
                    <div className="font-extrabold text-gray-900">
                      What's New Since Last Visit
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Scan-only cards • Click to expand • Expanded content
                      scrolls inside the card
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {documentData?.documents?.length || 0}{" "}
                    {documentData?.documents?.length === 1 ? "item" : "items"}
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto p-2.5">
                  <div className="mb-3">
                    <PatientIntakeUpdate documentData={documentData} />
                  </div>
                  <WhatsNewSection
                    documentData={documentData}
                    mode={mode}
                    copied={copied}
                    onCopySection={onCopySection}
                    isCollapsed={collapsedSections.whatsNew}
                    onToggle={() => onToggleSection("whatsNew")}
                  />
                </div>
              </div>
            )}
            {documentData && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-3.5 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-200">
                  <div>
                    <div className="font-extrabold text-gray-900">Treatment History</div>
                    <div className="text-xs text-gray-500">Summary snapshots and history</div>
                  </div>
                </div>
                <div className="px-3.5 py-3">
                  <TreatmentHistorySection documentData={documentData} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </>
));

// Brief Summary Modal Component
interface BriefSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefSummary: string;
}

const BriefSummaryModal = React.memo<BriefSummaryModalProps>(({
  isOpen,
  onClose,
  briefSummary,
}) => (
  isOpen && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Brief Summary</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-6">
            {briefSummary}
          </p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
));

// Previous Summary Modal Component
interface PreviousSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBrief: (summary: string) => void;
  previousSummary: DocumentSummary | null;
  formatDate: (date: string | undefined) => string;
}

const PreviousSummaryModal = React.memo<PreviousSummaryModalProps>(({
  isOpen,
  onClose,
  onViewBrief,
  previousSummary,
  formatDate,
}) =>
  isOpen &&
  previousSummary && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
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
            onClick={() => onViewBrief(previousSummary.brief_summary || "")}
            className="mr-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            View Brief
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
);

export default function PhysicianCard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTwoPhaseTracking } = useSocket();

  const [mode, setMode] = useState<"wc" | "gm">("wc");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verifyTime, setVerifyTime] = useState<string>("—");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [showPreviousSummary, setShowPreviousSummary] = useState<boolean>(false);
  const [previousSummary, setPreviousSummary] = useState<DocumentSummary | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentPatientsVisible, setRecentPatientsVisible] = useState(false);
  const [recentPatientsList, setRecentPatientsList] = useState<any[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({
    whatsNew: false,
    treatmentHistory: false,
    adlWorkStatus: true,
    documentSummary: true,
  });
  const [showManualTaskModal, setShowManualTaskModal] = useState(false);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const { toasts, addToast } = useToasts();
  const {
    showOnboarding,
    currentStep,
    stepPositions,
    showWelcomeModal,
    onboardingSteps,
    staffButtonRef,
    modeSelectorRef,
    nextStep,
    previousStep,
    closeOnboarding,
    startOnboarding,
  } = useOnboarding();

  const physicianId = useMemo(() => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? (session.user.id as string) || null
      : session.user.physicianId || null;
  }, [session]);

  const {
    documentData,
    taskQuickNotes,
    loading,
    error,
    fetchDocumentData,
    setDocumentData,
  } = usePatientData(physicianId);

  const { files, fileInputRef, handleFileSelect, handleUpload, resetFiles } = useFileUpload(addToast, session, startTwoPhaseTracking);

  const { searchQuery, searchResults, searchLoading, handleSearchChange, getPhysicianId: getSearchPhysicianId } = useSearch(mode);

  // Memoized current patient
  const currentPatient = useMemo(() => {
    if (documentData) {
      return {
        patientName: documentData.patient_name || "Not specified",
        dob: documentData.dob || "",
        doi: documentData.doi || "",
        claimNumber: documentData.claim_number || "Not specified",
      };
    }
    if (selectedPatient) {
      return {
        patientName:
          selectedPatient.patientName ||
          selectedPatient.name ||
          "Not specified",
        dob: selectedPatient.dob || "",
        doi: selectedPatient.doi || "",
        claimNumber: selectedPatient.claimNumber || "Not specified",
      };
    }
    return {
      patientName: "Select a patient",
      dob: "",
      doi: "",
      claimNumber: "Not specified",
    };
  }, [documentData, selectedPatient]);

  // Memoized document ID
  const documentId = useMemo(
    () => documentData?.documents?.[0]?.id || documentData?.documents?.[0]?.document_id || "",
    [documentData]
  );

  // Memoized staff dashboard href
  const staffDashboardHref = useMemo(() => {
    if (selectedPatient && documentData && documentId) {
      return `/staff-dashboard?patient_name=${encodeURIComponent(
        currentPatient.patientName
      )}&dob=${encodeURIComponent(
        currentPatient.dob || ""
      )}&claim=${encodeURIComponent(
        currentPatient.claimNumber
      )}&document_id=${encodeURIComponent(documentId)}`;
    } else if (selectedPatient) {
      return `/staff-dashboard?patient_name=${encodeURIComponent(
        currentPatient.patientName
      )}&dob=${encodeURIComponent(
        currentPatient.dob || ""
      )}&claim=${encodeURIComponent(currentPatient.claimNumber)}`;
    }
    return "/staff-dashboard";
  }, [selectedPatient, documentData, documentId, currentPatient]);

  // Memoized visit count
  const visitCount = useMemo(() => documentData?.document_summaries?.length || 0, [documentData]);

  // Memoized formatDate
  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Not specified";
      }
      return date.toLocaleDateString();
    } catch {
      return "Not specified";
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = useCallback((patient: Patient) => {
    console.log("Patient selected:", patient);
    setSelectedPatient(patient);
    fetchDocumentData(patient, mode);
  }, [fetchDocumentData, mode]);

  // Handle mode switch
  const switchMode = useCallback((val: "wc" | "gm") => {
    setMode(val);
  }, []);

  // Handle verify toggle
  const handleVerifyToggle = useCallback(async () => {
    if (documentData?.allVerified) return;
    setIsVerified((prev) => !prev);
    if (!isVerified) {
      if (!selectedPatient || !documentData) {
        addToast("No patient data available to verify.", "error");
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
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to verify document: ${response.status}`);
        }
        const verifyData = await response.json();
        console.log("Verification response:", verifyData);
        await fetchDocumentData(selectedPatient, mode);
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
        addToast(
          err instanceof Error ? err.message : "Verification failed",
          "error"
        );
        setIsVerified(false);
      } finally {
        setVerifyLoading(false);
      }
    }
  }, [documentData, isVerified, selectedPatient, session, fetchDocumentData, mode, addToast]);

  // Handle copy text
  const handleCopy = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${fieldName} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  // Handle section copy
  const handleSectionCopy = useCallback(async (
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
          text = `Summary Snapshot\nDx: ${
            currentSnap.dx || "Not specified"
          }\nKey Concern: ${
            currentSnap.keyConcern || "Not specified"
          }\nNext Step: ${currentSnap.nextStep || "Not specified"}`;
        }
        break;
      case "section-whatsnew":
        const latestSummary = doc?.document_summaries?.[0];
        const shortSummary =
          latestSummary?.brief_summary || "No short summary available";
        const longSummary =
          latestSummary?.summary || "No long summary available";
        text = `DOCUMENT SUMMARIES\n\n`;
        text += `📋 BRIEF SUMMARY:\n${shortSummary}\n\n`;
        text += `📄 DETAILED SUMMARY:\n${longSummary}\n\n`;
        if (latestSummary) {
          text += `📊 METADATA:\n`;
          text += `Type: ${latestSummary.type}\n`;
          text += `Date: ${formatDate(latestSummary.date)}\n`;
        }
        break;
      case "section-adl":
        text = `ADL / Work Status\nADLs Affected: ${
          doc?.adl?.adls_affected || "Not specified"
        }\nWork Restrictions: ${
          doc?.adl?.work_restrictions || "Not specified"
        }`;
        break;
      case "section-patient-quiz":
        if (doc?.patient_quiz) {
          const q = doc.patient_quiz;
          text = `Patient Quiz\nLanguage: ${q.lang}\nNew Appt: ${
            q.newAppt
          }\nPain Level: ${q.pain}/10\nWork Difficulty: ${q.workDiff}\nTrend: ${
            q.trend
          }\nWork Ability: ${q.workAbility}\nBarrier: ${
            q.barrier
          }\nADLs Affected: ${q.adl.join(", ")}\nUpcoming Appts:\n`;
          q.appts.forEach((appt: any) => {
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
            text = `${summary.type} - ${formatDate(summary.date)}\n${
              summary.summary
            }`;
          }
        }
        break;
    }
    if (!text) return;
    await handleCopy(text, sectionId);
    if (timersRef.current[sectionId]) {
      clearTimeout(timersRef.current[sectionId]);
      delete timersRef.current[sectionId];
    }
    setCopied((prev) => ({ ...prev, [sectionId]: true }));
    timersRef.current[sectionId] = setTimeout(() => {
      setCopied((prev) => {
        const newCopied = { ...prev };
        delete newCopied[sectionId];
        return newCopied;
      });
      delete timersRef.current[sectionId];
    }, 2000);
  }, [documentData, formatDate, handleCopy]);

  // Handle show previous summary
  const handleShowPrevious = useCallback((type: string) => {
    const previous = documentData?.previous_summaries?.[type];
    if (previous) {
      setPreviousSummary(previous);
      setShowPreviousSummary(true);
      setSelectedBriefSummary(""); // Clear brief summary
    }
  }, [documentData]);

  // Handle modal open
  const openModal = useCallback((briefSummary: string) => {
    setSelectedBriefSummary(briefSummary);
    setShowPreviousSummary(false);
  }, []);

  // Toggle section
  const toggleSection = useCallback((sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  // Retry fetch
  const handleRetry = useCallback(() => {
    if (selectedPatient) {
      fetchDocumentData(selectedPatient, mode);
    }
  }, [selectedPatient, fetchDocumentData, mode]);

  // Auto-set verified
  useEffect(() => {
    if (documentData?.allVerified) {
      setIsVerified(true);
    }
  }, [documentData?.allVerified]);

  // Fetch recent patients
  useEffect(() => {
    if (status === "loading" || !session) {
      return;
    }
    const fetchRecentPatientsForPopup = async () => {
      try {
        const url = `/api/get-recent-patients?mode=${mode}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch recent patients: ${response.status}`
          );
        }
        const result = await response.json();
        let data: any;
        try {
          data = handleEncryptedResponse(result);
          console.log("✅ Recent patients data decrypted successfully", {
            patientCount: Array.isArray(data) ? data.length : 0,
          });
        } catch (decryptError) {
          console.error("❌ Failed to decrypt recent patients:", decryptError);
          if (result.data && Array.isArray(result.data)) {
            console.log("🔄 Using unencrypted data directly");
            data = result.data;
          } else if (Array.isArray(result)) {
            console.log("🔄 Using direct array response");
            data = result;
          } else {
            throw decryptError;
          }
        }
        setRecentPatientsList(data || []);
        if (data && Array.isArray(data) && data.length > 0 && session?.user) {
          const latestPatient = data[0];
          console.log("🔄 Auto-selecting latest patient:", latestPatient.patientName);
          let dobString = "";
          if (latestPatient.dob) {
            if (latestPatient.dob instanceof Date) {
              dobString = latestPatient.dob.toISOString().split("T")[0];
            } else {
              dobString = String(latestPatient.dob);
            }
          }
          handlePatientSelect({
            patientName: latestPatient.patientName,
            dob: dobString,
            claimNumber: latestPatient.claimNumber || "",
            doi: "",
          });
        }
      } catch (err) {
        console.error("Error fetching recent patients for popup:", err);
        setRecentPatientsList([]);
      }
    };
    fetchRecentPatientsForPopup();
  }, [mode, status, session, handlePatientSelect]);

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

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        staffDashboardHref={staffDashboardHref}
        mode={mode}
        onModeChange={switchMode}
        session={session}
        staffButtonRef={staffButtonRef as React.RefObject<HTMLAnchorElement>}
        modeSelectorRef={modeSelectorRef as React.RefObject<HTMLSelectElement>}
      />
      <div className="mt-16 px-5 py-5 min-h-[calc(100vh-64px)] bg-gray-50 text-gray-900 font-sans">
        <PhysicianOnboardingTour
          isOpen={showOnboarding}
          onClose={closeOnboarding}
          currentStep={currentStep}
          onNext={nextStep}
          onPrevious={previousStep}
          steps={onboardingSteps}
          stepPositions={stepPositions}
        />
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => {}}
        />
        <OnboardingHelpButton onClick={startOnboarding} />
        <UploadSection
          files={files}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          onCancel={resetFiles}
          loading={loading}
        />
        <MainContent
          selectedPatient={selectedPatient}
          documentData={documentData as any}
          taskQuickNotes={taskQuickNotes as any[]}
          visitCount={visitCount}
          formatDate={formatDate}
          currentPatient={currentPatient as Patient}
          collapsedSections={collapsedSections}
          copied={copied}
          onToggleSection={toggleSection}
          onCopySection={handleSectionCopy}
          mode={mode}
          error={error}
          loading={loading}
          onRetry={handleRetry}
        />
        <div
          className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-2xl cursor-pointer font-semibold text-sm z-[9999]"
          onClick={() => setShowManualTaskModal(true)}
        >
          + New Order
        </div>
        <RecentPatientsPanel
          isVisible={recentPatientsVisible}
          onToggle={() => setRecentPatientsVisible(!recentPatientsVisible)}
          recentPatients={recentPatientsList}
          searchQuery={searchQuery}
          onSearchChange={(e) => handleSearchChange(e, session)}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onPatientSelect={handlePatientSelect}
          onClose={() => setRecentPatientsVisible(false)}
        />
      </div>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full">
          <Sidebar />
        </div>
      </div>
      <ToastContainer toasts={toasts} />
      <BriefSummaryModal
        isOpen={showPreviousSummary}
        onClose={() => setSelectedBriefSummary("")}
        briefSummary={selectedBriefSummary}
      />
      <PreviousSummaryModal
        isOpen={showPreviousSummary}
        onClose={() => setShowPreviousSummary(false)}
        onViewBrief={openModal}
        previousSummary={previousSummary as DocumentSummary | null}
        formatDate={formatDate}
      />
      <ManualTaskModal
        open={showManualTaskModal}
        onOpenChange={setShowManualTaskModal}
        departments={[
          "Medical/Clinical",
          "Scheduling & Coordination",
          "Administrative / Compliance",
          "Authorizations & Denials",
        ]}
        defaultClaim={
          (currentPatient as Patient).claimNumber !== "Not specified"
            ? currentPatient.claimNumber
            : undefined
        }
        defaultPatient={
          selectedPatient ? (currentPatient as Patient).patientName : undefined
        }
        defaultDocumentId={documentId || undefined}
        onSubmit={async (data: any) => {
          try {
            const response = await fetch("/api/add-manual-task", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...data,
                physicianId: (session?.user as any)?.physicianId || null,
              }),
            });
            if (!response.ok) {
              throw new Error("Failed to create task");
            }
            addToast("Task created successfully", "success");
          } catch (error) {
            console.error("Error creating task:", error);
            addToast("Failed to create task", "error");
            throw error;
          }
        }}
      />
    </>
  );
}