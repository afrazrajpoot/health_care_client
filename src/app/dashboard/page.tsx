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
// import { FloatingNewOrderButton } from "@/components/physician-components/FloatingNewOrderButton";

import { useSearch } from "../custom-hooks/staff-hooks/physician-hooks/useSearch";
import { useOnboarding } from "../custom-hooks/staff-hooks/physician-hooks/useOnboarding";
import { useToasts } from "../custom-hooks/staff-hooks/physician-hooks/useToasts";

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
    toast("Upload in Progress 🚀", {
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

      console.log(
        `🚀 Starting upload for ${pendingFiles.length} files in mode: ${mode}`
      );

      // Determine physician ID based on role
      const user = session?.user;
      const physicianId =
        user?.role === "Physician"
          ? user?.id // if Physician, send their own ID
          : user?.physicianId || ""; // otherwise, send assigned physician's ID

      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.doclatch.com"
      }/api/documents/extract-documents?physicianId=${physicianId}&userId=${
        user?.id || ""
      }`;

      console.log("🌐 API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.fastapi_token}`,
        },
        body: formData,
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Upload successful:", data);

      // Clear files after successful upload
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      throw error; // Re-throw to handle in calling code if needed
    } finally {
      // ProgressTracker will automatically close when processing completes
    }
  }, [pendingFiles, mode, session]);

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
    console.log("🔄 Refreshing patient data after upload completion...");

    if (selectedPatient) {
      try {
        // Fetch latest document data for the patient
        await fetchDocumentData(
          {
            patientName: selectedPatient.patientName,
            dob: selectedPatient.dob,
            claimNumber: selectedPatient.claimNumber || "",
            doi: selectedPatient.doi || "",
          },
          mode
        );

        console.log("✅ Patient data refreshed successfully");
      } catch (error) {
        console.error("❌ Error refreshing patient data:", error);
      }
    }
  }, [selectedPatient, fetchDocumentData, mode]);

  const handleUploadClick = useCallback(() => {
    // Directly trigger file input without drag drop zone
    fileInputRef.current?.click();
  }, []);

  // Handle file input changes - show confirmation modal
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files);
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
  const handlePatientSelect = useCallback(
    (patient: Patient) => {
      console.log("Patient selected:", patient);
      setSelectedPatient(patient);
      fetchDocumentData(patient, mode);
    },
    [fetchDocumentData, mode]
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
  }, [
    documentData,
    isVerified,
    selectedPatient,
    session,
    fetchDocumentData,
    mode,
    addToast,
  ]);

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
          console.log(
            "🔄 Auto-selecting latest patient:",
            latestPatient.patientName
          );
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
    return <LoadingFallback />;
  }

  if (!session) {
    return <UnauthenticatedFallback />;
  }

  const handleManualTaskSubmit = async (data: any) => {
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

      {showUploadToast && <UploadToast />}
    </>
  );
}

// vudihyz@mailinator.com
