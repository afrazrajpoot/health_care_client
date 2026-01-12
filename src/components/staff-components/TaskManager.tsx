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
  priority: string;
  quickNotes?: QuickNote;
  actions: string[];
  assignee: string;
  department: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  documentId: string;
  physicianId: string;
  sourceDocument: string;
  type: string;
  claimNumber: string | null;
  followUpTaskId: string | null;
  reason: string | null;
  ur_denial_reason: string | null;
}

interface TaskManagerProps {
  tasks: Task[];
}

const TaskManager = ({ tasks }: TaskManagerProps) => {
  console.log('Tasks data:', tasks);
  
  // Filter tasks for Active Tasks section - now checking for options instead of status_update
  const activeTasks = tasks.filter(task => 
    task.status !== 'Open' && 
    task.status !== 'pending' && 
    task.quickNotes?.options && 
    task.quickNotes.options.length > 0
  );
  
  // Filter tasks for Open Tasks section
  const openTasks = tasks.filter(task => 
    task.quickNotes?.options && 
    task.quickNotes.options.length > 0 && 
    (task.status === 'Open' || task.status === 'pending')
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

  // Get chip color for Open Tasks box (rotating between yellow, green, gray)
  const getOpenChipColor = (index: number) => {
    const colors = [
      "bg-yellow-100 border border-yellow-300", // yellow
      "bg-green-100 border border-green-300",   // green
      "bg-gray-100 border border-gray-300",     // gray
    ];
    return colors[index % colors.length];
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
      <h1 className="text-2xl mb-3">DocLatch – Staff Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Active Tasks - ALL YELLOW CHIPS */}
        <div className="bg-white rounded-xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg mb-2.5 flex justify-between items-center">
            Active Tasks
            <span className="text-sm font-normal text-gray-500">
              {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
            </span>
          </h2>
          
          {activeTasks.length > 0 ? (
            <div className="space-y-3">
              {activeTasks.map((task) => (
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
                    {/* <div className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {task.assignee}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              No active tasks with status updates
            </div>
          )}
        </div>
        
        {/* RIGHT: Open Tasks - YELLOW, GREEN, GRAY ROTATING CHIPS */}
        <div className="bg-white rounded-xl p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg mb-2.5 flex justify-between items-center">
            Open Tasks
            <span className="text-sm font-normal text-gray-500">
              {openTasks.length} task{openTasks.length !== 1 ? 's' : ''}
            </span>
          </h2>
          
          {openTasks.length > 0 ? (
            <div className="space-y-3">
              {openTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`bg-[#f9fafb] rounded-xl p-3 border-l-4 ${getPriorityColor(task.priority)}`}
                >
                  <div className="font-semibold text-sm mb-1.5">{task.description}</div>
                  <div className="text-xs text-[#6b7280] mb-2">
                    Patient: {task.patient} · Priority: {task.priority} · Due: {formatDate(task.dueDate)}
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
                                className={`${getOpenChipColor(index)} px-2 py-1 rounded-lg text-xs flex items-center gap-1`}
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
                        <span className="bg-yellow-100 border border-yellow-300 px-2.5 py-1.5 rounded-2xl text-xs">
                          📝 {task.quickNotes.status_update}
                        </span>
                        {task.quickNotes.one_line_note && (
                          <span className="bg-green-100 border border-green-300 px-2.5 py-1.5 rounded-2xl text-xs">
                            🏷 {task.quickNotes.one_line_note}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  
                  {task.actions && task.actions.length > 0 && (
                    <div className="mt-2">
                      <strong className="block mb-2">Actions Available</strong>
                      <div className="flex flex-wrap gap-2">
                        {task.actions.map((action, index) => (
                          <span 
                            key={index}
                            className="bg-blue-100 border border-blue-300 px-2.5 py-1.5 rounded-2xl text-xs flex items-center gap-1"
                          >
                            <span>{action === 'Confirm' || action === 'Verify' ? '✅' : '📄'}</span>
                            <span>{action}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      {task.department}
                    </div>
                    {/* <div className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {task.assignee}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              No open tasks with status updates
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold">{tasks.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Active Tasks</div>
          <div className="text-2xl font-bold text-blue-600">{activeTasks.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="text-sm text-gray-500">Open Tasks</div>
          <div className="text-2xl font-bold text-orange-600">{openTasks.length}</div>
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