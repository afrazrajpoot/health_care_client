"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { usePatientData } from "@/hooks/usePatientData";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

// Components
import { Header } from "@/components/physician-components/Header";
import { ToastContainer } from "@/components/physician-components/ToastContainer";
import { SidebarOverlay } from "@/components/physician-components/SidebarOverlay";
import { SidebarContainer } from "@/components/physician-components/SidebarContainer";
import { DashboardContent } from "@/components/physician-components/DashboardContent";
import { ModalsContainer } from "@/components/physician-components/ModalsContainer";
import { LoadingFallback } from "@/components/physician-components/LoadingFallback";
import { UnauthenticatedFallback } from "@/components/physician-components/UnauthenticatedFallback";
import { PhysicianCardLayout } from "@/components/physician-components/PhysicianCardLayout";
import FileConfirmationModal from "@/components/physician-components/FileConfirmationModal";
import UploadProgressManager from "@/components/physician-components/UploadProgressManager";
import DocumentSuccessPopup from "@/components/staff-components/DocumentSuccessPopup";
import PaymentErrorModal from "@/components/staff-components/PaymentErrorModal";

// Custom hooks
import { useSearch } from "../custom-hooks/staff-hooks/physician-hooks/useSearch";
import { useOnboarding } from "../custom-hooks/staff-hooks/physician-hooks/useOnboarding";
import { useToasts } from "../custom-hooks/staff-hooks/physician-hooks/useToasts";
import { useFileUpload } from "../custom-hooks/staff-hooks/physician-hooks/useFileUpload";

// API
import {
  dashboardApi,
  useGetRecentPatientsQuery,
  useAddManualTaskMutation,
} from "@/redux/dashboardApi";

// Import types - Check if these are exported from DashboardContent
// If not, define them locally
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

// Interfaces
interface SectionState {
  [key: string]: boolean;
}

interface CopiedState {
  [key: string]: boolean;
}

// Helper Components
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

    return () => toast.dismiss(toastId);
  }, []);

  return null;
};

// Helper Functions
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not specified";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not specified";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  } catch {
    return "Not specified";
  }
};

