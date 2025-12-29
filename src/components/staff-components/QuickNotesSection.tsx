"use client";

import React from "react";

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
}

interface QuickNotesSectionProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

// Reusable Badge Component
const Badge = ({
  children,
  color = "blue",
  size = "md",
  rounded = "default",
}: {
  children: React.ReactNode;
  color?: "red" | "amber" | "green" | "blue" | "gray";
  size?: "sm" | "md";
  rounded?: "default" | "full";
}) => {
  const baseClasses =
    "inline-flex items-center font-semibold transition-colors duration-200";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  const colorClasses = {
    red: "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200",
    amber:
      "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200",
    green:
      "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200",
    blue: "bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200",
    gray: "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200",
  };

  const roundedClasses = {
    default: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} ${roundedClasses[rounded]}`}
    >
      {children}
    </span>
  );
};

// Component to determine badge color based on task priority/status[citation:4][citation:6][citation:8]
const PriorityBadge = ({ task }: { task: Task }) => {
  if (
    task.priority === "high" ||
    task.status?.toLowerCase().includes("urgent") ||
    task.status?.toLowerCase().includes("signature") ||
    task.status?.toLowerCase().includes("physician")
  ) {
    return <Badge color="red">High Priority</Badge>;
  } else if (
    task.priority === "medium" ||
    task.status?.toLowerCase().includes("progress")
  ) {
    return <Badge color="amber">In Progress</Badge>;
  } else if (
    task.status?.toLowerCase().includes("completed") ||
    task.status?.toLowerCase().includes("done") ||
    task.status?.toLowerCase().includes("closed")
  ) {
    return <Badge color="green">Completed</Badge>;
  }
  return <Badge color="blue">Standard</Badge>;
};

export default function QuickNotesSection({
  tasks,
  onTaskClick,
}: QuickNotesSectionProps) {
  // Filter tasks that have at least one quick note
  const tasksWithNotes = tasks.filter((task) => {
    if (!task.quickNotes) return false;
    return (
      task.quickNotes.status_update ||
      task.quickNotes.one_line_note ||
      task.quickNotes.details
    );
  });

  if (tasksWithNotes.length === 0) return null;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Get border color based on task priority or status (keep for backward compatibility)
  const getBorderColor = (task: Task): string => {
    if (
      task.priority === "high" ||
      task.status?.toLowerCase().includes("urgent")
    ) {
      return "#dc2626";
    } else if (
      task.priority === "medium" ||
      task.status?.toLowerCase().includes("progress")
    ) {
      return "#d97706";
    } else if (
      task.status?.toLowerCase().includes("completed") ||
      task.status?.toLowerCase().includes("done")
    ) {
      return "#15803d";
    }
    return "#2563eb";
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-base font-bold text-gray-900 mb-4">Quick Notes</h3>
      <div className="space-y-4">
        {tasksWithNotes.map((task) => (
          <div
            key={task.id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer group hover:shadow-sm"
            style={{ borderLeft: `4px solid ${getBorderColor(task)}` }}
            onClick={() => onTaskClick(task)}
          >
            {/* Task Header with Badges */}
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {task.description}
              </h4>
              <div className="flex items-center gap-2">
                <PriorityBadge task={task} />
                <Badge color="gray" size="sm">
                  {task.department}
                </Badge>
              </div>
            </div>

            {/* Task Metadata */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
              <span className="inline-flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <strong className="mr-1">Due:</strong>{" "}
                {formatDate(task.dueDate)}
              </span>
              <span className="inline-flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <strong className="mr-1">Assignee:</strong>{" "}
                {task.assignee || "Unclaimed"}
              </span>
            </div>

            {/* Quick Notes Summary */}
            {task.quickNotes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {task.quickNotes.status_update && (
                    <Badge color="blue" size="sm" rounded="full">
                      Status: {task.quickNotes.status_update}
                    </Badge>
                  )}
                  {task.quickNotes.one_line_note && (
                    <Badge color="green" size="sm" rounded="full">
                      Note: {task.quickNotes.one_line_note.substring(0, 20)}...
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Click hint */}
            <div className="mt-3 text-xs text-gray-500 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Click to edit task
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
