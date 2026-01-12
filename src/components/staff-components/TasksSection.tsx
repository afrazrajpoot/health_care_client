import TasksTable from "@/components/staff-components/TasksTable";
import PatientContent from "@/components/staff-components/PatientContent";
import TaskManager from "./TaskManager";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
}

interface Task {
  id: string;
  description: string;
  department: string;
  status: string;
  dueDate?: string;
  patient: string;
  priority?: string;
  quickNotes?: any;
  assignee?: string;
  actions?: string[];
  type?: string;
  document?: {
    id: string;
    claimNumber: string;
    status: string;
    ur_denial_reason?: string;
    blobPath?: string;
    patientName: string;
    gcsFileLink?: string;
    fileName?: string;
  };
}

interface FailedDocument {
  id: string;
  reason: string;
  db?: string;
  doi?: string;
  claimNumber?: string;
  patientName?: string;
  documentText?: string;
  physicianId?: string;
  gcsFileLink?: string;
  fileName: string;
  fileHash?: string;
  blobPath?: string;
  summary?: string;
}

interface TasksSectionProps {
  selectedPatient: RecentPatient | null;
  displayedTasks: Task[];
  taskTotalCount: number;
  taskPage: number;
  taskPageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  showCompletedTasks: boolean;
  taskStatuses: { [taskId: string]: string };
  taskAssignees: { [taskId: string]: string };
  failedDocuments: FailedDocument[];
  loadingPatientData: boolean;
  patientIntakeUpdate: any;
  patientQuiz: any;
  taskStats: any;
  questionnaireChips: any[];
  physicianId: string | null;
  getStatusOptions: (task: Task) => string[];
  getAssigneeOptions: (task: Task) => string[];
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
  onShowCompletedTasksChange: (show: boolean) => void;
  onTaskPageChange: (page: number) => void;
  onStatusClick: (taskId: string, status: string) => Promise<void>;
  onAssigneeClick: (taskId: string, assignee: string) => void;
  onTaskClick: (task: Task) => void;
  onSaveQuickNote?: (taskId: string, quickNotes: any) => Promise<void>;
  onFailedDocumentDeleted: (docId: string) => void;
  onFailedDocumentRowClick: (doc: FailedDocument) => void;
}

export default function TasksSection({
  selectedPatient,
  displayedTasks,
  taskTotalCount,
  taskPage,
  taskPageSize,
  totalPages,
  hasNextPage,
  hasPrevPage,
  showCompletedTasks,
  taskStatuses,
  taskAssignees,
  failedDocuments,
  loadingPatientData,
  patientIntakeUpdate,
  patientQuiz,
  taskStats,
  questionnaireChips,
  physicianId,
  getStatusOptions,
  getAssigneeOptions,
  formatDOB,
  formatClaimNumber,
  onShowCompletedTasksChange,
  onTaskPageChange,
  onStatusClick,
  onAssigneeClick,
  onTaskClick,
  onSaveQuickNote,
  onFailedDocumentDeleted,
  onFailedDocumentRowClick,
}: TasksSectionProps) {
  return (
    <div>
      {/* Patient Content Section */}
      <PatientContent
        selectedPatient={selectedPatient}
        loadingPatientData={loadingPatientData}
        patientIntakeUpdate={patientIntakeUpdate}
        patientQuiz={patientQuiz}
        taskStats={taskStats}
        questionnaireChips={questionnaireChips}
        formatDOB={formatDOB}
        formatClaimNumber={formatClaimNumber}
      />

      {/* No Patient Selected Message */}
      {!selectedPatient && (
        <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-5 text-center mb-4">
          <p className="text-sm text-gray-500 m-0">
            Select a patient from the drawer to view their details and tasks
          </p>
        </section>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-slate-900 m-0">
          {selectedPatient && displayedTasks.length > 0 ? (
            showCompletedTasks ? (
              `Completed Tasks (${taskTotalCount})`
            ) : (
              `Open Tasks & Required Actions (${taskTotalCount})`
            )
          ) : (
            <span className="text-red-700"></span>
          )}
        </h3>

        {/* Show task filters only when patient is selected AND has tasks */}
        {selectedPatient && displayedTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShowCompletedTasksChange(!showCompletedTasks)}
              className={`px-4 py-2 rounded-lg border border-gray-200 cursor-pointer text-[13px] font-medium transition-all duration-200 ${
                showCompletedTasks
                  ? "bg-green-700 text-white"
                  : "bg-white text-slate-900 hover:bg-gray-50"
              }`}
            >
              {showCompletedTasks ? "Show Open Tasks" : "Show Completed Tasks"}
            </button>
          </div>
        )}
      </div>

      {/* Show TasksTable - only one instance, handle both cases */}
      <TaskManager  tasks={displayedTasks} />
      <TasksTable
        tasks={
          selectedPatient && displayedTasks.length > 0 ? displayedTasks : []
        }
        taskStatuses={
          selectedPatient && displayedTasks.length > 0 ? taskStatuses : {}
        }
        taskAssignees={
          selectedPatient && displayedTasks.length > 0 ? taskAssignees : {}
        }
        onStatusClick={onStatusClick}
        onAssigneeClick={onAssigneeClick}
        onTaskClick={onTaskClick}
        onSaveQuickNote={onSaveQuickNote}
        getStatusOptions={getStatusOptions}
        getAssigneeOptions={getAssigneeOptions}
        // ALWAYS pass failed documents (they show in ALL cases)
        failedDocuments={failedDocuments}
        onFailedDocumentDeleted={onFailedDocumentDeleted}
        onFailedDocumentRowClick={onFailedDocumentRowClick}
        mode="wc"
        physicianId={physicianId || undefined}
      />

      {/* Pagination Controls - only show when patient is selected, has tasks, and has pagination */}
      {selectedPatient &&
        displayedTasks.length > 0 &&
        taskTotalCount > taskPageSize && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Showing {(taskPage - 1) * taskPageSize + 1} to{" "}
              {Math.min(taskPage * taskPageSize, taskTotalCount)} of{" "}
              {taskTotalCount} tasks
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTaskPageChange(Math.max(1, taskPage - 1))}
                disabled={!hasPrevPage}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                  hasPrevPage
                    ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {taskPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  onTaskPageChange(Math.min(totalPages, taskPage + 1))
                }
                disabled={!hasNextPage}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                  hasNextPage
                    ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
