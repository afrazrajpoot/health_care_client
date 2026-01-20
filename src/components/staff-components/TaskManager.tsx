import React from 'react';

// Updated interface to match new quickNotes structure
interface ChipData {
  label: string;
  description: string;
  category: string;
}

interface QuickNote {
  options?: ChipData[];
  timestamp?: string;
  // Keep old fields for backward compatibility
  details?: string;
  one_line_note?: string;
  status_update?: string;
}

interface Task {
  id: string;
  description: string;
  patient: string;
  status: string;
  priority?: string;
  quickNotes?: QuickNote;
  actions?: string[];
  assignee?: string;
  department?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  documentId?: string;
  physicianId?: string;
  sourceDocument?: string;
  type?: string;
  claimNumber?: string | null;
  followUpTaskId?: string | null;
  reason?: string | null;
  ur_denial_reason?: string | null;
}

import TreatmentHistory from "@/components/physician-components/TreatmentHistorySection";

interface TaskManagerProps {
  tasks: Task[];
  treatmentHistoryData?: any;
  isTreatmentHistoryLoading?: boolean;
}

const TaskManager = ({ tasks, treatmentHistoryData, isTreatmentHistoryLoading }: TaskManagerProps) => {
  console.log('Tasks data:', tasks);
  
  // Filter tasks for Active Tasks section - include all tasks with quick notes regardless of status
  const activeTasks = tasks.filter(task => 
    task.quickNotes?.options && 
    task.quickNotes.options.length > 0
  );

  // Map task priority to color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-[#3b82f6]';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get emoji based on chip label/category
  const getChipEmoji = (label: string) => {
    // Define emojis for specific labels
    const emojiMap: Record<string, string> = {
      // General Task Status
      'New': '🟡',
      'In Progress': '🔵',
      'Waiting': '⏸',
      'Completed': '✅',
      'Unable to Complete': '🚫',
      'Reopened': '🔁',
      
      // Contact & Outreach Status
      'Called – No Answer': '📞',
      'Left Voicemail': '📩',
      'Email Sent': '✉️',
      'Fax Sent': '📠',
      'Text Sent': '📲',
      'Spoke With Party': '🤝',
      'Callback Scheduled': '📆',
      
      // Scheduling Status
      'Scheduled': '🗓',
      'Pending Availability': '⏳',
      'Rescheduled': '🔄',
      'Cancelled': '❌',
      'Patient No-Show': '🚷',
      'Facility Confirmed': '🏥',
      
      // Authorization / RFA Status
      'RFA Sent': '📤',
      'Auth Received': '📥',
      'Auth Name Update Needed': '🏷',
      'Denied': '❌',
      'Partial Approval': '🟠',
      'Pending UR': '⏳',
      'Clarification Requested': '🧾',
      'Appeal Needed': '⚠️',
      
      // Document Handling Status
      'Received': '📄',
      'Reviewed': '👀',
      'Categorized': '🏷',
      'Action Required': '📌',
      'Linked to Case': '🔗',
      'Filed / Archived': '🗄',
      
      // Patient Response Status
      'Patient Reached': '🙋',
      'Awaiting Patient': '⏰',
      'Forms Sent': '📋',
      'Forms Completed': '🖊',
      'Declined': '🚫',
      'Needs Follow-Up': '🔁',
      
      // External Party Status
      'Attorney Notified': '⚖️',
      'Adjuster Contacted': '🧑‍💼',
      'NCM Contacted': '🩺',
      'Facility Contacted': '🏥',
      'Response Received': '📨',
      'No Response': '⛔',
      
      // Physician-Dependent Status
      'Physician Review Needed': '🩺',
      'Signature Required': '✍️',
      'Addendum Requested': '📑',
      'Clinical Decision Pending': '🔍',
      'Physician Verified': '✅',
      
      // Exception & Priority Flags
      'Time-Sensitive': '⚠️',
      'Overdue': '⏰',
      'High Priority': '🔥',
      'Resolved After Escalation': '🧯',
    };
    
    return emojiMap[label] || '📝';
  };

  // Get chip color for Active Tasks box (all yellow)
  const getActiveChipColor = () => {
    return "bg-yellow-100 border border-yellow-300";
  };

  // Group chips by category
  const groupChipsByCategory = (chips: ChipData[]) => {
    const grouped: Record<string, ChipData[]> = {};
    
    chips.forEach(chip => {
      if (!grouped[chip.category]) {
        grouped[chip.category] = [];
      }
      grouped[chip.category].push(chip);
    });
    
    return grouped;
  };

  // Check if task has quick notes (backward compatible)
  const hasQuickNotes = (task: Task) => {
    return (task.quickNotes?.options && task.quickNotes.options.length > 0) || 
           task.quickNotes?.status_update ||
           task.quickNotes?.details;
  };

  return (
    <div className="font-sans bg-[#f5f7fb] p-5 text-[#1f2937]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[500px]">
        {/* LEFT: Active Tasks - Scrollable */}
        <div className="bg-white rounded-xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)] flex flex-col h-full overflow-hidden">
          <h2 className="text-lg mb-2.5 flex justify-between items-center flex-shrink-0">
            Active Tasks
            <span className="text-sm font-normal text-gray-500">
              {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
            </span>
          </h2>
          
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`bg-[#f9fafb] rounded-xl p-3 border-l-4 ${getPriorityColor(task.priority)}`}
                >
                  <div className="font-semibold text-sm mb-1.5">{task.description}</div>
                  <div className="text-xs text-[#6b7280] mb-2">
                    Patient: {task.patient} · Status: {task.status} · Due: {formatDate(task.dueDate)}
                  </div>
                  
                  {/* New quickNotes format with options array */}
                  {task.quickNotes?.options && task.quickNotes.options.length > 0 && (
                    <>
                      {/* Group chips by category */}
                      {Object.entries(groupChipsByCategory(task.quickNotes.options)).map(([category, chips]) => (
                        <div key={category} className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">{category}</h4>
                          <div className="flex flex-wrap gap-1">
                            {chips.map((chip, index) => (
                              <span 
                                key={index}
                                className={`${getActiveChipColor()} px-2 py-1 rounded-lg text-xs flex items-center gap-1`}
                              >
                                <span>{getChipEmoji(chip.label)}</span>
                                <span className="font-medium">{chip.label}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Backward compatibility - old format */}
                  {task.quickNotes?.status_update && !task.quickNotes?.options && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`${getActiveChipColor()} px-2.5 py-1.5 rounded-2xl text-xs`}>
                          📝 {task.quickNotes.status_update}
                        </span>
                        {task.quickNotes.one_line_note && (
                          <span className={`${getActiveChipColor()} px-2.5 py-1.5 rounded-2xl text-xs`}>
                            🏷 {task.quickNotes.one_line_note}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Updated: {formatDate(task.updatedAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No active tasks with status updates
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Treatment History - Scrollable */}
        <div className="bg-white rounded-xl p-0 shadow-[0_6px_18px_rgba(0,0,0,0.06)] flex flex-col h-full overflow-hidden">
          <div className="h-full overflow-y-auto">
            {isTreatmentHistoryLoading ? (
              <div className="p-4 text-center text-gray-500">Loading history...</div>
            ) : (
              <TreatmentHistory documentData={{ treatment_history: treatmentHistoryData }} />
            )}
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold">{tasks.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Active Tasks</div>
          <div className="text-2xl font-bold text-blue-600">{activeTasks.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">With Quick Notes</div>
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => hasQuickNotes(t)).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;