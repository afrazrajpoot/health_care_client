import React from "react";

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

interface DocumentData {
  patient_name?: string;
  dob?: string;
  doi?: string;
  claim_number?: string;
  documents?: Array<{ id?: string; document_id?: string }>;
  document_summaries?: DocumentSummary[];
  allVerified?: boolean;
  previous_summaries?: { [key: string]: DocumentSummary };
  summary_snapshots?: Array<{
    dx?: string;
    keyConcern?: string;
    nextStep?: string;
  }>;
  adl?: {
    adls_affected?: string;
    work_restrictions?: string;
  };
  patient_quiz?: {
    lang: string;
    newAppt: string;
    pain: number;
    workDiff: string;
    trend: string;
    workAbility: string;
    barrier: string;
    adl: string[];
    appts: Array<{ date: string; type: string; other: string }>;
    createdAt: string;
    updatedAt: string;
  };
}

interface TaskQuickNote {
  id: string;
  note: string;
  [key: string]: any;
}

interface CurrentPatient {
  patientName: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface DashboardContentProps {
  showOnboarding: boolean;
  currentStep: number;
  stepPositions: any[];
  showWelcomeModal: boolean;
  onboardingSteps: any[];
  onCloseOnboarding: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onStartOnboarding: () => void;
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancelUpload: () => void;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedPatient: Patient | null;
  documentData: DocumentData | null;
  taskQuickNotes: any;
  visitCount: number;
  formatDate?: (date: string | undefined) => string;
  currentPatient: CurrentPatient;
  collapsedSections: { [key: string]: boolean };
  copied: { [key: string]: boolean };
  onToggleSection: (key: string) => void;
  onCopySection: (id: string, index?: number) => void;
  mode: "wc" | "gm";
  error: string | null;
  onRetry?: () => void;
  recentPatientsVisible: boolean;
  onToggleRecentPatients: () => void;
  recentPatients: any[];
  searchQuery: string;
  onSearchChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    session: any
  ) => void;
  searchResults: any[];
  searchLoading: boolean;
  onPatientSelect: (patient: Patient, index?: number) => void;
  onCloseRecentPatients: () => void;
  session: any;
  highlightedPatientIndex?: number | null;
}

// Import child components
import { WelcomeModal } from "@/components/physician-components/WelcomeModal";
import { OnboardingHelpButton } from "./OnboardingHelpButton";
import { UploadSection } from "./UploadSection";
import { RecentPatientsPanel } from "./RecentPatientsPanel";
import PhysicianOnboardingTour from "./PhysicianOnboardingTour";
import { MainContent } from "./MainContent";

export const DashboardContent = React.memo<DashboardContentProps>(
  ({
    showOnboarding,
    currentStep,
    stepPositions,
    showWelcomeModal,
    onboardingSteps,
    onCloseOnboarding,
    onNextStep,
    onPreviousStep,
    onStartOnboarding,
    files,
    onFileSelect,
    onUpload,
    onCancelUpload,
    loading,
    fileInputRef,
    selectedPatient,
    documentData,
    taskQuickNotes,
    visitCount,
    formatDate,
    currentPatient,
    collapsedSections,
    copied,
    onToggleSection,
    onCopySection,
    mode,
    error,
    onRetry,
    recentPatientsVisible,
    onToggleRecentPatients,
    recentPatients,
    searchQuery,
    onSearchChange,
    searchResults,
    searchLoading,
    onPatientSelect,
    onCloseRecentPatients,
    session,
    highlightedPatientIndex,
  }) => {
    const defaultFormatDate = (dateString: string | undefined): string => {
      if (!dateString) return "Not specified";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Not specified";
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}-${day}-${year}`;
      } catch {
        return "Not specified";
      }
    };

    const formatDateFn = formatDate || defaultFormatDate;

    return (
      <div className="mt-16 px-5 py-5 min-h-[calc(100vh-64px)] bg-gray-50 text-gray-900 font-sans">
        <OnboardingHelpButton onClick={onStartOnboarding} />

        <UploadSection
          files={files}
          onFileSelect={onFileSelect}
          onUpload={onUpload}
          onCancel={onCancelUpload}
          loading={loading}
          fileInputRef={fileInputRef}
        />

        <MainContent
          selectedPatient={selectedPatient}
          documentData={documentData}
          taskQuickNotes={taskQuickNotes}
          visitCount={visitCount}
          formatDate={formatDateFn}
          currentPatient={currentPatient}
          collapsedSections={collapsedSections}
          copied={copied}
          onToggleSection={onToggleSection}
          onCopySection={onCopySection}
          mode={mode}
          error={error}
          loading={loading}
          onRetry={onRetry || (() => { })}
        />

        <RecentPatientsPanel
          isVisible={recentPatientsVisible}
          onToggle={onToggleRecentPatients}
          recentPatients={recentPatients}
          searchQuery={searchQuery}
          onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(e, session)
          }
          searchResults={searchResults}
          searchLoading={searchLoading}
          onPatientSelect={onPatientSelect}
          onClose={onCloseRecentPatients}
          highlightedPatientIndex={highlightedPatientIndex}
          selectedPatient={selectedPatient}
        />
      </div>
    );
  }
);

DashboardContent.displayName = "DashboardContent";