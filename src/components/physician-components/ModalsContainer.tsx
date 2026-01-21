import React from "react";
import { BriefSummaryModal } from "./BriefSummaryModal";
import { PreviousSummaryModal } from "./PreviousSummaryModal";
import ManualTaskModal from "../ManualTaskModal";
import { DocumentSummary } from "@/app/custom-hooks/staff-hooks/physician-hooks/types";

interface ModalsContainerProps {
  showPreviousSummary: boolean;
  onCloseBriefSummary: () => void;
  selectedBriefSummary: string;
  onClosePreviousSummary: () => void;
  onViewBrief: (summary: string) => void;
  previousSummary: DocumentSummary | null;
  formatDate: (date: string | undefined) => string;
  showManualTaskModal: boolean;
  onManualTaskModalChange: (open: boolean) => void;
  defaultClaim: string | undefined;
  defaultPatient: string | undefined;
  defaultDocumentId: string | undefined;
  onManualTaskSubmit: (data: any) => Promise<void>;
  session: any;
  addToast: (msg: string, type: "success" | "error") => void;
}

export const ModalsContainer = React.memo<ModalsContainerProps>(({
  showPreviousSummary,
  onCloseBriefSummary,
  selectedBriefSummary,
  onClosePreviousSummary,
  onViewBrief,
  previousSummary,
  formatDate,
  showManualTaskModal,
  onManualTaskModalChange,
  defaultClaim,
  defaultPatient,
  defaultDocumentId,
  onManualTaskSubmit,
  session,
  addToast,
}) => (
  <>
    {/* BriefSummaryModal - opens when selectedBriefSummary is not empty */}
    <BriefSummaryModal
      isOpen={!!selectedBriefSummary}
      onClose={onCloseBriefSummary}
      briefSummary={selectedBriefSummary}
    />

    {/* PreviousSummaryModal - opens when showPreviousSummary is true */}
    <PreviousSummaryModal
      isOpen={showPreviousSummary}
      onClose={onClosePreviousSummary}
      onViewBrief={onViewBrief}
      previousSummary={previousSummary}
      formatDate={formatDate}
    />

    {/* ManualTaskModal for creating manual tasks */}
    <ManualTaskModal
      open={showManualTaskModal}
      onOpenChange={onManualTaskModalChange}
      departments={[
        "Medical/Clinical",
        "Scheduling & Coordination",
        "Administrative / Compliance",
        "Authorizations & Denials",
      ]}
      defaultClaim={defaultClaim}
      defaultPatient={defaultPatient}
      defaultDocumentId={defaultDocumentId}
      onSubmit={onManualTaskSubmit}
    />
  </>
));

ModalsContainer.displayName = "ModalsContainer";