const validateFiles = (files: File[]): { isValid: boolean; error?: string; oversizedFiles?: File[] } => {
  if (files.length > 10) {
    return {
      isValid: false,
      error: `Maximum 10 documents allowed. Please select up to 10 documents at a time.`
    };
  }

  const oversizedFiles = files.filter(file => file.size > 30 * 1024 * 1024);
  if (oversizedFiles.length > 0) {
    return {
      isValid: false,
      error: `Files must be less than 30MB. The following files exceed the limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
      oversizedFiles
    };
  }

  return { isValid: true };
};

const showFileValidationError = (error: string) => {
  toast.error("Upload Error", {
    description: error,
    duration: 5000,
    position: "top-center",
    className: "border-l-4 border-red-500 bg-red-50 text-red-800",
  });
};

// Helper function to find patient from URL
const normalizeDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return null;
  }
};

export default function PhysicianCard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  // State
  const [mode, setMode] = useState<"wc" | "gm">("wc");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState("");
  const [showPreviousSummary, setShowPreviousSummary] = useState(false);
  const [previousSummary, setPreviousSummary] = useState<DocumentSummary | null>(null);
  const [copied, setCopied] = useState<CopiedState>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentPatientsVisible, setRecentPatientsVisible] = useState(false);
  const [recentPatientsList, setRecentPatientsList] = useState<Patient[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<SectionState>({
    whatsNew: false,
    treatmentHistory: false,
    adlWorkStatus: true,
    documentSummary: true,
  });
  const [showManualTaskModal, setShowManualTaskModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDocumentSuccessPopup, setShowDocumentSuccessPopup] = useState(false);
  const [showUploadToast, setShowUploadToast] = useState(false);
  const [showIgnoredFilesModal, setShowIgnoredFilesModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [highlightedPatientIndex, setHighlightedPatientIndex] = useState<number | null>(null);
  const [isFromURLSelection, setIsFromURLSelection] = useState(false);
  const [documentIdFromUrl, setDocumentIdFromUrl] = useState<string | null>(null);

  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const initialPatientSelectedRef = useRef(false);

  // File Upload Custom Hook
  const {
    selectedFiles,
    uploading,
    snapInputRef,
    formatSize,
    handleFileChange,
    handleSubmit,
    handleCancel,
    handleSnap,
    setSelectedFiles,
    paymentError,
    clearPaymentError,
    ignoredFiles,
    uploadError,
    clearUploadError,
    removeFile,
  } = useFileUpload(mode);

  // API Hooks - With proper skip conditions
  const {
    data: recentPatientsData,
    isLoading: isRecentPatientsLoading,
    isFetching: isRecentPatientsFetching
  } = useGetRecentPatientsQuery(mode, {
    skip: status !== "authenticated" || !session,
    refetchOnMountOrArgChange: false,
    pollingInterval: 0,
  });

  // Custom Hooks
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

  // Only fetch patient data when physicianId is available and initial load is complete
  const shouldFetchPatientData = useMemo(() => {
    return !isInitialLoad && physicianId !== null && selectedPatient !== null;
  }, [isInitialLoad, physicianId, selectedPatient]);

  // Get document ID from URL
  const urlDocumentId = useMemo(() => {
    return searchParams ? searchParams.get('document_id') : null;
  }, [searchParams]);

  const {
    documentData,
    taskQuickNotes,
    loading: isPatientDataLoading,
    error,
    refetchTreatmentHistory,
  } = usePatientData(
    physicianId,
    selectedPatient,
    mode,
    shouldFetchPatientData,
    urlDocumentId || undefined
  );

  const { searchQuery, searchResults, searchLoading: isSearchLoading, handleSearchChange } = useSearch(mode);

  // Combined loading state - shows single loader for initial app state
  const isLoading = useMemo(() => {
    return status === "loading" ||
      (status === "authenticated" && isInitialLoad) ||
      isRecentPatientsLoading;
  }, [status, isInitialLoad, isRecentPatientsLoading]);

  // Derived Data
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
        patientName: selectedPatient.patientName || selectedPatient.name || "Not specified",
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

  const documentId = useMemo(
    () => documentData?.documents?.[0]?.id || documentData?.documents?.[0]?.document_id || "",
    [documentData]
  );

  const staffDashboardHref = useMemo(() => {
    if (selectedPatient && documentData && documentId) {
      return `/staff-dashboard?patient_name=${encodeURIComponent(
        currentPatient.patientName
      )}&dob=${encodeURIComponent(currentPatient.dob)}&claim=${encodeURIComponent(
        currentPatient.claimNumber
      )}&document_id=${encodeURIComponent(documentId)}`;
    } else if (selectedPatient) {
      return `/staff-dashboard?patient_name=${encodeURIComponent(
        currentPatient.patientName
      )}&dob=${encodeURIComponent(currentPatient.dob)}&claim=${encodeURIComponent(
        currentPatient.claimNumber
      )}`;
    }
    return "/staff-dashboard";
  }, [selectedPatient, documentData, documentId, currentPatient]);

  const visitCount = useMemo(
    () => documentData?.document_summaries?.length || 0,
    [documentData]
  );

  // API Hooks
  const [addManualTask] = useAddManualTaskMutation();

  // Find patient from URL parameters
  const findPatientFromURL = useCallback((patients: Patient[]) => {
    if (!searchParams) return null;

    const patientName = searchParams.get('patient_name');
    const dob = searchParams.get('dob');
    const claimNumber = searchParams.get('claim');
    const docId = searchParams.get('document_id');

    if (!patientName && !dob && !claimNumber) return null;

    // Normalize the search parameters
    const normalizedSearch = {
      patientName: patientName?.trim() || "",
      dob: normalizeDate(dob) || dob || "",
      claimNumber: claimNumber?.trim() || "",
    };

    // Find the best matching patient in the provided list
    let bestMatchIndex = -1;
    let bestMatchScore = 0;

    if (patients && patients.length > 0) {
      patients.forEach((patient, index) => {
        let score = 0;

        // Check name match (partial match)
        const patientNameNormalized = patient.patientName?.toLowerCase().trim() ||
          patient.name?.toLowerCase().trim() || '';
        if (normalizedSearch.patientName &&
          patientNameNormalized.includes(normalizedSearch.patientName.toLowerCase())) {
          score += 3;
        }

        // Check DOB match
        if (normalizedSearch.dob && patient.dob) {
          const patientDOB = normalizeDate(patient.dob);
          if (patientDOB === normalizedSearch.dob) {
            score += 2;
          }
        }

        // Check claim number match
        if (normalizedSearch.claimNumber && patient.claimNumber) {
          const patientClaimNormalized = patient.claimNumber.trim();
          if (patientClaimNormalized === normalizedSearch.claimNumber) {
            score += 1;
          }
        }

        // Update best match if we have a better score
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchIndex = index;
        }
      });
    }

    // If we have a good match in the list, return it with its index
    if (bestMatchScore >= 3 && bestMatchIndex !== -1) {
      return {
        index: bestMatchIndex,
        patient: patients[bestMatchIndex],
        score: bestMatchScore
      };
    }

    // If no match in list but we have enough info, return a "virtual" patient
    if (normalizedSearch.patientName) {
      return {
        index: -1, // Not in list
        patient: {
          patientName: normalizedSearch.patientName,
          dob: normalizedSearch.dob,
          claimNumber: normalizedSearch.claimNumber,
          doi: ""
        },
        score: 0
      };
    }

    return null;
  }, [searchParams]);

  // Handlers
  const handlePatientSelect = useCallback((patient: Patient, index?: number) => {
    setSelectedPatient(patient);
    if (index !== undefined) {
      setHighlightedPatientIndex(index);
    }

    // Update URL with selected patient details
    const params = new URLSearchParams(searchParams.toString());
    params.set('patient_name', patient.patientName || patient.name || "");
    if (patient.dob) params.set('dob', patient.dob);
    if (patient.claimNumber) params.set('claim', patient.claimNumber);

    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const switchMode = useCallback((val: "wc" | "gm") => {
    setMode(val);
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  const handleSectionCopy = useCallback(
    async (sectionId: string, snapshotIndex?: number) => {
      let text = "";
      const doc = documentData;

      switch (sectionId) {
        case "section-snapshot":
          const snapshots = doc?.summary_snapshots || [];
          const currentIdx = snapshotIndex || 0;
          const currentSnap = snapshots[currentIdx];
          if (currentSnap) {
            text = `Summary Snapshot\nDx: ${currentSnap.dx || "Not specified"}\nKey Concern: ${currentSnap.keyConcern || "Not specified"}\nNext Step: ${currentSnap.nextStep || "Not specified"}`;
          }
          break;
        case "section-whatsnew":
          const latestSummary = doc?.document_summaries?.[0];
          const shortSummary = latestSummary?.brief_summary || "No short summary available";
          const longSummary = latestSummary?.summary || "No long summary available";
          text = `DOCUMENT SUMMARIES\n\n📋 BRIEF SUMMARY:\n${shortSummary}\n\n📄 DETAILED SUMMARY:\n${longSummary}\n\n`;
          if (latestSummary) {
            text += `📊 METADATA:\nType: ${latestSummary.type}\nDate: ${formatDate(latestSummary.date)}\n`;
          }
          break;
        case "section-adl":
          text = `ADL / Work Status\nADLs Affected: ${doc?.adl?.adls_affected || "Not specified"}\nWork Restrictions: ${doc?.adl?.work_restrictions || "Not specified"}`;
          break;
        case "section-patient-quiz":
          if (doc?.patient_quiz) {
            const q = doc.patient_quiz;
            text = `Patient Quiz\nLanguage: ${q.lang}\nNew Appt: ${q.newAppt}\nPain Level: ${q.pain}/10\nWork Difficulty: ${q.workDiff}\nTrend: ${q.trend}\nWork Ability: ${q.workAbility}\nBarrier: ${q.barrier}\nADLs Affected: ${q.adl.join(", ")}\nUpcoming Appts:\n`;
            q.appts.forEach((appt: any) => {
              text += `- ${appt.date} - ${appt.type} (${appt.other})\n`;
            });
            text += `Created: ${formatDate(q.createdAt)}\nUpdated: ${formatDate(q.updatedAt)}`;
          } else {
            text = "No patient quiz data available";
          }
          break;
        default:
          if (sectionId.startsWith("section-summary-")) {
            const index = parseInt(sectionId.split("-")[2]);
            const summary = doc?.document_summaries?.[index];
            if (summary) {
              text = `${summary.type} - ${formatDate(summary.date)}\n${summary.summary}`;
            }
          }
          break;
      }

      if (!text) return;
      await handleCopy(text);

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
    },
    [documentData, handleCopy]
  );

  const openModal = useCallback((briefSummary: string) => {
    setSelectedBriefSummary(briefSummary);
    setShowPreviousSummary(false);
  }, []);

  const toggleSection = useCallback((sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  // File Upload Handlers using custom hook
  const handleFilesSelection = useCallback((files: File[]) => {
    const validation = validateFiles(files);
    if (!validation.isValid) {
      showFileValidationError(validation.error!);
      return;
    }
    setSelectedFiles(files);
    setShowConfirmationModal(true);
  }, [setSelectedFiles]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSnap(e);
    },
    [handleSnap]
  );

  const handleUploadClick = useCallback(() => {
    snapInputRef.current?.click();
  }, [snapInputRef]);

  const handleConfirmUpload = useCallback(async () => {
    setShowConfirmationModal(false);
    setShowUploadToast(true);
    await handleSubmit();
    setShowUploadToast(false);
  }, [handleSubmit]);

  const handleCancelUpload = useCallback(() => {
    setShowConfirmationModal(false);
    handleCancel();
  }, [handleCancel]);

  const handleRemoveFile = useCallback((index: number) => {
    removeFile(index);
    // Close modal if no files left
    if (selectedFiles.length === 1) {
      setShowConfirmationModal(false);
    }
  }, [removeFile, selectedFiles.length]);

  const handleRefreshData = useCallback(() => {
    dispatch(dashboardApi.util.invalidateTags(["Patients", "Tasks"]));
  }, [dispatch]);

  const handleManualTaskSubmit = useCallback(async (data: any) => {
    try {
      await addManualTask({
        ...data,
        physicianId: (session?.user as any)?.physicianId || null,
      }).unwrap();
      addToast("Task created successfully", "success");
    } catch (error) {
      console.error("Error creating task:", error);
      addToast("Failed to create task", "error");
      throw error;
    }
  }, [addManualTask, session, addToast]);

  // Effects
  // Auto-select patient from URL parameters
  useEffect(() => {
    if (searchParams) {
      const matched = findPatientFromURL(recentPatientsList);

      if (matched && !initialPatientSelectedRef.current) {
        handlePatientSelect(matched.patient, matched.index !== -1 ? matched.index : undefined);
        setIsFromURLSelection(true);
        initialPatientSelectedRef.current = true;

        // Store document ID from URL if present
        const docId = searchParams.get('document_id');
        if (docId) {
          setDocumentIdFromUrl(docId);
        }

        console.log('Patient selected from URL:', matched.patient.patientName);
      }
    }
  }, [recentPatientsList, searchParams, findPatientFromURL, handlePatientSelect]);

  // Load recent patients data
  useEffect(() => {
    if (!isRecentPatientsLoading) {
      if (recentPatientsData) {
        const patients = recentPatientsData as unknown as Patient[];
        setRecentPatientsList(patients || []);

        // Auto-select first patient if no URL selection and this is the first load
        if (
          !initialPatientSelectedRef.current &&
          patients &&
          patients.length > 0 &&
          session?.user &&
          !selectedPatient
        ) {
          const latestPatient = patients[0];
          let dobString = "";
          if (latestPatient.dob) {
            dobString = typeof latestPatient.dob === 'string'
              ? latestPatient.dob
              : String(latestPatient.dob);
          }
          handlePatientSelect({
            patientName: latestPatient.patientName,
            dob: dobString,
            claimNumber: latestPatient.claimNumber || "",
            doi: "",
          }, 0);
          initialPatientSelectedRef.current = true;
        }
      }

      // Mark initial load as complete once loading finished (success or error)
      setIsInitialLoad(false);
    }
  }, [recentPatientsData, isRecentPatientsLoading, session, selectedPatient, handlePatientSelect]);

  // Handle ignored files from upload hook
  useEffect(() => {
    if (ignoredFiles.length > 0) {
      setShowIgnoredFilesModal(true);
    }
  }, [ignoredFiles]);

  // Clear highlight after delay
  useEffect(() => {
    if (highlightedPatientIndex !== null) {
      let timer: NodeJS.Timeout;

      if (isFromURLSelection) {
        // Keep highlighted longer for URL selections (5 seconds)
        timer = setTimeout(() => {
          setHighlightedPatientIndex(null);
          setIsFromURLSelection(false);
        }, 5000);
      } else {
        // Normal selection (2 seconds)
        timer = setTimeout(() => {
          setHighlightedPatientIndex(null);
        }, 2000);
      }

      return () => clearTimeout(timer);
    }
  }, [highlightedPatientIndex, isFromURLSelection]);

  // Auth States and Loading
  if (isLoading) return <LoadingFallback />;
  if (!session) return <UnauthenticatedFallback />;

  // Component Render
  const header = (
    <Header
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      staffDashboardHref={staffDashboardHref}
      mode={mode}
      onModeChange={switchMode}
      session={session}
      staffButtonRef={staffButtonRef as React.RefObject<HTMLAnchorElement>}
      modeSelectorRef={modeSelectorRef as React.RefObject<HTMLSelectElement>}
      onUploadDocument={handleUploadClick}
    />
  );

  const sidebar = <SidebarContainer isOpen={isSidebarOpen} />;
  const overlay = (
    <SidebarOverlay
      isOpen={isSidebarOpen}
      onClose={() => setIsSidebarOpen(false)}
    />
  );

  return (
    <>
      <style jsx>{`
        @keyframes pulse-highlight {
          0% { background-color: rgba(59, 130, 246, 0.1); }
          50% { background-color: rgba(59, 130, 246, 0.2); }
          100% { background-color: rgba(59, 130, 246, 0.1); }
        }
        .highlighted-patient {
          animation: pulse-highlight 2s ease-in-out infinite;
          border-left: 4px solid #3b82f6 !important;
        }
      `}</style>

      <PhysicianCardLayout
        header={header}
        sidebar={sidebar}
        overlay={overlay}
        toasts={<ToastContainer toasts={toasts} />}
      >
        <DashboardContent
          showOnboarding={showOnboarding}
          currentStep={currentStep}
          stepPositions={stepPositions}
          showWelcomeModal={showWelcomeModal}
          onboardingSteps={onboardingSteps}
          onCloseOnboarding={closeOnboarding}
          onNextStep={nextStep}
          onPreviousStep={previousStep}
          onStartOnboarding={startOnboarding}
          files={[]} // Empty files array since we're not using it
          onFileSelect={handleFileInputChange}
          onUpload={() => { }} // Dummy function
          onCancelUpload={() => { }} // Dummy function
          loading={isPatientDataLoading || uploading} // Only show patient data or upload loading
          fileInputRef={snapInputRef}
          selectedPatient={selectedPatient}
          documentData={documentData}
          taskQuickNotes={taskQuickNotes}
          visitCount={visitCount}
          currentPatient={currentPatient}
          collapsedSections={collapsedSections}
          copied={copied}
          onToggleSection={toggleSection}
          onCopySection={handleSectionCopy}
          mode={mode}
          error={error}
          recentPatientsVisible={recentPatientsVisible}
          onToggleRecentPatients={() => setRecentPatientsVisible(!recentPatientsVisible)}
          recentPatients={recentPatientsList}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchResults={searchResults}
          searchLoading={isSearchLoading}
          onPatientSelect={handlePatientSelect}
          onCloseRecentPatients={() => setRecentPatientsVisible(false)}
          session={session}
          highlightedPatientIndex={highlightedPatientIndex}
        />
        <ModalsContainer
          showPreviousSummary={showPreviousSummary}
          onCloseBriefSummary={() => setSelectedBriefSummary("")}
          selectedBriefSummary={selectedBriefSummary}
          onClosePreviousSummary={() => setShowPreviousSummary(false)}
          onViewBrief={openModal}
          previousSummary={previousSummary}
          formatDate={formatDate}
          showManualTaskModal={showManualTaskModal}
          onManualTaskModalChange={setShowManualTaskModal}
          defaultClaim={currentPatient.claimNumber !== "Not specified" ? currentPatient.claimNumber : undefined}
          defaultPatient={selectedPatient ? currentPatient.patientName : undefined}
          defaultDocumentId={documentId || undefined}
          onManualTaskSubmit={handleManualTaskSubmit}
          session={session}
          addToast={addToast}
        />
      </PhysicianCardLayout>

      <FileConfirmationModal
        showModal={showConfirmationModal}
        files={selectedFiles}
        onConfirm={handleConfirmUpload}
        onCancel={handleCancelUpload}
        onRemoveFile={handleRemoveFile}
        formatSize={formatSize}
      />

      <UploadProgressManager
        onRefreshData={handleRefreshData}
        onShowSuccessPopup={() => setShowDocumentSuccessPopup(true)}
      />

      <DocumentSuccessPopup
        isOpen={showDocumentSuccessPopup}
        onConfirm={() => {
          setShowDocumentSuccessPopup(false);
          handleRefreshData();
        }}
      />

      <PaymentErrorModal
        isOpen={showIgnoredFilesModal}
        onClose={() => {
          setShowIgnoredFilesModal(false);
          clearPaymentError();
        }}
        onUpgrade={() => router.push("/pricing")}
        ignoredFiles={ignoredFiles}
      />

      {showUploadToast && <UploadToast />}
    </>
  );
}