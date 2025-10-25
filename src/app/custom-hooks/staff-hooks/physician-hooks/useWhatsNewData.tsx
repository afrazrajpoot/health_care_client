// hooks/useWhatsNew.ts
import { useState, useCallback } from "react";

interface QuickNoteSnapshot {
  details: string;
  timestamp: string;
  one_line_note: string;
  status_update: string;
}

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  created_at?: string;
  status?: string;
  brief_summary?: { [key: string]: string[] };
  whats_new?: { [key: string]: string };
  quick_notes_snapshots?: QuickNoteSnapshot[];
  document_summary?: { [key: string]: { date: string; summary: string }[] };
  blob_path?: string;
}

// Custom hook for WhatsNew derived data
export const useWhatsNewData = (documentData: DocumentData | null) => {
  // ✅ Get summary of what's new for collapsed view
  const getWhatsNewSummary = useCallback(() => {
    if (!documentData?.whats_new && !documentData?.document_summary)
      return "No significant changes";
    const entries = Object.entries(documentData.whats_new || {}).filter(
      ([_, value]) => value && value.trim() !== "" && value.trim() !== " "
    );
    const summaryTypes = Object.keys(documentData?.document_summary || {});
    if (entries.length === 0 && summaryTypes.length === 0)
      return "No significant changes";
    const summary = entries
      .map(([key]) => key.toUpperCase().replace(/_/g, " "))
      .join(", ");
    const summaryPreview =
      summaryTypes.length > 0 ? ` + ${summaryTypes.join(", ")} summaries` : "";
    return summary + summaryPreview;
  }, [documentData]);

  // ✅ Helper to format timestamp to readable date/time
  const formatTimestamp = useCallback((timestamp: string): string => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(); // e.g., "10/18/2025, 9:52:51 AM"
    } catch {
      return timestamp;
    }
  }, []);

  // ✅ Format date from ISO string to MM/DD/YYYY
  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }, []);

  // ✅ Get ALL quick notes (including previous/empty ones), sorted latest first
  const getAllQuickNotes = useCallback(() => {
    const quickNotes = documentData?.quick_notes_snapshots || [];
    return quickNotes.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ); // Descending (latest first)
  }, [documentData]);

  // ✅ Get quick notes summary for collapsed view (count all)
  const getQuickNotesSummary = useCallback(() => {
    const allNotes = getAllQuickNotes();
    if (allNotes.length === 0) return "No quick notes";
    return `${allNotes.length} note${allNotes.length > 1 ? "s" : ""}`;
  }, [getAllQuickNotes]);

  // ✅ Check if a note is empty
  const isNoteEmpty = useCallback((note: QuickNoteSnapshot) => {
    return (
      !note.status_update?.trim() &&
      !note.one_line_note?.trim() &&
      !note.details?.trim()
    );
  }, []);

  // ✅ Get grouped document summaries by type
  const getGroupedDocumentSummaries = useCallback(() => {
    const docSummary = documentData?.document_summary || {};
    const grouped: {
      key: string;
      summaries: Array<{ summary: string; date: string }>;
    }[] = [];
    Object.entries(docSummary).forEach(([type, entries]) => {
      if (entries && entries.length > 0) {
        // Sort by date descending
        const sortedEntries = [...entries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const summaries = sortedEntries
          .filter((entry) => entry && entry.summary)
          .map((entry) => ({
            summary: entry.summary,
            date: entry.date,
          }));
        if (summaries.length > 0) {
          grouped.push({ key: type, summaries });
        }
      }
    });
    return grouped;
  }, [documentData]);

  // ✅ Combine whats_new and grouped document summaries
  const getAllWhatsNewItems = useCallback(() => {
    const whatsNewItems: Array<
      | { type: "whatsnew"; key: string; value: string }
      | {
          type: "document_group";
          key: string;
          summaries: Array<{ summary: string; date: string }>;
        }
    > = [];

    // Add whats_new items
    if (documentData?.whats_new) {
      Object.entries(documentData.whats_new).forEach(([key, value]) => {
        if (value && value.trim() !== "" && value.trim() !== " ") {
          whatsNewItems.push({ type: "whatsnew", key, value });
        }
      });
    }

    // Add grouped document summaries
    whatsNewItems.push(
      ...getGroupedDocumentSummaries().map((group) => ({
        type: "document_group" as const,
        ...group,
      }))
    );

    return whatsNewItems;
  }, [documentData, getGroupedDocumentSummaries]);

  return {
    getWhatsNewSummary,
    formatTimestamp,
    formatDate,
    getAllQuickNotes,
    getQuickNotesSummary,
    isNoteEmpty,
    getGroupedDocumentSummaries,
    getAllWhatsNewItems,
  };
};

// Custom hook for Quick Notes toggle state
export const useQuickNotesToggle = () => {
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);

  const toggleQuickNotes = useCallback(() => {
    setIsQuickNotesOpen((prev) => !prev);
  }, []);

  return {
    isQuickNotesOpen,
    toggleQuickNotes,
  };
};

// Custom hook for file preview handler
export const usePreviewFile = (documentData: DocumentData | null) => {
  const handlePreviewFile = useCallback(() => {
    const blobPath = documentData?.blob_path;
    if (blobPath) {
      const previewUrl = `${
        process.env.NEXT_PUBLIC_PYTHON_API_URL
      }/api/preview/${encodeURIComponent(blobPath)}`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }, [documentData]);

  return handlePreviewFile;
};
