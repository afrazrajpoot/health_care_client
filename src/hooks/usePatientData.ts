import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { handleEncryptedResponse } from "@/lib/decrypt";

interface Patient {
  id?: string | number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

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
  documents?: any[];
  whats_new?: any;
  document_summaries?: any[];
  previous_summaries?: any;
  patient_quiz?: any;
  adl?: any;
  body_part_snapshots?: any[];
  quick_notes_snapshots?: QuickNoteSnapshot[];
  gcs_file_link?: string;
  blob_path?: string;
  file_name?: string;
  consulting_doctor?: string;
  allVerified?: boolean;
  summary_snapshots?: any[];
  merge_metadata?: any;
  treatment_history?: any;
}

interface UsePatientDataReturn {
  documentData: DocumentData | null;
  taskQuickNotes: QuickNoteSnapshot[];
  loading: boolean;
  error: string | null;
  fetchDocumentData: (patientInfo: Patient, mode: "wc" | "gm") => Promise<void>;
  setDocumentData: (data: DocumentData | null) => void;
}

export const usePatientData = (
  physicianId: string | null
): UsePatientDataReturn => {
  const { data: session } = useSession();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [taskQuickNotes, setTaskQuickNotes] = useState<QuickNoteSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processAggregatedSummaries = useCallback(
    (grouped: {
      [key: string]: {
        date: string;
        summary: string;
        brief_summary: string;
      }[];
    }): {
      document_summaries: any[];
      previous_summaries: { [key: string]: any };
    } => {
      const document_summaries: any[] = [];
      const previousByType: { [key: string]: any } = {};

      Object.entries(grouped).forEach(([type, entries]) => {
        if (!Array.isArray(entries)) return;
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

      document_summaries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return { document_summaries, previous_summaries: previousByType };
    },
    []
  );

  const fetchTaskQuickNotes = useCallback(
    async (
      latestDoc: any,
      patientInfo: Patient,
      allDocuments: any[],
      docMode: string
    ) => {
      try {
        const taskParams = new URLSearchParams({ mode: docMode });

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

        if (!taskResponse.ok) {
          console.error(`❌ Task API returned error: ${taskResponse.status}`);
          return [];
        }

        const taskResult = await taskResponse.json();

        // Handle encrypted response
        let taskData;
        try {
          taskData = handleEncryptedResponse(taskResult);
          console.log("✅ Task data decrypted successfully");
        } catch (decryptError) {
          console.error("❌ Failed to decrypt task data:", decryptError);

          // Fallback for backward compatibility
          if (taskResult.tasks && Array.isArray(taskResult.tasks)) {
            taskData = taskResult;
          } else if (Array.isArray(taskResult)) {
            taskData = { tasks: taskResult, totalCount: taskResult.length };
          } else if (taskResult.data && Array.isArray(taskResult.data.tasks)) {
            taskData = taskResult.data;
          } else {
            console.error("❌ Could not parse task response");
            return [];
          }
        }

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

        const patientDocumentIds = new Set<string>();
        if (allDocuments && Array.isArray(allDocuments)) {
          allDocuments.forEach((doc: any) => {
            if (doc.id) {
              patientDocumentIds.add(doc.id);
            }
          });
        }

        const allTaskQuickNotes: QuickNoteSnapshot[] = [];

        if (taskData.tasks && Array.isArray(taskData.tasks)) {
          taskData.tasks.forEach((task: any, index: number) => {
            const taskPatient = (task.patient || "").toLowerCase().trim();
            const taskClaim = task.document?.claimNumber
              ? task.document.claimNumber.toUpperCase().trim()
              : null;
            const taskDocumentId = task.documentId || task.document?.id || null;

            let patientMatches = false;
            if (taskDocumentId && patientDocumentIds.has(taskDocumentId)) {
              patientMatches = true;
            } else if (claimNumber && taskClaim) {
              patientMatches = taskClaim === claimNumber;
            } else if (patientName && taskPatient) {
              patientMatches =
                taskPatient === patientName ||
                taskPatient.includes(patientName) ||
                patientName.includes(taskPatient);
            }

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
                  timestamp: task.quickNotes.timestamp || task.updatedAt || "",
                  one_line_note: task.quickNotes.one_line_note || "",
                  status_update: task.quickNotes.status_update || "",
                });
              }
            }
          });
        }

        const sortedNotes = allTaskQuickNotes
          .sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
          })
          .slice(0, 5);

        console.log(`✅ Found ${sortedNotes.length} quick notes for patient`);
        return sortedNotes;
      } catch (err) {
        console.error("Error fetching task quick notes:", err);
        return [];
      }
    },
    [session?.user?.fastapi_token]
  );

  const fetchDocumentData = useCallback(
    async (patientInfo: Patient, mode: "wc" | "gm") => {
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

        const response = await fetch(`/api/documents/get-document?${params}`, {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }

        const rawResponse = await response.json();

        // Use the decryption utility to handle the response
        let data: any;
        try {
          data = handleEncryptedResponse(rawResponse);
          console.log("✅ Document data processed (encrypted or unencrypted)");
        } catch (decryptError) {
          console.error("❌ Failed to process encrypted response:", decryptError);

          if (rawResponse.documents) {
            console.log("🔄 Falling back to unencrypted data");
            data = rawResponse;
          } else {
            throw new Error(
              `Failed to process response: ${
                decryptError instanceof Error
                  ? decryptError.message
                  : "Unknown error"
              }`
            );
          }
        }

        if (!data.documents || data.documents.length === 0) {
          setDocumentData(null);
          setError(
            "No documents found. The document may not have complete patient information (patient name, DOB, DOI, claim number)."
          );
          return;
        }

        const latestDoc = data.documents[0];

        // Process What's New
        let processedWhatsNew: any = {};
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
              status_update: "",
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

        // Aggregate all body part snapshots from all documents
        const sortedDocs = [...data.documents].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const allBodyPartSnapshots = sortedDocs.flatMap((doc: any) =>
          (doc.body_part_snapshots || []).map((snap: any) => ({
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
          }))
        );

        const processedData: DocumentData = {
          ...data,
          dob: latestDoc.dob,
          doi: latestDoc.doi,
          claim_number: latestDoc.claim_number,
          created_at: latestDoc.created_at,
          documents: data.documents,
          adl: latestDoc.adl,
          whats_new: processedWhatsNew,
          brief_summary: latestDoc.brief_summary,
          document_summaries,
          previous_summaries,
          patient_quiz: data.patient_quiz,
          treatment_history: latestDoc.treatment_history,
          body_part_snapshots: allBodyPartSnapshots,
          quick_notes_snapshots: processedQuickNotes,
          gcs_file_link: latestDoc?.gcs_file_link,
          blob_path: latestDoc?.blob_path,
          file_name: latestDoc?.file_name,
          consulting_doctor:
            allBodyPartSnapshots[0]?.consultingDoctor ||
            latestDoc?.body_part_snapshots?.[0]?.consultingDoctor ||
            "Not specified",
          allVerified:
            !!latestDoc.status && latestDoc.status.toLowerCase() === "verified",
          summary_snapshots: allBodyPartSnapshots,
          ...(data.total_documents > 1 && {
            merge_metadata: {
              total_documents_merged: data.total_documents,
              is_merged: true,
              latest_document_date: latestDoc.created_at || "",
              previous_document_date: "",
            },
          }),
        };

        // Handle adl processing
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

        // Fetch task quick notes in parallel
        const docMode = latestDoc.mode || mode;
        const taskNotes = await fetchTaskQuickNotes(
          latestDoc,
          patientInfo,
          data.documents,
          docMode
        );
        setTaskQuickNotes(taskNotes);
      } catch (err: unknown) {
        console.error("Error fetching document data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [physicianId, session?.user?.fastapi_token, processAggregatedSummaries, fetchTaskQuickNotes]
  );

  return {
    documentData,
    taskQuickNotes,
    loading,
    error,
    fetchDocumentData,
    setDocumentData,
  };
};

