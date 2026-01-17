import TasksTable from "@/components/staff-components/TasksTable";
import PatientContent from "@/components/staff-components/PatientContent";
import TaskManager from "./TaskManager";

import { Task, RecentPatient, FailedDocument } from "@/utils/staffDashboardUtils";

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
  onAssigneeClick: (taskId: string, assignee: string) => void;
  onTaskClick: (task: Task) => void;
  onSaveQuickNote?: (taskId: string, quickNotes: any) => Promise<void>;
  onFailedDocumentDeleted: (docId: string) => void;
  onFailedDocumentRowClick: (doc: FailedDocument) => void;
  userRole?: string;
  onBulkAssign?: (taskIds: string[], assignee: string) => Promise<void>;
}

import { useState, useCallback } from "react";
import StaffAssignmentSection from "./StaffAssignmentSection";

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
}: TasksSectionProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

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

  const handleAssignTasks = async (staffId: string, staffName: string) => {
    // If bulk assign handler is provided, use it
    if (onBulkAssign) {
      await onBulkAssign(selectedTaskIds, staffName);
      setSelectedTaskIds([]);
      return;
    }

    // Fallback to individual assignment (legacy behavior)
    for (const taskId of selectedTaskIds) {
        await onAssigneeClick(taskId, staffName);
    }
    // Clear selection
    setSelectedTaskIds([]);
  };

  // Handle view mode toggle
  const handleViewModeToggle = () => {
    if (viewMode === "open") {
      onViewModeChange("completed");
    } else if (viewMode === "completed") {
      onViewModeChange("all");
    } else {
      onViewModeChange("completed");
    }
  };

  // Get button text based on current view mode
  const getViewModeButtonText = () => {
    if (viewMode === "open") {
      return "Show Completed Tasks";
    } else if (viewMode === "completed") {
      return "Show All Tasks";
    } else {
      return "Show Completed Tasks";
    }
  };

  // Get button class based on current view mode
  const getViewModeButtonClass = () => {
    const baseClass = "px-4 py-2 rounded-lg border border-gray-200 cursor-pointer text-[13px] font-medium transition-all duration-200";
    
    // Show green when in "completed" or "all" mode (indicating a filter is active or changed)
    if (viewMode === "completed" || viewMode === "all") {
      return `${baseClass} bg-green-700 text-white`;
    } else {
      return `${baseClass} bg-white text-slate-900 hover:bg-gray-50`;
    }
  };

  // Get section title based on view mode
  const getSectionTitle = () => {
    if (!selectedPatient) {
      return "";
    }
    
    if (viewMode === "completed") {
      return `Completed Tasks (${taskTotalCount})`;
    } else if (viewMode === "all") {
      return `All Tasks (${taskTotalCount})`;
    } else {
      return `Open Tasks & Required Actions (${taskTotalCount})`;
    }
  };

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
          {getSectionTitle()}
        </h3>

        {/* Show task filters when patient is selected */}
        {selectedPatient && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewModeToggle}
              className={getViewModeButtonClass()}
            >
              {getViewModeButtonText()}
            </button>
          </div>
        )}
      </div>

      {/* Staff Assignment Section - Only visible to Physicians */}
      {userRole === "Physician" && (
        <StaffAssignmentSection 
            selectedTaskIds={selectedTaskIds}
            taskAssignees={taskAssignees}
            onAssign={handleAssignTasks}
        />
      )}

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
        selectedTaskIds={selectedTaskIds}
        onToggleTaskSelection={handleToggleTaskSelection}
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