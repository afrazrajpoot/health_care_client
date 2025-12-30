"use client";
import { Sidebar } from "@/components/navigation/sidebar";
import ManualTaskModal from "@/components/ManualTaskModal";
import ADLSection from "@/components/physician-components/ADLSection";
import DocumentSummarySection from "@/components/physician-components/DocumentSummarySection";
import PatientQuizSection from "@/components/physician-components/PatientQuizSection";
import PhysicianOnboardingTour from "@/components/physician-components/PhysicianOnboardingTour";
import TreatmentHistorySection from "@/components/physician-components/TreatmentHistorySection";
import { WelcomeModal } from "@/components/physician-components/WelcomeModal";
import WhatsNewSection from "@/components/physician-components/WhatsNewSection";
import PatientIntakeUpdate from "@/components/physician-components/PatientIntakeUpdate";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";
// Define TypeScript interfaces for data structures
interface Patient {
  id?: string | number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}
interface PatientQuiz {
  id: string;
  patientName: string;
  dob: string;
  doi: string;
  lang: string;
  newAppt: string;
  appts: Array<{
    date: string;
    type: string;
    other: string;
  }>;
  pain: number;
  workDiff: string;
  trend: string;
  workAbility: string;
  barrier: string;
  adl: string[];
  createdAt: string;
  updatedAt: string;
}
interface SummarySnapshotItem {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
  bodyPart?: string;
  urDecision?: string;
  recommended?: string;
  aiOutcome?: string;
  consultingDoctor?: string;
  document_created_at?: string;
  document_report_date?: string;
}
interface SummarySnapshot {
  diagnosis: string;
  diagnosis_history: string;
  key_concern: string;
  key_concern_history: string;
  next_step: string;
  next_step_history: string;
  has_changes: boolean;
}
interface WhatsNew {
  [key: string]: string;
}
interface QuickNoteSnapshot {
  details: string;
  timestamp: string;
  one_line_note: string;
  status_update: string;
}
interface ADL {
  adls_affected: string;
  adls_affected_history: string;
  work_restrictions: string;
  work_restrictions_history: string;
  has_changes: boolean;
}
interface DocumentSummary {
  type: string;
  date: string;
  summary: string;
  brief_summary?: string;
  document_id?: string;
}
interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  brief_summary?: { [key: string]: string[] };
  summary_snapshot?: SummarySnapshot;
  summary_snapshots?: SummarySnapshotItem[];
  whats_new?: WhatsNew;
  quick_notes_snapshots?: QuickNoteSnapshot[];
  adl?: ADL;
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: DocumentSummary[];
  patient_quiz?: PatientQuiz | null;
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: { [key: string]: DocumentSummary };
  allVerified?: boolean;
  gcs_file_link?: string;
  blob_path?: string;
  documents?: any[];
  body_part_snapshots?: any[];
}
export default function PhysicianCard() {
  // All hooks must be called at the top, before any conditional returns
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTwoPhaseTracking, setActiveTask } = useSocket();

  const [mode, setMode] = useState<"wc" | "gm">("wc");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verifyTime, setVerifyTime] = useState<string>("—");
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [showPreviousSummary, setShowPreviousSummary] =
    useState<boolean>(false);
  const [previousSummary, setPreviousSummary] =
    useState<DocumentSummary | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [files, setFiles] = useState<File[]>([]);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rpToggle, setRpToggle] = useState(true); // Default to open/visible
  const [recentPatientsVisible, setRecentPatientsVisible] = useState(false);
  const [recentPatientsList, setRecentPatientsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [taskQuickNotes, setTaskQuickNotes] = useState<QuickNoteSnapshot[]>([]);
  const [showManualTaskModal, setShowManualTaskModal] = useState(false);
  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  // Refs for onboarding target elements
  const staffButtonRef = useRef<HTMLAnchorElement>(null);
  const modeSelectorRef = useRef<HTMLSelectElement>(null);
  const patientCardRef = useRef<HTMLDivElement>(null);
  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({
    whatsNew: false,
    treatmentHistory: false, // Always expanded
    adlWorkStatus: true,
    documentSummary: true,
  });
  // Onboarding steps configuration
  const onboardingSteps = [
    {
      title: "Staff Dashboard",
      content:
        "Switch to the Staff Dashboard to manage tasks, upload documents, and track workflow.",
      target: staffButtonRef,
    },
  ];
  // Calculate positions for onboarding steps
  const calculateStepPositions = useCallback(() => {
    const positions = [];
    // Position for Staff Dashboard button
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
      // Recalculate positions after a brief delay
      setTimeout(() => {
        const newPositions = calculateStepPositions();
        setStepPositions(newPositions);
      }, 50);
    } else {
      setShowOnboarding(false);
      localStorage.setItem("physicianOnboardingCompleted", "true");
    }
  };
  // Previous step in onboarding
  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Recalculate positions after a brief delay
      setTimeout(() => {
        const newPositions = calculateStepPositions();
        setStepPositions(newPositions);
      }, 50);
    }
  };
  // Close onboarding
  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("physicianOnboardingCompleted", "true");
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
    const onboardingCompleted = localStorage.getItem(
      "physicianOnboardingCompleted"
    );
    const welcomeShown = localStorage.getItem("physicianWelcomeShown");
    if (!welcomeShown) {
      setShowWelcomeModal(true);
      localStorage.setItem("physicianWelcomeShown", "true");
    } else if (!onboardingCompleted) {
      // Show onboarding after a short delay if welcome was already shown
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [calculateStepPositions]);
  // Listen for start onboarding event
  useEffect(() => {
    const handleStartOnboarding = () => {
      startOnboarding();
    };
    window.addEventListener("start-onboarding", handleStartOnboarding);
    return () => {
      window.removeEventListener("start-onboarding", handleStartOnboarding);
    };
  }, []);
  // Toggle section collapse state
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };
  console.log("Session data:", session);
  // Toast management
  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  // Handle upload and queue
  const handleUpload = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    try {
      setLoading(true);
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

      // Support two-phase tracking if both task IDs are available
      if (data.upload_task_id && data.task_id) {
        startTwoPhaseTracking(data.upload_task_id, data.task_id);
        addToast(
          `Started processing ${files.length} document(s) with two-phase tracking`,
          "success"
        );
      } else {
        // Fallback: show task IDs as before
        const taskIds = data.task_ids || [];
        files.forEach((file, index) => {
          const taskId = taskIds[index] || "unknown";
          addToast(
            `File "${file.name}" successfully queued for processing. Task ID: ${taskId}`,
            "success"
          );
        });
      }

      // Clear files
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      addToast("Network error uploading files", "error");
    } finally {
      setLoading(false);
    }
  };
  // Compute physician ID safely
  const getPhysicianId = (): string | null => {
    if (!session?.user) return null;
    return session.user.role === "Physician"
      ? (session.user.id as string) || null
      : session.user.physicianId || null;
  };
  // Handle patient selection from recommendations
  const handlePatientSelect = (patient: Patient) => {
    console.log("Patient selected:", patient);
    setSelectedPatient(patient);
    // Fetch document data for the selected patient
    fetchDocumentData(patient);
  };
  // Handle mode switch - Updated: Only changes mode for search, does NOT refetch current data
  const switchMode = (val: "wc" | "gm") => {
    setMode(val);
    // Removed refetch logic: Data is now mode-specific from initial API fetch on patient select
    // Future searches will use the new mode, but current data remains unchanged
  };
  // Updated processAggregatedSummaries to handle grouped entries with brief_summary
  const processAggregatedSummaries = (grouped: {
    [key: string]: { date: string; summary: string; brief_summary: string }[];
  }): {
    document_summaries: DocumentSummary[];
    previous_summaries: { [key: string]: DocumentSummary };
  } => {
    const document_summaries: DocumentSummary[] = [];
    const previousByType: { [key: string]: DocumentSummary } = {};
    Object.entries(grouped).forEach(([type, entries]) => {
      // entries is array of {date, summary, brief_summary}
      if (!Array.isArray(entries)) return; // Safety check
      // Sort entries by date descending
      entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      entries.forEach((entry) => {
        document_summaries.push({
          type,
          date: entry.date,
          summary: entry.summary,
          brief_summary: entry.brief_summary,
        });
      });
      // Set previous if more than one
      if (entries.length > 1) {
        const prevEntry = entries[1];
        previousByType[type] = {
          type,
          date: prevEntry.date,
          summary: prevEntry.summary,
          brief_summary: prevEntry.brief_summary,
        };
      }
    });
    // Sort all summaries by date desc globally
    document_summaries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return { document_summaries, previous_summaries: previousByType };
  };
  // Fetch document data from API - Mode is now passed from initial search context
  const fetchDocumentData = async (patientInfo: Patient) => {
    const physicianId = getPhysicianId();
    if (!physicianId) {
      console.error("No physician ID available for document fetch");
      setError("Session not ready. Please refresh.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        patient_name: patientInfo.patientName || patientInfo.name || "",
        dob: patientInfo.dob,
        doi: patientInfo.doi,
        claim_number: patientInfo.claimNumber,
        physicianId: physicianId,
        mode: mode, // Mode-specific data fetched from API based on current search mode
      });
      console.log("Fetching document data with params:", params.toString());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/documents/document?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      const data: any = await response.json();
      console.log("Document data received:", data);
      if (!data.documents || data.documents.length === 0) {
        setDocumentData(null);
        setError(
          "No documents found. The document may not have complete patient information (patient name, DOB, DOI, claim number)."
        );
        return;
      }
      const latestDoc = data.documents[0]; // Latest document for top-level fields like adl, whats_new, etc.
      // Process whats_new to flat object, and set summaries in whats_new
      let processedWhatsNew: WhatsNew = {};
      let processedQuickNotes: QuickNoteSnapshot[] = [];
      if (
        latestDoc.whats_new &&
        Array.isArray(latestDoc.whats_new) &&
        latestDoc.whats_new.length > 0
      ) {
        const wnItem = latestDoc.whats_new[0];
        processedWhatsNew = {
          qme: wnItem.qme?.content || "",
          outcome: wnItem.outcome?.content || "",
          diagnosis: wnItem.diagnosis?.content || "",
          ur_decision: wnItem.ur_decision?.content || "",
          recommendations: wnItem.recommendations?.content || "",
        };
        if (wnItem.quick_note && Array.isArray(wnItem.quick_note)) {
          processedQuickNotes = wnItem.quick_note.map((note: any) => ({
            details: note.content || "",
            timestamp: note.document_created_at || "",
            one_line_note: note.description || "",
            status_update: "", // Can be derived if needed
          }));
        }
      }
      // Set summaries in whats_new
      if (latestDoc.brief_summary) {
        processedWhatsNew.brief_summary = latestDoc.brief_summary;
      }
      if (latestDoc.document_summary?.summary) {
        processedWhatsNew.detailed_summary = latestDoc.document_summary.summary;
      }
      if (latestDoc.document_summary?.type) {
        processedWhatsNew.summary_type = latestDoc.document_summary.type;
      }
      if (latestDoc.document_summary?.date) {
        processedWhatsNew.summary_date = latestDoc.document_summary.date;
      }
      // Group summaries and briefs across all documents by type
      const grouped: {
        [key: string]: {
          date: string;
          summary: string;
          brief_summary: string;
        }[];
      } = {};
      data.documents.forEach((doc: any) => {
        const docSum = doc.document_summary;
        const brief = doc.brief_summary || "";
        if (docSum && docSum.type) {
          const type = docSum.type;
          if (!grouped[type]) {
            grouped[type] = [];
          }
          grouped[type].push({
            date: docSum.date,
            summary: docSum.summary,
            brief_summary: brief,
          });
        }
      });
      const { document_summaries, previous_summaries } =
        processAggregatedSummaries(grouped);
      // Aggregate all body part snapshots from all documents, sorted by document_report_date descending
      const sortedDocs = [...data.documents].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const allBodyPartSnapshots = sortedDocs.flatMap((doc: any) =>
        (doc.body_part_snapshots || []).map(
          (snap: any): SummarySnapshotItem => ({
            id: snap.id,
            dx: snap.dx,
            keyConcern: snap.keyConcern,
            nextStep: snap.nextStep,
            documentId: snap.documentId,
            bodyPart: snap.bodyPart,
            urDecision: snap.urDecision,
            recommended: snap.recommended,
            aiOutcome: snap.aiOutcome,
            consultingDoctor: snap.consultingDoctor,
            document_created_at: snap.document_created_at,
            document_report_date: snap.document_report_date,
          })
        )
      );
      const processedData: DocumentData = {
        ...data, // Top-level fields like patient_name, total_documents, etc.
        dob: latestDoc.dob,
        doi: latestDoc.doi,
        claim_number: latestDoc.claim_number,
        created_at: latestDoc.created_at,
        documents: data.documents, // Keep full array for components like WhatsNewSection
        adl: latestDoc.adl, // ADL from latest doc
        whats_new: processedWhatsNew, // Processed flat object with summaries included
        brief_summary: latestDoc.brief_summary, // For backward compatibility
        document_summaries,
        previous_summaries,
        patient_quiz: data.patient_quiz,
        treatment_history: latestDoc.treatment_history,
        body_part_snapshots: allBodyPartSnapshots, // Set all aggregated body part snapshots
        quick_notes_snapshots: processedQuickNotes,
        gcs_file_link: latestDoc?.gcs_file_link,
        blob_path: latestDoc?.blob_path,
        file_name: latestDoc?.file_name,
        consulting_doctor:
          allBodyPartSnapshots[0]?.consultingDoctor ||
          latestDoc?.body_part_snapshots?.[0]?.consultingDoctor ||
          "Not specified",
        // Compute allVerified based on status of latest doc (or aggregate if needed)
        allVerified:
          !!latestDoc.status && latestDoc.status.toLowerCase() === "verified",
        // Handle summary_snapshots as aggregated body part snapshots
        summary_snapshots: allBodyPartSnapshots,
        // Set merge_metadata if total_documents >1
        ...(data.total_documents > 1 && {
          merge_metadata: {
            total_documents_merged: data.total_documents,
            is_merged: true,
            latest_document_date: latestDoc.created_at || "",
            previous_document_date: "", // Not available in aggregated; could derive from other docs if needed
          },
        }),
      };
      // Handle adl processing (convert arrays to strings if needed)
      if (processedData.adl) {
        const adlData = processedData.adl;
        adlData.adls_affected = Array.isArray(adlData.adls_affected)
          ? adlData.adls_affected.join(", ")
          : adlData.adls_affected || "Not specified";
        adlData.work_restrictions = Array.isArray(adlData.work_restrictions)
          ? adlData.work_restrictions.join(", ")
          : adlData.work_restrictions || "Not specified";
        adlData.adls_affected_history = adlData.adls_affected;
        adlData.work_restrictions_history = adlData.work_restrictions;
        adlData.has_changes = false;
      }
      setDocumentData(processedData);

      // Update URL with patient details and mode from document
      const docMode = latestDoc.mode || "wc";
      if (docMode !== mode) {
        setMode(docMode as "wc" | "gm");
      }
      const urlParams = new URLSearchParams(searchParams.toString());
      urlParams.set("patient_name", latestDoc.patient_name || "");
      urlParams.set("dob", latestDoc.dob || "");
      urlParams.set("claim_number", latestDoc.claim_number || "");
      urlParams.set("mode", docMode);
      router.replace(`?${urlParams.toString()}`, { scroll: false });

      // Fetch task quick notes for this patient - with strict patient matching
      try {
        const taskParams = new URLSearchParams({
          mode: docMode,
        });

        // Use claim number if available (most reliable), otherwise use patient name
        if (
          latestDoc.claim_number &&
          latestDoc.claim_number !== "Not specified"
        ) {
          taskParams.set("claim", latestDoc.claim_number);
        } else if (latestDoc.patient_name || patientInfo.patientName) {
          taskParams.set(
            "search",
            latestDoc.patient_name || patientInfo.patientName || ""
          );
        }

        const taskResponse = await fetch(`/api/tasks?${taskParams}`, {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        });
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();

          // Get patient identifiers for strict matching
          const patientName = (
            latestDoc.patient_name ||
            patientInfo.patientName ||
            ""
          )
            .toLowerCase()
            .trim();
          const claimNumber =
            latestDoc.claim_number && latestDoc.claim_number !== "Not specified"
              ? latestDoc.claim_number.toUpperCase().trim()
              : null;

          // Get all patient document IDs from documentData
          const patientDocumentIds = new Set<string>();
          if (data.documents && Array.isArray(data.documents)) {
            data.documents.forEach((doc: any) => {
              if (doc.id) {
                patientDocumentIds.add(doc.id);
              }
            });
          }

          // Extract quick notes from tasks - filter by patient and document ID matching
          const allTaskQuickNotes: QuickNoteSnapshot[] = [];
          if (taskData.tasks && Array.isArray(taskData.tasks)) {
            taskData.tasks.forEach((task: any) => {
              // Strict patient matching: check task.patient matches current patient
              const taskPatient = (task.patient || "").toLowerCase().trim();
              const taskClaim = task.document?.claimNumber
                ? task.document.claimNumber.toUpperCase().trim()
                : null;
              const taskDocumentId =
                task.documentId || task.document?.id || null;

              // Match by document ID first (most reliable if task has documentId)
              let patientMatches = false;
              if (taskDocumentId && patientDocumentIds.has(taskDocumentId)) {
                patientMatches = true;
              } else if (claimNumber && taskClaim) {
                // Match by claim number if available
                patientMatches = taskClaim === claimNumber;
              } else if (patientName && taskPatient) {
                // Match by patient name (exact or contains)
                patientMatches =
                  taskPatient === patientName ||
                  taskPatient.includes(patientName) ||
                  patientName.includes(taskPatient);
              }

              // Only include tasks with quick notes that match this patient and have meaningful content
              if (patientMatches && task.quickNotes) {
                const hasContent =
                  (task.quickNotes.status_update &&
                    task.quickNotes.status_update.trim()) ||
                  (task.quickNotes.one_line_note &&
                    task.quickNotes.one_line_note.trim()) ||
                  (task.quickNotes.details && task.quickNotes.details.trim());

                if (hasContent) {
                  allTaskQuickNotes.push({
                    details: task.quickNotes.details || "",
                    timestamp:
                      task.quickNotes.timestamp || task.updatedAt || "",
                    one_line_note: task.quickNotes.one_line_note || "",
                    status_update: task.quickNotes.status_update || "",
                  });
                }
              }
            });
          }

          // Sort by timestamp (most recent first) and limit to 5 most recent
          const sortedNotes = allTaskQuickNotes
            .sort((a, b) => {
              const timeA = new Date(a.timestamp || 0).getTime();
              const timeB = new Date(b.timestamp || 0).getTime();
              return timeB - timeA; // Most recent first
            })
            .slice(0, 5); // Limit to 5 most recent

          setTaskQuickNotes(sortedNotes);
        }
      } catch (err) {
        console.error("Error fetching task quick notes:", err);
        setTaskQuickNotes([]);
      }
    } catch (err: unknown) {
      console.error("Error fetching document data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  // Handle verify toggle with API call
  const handleVerifyToggle = async () => {
    if (documentData?.allVerified) return; // Already all verified, no action
    setIsVerified((prev) => !prev);
    if (!isVerified) {
      if (!selectedPatient || !documentData) {
        setError("No patient data available to verify.");
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
        // Optionally refetch document data to update status
        await fetchDocumentData(selectedPatient);
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
        setError(err instanceof Error ? err.message : "Verification failed");
        setIsVerified(false); // Revert on error
      } finally {
        setVerifyLoading(false);
      }
    }
  };
  // Handle copy text
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${fieldName} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  // Handle section copy - UPDATED TO INCLUDE BOTH SUMMARIES
  const handleSectionCopy = async (
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
        // Get both summaries
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
          q.appts.forEach((appt) => {
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
    // Clear previous timer if any
    if (timersRef.current[sectionId]) {
      clearTimeout(timersRef.current[sectionId]);
      delete timersRef.current[sectionId];
    }
    // Set copied state
    setCopied((prev) => ({ ...prev, [sectionId]: true }));
    // Set timer to reset
    timersRef.current[sectionId] = setTimeout(() => {
      setCopied((prev) => {
        const newCopied = { ...prev };
        delete newCopied[sectionId];
        return newCopied;
      });
      delete timersRef.current[sectionId];
    }, 2000);
  };
  // Handle show previous summary
  const handleShowPrevious = (type: string) => {
    const previous = documentData?.previous_summaries?.[type];
    if (previous) {
      setPreviousSummary(previous);
      setShowPreviousSummary(true);
      setShowModal(false);
    }
  };
  // Handle modal open
  const openModal = (briefSummary: string) => {
    setSelectedBriefSummary(briefSummary);
    setShowModal(true);
    setShowPreviousSummary(false);
  };
  // Auto-set verified if all documents are verified
  useEffect(() => {
    if (documentData?.allVerified) {
      setIsVerified(true);
    }
  }, [documentData?.allVerified]);

  // Fetch recent patients for popup
  useEffect(() => {
    const fetchRecentPatientsForPopup = async () => {
      try {
        const url = `/api/get-recent-patients?mode=${mode}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setRecentPatientsList(data);
      } catch (err) {
        console.error("Error fetching recent patients for popup:", err);
      }
    };

    fetchRecentPatientsForPopup();
  }, [mode]);
  // Format date from ISO string to MM/DD/YYYY
  const formatDate = (dateString: string | undefined): string => {
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
  };
  // Helper for timestamp formatting (used in copy handler)
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };
  // Format date for display (Visit date)
  const getVisitDate = (): string => {
    return documentData?.created_at
      ? formatDate(documentData.created_at)
      : "Not specified";
  };

  // Format date for recent patients popup (MM/DD/YYYY)
  const formatShortDate = (
    dateString: string | Date | null | undefined
  ): string => {
    if (!dateString) return "";
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch {
      return "";
    }
  };

  // Get document type for recent patients popup
  const getDocType = (patient: any): string => {
    if (patient.documentType) {
      return patient.documentType;
    }
    if (patient.documentCount > 0) {
      return `${patient.documentCount} document(s)`;
    }
    return "Unknown";
  };

  // Helper to format date to YYYY-MM-DD string
  const formatDateToString = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Fetch search results from API
  const fetchSearchResults = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const currentPhysicianId = getPhysicianId();

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
    [mode]
  );

  // Debounce function
  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchSearchResults(query);
    }, 300),
    [fetchSearchResults]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  // Filter recent patients based on search query
  const filteredRecentPatients = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return recentPatientsList;
    }
    const query = searchQuery.toLowerCase();
    return recentPatientsList.filter(
      (patient) =>
        patient.patientName?.toLowerCase().includes(query) ||
        patient.claimNumber?.toLowerCase().includes(query) ||
        patient.dob?.toLowerCase().includes(query)
    );
  }, [recentPatientsList, searchQuery]);

  // Handle selecting a search result patient
  const handleSearchResultSelect = (patient: Patient) => {
    handlePatientSelect(patient);
    setSearchQuery("");
    setSearchResults([]);
    setRecentPatientsVisible(false);
  };
  // Get current patient info for display
  const getCurrentPatientInfo = (): Patient => {
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
  };
  const currentPatient = getCurrentPatientInfo();
  console.log(currentPatient, "currentPatient");
  // Extract document ID from the latest document (assuming 'id' or 'document_id' field exists)
  const documentId =
    documentData?.documents?.[0]?.id ||
    documentData?.documents?.[0]?.document_id ||
    "";
  // Dynamic href for Staff Dashboard link, including document_id if available
  const staffDashboardHref =
    selectedPatient && documentData && documentId
      ? `/staff-dashboard?patient_name=${encodeURIComponent(
          currentPatient.patientName
        )}&dob=${encodeURIComponent(
          currentPatient.dob || ""
        )}&claim=${encodeURIComponent(
          currentPatient.claimNumber
        )}&document_id=${encodeURIComponent(documentId)}`
      : selectedPatient
      ? `/staff-dashboard?patient_name=${encodeURIComponent(
          currentPatient.patientName
        )}&dob=${encodeURIComponent(
          currentPatient.dob || ""
        )}&claim=${encodeURIComponent(currentPatient.claimNumber)}`
      : "/staff-dashboard";
  const rebutalHre =
    selectedPatient && documentData && documentId
      ? `/generate-rebuttal?patient_name=${encodeURIComponent(
          currentPatient.patientName
        )}&dob=${encodeURIComponent(
          currentPatient.dob || ""
        )}&claim=${encodeURIComponent(
          currentPatient.claimNumber
        )}&document_id=${encodeURIComponent(documentId)}`
      : selectedPatient
      ? `/generate-rebuttal?patient_name=${encodeURIComponent(
          currentPatient.patientName
        )}&dob=${encodeURIComponent(
          currentPatient.dob || ""
        )}&claim=${encodeURIComponent(currentPatient.claimNumber)}`
      : "/generate-rebuttal";
  // Burger Icon Component
  const BurgerIcon = () => (
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
  );
  // Onboarding Help Button
  const OnboardingHelpButton = () => (
    <button
      className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center z-40"
      onClick={startOnboarding}
      title="Show onboarding tour"
    >
      ?
    </button>
  );
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
  const physicianId = getPhysicianId();

  // Calculate visit count from document summaries
  const visitCount = documentData?.document_summaries?.length || 0;

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #f5f7fa;
          --card: #ffffff;
          --ink: #111827;
          --muted: #6b7280;
          --border: #e5e7eb;
          --accent: #3f51b5;
          --accent2: #1a237e;
          --chip: #eef2ff;
          --chip2: #e8f5e9;
        }
        * {
          box-sizing: border-box;
        }
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }
        body {
          font-family: Arial, sans-serif;
          background: var(--bg);
          margin: 0;
          padding: 0;
          color: var(--ink);
        }
        .main-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid var(--border);
          z-index: 1000;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .main-header .logo-container {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .main-content {
          margin-top: 64px;
          padding: 20px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .patient-header {
          background: var(--card);
          padding: 14px 16px;
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .patient-name {
          font-size: 18px;
          font-weight: 700;
          margin-right: 4px;
        }
        .tag {
          background: var(--chip);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 13px;
          color: var(--ink);
        }
        .tag.good {
          background: var(--chip2);
        }
        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
          align-items: start;
          max-width: 100%;
        }
        .panel {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .panel-h {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
        }
        .panel-h .title {
          font-weight: 800;
        }
        .panel-h .meta {
          font-size: 12px;
          color: var(--muted);
        }
        .panel-body {
          padding: 12px 14px;
          overflow: hidden;
        }
        .section-scroll {
          max-height: 420px;
          overflow: auto;
          padding: 10px 10px 12px;
        }
        .recent-item {
          padding: 10px 14px;
          border-top: 1px solid var(--border);
          font-size: 13px;
        }
        .recent-item:first-child {
          border-top: none;
        }
        /* Staff status chips (horizontal scroll) */
        .status-wrap {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-wrap: nowrap;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
        }
        .status-wrap > .s-chip {
          scroll-snap-align: start;
        }
        .status-wrap::-webkit-scrollbar {
          height: 6px;
        }
        .status-wrap::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 999px;
        }
        .status-wrap::-webkit-scrollbar-track {
          background: transparent;
        }
        .s-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: #fff;
          font-size: 12px;
          font-weight: 800;
          color: var(--ink);
          flex: 0 0 auto;
        }
        .s-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #9ca3af;
        }
        .s-dot.red {
          background: #ef4444;
        }
        .s-dot.amber {
          background: #f59e0b;
        }
        .s-dot.green {
          background: #22c55e;
        }
        .s-dot.blue {
          background: #3b82f6;
        }
        .s-dot.gray {
          background: #9ca3af;
        }
        .s-chip.small {
          padding: 6px 12px;
          font-weight: 800;
        }
        .floating-new-order {
          position: fixed;
          bottom: 18px;
          right: 18px;
          background: var(--accent);
          color: #fff;
          padding: 12px 16px;
          border-radius: 999px;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          z-index: 9999;
        }
      `}</style>

      {/* Fixed Header - Outside Layout */}
      <div className="main-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Toggle sidebar"
          >
            <BurgerIcon />
          </button>
          <div className="logo-container">
            <img
              src="/logo.png"
              alt="DocLatch Logo"
              style={{ height: "80px", maxHeight: "80px", width: "auto" }}
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
          {/* {session.user.role === "Physician" && (
            <Link href={rebutalHre} ref={staffButtonRef}>
              <button className="font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                Generate Rebuttal
              </button>
            </Link>
          )} */}
          <select
            id="mode"
            className="bg-indigo-50 text-gray-900 border border-blue-200 rounded-lg p-2 font-semibold focus:outline-none"
            value={mode}
            onChange={(e) => switchMode(e.target.value as "wc" | "gm")}
            ref={modeSelectorRef}
            title="Filter search by mode (Workers Comp or General Medicine)"
          >
            <option value="wc">Workers Comp</option>
            <option value="gm">General Medicine</option>
          </select>
        </div>
      </div>

      <div
        className="main-content"
        style={{
          fontFamily: "Arial, sans-serif",
          background: "var(--bg)",
          color: "var(--ink)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Onboarding Tour */}
        <PhysicianOnboardingTour
          isOpen={showOnboarding}
          onClose={closeOnboarding}
          currentStep={currentStep}
          onNext={nextStep}
          onPrevious={previousStep}
          steps={onboardingSteps}
          stepPositions={stepPositions}
        />
        {/* Welcome Modal */}
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        />
        {/* Onboarding Help Button */}
        <OnboardingHelpButton />

        {/* Upload Section */}
        <div style={{ marginBottom: "14px" }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {files.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
              <span className="text-sm text-gray-600">
                Selected: {files.map((f) => f.name).join(", ")}
              </span>
              <button
                onClick={handleUpload}
                className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
                disabled={loading}
              >
                Queue for Processing
              </button>
              <button
                onClick={() => {
                  setFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              marginBottom: "14px",
              padding: "16px",
              background: "#dbeafe",
              border: "1px solid #93c5fd",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p style={{ color: "#1e40af" }}>Loading patient data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              marginBottom: "14px",
              padding: "16px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "14px",
            }}
          >
            <div
              style={{ color: "#dc2626", fontWeight: 600, marginBottom: "8px" }}
            >
              Error
            </div>
            <p style={{ color: "#991b1b" }}>{error}</p>
            <button
              onClick={() =>
                selectedPatient && fetchDocumentData(selectedPatient)
              }
              style={{
                marginTop: "8px",
                background: "#dc2626",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Patient Header Topbar - Show when patient is selected */}
        {selectedPatient && documentData && (
          <div className="topbar">
            <div className="patient-header">
              <div className="patient-name">{currentPatient.patientName}</div>
              <div className="tag">DOB: {formatDate(currentPatient.dob)}</div>
              <div className="tag">Claim: {currentPatient.claimNumber}</div>
              <div className="tag">DOI: {formatDate(currentPatient.doi)}</div>
              {visitCount > 0 && (
                <div className="tag good">
                  {visitCount} {visitCount === 1 ? "Visit" : "Visits"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid">
          <div>
            {!selectedPatient && !documentData ? (
              <div
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "var(--muted)" }}>
                  Click the Recent Patients button to search and select a
                  patient
                </p>
              </div>
            ) : (
              <>
                {/* Staff Status Section - Quick Notes */}
                {documentData && (
                  <div className="panel" style={{ marginBottom: "14px" }}>
                    <div className="panel-h">
                      <div>
                        <div className="title">Staff Status</div>
                        <div className="meta">Patient-specific • Read-only</div>
                      </div>
                    </div>
                    <div className="panel-body">
                      {(() => {
                        // Filter document quick notes - only show ones with meaningful content
                        // Note: documentData is already patient-specific (fetched by patient_name, dob, claim_number)
                        // So quick_notes_snapshots are already for this patient
                        const filteredDocNotes =
                          documentData.quick_notes_snapshots?.filter((note) => {
                            const hasContent =
                              (note.status_update &&
                                note.status_update.trim()) ||
                              (note.one_line_note &&
                                note.one_line_note.trim()) ||
                              (note.details && note.details.trim());
                            return hasContent;
                          }) || [];

                        // Limit document notes to 3 most recent
                        const limitedDocNotes = filteredDocNotes
                          .sort((a, b) => {
                            const timeA = new Date(a.timestamp || 0).getTime();
                            const timeB = new Date(b.timestamp || 0).getTime();
                            return timeB - timeA; // Most recent first
                          })
                          .slice(0, 3);

                        const hasNotes =
                          limitedDocNotes.length > 0 ||
                          (taskQuickNotes && taskQuickNotes.length > 0);

                        return hasNotes ? (
                          <div className="status-wrap">
                            {/* Document Quick Notes */}
                            {limitedDocNotes.map((note, index) => {
                              // Determine status color based on status_update or content
                              const getStatusColor = () => {
                                const status = (
                                  note.status_update || ""
                                ).toLowerCase();
                                if (
                                  status.includes("urgent") ||
                                  status.includes("critical") ||
                                  status.includes("time-sensitive")
                                ) {
                                  return "red";
                                }
                                if (
                                  status.includes("pending") ||
                                  status.includes("waiting") ||
                                  status.includes("scheduling")
                                ) {
                                  return "amber";
                                }
                                if (
                                  status.includes("completed") ||
                                  status.includes("done") ||
                                  status.includes("approved")
                                ) {
                                  return "green";
                                }
                                if (
                                  status.includes("authorization") ||
                                  status.includes("decision")
                                ) {
                                  return "blue";
                                }
                                return "gray";
                              };

                              const statusColor = getStatusColor();
                              // Build display text: prefer status_update, then one_line_note, then details
                              let displayText = "";
                              if (note.status_update) {
                                displayText = note.status_update;
                                // Append one_line_note if available and different
                                if (
                                  note.one_line_note &&
                                  note.one_line_note !== note.status_update
                                ) {
                                  displayText += ` — ${note.one_line_note}`;
                                }
                              } else if (note.one_line_note) {
                                displayText = note.one_line_note;
                              } else if (note.details) {
                                // Truncate details if too long
                                displayText =
                                  note.details.length > 50
                                    ? note.details.substring(0, 50) + "..."
                                    : note.details;
                              } else {
                                displayText = "Quick Note";
                              }

                              return (
                                <div
                                  key={`doc-note-${index}`}
                                  className="s-chip small"
                                  title={note.details || displayText}
                                >
                                  <span
                                    className={`s-dot ${statusColor}`}
                                  ></span>
                                  {displayText}
                                </div>
                              );
                            })}
                            {/* Task Quick Notes */}
                            {taskQuickNotes &&
                              taskQuickNotes.map((note, index) => {
                                // Determine status color based on status_update or content
                                const getStatusColor = () => {
                                  const status = (
                                    note.status_update || ""
                                  ).toLowerCase();
                                  if (
                                    status.includes("urgent") ||
                                    status.includes("critical") ||
                                    status.includes("time-sensitive")
                                  ) {
                                    return "red";
                                  }
                                  if (
                                    status.includes("pending") ||
                                    status.includes("waiting") ||
                                    status.includes("scheduling")
                                  ) {
                                    return "amber";
                                  }
                                  if (
                                    status.includes("completed") ||
                                    status.includes("done") ||
                                    status.includes("approved")
                                  ) {
                                    return "green";
                                  }
                                  if (
                                    status.includes("authorization") ||
                                    status.includes("decision")
                                  ) {
                                    return "blue";
                                  }
                                  return "gray";
                                };

                                const statusColor = getStatusColor();
                                // Build display text: prefer status_update, then one_line_note, then details
                                let displayText = "";
                                if (note.status_update) {
                                  displayText = note.status_update;
                                  // Append one_line_note if available and different
                                  if (
                                    note.one_line_note &&
                                    note.one_line_note !== note.status_update
                                  ) {
                                    displayText += ` — ${note.one_line_note}`;
                                  }
                                } else if (note.one_line_note) {
                                  displayText = note.one_line_note;
                                } else if (note.details) {
                                  // Truncate details if too long
                                  displayText =
                                    note.details.length > 50
                                      ? note.details.substring(0, 50) + "..."
                                      : note.details;
                                } else {
                                  displayText = "Quick Note";
                                }

                                return (
                                  <div
                                    key={`task-note-${index}`}
                                    className="s-chip small"
                                    title={note.details || displayText}
                                  >
                                    <span
                                      className={`s-dot ${statusColor}`}
                                    ></span>
                                    {displayText}
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--muted)",
                              textAlign: "center",
                              padding: "20px",
                            }}
                          >
                            No staff status updates available
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* What's New Section */}
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
                        {documentData?.documents?.length === 1
                          ? "item"
                          : "items"}
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
                        onCopySection={handleSectionCopy}
                        isCollapsed={collapsedSections.whatsNew}
                        onToggle={() => toggleSection("whatsNew")}
                      />
                    </div>
                  </div>
                )}

                {/* Treatment History Section */}
                {documentData && (
                  <div className="panel" style={{ marginBottom: "14px" }}>
                    <div className="panel-h">
                      <div>
                        <div className="title">Treatment History</div>
                        <div className="meta">
                          Summary snapshots and history
                        </div>
                      </div>
                    </div>
                    <div className="panel-body">
                      <TreatmentHistorySection
                        documentData={documentData}
                        mode={mode}
                        copied={copied}
                        onCopySection={handleSectionCopy}
                        isCollapsed={false}
                        onToggle={() => {}}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Floating New Order Button */}
        <div
          className="floating-new-order"
          onClick={() => setShowManualTaskModal(true)}
        >
          + New Order
        </div>

        {/* Recent Patients Toggle */}
        <div
          className={`fixed right-0 top-1/2 -translate-y-1/2 bg-[#3f51b5] text-white p-[10px_12px] rounded-l-[12px] shadow-[0_8px_18px_rgba(0,0,0,0.18)] cursor-pointer z-[9998] font-extrabold text-[13px] flex items-center gap-2 ${
            recentPatientsVisible ? "checked" : ""
          }`}
          onClick={() => setRecentPatientsVisible(!recentPatientsVisible)}
        >
          <span className="[writing-mode:vertical-rl] rotate-180 tracking-[0.02em]">
            Recent Patients
          </span>
          <div
            className={`[writing-mode:horizontal-tb] text-[16px] leading-[1] ${
              recentPatientsVisible ? "rotate-180" : ""
            }`}
          >
            ◀
          </div>
        </div>

        {/* Recent Patients Panel - Fixed Position next to toggle */}
        {recentPatientsVisible && (
          <div className="fixed right-[60px] top-1/2 -translate-y-1/2 z-[9997]">
            <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] overflow-hidden w-[320px]">
              <div className="flex items-center justify-between p-[12px_14px] border-b border-[#e5e7eb]">
                <div className="font-extrabold">Recent Patients</div>
                <div className="text-[12px] text-[#6b7280]">
                  Quick jump list
                </div>
              </div>

              {/* Search Input */}
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                />
              </div>

              <div className="p-0 max-h-[400px] overflow-y-auto">
                {/* Search Results */}
                {searchQuery.trim() && (
                  <>
                    {searchLoading ? (
                      <div className="p-[10px_14px] text-[13px] text-center text-[#6b7280]">
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div
                          style={{
                            padding: "8px 14px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Search Results
                        </div>
                        {searchResults.map((patient, index) => (
                          <div
                            key={patient.id || index}
                            className="p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleSearchResultSelect(patient)}
                          >
                            {patient.patientName}
                            {patient.claimNumber &&
                              patient.claimNumber !== "Not specified" && (
                                <> • Claim: {patient.claimNumber}</>
                              )}
                            {patient.dob && (
                              <> • DOB: {formatShortDate(patient.dob)}</>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-[10px_14px] text-[13px] text-center text-[#6b7280]">
                        No patients found
                      </div>
                    )}
                  </>
                )}

                {/* Recent Patients List - Only show when no search query */}
                {!searchQuery.trim() && (
                  <>
                    {recentPatientsList.length === 0 ? (
                      <div className="p-[10px_14px] text-[13px] text-center text-[#6b7280]">
                        No patients found
                      </div>
                    ) : (
                      filteredRecentPatients.map((patient, index) => (
                        <div
                          key={index}
                          className="p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            // Format dob to string if it's a Date object
                            let dobString = "";
                            if (patient.dob) {
                              if (patient.dob instanceof Date) {
                                dobString = patient.dob
                                  .toISOString()
                                  .split("T")[0];
                              } else {
                                dobString = String(patient.dob);
                              }
                            }

                            handlePatientSelect({
                              patientName: patient.patientName,
                              dob: dobString,
                              claimNumber: patient.claimNumber || "",
                              doi: "", // DOI will be fetched when document data is loaded
                            });
                            setRecentPatientsVisible(false);
                          }}
                        >
                          {patient.patientName} — {getDocType(patient)} •{" "}
                          {formatShortDate(patient.createdAt)}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Sidebar Overlay - Closes on click */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`sidebar-container fixed top-0 left-0 h-full w-80 z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full">
          <Sidebar />
        </div>
      </div>
      {/* Toasts */}
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
      {/* Brief Summary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Brief Summary</h3>
              <p className="text-gray-700 whitespace-pre-wrap mb-6">
                {selectedBriefSummary}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Previous Summary Modal */}
      {showPreviousSummary && previousSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
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
                onClick={() => openModal(previousSummary.brief_summary || "")}
                className="mr-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                View Brief
              </button>
              <button
                onClick={() => setShowPreviousSummary(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Task Modal */}
      <aside>
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
            currentPatient.claimNumber !== "Not specified"
              ? currentPatient.claimNumber
              : undefined
          }
          defaultPatient={
            selectedPatient ? currentPatient.patientName : undefined
          }
          defaultDocumentId={documentId || undefined}
          onSubmit={async (data) => {
            try {
              const response = await fetch("/api/add-manual-task", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...data,
                  physicianId: getPhysicianId(),
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
      </aside>
    </>
  );
}
