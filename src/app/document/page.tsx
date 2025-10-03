"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Define TypeScript interfaces for data structures
interface Patient {
  id?: number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface SummarySnapshotItem {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
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
  adl?: ADL;
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: DocumentSummary[];
  merge_metadata?: {
    total_documents_merged: number;
    is_merged: boolean;
    latest_document_date: string;
    previous_document_date: string;
  };
  previous_summaries?: { [key: string]: DocumentSummary };
  allVerified?: boolean;
}

interface RecommendationsResponse {
  success: boolean;
  data: {
    patients?: Patient[];
    patientNames?: string[];
    dobs?: string[];
    dois?: string[];
    claimNumbers?: string[];
  };
}

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Summary Snapshot Component
const SummarySnapshotSection = ({
  documentData,
  copied,
  onCopySection,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string, index?: number) => void;
}) => {
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0);
  const snapshots = documentData?.summary_snapshots || [];

  useEffect(() => {
    setCurrentSnapshotIndex(0); // Reset to latest on data change
  }, [documentData]);

  const currentSnapshot = snapshots[currentSnapshotIndex];

  const handlePreviousSnapshot = () => {
    if (currentSnapshotIndex < snapshots.length - 1) {
      setCurrentSnapshotIndex((prev) => prev + 1);
    }
  };

  const handleLatestSnapshot = () => {
    setCurrentSnapshotIndex(0);
  };

  const formatSnapshotText = () => {
    if (!currentSnapshot) return "Not specified";
    return `Dx: ${currentSnapshot.dx || "Not specified"}\nKey Concern: ${
      currentSnapshot.keyConcern || "Not specified"
    }\nNext Step: ${currentSnapshot.nextStep || "Not specified"}`;
  };

  const sectionId = `section-snapshot-${currentSnapshotIndex}`;

  return (
    <section
      className="p-5 bg-blue-100 border-b border-blue-200"
      aria-labelledby="snapshot-title"
    >
      <h3
        className="flex gap-2 items-center mb-3 text-base font-semibold"
        id="snapshot-title"
      >
        📌 Summary (Snapshot)
        {snapshots.length > 1 && (
          <span className="text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded">
            {currentSnapshotIndex + 1} of {snapshots.length}
          </span>
        )}
      </h3>
      <div className="grid grid-cols-[170px_1fr] gap-x-4 gap-y-2 items-center mb-4">
        <b>Dx</b>
        <div>{currentSnapshot?.dx || "Not specified"}</div>

        <b>Key Concern</b>
        <div>{currentSnapshot?.keyConcern || "Not specified"}</div>

        <b>Next Step</b>
        <div>{currentSnapshot?.nextStep || "Not specified"}</div>
      </div>
      {snapshots.length > 1 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleLatestSnapshot}
            className={`px-3 py-1 text-sm rounded bg-blue-200 text-blue-800 hover:bg-blue-300 ${
              currentSnapshotIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={currentSnapshotIndex === 0}
          >
            Latest
          </button>
          <button
            onClick={handlePreviousSnapshot}
            className={`px-3 py-1 text-sm rounded bg-blue-200 text-blue-800 hover:bg-blue-300 ${
              currentSnapshotIndex === snapshots.length - 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={currentSnapshotIndex === snapshots.length - 1}
          >
            Previous
          </button>
        </div>
      )}
      <div className="flex justify-end">
        <button
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-blue-200 transition-colors ${
            copied[sectionId]
              ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
              : "border-blue-200 bg-white text-gray-900"
          }`}
          onClick={() =>
            onCopySection("section-snapshot", currentSnapshotIndex)
          }
          title="Copy Section"
        >
          {copied[sectionId] ? <CheckIcon /> : <CopyIcon />}
          Copy Section
        </button>
      </div>
    </section>
  );
};

// What's New Component
const WhatsNewSection = ({
  documentData,
  copied,
  onCopySection,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
}) => {
  return (
    <section
      className="p-5 bg-amber-50 border-b border-blue-200"
      aria-labelledby="whatsnew-title"
    >
      <h3
        className="flex gap-2 items-center mb-3 text-base font-semibold"
        id="whatsnew-title"
      >
        ⚡ What's New Since Last Visit
      </h3>
      <ul className="m-0 p-0 grid gap-2 list-none" role="list">
        {documentData?.whats_new &&
          Object.entries(documentData.whats_new).map(([key, value]) => {
            if (!value || value.trim() === "" || value.trim() === " ") {
              return null;
            }
            const label = key.toUpperCase().replace(/_/g, " ");
            return (
              <li
                key={key}
                className="flex gap-2 items-start p-3 border border-dashed border-amber-300 bg-white rounded-lg"
              >
                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-400 text-xs font-bold whitespace-nowrap flex-shrink-0">
                  {label}
                </span>
                <div className="flex-1 min-w-0">{value}</div>
              </li>
            );
          })}
        {(!documentData?.whats_new ||
          Object.values(documentData.whats_new || {}).every(
            (val) => !val || val.trim() === "" || val.trim() === " "
          )) && (
          <li className="p-3 text-gray-500 text-center">
            No significant changes since last visit
          </li>
        )}
      </ul>
      <div className="flex justify-end mt-4">
        <button
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-amber-200 transition-colors ${
            copied["section-whatsnew"]
              ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
              : "border-amber-200 bg-white text-gray-900"
          }`}
          onClick={() => onCopySection("section-whatsnew")}
          title="Copy Section"
        >
          {copied["section-whatsnew"] ? <CheckIcon /> : <CopyIcon />}
          Copy Section
        </button>
      </div>
    </section>
  );
};

