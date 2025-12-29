"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

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

interface TasksTableProps {
  tasks: Task[];
  taskStatuses: { [taskId: string]: string };
  taskAssignees: { [taskId: string]: string };
  onStatusClick: (taskId: string, status: string) => void;
  onAssigneeClick: (taskId: string, assignee: string) => void;
  onTaskClick: (task: Task) => void;
  getStatusOptions: (task: Task) => string[];
  getAssigneeOptions: (task: Task) => string[];
}

export default function TasksTable({
  tasks,
  taskStatuses,
  taskAssignees,
  onStatusClick,
  onAssigneeClick,
  onTaskClick,
  getStatusOptions,
  getAssigneeOptions,
}: TasksTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (tasks.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
        <div className="p-10 text-center text-gray-500">
          <p className="text-sm m-0">No tasks found</p>
        </div>
      </section>
    );
  }

  const getStatusChipColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("signature") || s.includes("physician"))
      return "border-red-400 bg-red-100 text-red-700";
    if (s.includes("progress"))
      return "border-amber-400 bg-amber-100 text-amber-700";
    if (s.includes("pending"))
      return "border-orange-400 bg-orange-100 text-orange-700";
    if (s.includes("waiting") || s.includes("callback"))
      return "border-purple-400 bg-purple-100 text-purple-700";
    if (s.includes("scheduling"))
      return "border-blue-400 bg-blue-100 text-blue-700";
    if (s.includes("completed") || s.includes("done"))
      return "border-green-400 bg-green-100 text-green-700";
    if (s.includes("unclaimed"))
      return "border-gray-400 bg-gray-100 text-gray-700";
    return "border-blue-400 bg-blue-100 text-blue-700";
  };

  const getAssigneeChipColor = (assignee: string) => {
    const a = assignee.toLowerCase();
    if (a.includes("unclaimed"))
      return "border-gray-400 bg-gray-100 text-gray-700";
    if (a.includes("physician"))
      return "border-red-400 bg-red-100 text-red-700";
    if (a.includes("admin"))
      return "border-indigo-400 bg-indigo-100 text-indigo-700";
    if (a.includes("scheduler"))
      return "border-teal-400 bg-teal-100 text-teal-700";
    if (a.includes("ma")) return "border-cyan-400 bg-cyan-100 text-cyan-700";
    return "border-blue-400 bg-blue-100 text-blue-700";
  };

  return (
    <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] flex flex-col min-h-0 flex-1 overflow-hidden">
      <h3 className="m-0 px-3.5 py-3 text-base font-bold border-b border-gray-200">
        Open Tasks & Required Actions
      </h3>
      <div className="min-h-0 max-h-full overflow-y-auto overflow-x-hidden flex-1 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:min-w-5 [&::-webkit-scrollbar-thumb]:min-h-5 [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
        <div className="overflow-x-auto overflow-y-visible w-full [-webkit-overflow-scrolling:touch] relative [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:min-w-5 [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
          <table className="w-max min-w-full border-collapse table-auto text-sm visible table box-border">
            <thead>
              <tr>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[250px] w-[250px] whitespace-normal">
                  Item
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[50px] w-[50px] whitespace-nowrap">
                  Status
                </th>
                {/* <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[220px] w-[220px] whitespace-nowrap">
                  Assignee
                </th> */}
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[150px] w-[150px] whitespace-nowrap">
                  Type
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[100px] w-[100px] whitespace-nowrap">
                  Due
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[100px] w-[100px] whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const currentStatus =
                  taskStatuses[task.id] || task.status || "Pending";
                const currentAssignee =
                  taskAssignees[task.id] || task.assignee || "Unclaimed";
                const statusOptions = getStatusOptions(task);
                const assigneeOptions = getAssigneeOptions(task);

                return (
                  <tr key={task.id}>
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[250px] w-[250px] whitespace-normal">
                      {task.description}
                    </td>
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[50px] w-[50px] whitespace-nowrap">
                      <div
                        className="relative"
                        ref={openDropdown === task.id ? dropdownRef : null}
                      >
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${getStatusChipColor(
                            currentStatus
                          )}`}
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === task.id ? null : task.id
                            )
                          }
                        >
                          {currentStatus}
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </span>
                        {openDropdown === task.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                            {statusOptions.map((status) => (
                              <div
                                key={status}
                                className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                  currentStatus === status
                                    ? "bg-blue-50 font-semibold"
                                    : ""
                                }`}
                                onClick={() => {
                                  onStatusClick(task.id, status);
                                  setOpenDropdown(null);
                                  toast.success(
                                    `Status updated to "${status}"`
                                  );
                                }}
                              >
                                <span
                                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                    status.toLowerCase().includes("completed")
                                      ? "bg-green-500"
                                      : status
                                          .toLowerCase()
                                          .includes("progress")
                                      ? "bg-amber-500"
                                      : status.toLowerCase().includes("pending")
                                      ? "bg-orange-500"
                                      : status.toLowerCase().includes("waiting")
                                      ? "bg-purple-500"
                                      : "bg-blue-500"
                                  }`}
                                ></span>
                                {status}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[220px] w-[220px] whitespace-nowrap">
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap cursor-pointer ${getAssigneeChipColor(
                          currentAssignee
                        )}`}
                        onClick={() =>
                          onAssigneeClick(task.id, currentAssignee)
                        }
                      >
                        {currentAssignee}
                      </span>
                    </td> */}
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[150px] w-[150px] whitespace-nowrap">
                      {task.department}
                    </td>
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[100px] w-[100px] whitespace-nowrap">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[100px] w-[100px] whitespace-nowrap">
                      <span
                        className="text-blue-600 font-semibold cursor-pointer"
                        onClick={() => onTaskClick(task)}
                      >
                        {task.department?.toLowerCase().includes("clinical") ||
                        task.department?.toLowerCase().includes("medical")
                          ? "Review"
                          : "View"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
