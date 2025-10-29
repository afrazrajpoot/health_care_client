// pages/PhysicianCard.tsx (or app/physician-card/page.tsx)
"use client";

import { Sidebar } from "@/components/navigation/sidebar";
import ADLSection from "@/components/physician-components/ADLSection";
import DocumentSummarySection from "@/components/physician-components/DocumentSummarySection";
import PatientQuizSection from "@/components/physician-components/PatientQuizSection";
import PhysicianOnboardingTour from "@/components/physician-components/PhysicianOnboardingTour";
import TreatmentHistorySection from "@/components/physician-components/TreatmentHistorySection";
import { WelcomeModal } from "@/components/physician-components/WelcomeModal";
import WhatsNewSection from "@/components/physician-components/WhatsNewSection";
import SearchBar from "@/components/SearchBar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
// import SearchBar from "@/components/SearchBar"; // Adjust path as needed

// Define TypeScript interfaces for data structures
interface Patient {
  id?: number;
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
  quick_notes_snapshots?: QuickNoteSnapshot[]; // ✅ Added interface for quick notes snapshots
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
  gcs_file_link?: string; // Signed GCS URL for view file
  blob_path?: string; // Blob path for preview (e.g., "uploads/filename.ext")
  documents?: any[]; // Added to hold the full documents array
  body_part_snapshots?: any[];
}

