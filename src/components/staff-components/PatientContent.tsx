import PatientHeader from "@/components/staff-components/PatientHeader";
import TaskSummary from "@/components/staff-components/TaskSummary";
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
}: PatientContentProps) {
  // Don't render anything if no patient is selected - let TasksSection handle this
  if (!selectedPatient) {
    return null;
  }

  if (loadingPatientData) {
    return (
      <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-5 text-center">
        <p className="text-sm text-gray-500 m-0">Loading patient data...</p>
      </section>
    );
  }

  return (
    <>
      <PatientHeader
        patient={selectedPatient}
        formatDOB={formatDOB}
        formatClaimNumber={formatClaimNumber}
        completedTasks={taskStats.completed}
      />

      {/* <TaskSummary
        open={taskStats.open}
        urgent={taskStats.urgent}
        dueToday={taskStats.dueToday}
        completed={taskStats.completed}
      /> */}

      <QuestionnaireSummary chips={questionnaireChips} />
    </>
  );
}
