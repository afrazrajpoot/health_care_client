import React from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar,
  FileText,
  TrendingUp,
  MessageSquare,
  Bell,
  Zap,
  History,
  Filter,
  ChevronRight,
  MoreVertical,
  Download,
  Share2,
  Eye,
  Tag,
  BarChart3
} from 'lucide-react';

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

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: <Clock className="w-4 h-4" />
        };
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: <CheckCircle className="w-4 h-4" />
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: <Tag className="w-4 h-4" />
        };
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

  // Get icon based on chip label/category
  const getChipIcon = (label: string, category: string) => {
    // Define icons for specific categories
    const categoryIcons: Record<string, React.ReactNode> = {
      'General Task Status': <Activity className="w-3.5 h-3.5" />,
      'Contact & Outreach': <MessageSquare className="w-3.5 h-3.5" />,
      'Scheduling': <Calendar className="w-3.5 h-3.5" />,
      'Authorization': <FileText className="w-3.5 h-3.5" />,
      'Document Handling': <FileText className="w-3.5 h-3.5" />,
      'Patient Response': <User className="w-3.5 h-3.5" />,
      'External Party': <User className="w-3.5 h-3.5" />,
      'Physician-Dependent': <User className="w-3.5 h-3.5" />,
      'Exception & Priority': <AlertCircle className="w-3.5 h-3.5" />
    };

    // Specific label icons
    const labelIcons: Record<string, React.ReactNode> = {
      'Urgent': <AlertCircle className="w-3.5 h-3.5" />,
      'Completed': <CheckCircle className="w-3.5 h-3.5" />,
      'Pending': <Clock className="w-3.5 h-3.5" />,
      'Overdue': <Bell className="w-3.5 h-3.5" />,
      'New': <Zap className="w-3.5 h-3.5" />,
      'High Priority': <AlertCircle className="w-3.5 h-3.5" />
    };

    return labelIcons[label] || categoryIcons[category] || <Activity className="w-3.5 h-3.5" />;
  };

  // Get chip color for Active Tasks box
  const getChipColor = (category: string) => {
    const colors: Record<string, string> = {
      'General Task Status': 'bg-blue-50 border-blue-200 text-blue-800',
      'Contact & Outreach': 'bg-purple-50 border-purple-200 text-purple-800',
      'Scheduling': 'bg-indigo-50 border-indigo-200 text-indigo-800',
      'Authorization': 'bg-cyan-50 border-cyan-200 text-cyan-800',
      'Document Handling': 'bg-teal-50 border-teal-200 text-teal-800',
      'Patient Response': 'bg-emerald-50 border-emerald-200 text-emerald-800',
      'External Party': 'bg-amber-50 border-amber-200 text-amber-800',
      'Physician-Dependent': 'bg-rose-50 border-rose-200 text-rose-800',
      'Exception & Priority': 'bg-red-50 border-red-200 text-red-800'
    };
    
    return colors[category] || 'bg-gray-50 border-gray-200 text-gray-800';
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
    <div className="font-sans bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 text-gray-900">
    
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Active Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[600px] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Active Tasks</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  {activeTasks.length} tasks
                </span>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Tasks with recent status updates and quick notes</p>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => {
                const priority = getPriorityBadge(task.priority || '');
                
                return (
                  <div 
                    key={task.id}
                    className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${priority.bg} ${priority.border} ${priority.text}`}>
                            {priority.icon}
                            {task.priority || 'Normal'} Priority
                          </span>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                            {task.type || 'General'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{task.description}</h3>
                      </div>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    
                    {/* Task Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {task.patient}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(task.dueDate || '')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {task.status}
                      </span>
                    </div>
                    
                    {/* Quick Notes */}
                    {task.quickNotes?.options && task.quickNotes.options.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <h4 className="text-sm font-semibold text-gray-700">Quick Notes</h4>
                        </div>
                        
                        {Object.entries(groupChipsByCategory(task.quickNotes.options)).map(([category, chips]) => (
                          <div key={category} className="mb-3 last:mb-0">
                            <h5 className="text-xs font-medium text-gray-500 mb-2">{category}</h5>
                            <div className="flex flex-wrap gap-2">
                              {chips.map((chip, index) => (
                                <span 
                                  key={index}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${getChipColor(category)}`}
                                >
                                  {getChipIcon(chip.label, category)}
                                  <span>{chip.label}</span>
                                  {chip.description && (
                                    <span className="text-xs font-normal opacity-75">
                                      • {chip.description}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Task Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Updated {formatDate(task.updatedAt || task.createdAt || '')}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.assignee && (
                          <div className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-700">
                            👤 {task.assignee}
                          </div>
                        )}
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Tasks with quick notes will appear here. Create new tasks or add notes to existing ones.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Treatment History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[600px] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <History className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Treatment History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <Share2 className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Complete patient treatment timeline and history</p>
          </div>
          
          <div className="h-full overflow-y-auto">
            {isTreatmentHistoryLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
                    <History className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Loading treatment history...</p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <TreatmentHistory documentData={{ treatment_history: treatmentHistoryData }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;