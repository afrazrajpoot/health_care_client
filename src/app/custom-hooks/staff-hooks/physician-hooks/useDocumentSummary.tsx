// hooks/useDocumentSummary.ts
import { useState, useEffect, useRef, useCallback } from "react";

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
  summary_snapshot?: {
    diagnosis: string;
    diagnosis_history: string;
    key_concern: string;
    key_concern_history: string;
    next_step: string;
    next_step_history: string;
    has_changes: boolean;
  };
  summary_snapshots?: {
    id: string;
    dx: string;
    keyConcern: string;
    nextStep: string;
    documentId: string;
  }[];
  whats_new?: { [key: string]: string };
  quick_notes_snapshots?: {
    details: string;
    timestamp: string;
    one_line_note: string;
    status_update: string;
  }[];
  adl?: {
    adls_affected: string;
    adls_affected_history: string;
    work_restrictions: string;
    work_restrictions_history: string;
    has_changes: boolean;
  };
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  document_summaries?: DocumentSummary[];
  patient_quiz?: {
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
  } | null;
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
}

export const useDocumentSummary = (
  documentData: DocumentData | null,
  isCollapsed: boolean,
  onToggle: () => void
) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const accordionBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAccordionOpen(!isCollapsed);
  }, [isCollapsed]);

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

  const toggleAccordion = useCallback(() => {
    setIsAccordionOpen((prev) => !prev);
  }, []);

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }, []);

  // Utility function to keep only latest by type
  const getUniqueLatestSummaries = useCallback(
    (summaries: DocumentSummary[] | undefined) => {
      if (!summaries) return [];

      // Group by type and pick latest by date
      const latestMap: { [key: string]: DocumentSummary } = summaries.reduce(
        (acc: any, summary) => {
          const existing = acc[summary.type];
          if (!existing || new Date(summary.date) > new Date(existing.date)) {
            acc[summary.type] = summary;
          }
          return acc;
        },
        {}
      );

      return Object.values(latestMap);
    },
    []
  );

  const uniqueSummaries = getUniqueLatestSummaries(
    documentData?.document_summaries
  );

  // Function to handle file preview (opens in new tab) - direct to backend API
  const handlePreviewFile = useCallback(() => {
    const blobPath = documentData?.blob_path;
    if (blobPath) {
      const previewUrl = `${
        process.env.NEXT_PUBLIC_PYTHON_API_URL
      }/api/preview/${encodeURIComponent(blobPath)}`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }, [documentData]);

  // Function to handle view original file (e.g., download or open signed URL) - uses document-level gcs_file_link
  const handleViewFile = useCallback(() => {
    const gcsUrl = documentData?.gcs_file_link;
    if (gcsUrl) {
      window.open(gcsUrl, "_blank", "noopener,noreferrer"); // Opens signed GCS URL (may download based on type)
    }
  }, [documentData]);

  const handleToggleAccordion = useCallback(() => {
    onToggle();
    toggleAccordion();
  }, [onToggle, toggleAccordion]);

  const getDocumentSummary = useCallback(() => {
    const summaries = documentData?.document_summaries || [];
    if (summaries.length === 0) return "No documents";
    const types = [...new Set(summaries.map((s: any) => s.type))];
    return `${summaries.length} documents (${types.join(", ")})`;
  }, [documentData]);

  return {
    isAccordionOpen,
    accordionBodyRef,
    toggleAccordion,
    formatDate,
    uniqueSummaries,
    handlePreviewFile,
    handleViewFile,
    handleToggleAccordion,
    getDocumentSummary,
  };
};
