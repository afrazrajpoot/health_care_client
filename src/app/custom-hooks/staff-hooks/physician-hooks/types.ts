// types/physician-card.ts
export interface Patient {
    id?: number;
    patientName: string;
    name?: string;
    dob: string;
    doi: string;
    claimNumber: string;
  }
  
  export interface PatientQuiz {
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
  
  export interface SummarySnapshotItem {
    id: string;
    dx: string;
    keyConcern: string;
    nextStep: string;
    documentId: string;
  }
  
  export interface SummarySnapshot {
    diagnosis: string;
    diagnosis_history: string;
    key_concern: string;
    key_concern_history: string;
    next_step: string;
    next_step_history: string;
    has_changes: boolean;
  }
  
  export interface WhatsNew {
    [key: string]: string;
  }
  
  export interface QuickNoteSnapshot {
    details: string;
    timestamp: string;
    one_line_note: string;
    status_update: string;
  }
  
  export interface ADL {
    adls_affected: string;
    adls_affected_history: string;
    work_restrictions: string;
    work_restrictions_history: string;
    has_changes: boolean;
  }
  
  export interface DocumentSummary {
    type: string;
    date: string;
    summary: string;
    brief_summary?: string;
    document_id?: string;
  }
  
  export interface DocumentData {
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
  }