export default function PhysicianCard() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Refs for onboarding target elements
  const staffButtonRef = useRef<HTMLAnchorElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const modeSelectorRef = useRef<HTMLSelectElement>(null);
  const patientCardRef = useRef<HTMLDivElement>(null);

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({
    whatsNew: false,
    treatmentHistory: true,
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
    {
      title: "Patient Search",
      content:
        "Search for patients by name to view their medical records and physician cards.",
      target: searchBarRef,
    },
    // {
    //   title: "Mode Selection",
    //   content:
    //     "Toggle between Workers Comp and General Medicine modes to filter data accordingly.",
    //   target: modeSelectorRef,
    // },
    // {
    //   title: "Patient Information",
    //   content:
    //     "View comprehensive patient data including visit history, treatment summaries, and ADL status.",
    //   target: patientCardRef,
    // },
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

    // Position for Search Bar
    if (searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
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

  const { data: session, status } = useSession();
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
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        addToast(`Failed to queue files: ${errorText}`, "error");
        return;
      }

      const data = await response.json();
      const taskIds = data.task_ids || [];
      files.forEach((file, index) => {
        const taskId = taskIds[index] || "unknown";
        addToast(
          `File "${file.name}" successfully queued for processing. Task ID: ${taskId}`,
          "success"
        );
      });

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
      ? session.user.id
      : session.user.physicianId;
  };

  // Handle patient selection from recommendations
  const handlePatientSelect = (patient: Patient) => {
    console.log("Patient selected:", patient);
    setSelectedPatient(patient);

    // Fetch document data for the selected patient
    fetchDocumentData(patient);
  };

  // Handle mode switch
  const switchMode = (val: "wc" | "gm") => {
    setMode(val);
    if (selectedPatient) {
      fetchDocumentData(selectedPatient);
    }
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

  // Fetch document data from API
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
        mode: mode,
      });

      console.log("Fetching document data with params:", params.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/document?${params}`
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

      // Process whats_new to flat object
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
        whats_new: processedWhatsNew, // Processed flat object
        brief_summary: latestDoc.brief_summary, // For backward compatibility
        document_summaries,
        previous_summaries,
        patient_quiz: data.patient_quiz,
        body_part_snapshots: allBodyPartSnapshots, // Set all aggregated body part snapshots
        quick_notes_snapshots: processedQuickNotes,
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
      // Optional: Show toast or feedback
      console.log(`${fieldName} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Handle section copy
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
        text = "What's New Since Last Visit\n";
        const wn = doc?.whats_new;
        if (wn) {
          Object.entries(wn).forEach(([key, value]) => {
            if (value && value.trim() !== "" && value.trim() !== " ") {
              const label = key.toUpperCase().replace(/_/g, " ");
              text += `${label}: ${value}\n`;
            }
          });
        }
        if (!text.includes(":")) {
          text += "No significant changes since last visit";
        }
        // ✅ Append quick notes to copy text (sorted)
        const sortedNotes = (doc?.quick_notes_snapshots || [])
          .filter(
            (note) =>
              note.status_update?.trim() ||
              note.one_line_note?.trim() ||
              note.details?.trim()
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        if (sortedNotes.length > 0) {
          text += "\nQuick Notes:\n";
          sortedNotes.forEach((note) => {
            text += `- ${formatTimestamp(note.timestamp)}: ${
              note.status_update || "Note"
            } - ${note.one_line_note || ""} (${note.details || ""})\n`;
          });
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

  // Format date from ISO string to MM/DD/YYYY
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // ✅ Helper for timestamp formatting (used in copy handler)
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
    return documentData?.created_at ? formatDate(documentData.created_at) : "—";
  };

  // Get current patient info for display
  const getCurrentPatientInfo = (): Patient => {
    if (documentData) {
      return {
        patientName: documentData.patient_name || "Select a patient",
        dob: documentData.dob || "—",
        doi: documentData.doi || "—",
        claimNumber: documentData.claim_number || "—",
      };
    }
    if (selectedPatient) {
      return {
        patientName:
          selectedPatient.patientName ||
          selectedPatient.name ||
          "Select a patient",
        dob: selectedPatient.dob || "—",
        doi: selectedPatient.doi || "—",
        claimNumber: selectedPatient.claimNumber || "—",
      };
    }
    return {
      patientName: "Select a patient",
      dob: "—",
      doi: "—",
      claimNumber: "—",
    };
  };

  const currentPatient = getCurrentPatientInfo();
  console.log(currentPatient, "currentPatient");
  // Dynamic href for Staff Dashboard link
  const staffDashboardHref = selectedPatient
    ? `/staff-dashboard?patient_name=${encodeURIComponent(
        currentPatient.patientName
      )}&dob=${encodeURIComponent(
        currentPatient.dob
      )}&claim=${encodeURIComponent(currentPatient.claimNumber)}`
    : "/staff-dashboard";

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

  return (
    <>
      <div className="min-h-screen font-sans bg-blue-50 text-gray-900 relative">
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

        {/* Full-width header for burger at left edge */}
        <div className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-blue-200">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Toggle sidebar"
          >
            <BurgerIcon />
          </button>
          <div className="font-bold absolute left-[5vw]">
            Kebilo Physician Dashboard
          </div>
          <div className="flex items-center gap-4">
            <Link href={staffDashboardHref} ref={staffButtonRef}>
              <button className="font-bold bg-blue-500 text-white px-4 py-2 rounded">
                Staff Dashboard
              </button>
            </Link>

            <select
              id="mode"
              className="bg-indigo-50 text-gray-900 border border-blue-200 rounded-lg p-2 font-semibold focus:outline-none"
              value={mode}
              onChange={(e) => switchMode(e.target.value as "wc" | "gm")}
              ref={modeSelectorRef}
            >
              <option value="wc">Workers Comp</option>
              <option value="gm">General Medicine</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            {/* Search Bar */}
            <div ref={searchBarRef}>
              <SearchBar
                physicianId={physicianId}
                mode={mode}
                onPatientSelect={handlePatientSelect}
              />
            </div>

            {/* Upload Section */}
            <div className="mb-6">
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
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading patient data...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="text-red-500 font-semibold mb-2">Error</div>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() =>
                    selectedPatient && fetchDocumentData(selectedPatient)
                  }
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {!selectedPatient && !documentData ? (
              <div className="bg-white border border-blue-200 rounded-2xl shadow-sm p-8 text-center">
                <div className="text-gray-500 text-lg mb-4">
                  👆 Search for a patient above to get started
                </div>
                <p className="text-gray-400">
                  Type a patient name in the search bar to view their physician
                  card
                </p>
              </div>
            ) : (
              <div
                className="bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden"
                role="region"
                aria-label="Physician-facing card"
                ref={patientCardRef}
              >
                {/* Header with merge indicator */}
                <div className="grid grid-cols-[1fr_auto] gap-3 items-center p-5 bg-blue-50 border-b border-blue-200">
                  <div
                    className="flex flex-wrap gap-x-4 gap-y-2"
                    aria-label="Patient summary"
                  >
                    <div className="bg-[#dcfce7] border border-blue-200 px-2 py-1 rounded-full text-sm">
                      Patient: <b>{currentPatient.patientName}</b>
                    </div>
                    <div className="bg-[#ede9fe] text-[#6b21a8] border border-blue-200 px-2 py-1 rounded-full text-sm">
                      DOB: {formatDate(currentPatient.dob)}
                    </div>
                    <div className="bg-[#e0f2fe] text-[#0369a1] border border-blue-200 px-2 py-1 rounded-full text-sm">
                      Claim #: {currentPatient.claimNumber}
                    </div>
                    <div className="bg-[#fef3c7] text-[#92400e] border border-blue-200 px-2 py-1 rounded-full text-sm">
                      DOI: {formatDate(currentPatient.doi)}
                    </div>
                    {documentData?.merge_metadata?.is_merged && (
                      <div className="bg-amber-100 border border-amber-300 px-2 py-1 rounded-full text-sm">
                        🔄 Combined{" "}
                        {documentData.merge_metadata.total_documents_merged}{" "}
                        visits
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="bg-blue-100 text-gray-900 border border-blue-200 px-2 py-1 rounded-full text-xs font-bold">
                      PR‑2
                    </span>
                    <span className="bg-indigo-50 text-gray-900 border border-blue-200 px-2 py-1 rounded-full text-xs font-bold">
                      Visit: {getVisitDate()}
                    </span>
                  </div>
                </div>

                {/* Physician Verified Row - Only show for Physicians */}
                {session.user.role === "Physician" && (
                  <div className="flex justify-between items-center p-3 border-b border-blue-200 bg-gray-50">
                    <div className="flex gap-2 items-center text-sm">
                      <label
                        className="relative inline-block w-14 h-8"
                        aria-label="Physician Verified"
                      >
                        <input
                          id="verifyToggle"
                          type="checkbox"
                          className="opacity-0 w-0 h-0"
                          checked={isVerified}
                          onChange={handleVerifyToggle}
                          disabled={verifyLoading || documentData?.allVerified}
                        />
                        <span
                          className={`absolute inset-0 bg-gray-300 border border-blue-200 rounded-full cursor-pointer transition duration-200 ${
                            isVerified ? "bg-green-100 border-green-300" : ""
                          } ${
                            verifyLoading || documentData?.allVerified
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`absolute h-6 w-6 bg-white rounded-full top-0.5 left-0.5 transition-transform duration-200 ${
                              isVerified ? "translate-x-6" : ""
                            } shadow`}
                          ></span>
                        </span>
                      </label>
                      {verifyLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      )}
                      <span
                        id="verifyBadge"
                        className={`px-2 py-1 rounded-full border border-green-300 bg-green-50 text-green-800 font-bold ${
                          isVerified ? "inline-block" : "hidden"
                        }`}
                      >
                        Verified ✓
                      </span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      Last verified: <span id="verifyTime">{verifyTime}</span>
                    </div>
                  </div>
                )}

                {/* Render Sub-Components - Using Treatment History as Summary Snapshot */}
                <WhatsNewSection
                  documentData={documentData}
                  copied={copied}
                  onCopySection={handleSectionCopy}
                  isCollapsed={collapsedSections.whatsNew}
                  onToggle={() => toggleSection("whatsNew")}
                />
                <TreatmentHistorySection
                  documentData={documentData}
                  copied={copied}
                  onCopySection={handleSectionCopy}
                  isCollapsed={collapsedSections.treatmentHistory}
                  onToggle={() => toggleSection("treatmentHistory")}
                />
                <ADLSection
                  documentData={documentData}
                  copied={copied}
                  onCopySection={handleSectionCopy}
                  isCollapsed={collapsedSections.adlWorkStatus}
                  onToggle={() => toggleSection("adlWorkStatus")}
                />
                <DocumentSummarySection
                  documentData={documentData}
                  openModal={openModal}
                  handleShowPrevious={handleShowPrevious}
                  copied={copied}
                  onCopySection={handleSectionCopy}
                  isCollapsed={collapsedSections.documentSummary}
                  onToggle={() => toggleSection("documentSummary")}
                />
                <PatientQuizSection
                  documentData={documentData}
                  copied={copied}
                  onCopySection={handleSectionCopy}
                />
              </div>
            )}

            {/* Refresh button - only show when patient is selected */}
            {selectedPatient && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => fetchDocumentData(selectedPatient)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  disabled={loading}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loading ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            )}
          </div>
        </div>
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
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
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
    </>
  );
}
