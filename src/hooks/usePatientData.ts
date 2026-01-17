import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  useGetDocumentQuery,
  useGetTasksQuery,
  useGetPatientIntakesQuery,
  useGetPatientIntakeUpdateQuery
} from "@/redux/dashboardApi";

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

export const usePatientData = (
  physicianId: string | null,
  patientInfo: Patient | null,
  mode: "wc" | "gm"
) => {
  const { data: session } = useSession();

  // 1. Fetch Document Data
  const docParams = useMemo(() => {
    if (!physicianId || !patientInfo) return null;
    return {
      patient_name: patientInfo.patientName || patientInfo.name || "",
      dob: patientInfo.dob,
      doi: patientInfo.doi,
      claim_number: patientInfo.claimNumber,
      physicianId: physicianId,
      mode: mode,
    };
  }, [
    physicianId,
    patientInfo?.patientName,
    patientInfo?.name,
    patientInfo?.dob,
    patientInfo?.doi,
    patientInfo?.claimNumber,
    mode
  ]);

  const {
    data: rawDocData,
    isFetching: docLoading,
    error: docError
  } = useGetDocumentQuery(docParams, {
    skip: !docParams,
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });

  const latestDoc = useMemo(() => {
    if (rawDocData?.documents && rawDocData.documents.length > 0) {
      return rawDocData.documents[0];
    }
    return null;
  }, [rawDocData]);

  // 2. Fetch Task Data (Dependent on Document Data)
  const taskParams = useMemo(() => {
    if (!latestDoc || !patientInfo) return null;

    const params: any = { mode: latestDoc.mode || mode };
    if (latestDoc.claim_number && latestDoc.claim_number !== "Not specified") {
      params.claim = latestDoc.claim_number;
    } else {
      params.patientName = latestDoc.patient_name || patientInfo.patientName || "";
    }
    return params;
  }, [latestDoc?.mode, latestDoc?.claim_number, latestDoc?.patient_name, patientInfo?.patientName, mode]);

  const {
    data: rawTaskData,
    isFetching: taskLoading
  } = useGetTasksQuery(taskParams, {
    skip: !taskParams || !rawDocData, // Only fetch when we have document data
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });

  // 3. Fetch Patient Intake Data
  const intakeParams = useMemo(() => {
    if (!patientInfo) return null;
    return {
      patientName: patientInfo.patientName || patientInfo.name || "",
      dob: patientInfo.dob,
      claimNumber: patientInfo.claimNumber
    };
  }, [patientInfo?.patientName, patientInfo?.name, patientInfo?.dob, patientInfo?.claimNumber]);

  const {
    data: patientIntakeData,
    isFetching: intakeLoading
  } = useGetPatientIntakesQuery(intakeParams, {
    skip: !intakeParams,
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });

  const {
    data: patientIntakeUpdateData,
    isFetching: intakeUpdateLoading
  } = useGetPatientIntakeUpdateQuery(intakeParams, {
    skip: !intakeParams,
    refetchOnMountOrArgChange: false, // Don't refetch on mount if cached data exists
    pollingInterval: 0, // Disable automatic polling
  });

  // 4. Process Document Data
  const processedData = useMemo(() => {
    if (!rawDocData || !latestDoc) return null;

    // Process What's New
    let processedWhatsNew: any = {};
    let processedQuickNotes: QuickNoteSnapshot[] = [];

    if (latestDoc.whats_new && Array.isArray(latestDoc.whats_new) && latestDoc.whats_new.length > 0) {
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
    if (latestDoc.brief_summary) processedWhatsNew.brief_summary = latestDoc.brief_summary;
    if (latestDoc.document_summary?.summary) processedWhatsNew.detailed_summary = latestDoc.document_summary.summary;
    if (latestDoc.document_summary?.type) processedWhatsNew.summary_type = latestDoc.document_summary.type;
    if (latestDoc.document_summary?.date) processedWhatsNew.summary_date = latestDoc.document_summary.date;

    // Group summaries
    const grouped: { [key: string]: any[] } = {};
    rawDocData.documents.forEach((doc: any) => {
      const docSum = doc.document_summary;
      const brief = doc.brief_summary || "";
      if (docSum && docSum.type) {
        const type = docSum.type;
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push({
          date: docSum.date,
          summary: docSum.summary,
          brief_summary: brief,
        });
      }
    });

    const document_summaries: any[] = [];
    const previous_summaries: { [key: string]: any } = {};

    Object.entries(grouped).forEach(([type, entries]) => {
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        previous_summaries[type] = {
          type,
          date: prevEntry.date,
          summary: prevEntry.summary,
          brief_summary: prevEntry.brief_summary,
        };
      }
    });
    document_summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Aggregate body part snapshots
    const sortedDocs = [...rawDocData.documents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const allBodyPartSnapshots = sortedDocs.flatMap((doc: any) =>
      (doc.body_part_snapshots || []).map((snap: any) => ({
        ...snap,
        document_created_at: snap.document_created_at,
        document_report_date: snap.document_report_date,
      }))
    );

    const data: DocumentData = {
      ...rawDocData,
      dob: latestDoc.dob,
      doi: latestDoc.doi,
      claim_number: latestDoc.claim_number,
      created_at: latestDoc.created_at,
      adl: latestDoc.adl ? { ...latestDoc.adl } : null,
      whats_new: processedWhatsNew,
      brief_summary: latestDoc.brief_summary,
      document_summaries,
      previous_summaries,
      patient_quiz: rawDocData.patient_quiz,
      treatment_history: latestDoc.treatment_history,
      body_part_snapshots: allBodyPartSnapshots,
      quick_notes_snapshots: processedQuickNotes,
      gcs_file_link: latestDoc?.gcs_file_link,
      blob_path: latestDoc?.blob_path,
      file_name: latestDoc?.file_name,
      consulting_doctor: allBodyPartSnapshots[0]?.consultingDoctor || latestDoc?.body_part_snapshots?.[0]?.consultingDoctor || "Not specified",
      allVerified: !!latestDoc.status && latestDoc.status.toLowerCase() === "verified",
      summary_snapshots: allBodyPartSnapshots,
      ...(rawDocData.total_documents > 1 && {
        merge_metadata: {
          total_documents_merged: rawDocData.total_documents,
          is_merged: true,
          latest_document_date: latestDoc.created_at || "",
          previous_document_date: "",
        },
      }),
    };

    if (data.adl) {
      const adlData = data.adl;
      adlData.adls_affected = Array.isArray(adlData.adls_affected) ? adlData.adls_affected.join(", ") : adlData.adls_affected || "Not specified";
      adlData.work_restrictions = Array.isArray(adlData.work_restrictions) ? adlData.work_restrictions.join(", ") : adlData.work_restrictions || "Not specified";
      adlData.adls_affected_history = adlData.adls_affected;
      adlData.work_restrictions_history = adlData.work_restrictions;
      adlData.has_changes = false;
    }

    return data;
  }, [rawDocData, latestDoc]);

  // 5. Process Task Data
  const processedTaskNotes = useMemo(() => {
    if (!rawTaskData || !latestDoc || !patientInfo || !rawDocData) return [];

    const patientName = (latestDoc.patient_name || patientInfo.patientName || "").toLowerCase().trim();
    const claimNumber = latestDoc.claim_number && latestDoc.claim_number !== "Not specified" ? latestDoc.claim_number.toUpperCase().trim() : null;

    const patientDocumentIds = new Set<string>();
    rawDocData.documents.forEach((doc: any) => { if (doc.id) patientDocumentIds.add(doc.id); });

    const allTaskQuickNotes: QuickNoteSnapshot[] = [];
    if (rawTaskData.tasks && Array.isArray(rawTaskData.tasks)) {
      rawTaskData.tasks.forEach((task: any) => {
        const taskPatient = (task.patient || "").toLowerCase().trim();
        const taskClaim = task.document?.claimNumber ? task.document.claimNumber.toUpperCase().trim() : null;
        const taskDocumentId = task.documentId || task.document?.id || null;

        let patientMatches = false;
        if (taskDocumentId && patientDocumentIds.has(taskDocumentId)) {
          patientMatches = true;
        } else if (claimNumber && taskClaim) {
          patientMatches = taskClaim === claimNumber;
        } else if (patientName && taskPatient) {
          patientMatches = taskPatient === patientName || taskPatient.includes(patientName) || patientName.includes(taskPatient);
        }

        if (patientMatches && task.quickNotes) {
          const hasContent = (task.quickNotes.status_update && task.quickNotes.status_update.trim()) ||
            (task.quickNotes.one_line_note && task.quickNotes.one_line_note.trim()) ||
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

    return allTaskQuickNotes
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, 5);
  }, [rawTaskData, latestDoc, patientInfo, rawDocData]);

  // 6. Process Patient Intake Data
  const patientQuiz = useMemo(() => {
    if (patientIntakeData?.success && patientIntakeData?.data?.length > 0) {
      return patientIntakeData.data[0];
    }
    return null;
  }, [patientIntakeData]);

  const patientIntakeUpdate = useMemo(() => {
    if (patientIntakeUpdateData?.success) {
      return patientIntakeUpdateData.data;
    }
    return null;
  }, [patientIntakeUpdateData]);

  return {
    documentData: processedData,
    taskQuickNotes: processedTaskNotes,
    patientQuiz,
    patientIntakeUpdate,
    loading: docLoading || taskLoading || intakeLoading || intakeUpdateLoading,
    error: docError ? (docError as any).data?.error || "An error occurred" : null,
  };
};
