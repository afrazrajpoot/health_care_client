import TasksTable from "@/components/staff-components/TasksTable";
import PatientContent from "@/components/staff-components/PatientContent";
import TaskManager from "./TaskManager";

import { Task, RecentPatient, FailedDocument } from "@/utils/staffDashboardUtils";

interface TasksSectionProps {
  selectedPatient: RecentPatient | null;
  displayedTasks: Task[];
  taskTotalCount: number;
  taskPage: number;
  taskPageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  viewMode: "open" | "completed" | "all";
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
  onViewModeChange: (mode: "open" | "completed" | "all") => void;
  onTaskPageChange: (page: number) => void;
  onStatusClick: (taskId: string, status: string) => Promise<void>;
  onAssigneeClick: (taskId: string, assignee: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onSaveQuickNote?: (taskId: string, quickNotes: any) => Promise<void>;
  onFailedDocumentDeleted: (docId: string) => void;
  onFailedDocumentRowClick: (doc: FailedDocument) => void;
  userRole?: string;
  onBulkAssign?: (taskIds: string[], assignee: string) => Promise<void>;
  treatmentHistoryData?: any;
  isTreatmentHistoryLoading?: boolean;
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onSelectDocument?: (docId: string | null) => void;
  selectedDocumentId?: string | null;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  showAllTasks?: boolean;
}

import { useState, useCallback, useEffect } from "react";


export default function TasksSection({
  selectedPatient,
  displayedTasks,
  taskTotalCount,
  taskPage,
  taskPageSize,
  totalPages,
  hasNextPage,
  hasPrevPage,
  viewMode,
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
  onViewModeChange,
  onTaskPageChange,
  onStatusClick,
  onAssigneeClick,
  onTaskClick,
  onSaveQuickNote,
  onFailedDocumentDeleted,
  onFailedDocumentRowClick,
  userRole,
  onBulkAssign,
  treatmentHistoryData,
  isTreatmentHistoryLoading,
  onSearch,
  onRefresh,
  onSelectDocument,
  selectedDocumentId,
  onEditTask,
  onDeleteTask,
  showAllTasks,
}: TasksSectionProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Reset selection when patient changes
  useEffect(() => {
    setSelectedTaskIds([]);
  }, [selectedPatient?.patientName, selectedPatient?.dob, selectedPatient?.claimNumber]);

  const handleToggleTaskSelection = useCallback((taskIds: string[], selected: boolean) => {
    setSelectedTaskIds(prev => {
      if (selected) {
        // Add unique IDs
        const newIds = taskIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        // Remove IDs
        if (taskIds.length === 0) return []; // Clear all
        return prev.filter(id => !taskIds.includes(id));
      }
    });
  }, []);







  return (
    <div>
      {/* Patient Content Section */}
      <div className="px-[1vw]">
        {!showAllTasks && (
          <PatientContent
            selectedPatient={selectedPatient}
            loadingPatientData={loadingPatientData}
            patientIntakeUpdate={patientIntakeUpdate}
            patientQuiz={patientQuiz}
            taskStats={taskStats}
            questionnaireChips={questionnaireChips}
            formatDOB={formatDOB}
            formatClaimNumber={formatClaimNumber}
            treatmentHistoryData={treatmentHistoryData}
            isTreatmentHistoryLoading={isTreatmentHistoryLoading}
          />
        )}

      </div>
      {/* No Patient Selected Message */}
      {!selectedPatient && !showAllTasks && (
        <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-5 text-center mb-4">
          <p className="text-sm text-gray-500 m-0">
            Select a patient from the drawer to view their details and tasks
          </p>
        </section>
      )}




      {/* Show TasksTable - only one instance, handle both cases */}
      <div className="px-[1vw]">
        <TasksTable
          tasks={displayedTasks}
          taskStatuses={taskStatuses}
          taskAssignees={taskAssignees}
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
          selectedTaskIds={selectedTaskIds}
          onToggleTaskSelection={handleToggleTaskSelection}
          onSearch={onSearch}
          isLoading={loadingPatientData}
          onRefresh={onRefresh}
          onSelectDocument={onSelectDocument}
          selectedDocumentId={selectedDocumentId}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          showAllTasks={showAllTasks}
          taskTotalCount={taskTotalCount}
          taskStats={taskStats}
        />
        {(selectedPatient || showAllTasks) &&
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${hasPrevPage
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${hasNextPage
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
      <TaskManager
        tasks={displayedTasks as any}
        treatmentHistoryData={treatmentHistoryData}
        isTreatmentHistoryLoading={isTreatmentHistoryLoading}
      />


      {/* Pagination Controls - only show when patient is selected, has tasks, and has pagination */}

    </div>
  );
}