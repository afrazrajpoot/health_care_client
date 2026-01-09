import React from "react";
// import { PhysicianOnboardingTour } from "@/components/physician-components/PhysicianOnboardingTour";
import { WelcomeModal } from "@/components/physician-components/WelcomeModal";
import { OnboardingHelpButton } from "./OnboardingHelpButton";
import { UploadSection } from "./UploadSection";
// import { MainContent } from "./MainContent";
import { RecentPatientsPanel } from "./RecentPatientsPanel";
// import { Patient } from "../types"; // Assume types are exported
import PhysicianOnboardingTour from "./PhysicianOnboardingTour";
import { MainContent } from "./MainContent";

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
  selectedPatient: any | null;
  documentData: any;
  taskQuickNotes: any[];
  visitCount: number;
  formatDate: (date: string | undefined) => string;
  currentPatient: any;
  collapsedSections: { [key: string]: boolean };
  copied: { [key: string]: boolean };
  onToggleSection: (key: string) => void;
  onCopySection: (id: string, index?: number) => void;
  mode: "wc" | "gm";
  error: string | null;
  onRetry: () => void;
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
  onPatientSelect: (patient: any) => void;
  onCloseRecentPatients: () => void;
  session: any;
}

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
  }) => (
    <div className="mt-16 px-5 py-5 min-h-[calc(100vh-64px)] bg-gray-50 text-gray-900 font-sans">
      {/* <PhysicianOnboardingTour
      isOpen={showOnboarding}
      onClose={onCloseOnboarding}
      currentStep={currentStep}
      onNext={onNextStep}
      onPrevious={onPreviousStep}
      steps={onboardingSteps}
      stepPositions={stepPositions}
    /> */}
      {/* <WelcomeModal
      isOpen={showWelcomeModal}
      onClose={() => {}}
    /> */}
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
        documentData={documentData as any}
        taskQuickNotes={taskQuickNotes as any[]}
        visitCount={visitCount}
        formatDate={formatDate}
        currentPatient={currentPatient as any}
        collapsedSections={collapsedSections}
        copied={copied}
        onToggleSection={onToggleSection}
        onCopySection={onCopySection}
        mode={mode}
        error={error}
        loading={loading}
        onRetry={onRetry}
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
      />
    </div>
  )
);
