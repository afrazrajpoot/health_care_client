// app/tasks/page.tsx
"use client";

import React, { useState } from "react";
import {
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  ListTodo,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string;
  type: "RFA" | "REBUTTAL" | "WORK_STATUS_REVIEW" | "REVIEW";
  patientName?: string;
}

const TasksPage = () => {
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");

  const tasks: Task[] = [
    {
      id: "1",
      title: "Review Work Status (TTD > 30d)",
      description: "Patient work status overdue - requires physician review",
      assignee: "Dr. Smith",
      priority: "HIGH",
      status: "PENDING",
      dueDate: "2024-09-25",
      type: "WORK_STATUS_REVIEW",
      patientName: "John Smith",
    },
    {
      id: "2",
      title: "Draft Rebuttal - Physical Therapy",
      assignee: "Dr. Johnson",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      dueDate: "2024-09-23",
      type: "REBUTTAL",
      patientName: "Emily White",
    },
    {
      id: "3",
      title: "Review QME Report",
      assignee: "MA Thompson",
      priority: "MEDIUM",
      status: "PENDING",
      dueDate: "2024-09-26",
      type: "REVIEW",
      patientName: "Michael Brown",
    },
    {
      id: "4",
      title: "Schedule Follow-up Appointment",
      assignee: "Scheduling Team",
      priority: "LOW",
      status: "COMPLETED",
      dueDate: "2024-09-20",
      type: "RFA",
      patientName: "Sarah Davis",
    },
  ];

  const getStatusColumns = () => {
    return [
      { id: "PENDING", title: "To Do", status: "PENDING", color: "blue" },
      {
        id: "IN_PROGRESS",
        title: "In Progress",
        status: "IN_PROGRESS",
        color: "amber",
      },
      {
        id: "COMPLETED",
        title: "Completed",
        status: "COMPLETED",
        color: "green",
      },
    ];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOW":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getColumnHeaderColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-700";
      case "amber":
        return "text-amber-700";
      case "green":
        return "text-green-700";
      default:
        return "text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "WORK_STATUS_REVIEW":
        return <AlertTriangle className="w-3 h-3" />;
      case "REBUTTAL":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== "ALL" && task.priority !== filterPriority)
      return false;
    if (filterAssignee !== "ALL" && !task.assignee.includes(filterAssignee))
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">
              Manage and track team assignments
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-48 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Staff</SelectItem>
                <SelectItem value="Dr.">Physicians</SelectItem>
                <SelectItem value="MA">Medical Assistants</SelectItem>
                <SelectItem value="Scheduling">Scheduling Team</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {getStatusColumns().map((column) => (
            <div key={column.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-lg font-semibold ${getColumnHeaderColor(
                    column.color
                  )}`}
                >
                  {column.title}
                </h2>
                <Badge variant="outline" className="bg-white font-medium">
                  {
                    filteredTasks.filter((t) => t.status === column.status)
                      .length
                  }
                </Badge>
              </div>

              <div className="space-y-4">
                {filteredTasks
                  .filter((task) => task.status === column.status)
                  .sort((a, b) => {
                    const priorityOrder = {
                      CRITICAL: 4,
                      HIGH: 3,
                      MEDIUM: 2,
                      LOW: 1,
                    };
                    return (
                      priorityOrder[b.priority] - priorityOrder[a.priority]
                    );
                  })
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}

                {filteredTasks.filter((t) => t.status === column.status)
                  .length === 0 && (
                  <div className="text-center py-8">
                    <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task }: { task: Task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOW":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date();

  return (
    <LayoutWrapper>
      <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </Badge>
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                isOverdue ? "text-red-600" : "text-gray-500"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {(() => {
                const d = new Date(task.dueDate);
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const year = d.getFullYear();
                return `${month}-${day}-${year}`;
              })()}
            </div>
          </div>

          <h4 className="font-semibold text-sm text-gray-900 mb-3 leading-relaxed">
            {task.title}
          </h4>

          {task.patientName && (
            <p className="text-xs text-gray-600 mb-3 font-medium">
              Patient: <span className="text-gray-900">{task.patientName}</span>
            </p>
          )}

          {task.description && (
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-gray-400" />
              <span className="font-medium text-gray-700">{task.assignee}</span>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-gray-50 text-gray-700 border-gray-200 font-medium"
            >
              {task.type.replace("_", " ")}
            </Badge>
          </div>

          {task.type === "WORK_STATUS_REVIEW" && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-3 w-3 text-orange-600" />
                <span className="font-semibold text-orange-800 text-xs">
                  Work Status Alert
                </span>
              </div>
              <p className="text-orange-700 text-xs leading-relaxed">
                Patient work status overdue - requires physician review
              </p>
            </div>
          )}

          {isOverdue && task.status !== "COMPLETED" && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-red-600" />
                <span className="font-semibold text-red-800 text-xs">
                  Overdue
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </LayoutWrapper>
  );
};

export default TasksPage;
