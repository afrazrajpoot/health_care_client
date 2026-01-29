import PatientHeader from "@/components/staff-components/PatientHeader";
import TaskSummary from "@/components/staff-components/TaskSummary";
import TreatmentHistorySection from "@/components/staff-components/TreatmentHistorySection";
import QuestionnaireSummary from "@/components/staff-components/QuestionnaireSummary";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
}

interface TaskStats {
  open: number;
  urgent: number;
  dueToday: number;
  completed: number;
}

interface QuestionnaireChip {
  text: string;
  type: "blue" | "amber" | "red" | "green";
}

interface PatientContentProps {
  selectedPatient: RecentPatient | null;
  loadingPatientData: boolean;
  patientIntakeUpdate: any;
  patientQuiz: any;
  taskStats: TaskStats;
  questionnaireChips: QuestionnaireChip[];
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
  treatmentHistoryData?: any;
  isTreatmentHistoryLoading?: boolean;
  onSelectDocument?: (docId: string | null) => void;
  selectedDocumentId?: string | null;
}

export default function PatientContent({
  selectedPatient,
  loadingPatientData,
  patientIntakeUpdate,
  patientQuiz,
  taskStats,
  questionnaireChips,
  formatDOB,
  formatClaimNumber,
  treatmentHistoryData,
  isTreatmentHistoryLoading,
  onSelectDocument,
  selectedDocumentId,
}: PatientContentProps) {
  // Don't render anything if no patient is selected - let TasksSection handle this
  if (!selectedPatient) {
    return null;
  }

  return (
    <>
      <PatientHeader
        patient={selectedPatient}
        formatDOB={formatDOB}
        formatClaimNumber={formatClaimNumber}
        completedTasks={taskStats.completed}
      />

      {loadingPatientData ? (
        <section className="bg-white/60 backdrop-blur-[2px] border border-gray-200 rounded-[14px] p-8 text-center my-4 animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-blue-600">
              Syncing patient data...
            </p>
          </div>
        </section>
      ) : (
        <>
          <TaskSummary
            open={taskStats.open}
            urgent={taskStats.urgent}
            dueToday={taskStats.dueToday}
            completed={taskStats.completed}
          />

          <QuestionnaireSummary chips={questionnaireChips} />
        </>
      )}
    </>
  );
}
