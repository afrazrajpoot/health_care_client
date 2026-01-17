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
import { useSocket } from "@/providers/SocketProvider";
import { handleEncryptedResponse } from "@/lib/decrypt";
import { usePatientData } from "@/hooks/usePatientData";
import { toast } from "sonner";

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
// import { FloatingNewOrderButton } from "@/components/physician-components/FloatingNewOrderButton";

import { useSearch } from "../custom-hooks/staff-hooks/physician-hooks/useSearch";
import { useOnboarding } from "../custom-hooks/staff-hooks/physician-hooks/useOnboarding";
import { useToasts } from "../custom-hooks/staff-hooks/physician-hooks/useToasts";
import { 
  useGetRecentPatientsQuery, 
  useVerifyDocumentMutation, 
  useAddManualTaskMutation 
} from "@/redux/dashboardApi";
import { useExtractDocumentsMutation } from "@/redux/pythonApi";

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

export default function PhysicianCard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"wc" | "gm">("wc");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verifyTime, setVerifyTime] = useState<string>("—");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [showPreviousSummary, setShowPreviousSummary] =
    useState<boolean>(false);
  const [previousSummary, setPreviousSummary] =
    useState<DocumentSummary | null>(null);
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
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDocumentSuccessPopup, setShowDocumentSuccessPopup] =
    useState(false);
  const [showUploadToast, setShowUploadToast] = useState(false);
  const [ignoredFiles, setIgnoredFiles] = useState<any[]>([]);
  const [showIgnoredFilesModal, setShowIgnoredFilesModal] = useState(false);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const initialPatientSelectedRef = useRef(false); // Track if initial patient has been selected

  const [extractDocuments] = useExtractDocumentsMutation();
  const [verifyDocument] = useVerifyDocumentMutation();
  const [addManualTask] = useAddManualTaskMutation();

  const { data: recentPatientsData, isFetching: recentPatientsLoading } = useGetRecentPatientsQuery(mode, {
    skip: status !== "authenticated" || !session,
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });

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

  // Get socket methods for progress tracking
  const { setActiveTask, startTwoPhaseTracking, clearProgress } = useSocket();

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
  } = usePatientData(physicianId, selectedPatient, mode);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragDropFiles = useCallback((files: File[]) => {
    setPendingFiles(files);
    setShowConfirmationModal(true);
  }, []);

  // Confirmation modal handlers
  const handleConfirmUpload = useCallback(async () => {
    setShowConfirmationModal(false);
    setShowUploadToast(true);
    // ProgressTracker will automatically show in minimized mode

    try {
      // Create FormData directly for API call
      const formData = new FormData();
      pendingFiles.forEach((file) => {
        formData.append("documents", file);
      });
      formData.append("mode", mode);

      const user = session?.user;
      const physicianId =
        user?.role === "Physician"
          ? user?.id // if Physician, send their own ID
          : user?.physicianId || ""; // otherwise, send assigned physician's ID

      const data = await extractDocuments({
        physicianId,
        userId: user?.id || "",
        formData,
      }).unwrap();

      // Handle ignored files - show modal with details
      if (data.ignored && data.ignored.length > 0) {
        setIgnoredFiles(data.ignored);
        setShowIgnoredFilesModal(true);

        // If no task_id (all ignored), clear progress
        if (!data.task_id) {
          clearProgress();
        }
      }

      // Start progress tracking if we have a task ID
      if (data.upload_task_id && data.task_id) {
        // Use two-phase tracking - pass payload_count as total files
        startTwoPhaseTracking(
          data.upload_task_id,
          data.task_id,
          data.payload_count
        );
      } else if (data.task_id) {
        // Fallback to single-phase tracking
        setActiveTask(data.task_id, data.payload_count);
      }

      // Clear files after successful upload
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Unknown error",
        duration: 5000,
      });
      clearProgress();
    } finally {
      // ProgressTracker will automatically close when processing completes
      setShowUploadToast(false);
    }
  }, [
    pendingFiles,
    mode,
    session,
    setActiveTask,
    startTwoPhaseTracking,
    clearProgress,
  ]);

  const handleCancelUpload = useCallback(() => {
    setShowConfirmationModal(false);
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [fileInputRef]);

  const handleRemoveFile = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Close modal if no files left
      if (updated.length === 0) {
        setShowConfirmationModal(false);
      }
      return updated;
    });
  }, []);

  // Callback to refresh data after upload completion
  const handleRefreshData = useCallback(async () => {
    // RTK Query will automatically refetch due to tag invalidation
    // or we can manually trigger if needed, but usually not necessary
  }, []);

  const handleUploadClick = useCallback(() => {
    // Directly trigger file input without drag drop zone
    fileInputRef.current?.click();
  }, []);

  // Handle file input changes - show confirmation modal
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files);

        if (filesArray.length > 5) {
          toast("Maximum 5 documents allowed", {
            description:
              "Please select up to 5 documents at a time for upload.",
            duration: 4000,
            position: "top-center",
            className: "border-l-4 border-red-500 bg-red-50 text-red-800",
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setPendingFiles(filesArray);
        setShowConfirmationModal(true);
      }
    },
    []
  );

  // Dummy values for DashboardContent (not used in new upload flow)
  const dummyFiles: File[] = [];
  const dummyHandleUpload = useCallback(() => {}, []);
  const dummyResetFiles = useCallback(() => {}, []);

  const {
    searchQuery,
    searchResults,
    searchLoading,
    handleSearchChange,
    getPhysicianId: getSearchPhysicianId,
  } = useSearch(mode);

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
    () =>
      documentData?.documents?.[0]?.id ||
      documentData?.documents?.[0]?.document_id ||
      "",
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
  const visitCount = useMemo(
    () => documentData?.document_summaries?.length || 0,
    [documentData]
  );

  // Memoized formatDate (MM-DD-YYYY)
  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Not specified";
      }
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch {
      return "Not specified";
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = useCallback(
    (patient: Patient) => {
      setSelectedPatient(patient);
    },
    []
  );

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
        const params = {
          patient_name:
            selectedPatient.patientName || selectedPatient.name || "",
          dob: selectedPatient.dob,
          doi: selectedPatient.doi,
          claim_number: selectedPatient.claimNumber,
        };
        
        await verifyDocument(params).unwrap();

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
  }, [
    documentData,
    isVerified,
    selectedPatient,
    verifyDocument,
    addToast,
  ]);

  // Handle copy text
  const handleCopy = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  // Handle section copy
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
            }\nPain Level: ${q.pain}/10\nWork Difficulty: ${
              q.workDiff
            }\nTrend: ${q.trend}\nWork Ability: ${q.workAbility}\nBarrier: ${
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
    },
    [documentData, formatDate, handleCopy]
  );

  // Handle show previous summary
  const handleShowPrevious = useCallback(
    (type: string) => {
      const previous = documentData?.previous_summaries?.[type];
      if (previous) {
        setPreviousSummary(previous);
        setShowPreviousSummary(true);
        setSelectedBriefSummary(""); // Clear brief summary
      }
    },
    [documentData]
  );

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
    // RTK Query handles retry via refetch if needed, 
    // but here we just let it refetch automatically when state is correct
  }, []);

  // Auto-set verified
  useEffect(() => {
    if (documentData?.allVerified) {
      setIsVerified(true);
    }
  }, [documentData?.allVerified]);

  // Update recent patients list when data changes
  useEffect(() => {
    if (recentPatientsData) {
      setRecentPatientsList(recentPatientsData || []);
      
      // Only auto-select the first patient on initial load, not on every re-render
      if (
        !initialPatientSelectedRef.current &&
        recentPatientsData &&
        Array.isArray(recentPatientsData) &&
        recentPatientsData.length > 0 &&
        session?.user &&
        !selectedPatient // Only if no patient is already selected
      ) {
        const latestPatient = recentPatientsData[0];

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
        initialPatientSelectedRef.current = true; // Mark as selected
      }
    }
  }, [recentPatientsData, session]); // Removed handlePatientSelect and selectedPatient from dependencies

  if (status === "loading") {
    return <LoadingFallback />;
  }

  if (!session) {
    return <UnauthenticatedFallback />;
  }

  const handleManualTaskSubmit = async (data: any) => {
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
  };

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
          files={dummyFiles}
          onFileSelect={handleFileInputChange}
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          onUpload={dummyHandleUpload}
          onCancelUpload={dummyResetFiles}
          loading={loading}
          selectedPatient={selectedPatient}
          documentData={documentData}
          taskQuickNotes={taskQuickNotes}
          visitCount={visitCount}
          formatDate={formatDate}
          currentPatient={currentPatient}
          collapsedSections={collapsedSections}
          copied={copied}
          onToggleSection={toggleSection}
          onCopySection={handleSectionCopy}
          mode={mode}
          error={error}
          onRetry={handleRetry}
          recentPatientsVisible={recentPatientsVisible}
          onToggleRecentPatients={() =>
            setRecentPatientsVisible(!recentPatientsVisible)
          }
          recentPatients={recentPatientsList}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onPatientSelect={handlePatientSelect}
          onCloseRecentPatients={() => setRecentPatientsVisible(false)}
          session={session}
        />
        {/* <FloatingNewOrderButton onClick={() => setShowManualTaskModal(true)} /> */}
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
          defaultClaim={
            (currentPatient as Patient).claimNumber !== "Not specified"
              ? currentPatient.claimNumber
              : undefined
          }
          defaultPatient={
            selectedPatient
              ? (currentPatient as Patient).patientName
              : undefined
          }
          defaultDocumentId={documentId || undefined}
          onManualTaskSubmit={handleManualTaskSubmit}
          session={session}
          addToast={addToast}
        />
      </PhysicianCardLayout>

      <FileConfirmationModal
        showModal={showConfirmationModal}
        files={pendingFiles}
        onConfirm={handleConfirmUpload}
        onCancel={handleCancelUpload}
        onRemoveFile={handleRemoveFile}
      />

      <UploadProgressManager
        onRefreshData={handleRefreshData}
        onShowSuccessPopup={() => setShowDocumentSuccessPopup(true)}
      />

      <DocumentSuccessPopup
        isOpen={showDocumentSuccessPopup}
        onConfirm={() => {
          setShowDocumentSuccessPopup(false);
          window.location.reload();
        }}
      />

      <PaymentErrorModal
        isOpen={showIgnoredFilesModal}
        onClose={() => {
          setShowIgnoredFilesModal(false);
          setIgnoredFiles([]);
        }}
        onUpgrade={() => router.push("/pricing")}
        ignoredFiles={ignoredFiles}
      />

      {showUploadToast && <UploadToast />}
    </>
  );
}

// vudihyz@mailinator.com
