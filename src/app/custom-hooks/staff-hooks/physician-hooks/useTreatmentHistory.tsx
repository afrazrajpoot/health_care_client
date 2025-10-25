// hooks/useTreatmentHistory.ts
import { useState, useEffect, useCallback } from "react";

interface SummarySnapshotItem {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
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
  summary_snapshots?: SummarySnapshotItem[];
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
  document_summaries?: {
    type: string;
    date: string;
    summary: string;
    brief_summary?: string;
    document_id?: string;
  }[];
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
  previous_summaries?: {
    [key: string]: {
      type: string;
      date: string;
      summary: string;
      brief_summary?: string;
      document_id?: string;
    };
  };
  allVerified?: boolean;
  gcs_file_link?: string;
  blob_path?: string;
}

export const useTreatmentHistory = (documentData: DocumentData | null) => {
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0);
  const [expandedSnapshots, setExpandedSnapshots] = useState<{
    [key: number]: boolean;
  }>({});

  const snapshots = documentData?.summary_snapshots || [];

  useEffect(() => {
    setCurrentSnapshotIndex(0); // Reset to latest on data change
  }, [documentData]);

  const toggleSnapshot = useCallback((index: number) => {
    setExpandedSnapshots((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const handlePreviousSnapshot = useCallback(() => {
    if (currentSnapshotIndex < snapshots.length - 1) {
      setCurrentSnapshotIndex((prev) => prev + 1);
    }
  }, [currentSnapshotIndex, snapshots.length]);

  const handleLatestSnapshot = useCallback(() => {
    setCurrentSnapshotIndex(0);
  }, []);

  const getTreatmentSummary = useCallback(() => {
    if (snapshots.length === 0) return "No snapshots available";
    const diagnoses = snapshots
      .map((snapshot) => snapshot.dx)
      .filter((dx) => dx && dx.trim() !== "");
    return diagnoses.length > 0
      ? diagnoses.join(", ")
      : "No diagnoses specified";
  }, [snapshots]);

  return {
    currentSnapshotIndex,
    expandedSnapshots,
    snapshots,
    toggleSnapshot,
    handlePreviousSnapshot,
    handleLatestSnapshot,
    getTreatmentSummary,
  };
};
