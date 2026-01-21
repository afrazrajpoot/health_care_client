import React from "react";
import { LoadingOverlay } from "@/components/physician-components/LoadingOverlay";
import { ErrorDisplay } from "./ErrorDisplay";
import { PatientHeader } from "@/components/physician-components/PatientHeader";
import { StaffStatusSection } from "@/components/physician-components/StaffStatusSection";
import PatientIntakeUpdate from "./PatientIntakeUpdate";
import WhatsNewSection from "./WhatsNewSection";
import TreatmentHistorySection from "./TreatmentHistorySection";
// import { PatientIntakeUpdate } from "@/components/physician-components/PatientIntakeUpdate";
// import { WhatsNewSection } from "@/components/physician-components/WhatsNewSection";
// import { TreatmentHistorySection } from "@/components/physician-components/TreatmentHistorySection";
// import { Patient } from "../types"; // Assume types

interface MainContentProps {
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
  loading: boolean;
  onRetry: () => void;
}

export const MainContent = React.memo<MainContentProps>(
  ({
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
    loading,
    onRetry,
  }) => (
    <>
      {/* <LoadingOverlay isLoading={loading} /> */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={onRetry}
          selectedPatient={selectedPatient}
          fetchDocumentData={() => { }}
          mode={mode}
        />
      )}
      {selectedPatient && documentData && (
        <PatientHeader
          patient={currentPatient}
          visitCount={visitCount}
          formatDate={formatDate}
        />
      )}
      <div className="grid grid-cols-1 gap-3.5">
        <div>
          {!selectedPatient && !documentData ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-500">
                Click the Recent Patients button to search and select a patient
              </p>
            </div>
          ) : (
            <>
              {documentData && (
                <StaffStatusSection
                  documentQuickNotes={documentData.quick_notes_snapshots || []}
                  taskQuickNotes={taskQuickNotes}
                  isCollapsed={collapsedSections.staffStatus}
                  onToggle={() => onToggleSection("staffStatus")}
                />
              )}
              {documentData && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3.5">
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-200">
                    <div>
                      <div className="font-extrabold text-gray-900">
                        What's New Since Last Visit
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Click to expand • Expanded content scrolls inside the
                        card
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {documentData?.documents?.length || 0}{" "}
                      {documentData?.documents?.length === 1 ? "item" : "items"}
                    </div>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto p-2.5">
                    <div className="mb-3">
                      <PatientIntakeUpdate documentData={documentData} />
                    </div>
                    <WhatsNewSection
                      documentData={documentData}
                      mode={mode}
                      copied={copied}
                      onCopySection={onCopySection}
                      isCollapsed={collapsedSections.whatsNew}
                      onToggle={() => onToggleSection("whatsNew")}
                    />
                  </div>
                </div>
              )}
              {documentData && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-3.5 overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-200">
                    <div>
                      <div className="font-extrabold text-gray-900">
                        Treatment History
                      </div>
                      <div className="text-xs text-gray-500">
                        Summary snapshots and history
                      </div>
                    </div>
                  </div>
                  <div className="px-3.5 py-3">
                    <TreatmentHistorySection documentData={documentData} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  ),
);