// ADL Component
const ADLSection = ({
  documentData,
  copied,
  onCopySection,
}: {
  documentData: DocumentData | null;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
}) => {
  return (
    <section
      className="p-5 bg-green-50 border-b border-blue-200"
      aria-labelledby="adl-title"
    >
      <h3
        className="flex gap-2 items-center mb-3 text-base font-semibold"
        id="adl-title"
      >
        🧩 ADL / Work Status
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-green-200 bg-white rounded-lg p-3">
          <h4 className="m-0 mb-2 text-sm text-green-800 font-semibold">
            ADLs Affected
          </h4>
          <div className="whitespace-pre-wrap">
            {documentData?.adl?.adls_affected || "Not specified"}
          </div>
        </div>
        <div className="border border-green-200 bg-white rounded-lg p-3">
          <h4 className="m-0 mb-2 text-sm text-green-800 font-semibold">
            Work Restrictions
          </h4>
          <div className="whitespace-pre-wrap">
            {documentData?.adl?.work_restrictions || "Not specified"}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-green-200 transition-colors ${
            copied["section-adl"]
              ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
              : "border-green-200 bg-white text-gray-900"
          }`}
          onClick={() => onCopySection("section-adl")}
          title="Copy Section"
        >
          {copied["section-adl"] ? <CheckIcon /> : <CopyIcon />}
          Copy Section
        </button>
      </div>
    </section>
  );
};

// Document Summary Component
const DocumentSummarySection = ({
  documentData,
  openModal,
  handleShowPrevious,
  copied,
  onCopySection,
}: {
  documentData: DocumentData | null;
  openModal: (briefSummary: string) => void;
  handleShowPrevious: (type: string) => void;
  copied: { [key: string]: boolean };
  onCopySection: (sectionId: string) => void;
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const accordionBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bodyEl = accordionBodyRef.current;
    if (bodyEl) {
      bodyEl.style.maxHeight = isAccordionOpen
        ? `${bodyEl.scrollHeight}px`
        : "0px";
    }
  }, [isAccordionOpen, documentData]);

  useEffect(() => {
    const handleResize = () => {
      if (isAccordionOpen && accordionBodyRef.current) {
        accordionBodyRef.current.style.maxHeight = `${accordionBodyRef.current.scrollHeight}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAccordionOpen]);

  const toggleAccordion = () => {
    setIsAccordionOpen((prev) => !prev);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <section className="p-5 bg-gray-100" aria-labelledby="doc-title">
      <div
        className="flex justify-between items-center cursor-pointer py-1"
        role="button"
        aria-expanded={isAccordionOpen}
        aria-controls="doc-body"
        id="doc-title"
        onClick={toggleAccordion}
      >
        <h3 className="flex gap-2 items-center m-0 text-base font-semibold">
          📄 Document Summary
          {documentData?.document_summaries &&
            documentData.document_summaries.length > 1 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {documentData.document_summaries.length} reports
              </span>
            )}
        </h3>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isAccordionOpen ? "rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div
        id="doc-body"
        className="overflow-hidden transition-all duration-300"
        ref={accordionBodyRef}
        role="region"
        aria-label="Parsed documents"
      >
        {documentData?.document_summaries &&
        documentData.document_summaries.length > 0 ? (
          documentData.document_summaries.map((summary, index) => {
            const hasPrevious =
              documentData.previous_summaries &&
              documentData.previous_summaries[summary.type];
            const sectionId = `section-summary-${index}`;
            return (
              <div key={index} className="my-3">
                <div className="border border-blue-200 bg-white rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <div className="text-gray-600 text-xs">Type</div>
                        <div>{summary.type}</div>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <div className="text-gray-600 text-xs">Date</div>
                        <div>{formatDate(summary.date)}</div>
                      </div>
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <div className="text-gray-600 text-xs">Summary</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">{summary.summary}</div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2 items-end">
                      <button
                        onClick={() => openModal(summary.brief_summary || "")}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Brief
                      </button>
                      {hasPrevious && (
                        <button
                          onClick={() => handleShowPrevious(summary.type)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Previous
                        </button>
                      )}
                      <button
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
                          copied[sectionId]
                            ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                            : "border-blue-200 bg-white text-gray-900"
                        }`}
                        onClick={() => onCopySection(sectionId)}
                        title="Copy Section"
                      >
                        {copied[sectionId] ? <CheckIcon /> : <CopyIcon />}
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center p-3">
            No document summaries available
          </div>
        )}
      </div>
    </section>
  );
};

export default function PhysicianCard() {
  const [theme, setTheme] = useState<"clinical" | "standard">("clinical");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verifyTime, setVerifyTime] = useState<string>("—");
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Patient[]>([]);
  const [showRecommendations, setShowRecommendations] =
    useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedBriefSummary, setSelectedBriefSummary] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [showPreviousSummary, setShowPreviousSummary] =
    useState<boolean>(false);
  const [previousSummary, setPreviousSummary] =
    useState<DocumentSummary | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const searchRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

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

  // Fetch recommendations from your patients API
  const fetchRecommendations = async (query: string) => {
    if (!query.trim()) {
      setRecommendations([]);
      setShowRecommendations(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `/api/dashboard/recommendation?patientName=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data: RecommendationsResponse = await response.json();
      console.log("Recommendations API response:", data);

      if (data.success) {
        if (data.data.patients) {
          setRecommendations(data.data.patients);
        } else if (data.data.patientNames) {
          const patients: Patient[] = data.data.patientNames.map(
            (name, index) => ({
              id: index,
              patientName: name,
              dob: data.data.dobs?.[index] || "1980-01-01",
              doi: data.data.dois?.[index] || "2024-01-01",
              claimNumber:
                data.data.claimNumbers?.[index] ||
                `WC-${Math.floor(100000 + Math.random() * 900000)}`,
            })
          );
          setRecommendations(patients);
        }
        setShowRecommendations(true);
      }
    } catch (err: unknown) {
      console.error("Error fetching recommendations:", err);
      setRecommendations([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchRecommendations(query);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setRecommendations([]);
      setShowRecommendations(false);
    }
  };

  // Flatten grouped summaries into array and prepare previous
  const processAggregatedSummaries = (
    groupedDocumentSummary: {
      [key: string]: { date: string; summary: string }[];
    },
    groupedBriefSummary: { [key: string]: string[] }
  ): {
    document_summaries: DocumentSummary[];
    previous_summaries: { [key: string]: DocumentSummary };
  } => {
    const document_summaries: DocumentSummary[] = [];
    const previousByType: { [key: string]: DocumentSummary } = {};

    Object.entries(groupedDocumentSummary).forEach(([type, sumEntries]) => {
      // Sort entries by date descending
      sumEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const briefEntries = groupedBriefSummary[type] || [];
      // Assume brief entries are in same order, sort if needed
      // For simplicity, pair by index

      sumEntries.forEach((entry, idx) => {
        const brief =
          briefEntries[idx] || (briefEntries.length > 0 ? briefEntries[0] : "");
        document_summaries.push({
          type,
          date: entry.date,
          summary: entry.summary,
          brief_summary: brief,
        });
      });

      // Set previous if more than one
      if (sumEntries.length > 1) {
        const prevEntry = sumEntries[1];
        const prevBrief =
          briefEntries[1] || (briefEntries.length > 0 ? briefEntries[0] : "");
        previousByType[type] = {
          type,
          date: prevEntry.date,
          summary: prevEntry.summary,
          brief_summary: prevBrief,
        };
      }
    });

    // Sort all summaries by date desc
    document_summaries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return { document_summaries, previous_summaries: previousByType };
  };

  // Handle patient selection from recommendations
  const handlePatientSelect = (patient: Patient) => {
    console.log("Patient selected:", patient);
    setSelectedPatient(patient);
    setSearchQuery(patient.patientName || patient.name || "");
    setShowRecommendations(false);

    // Fetch document data for the selected patient
    fetchDocumentData(patient);
  };

  // Fetch document data from API
  const fetchDocumentData = async (patientInfo: Patient) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        patient_name: patientInfo.patientName || patientInfo.name || "",
        dob: patientInfo.dob,
        doi: patientInfo.doi,
        claim_number: patientInfo.claimNumber,
      });

      console.log("Fetching document data with params:", params.toString());

      const response = await fetch(
        `http://127.0.0.1:8000/api/document?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const data: any = await response.json();
      console.log("Document data received:", data);

      let processedData: DocumentData;

      // Handle aggregated single document
      if (data.documents && data.documents.length > 0) {
        const aggDoc = data.documents[0];
        processedData = { ...aggDoc };

        // Compute allVerified based on status
        processedData.allVerified =
          !!aggDoc.status && aggDoc.status.toLowerCase() === "verified";

        // Process grouped summaries
        const { document_summaries, previous_summaries } =
          processAggregatedSummaries(
            aggDoc.document_summary || {},
            aggDoc.brief_summary || {}
          );
        processedData.document_summaries = document_summaries;
        processedData.previous_summaries = previous_summaries;

        // Handle summary_snapshots array
        processedData.summary_snapshots = aggDoc.summary_snapshots || [];

        // Handle adl - set history if needed, but since aggregated from latest medical, no previous here
        if (processedData.adl) {
          const adlData = processedData.adl;
          adlData.adls_affected_history =
            adlData.adls_affected || "Not specified";
          adlData.work_restrictions_history =
            adlData.work_restrictions || "Not specified";
          adlData.has_changes = false;
        }

        // Set merge_metadata if total_documents >1
        if (data.total_documents > 1) {
          processedData.merge_metadata = {
            total_documents_merged: data.total_documents,
            is_merged: true,
            latest_document_date: aggDoc.created_at || "",
            previous_document_date: "", // Not available in aggregated, could fetch separately if needed
          };
        }
      } else {
        processedData = null;
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
        break;
      case "section-adl":
        text = `ADL / Work Status\nADLs Affected: ${
          doc?.adl?.adls_affected || "Not specified"
        }\nWork Restrictions: ${
          doc?.adl?.work_restrictions || "Not specified"
        }`;
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

  // Close recommendations when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowRecommendations(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-set verified if all documents are verified
  useEffect(() => {
    if (documentData?.allVerified) {
      setIsVerified(true);
    }
  }, [documentData?.allVerified]);

  // Handle theme switch
  const switchTheme = (val: "clinical" | "standard") => {
    setTheme(val);
  };

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

  return (
    <>
      <div
        className={`min-h-screen p-6 font-sans ${
          theme === "standard" ? "bg-gray-100" : "bg-blue-50"
        } text-gray-900`}
      >
        <div className="max-w-5xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowRecommendations(true)}
                className="w-full p-4 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Recommendations Dropdown */}
              {showRecommendations && recommendations.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-2xl shadow-lg mt-2 max-h-80 overflow-y-auto z-50">
                  {recommendations.map((patient, index) => (
                    <div
                      key={patient.id || index}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-150"
                    >
                      <div className="font-semibold text-gray-900">
                        {patient.patientName || patient.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block mr-4">
                          <strong>DOB:</strong> {formatDate(patient.dob)}
                        </span>
                        <span className="inline-block mr-4">
                          <strong>DOI:</strong> {formatDate(patient.doi)}
                        </span>
                        <span className="inline-block">
                          <strong>Claim:</strong> {patient.claimNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showRecommendations &&
                searchQuery &&
                recommendations.length === 0 &&
                !searchLoading && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-2xl shadow-lg mt-2 p-4 text-gray-500 text-center">
                    No patients found
                  </div>
                )}
            </div>
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

          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="font-bold">
              Kebilo Physician Card — Final Mockup
            </div>
            <select
              id="theme"
              className="bg-indigo-50 text-gray-900 border border-blue-200 rounded-lg p-2 font-semibold focus:outline-none"
              value={theme}
              onChange={(e) =>
                switchTheme(e.target.value as "clinical" | "standard")
              }
            >
              <option value="clinical">Clinical Light (Print‑ready)</option>
              <option value="standard">Standard Light</option>
            </select>
          </div>

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
            >
              {/* Header with merge indicator */}
              <div className="grid grid-cols-[1fr_auto] gap-3 items-center p-5 bg-blue-50 border-b border-blue-200">
                <div
                  className="flex flex-wrap gap-x-4 gap-y-2"
                  aria-label="Patient summary"
                >
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    Patient: <b>{currentPatient.patientName}</b>
                  </div>
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    DOB: {formatDate(currentPatient.dob)}
                  </div>
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
                    Claim #: {currentPatient.claimNumber}
                  </div>
                  <div className="bg-gray-100 border border-blue-200 px-2 py-1 rounded-full text-sm">
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

              {/* Physician Verified Row */}
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

              {/* Render Sub-Components */}
              <SummarySnapshotSection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
              />
              <WhatsNewSection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
              />
              <ADLSection
                documentData={documentData}
                copied={copied}
                onCopySection={handleSectionCopy}
              />
              <DocumentSummarySection
                documentData={documentData}
                openModal={openModal}
                handleShowPrevious={handleShowPrevious}
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
