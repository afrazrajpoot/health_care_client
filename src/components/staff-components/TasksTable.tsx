"use client";

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
  if (tasks.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
        <div className="p-10 text-center text-gray-500">
          <p>No tasks found</p>
        </div>
      </section>
    );
  }

  const getStatusChipColor = (status: string) => {
    if (
      status.toLowerCase().includes("signature") ||
      status.toLowerCase().includes("physician")
    )
      return "border-red-200 bg-red-50 text-red-900";
    if (status.toLowerCase().includes("progress"))
      return "border-amber-200 bg-amber-50 text-amber-900";
    if (status.toLowerCase().includes("scheduling"))
      return "border-blue-200 bg-blue-50 text-blue-900";
    if (status.toLowerCase().includes("completed"))
      return "border-green-200 bg-green-50 text-green-900";
    return "border-blue-200 bg-blue-50 text-blue-900";
  };

  return (
    <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] flex flex-col min-h-0 flex-1 overflow-hidden">
      <h3 className="m-0 px-3.5 py-3 text-[13px] font-bold border-b border-gray-200">
        Open Tasks & Required Actions
      </h3>
      <div className="min-h-0 max-h-full overflow-y-auto overflow-x-hidden flex-1 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:min-w-5 [&::-webkit-scrollbar-thumb]:min-h-5 [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
        <div className="overflow-x-auto overflow-y-visible w-full [-webkit-overflow-scrolling:touch] relative [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:min-w-5 [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
          <table className="w-max min-w-full border-collapse table-auto text-[13px] visible table box-border">
            <thead>
              <tr>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-[11px] font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[250px] w-[250px] whitespace-normal">
                  Item
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-[11px] font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[250px] w-[250px] whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-[11px] font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[220px] w-[220px] whitespace-nowrap">
                  Assignee
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-[11px] font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[150px] w-[150px] whitespace-nowrap">
                  Type
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-[11px] font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[100px] w-[100px] whitespace-nowrap">
                  Due
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-[11px] font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[100px] w-[100px] whitespace-nowrap"></th>
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
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[250px] w-[250px] whitespace-nowrap">
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {statusOptions.map((status) => (
                          <span
                            key={status}
                            className={`text-[11px] px-2 py-1 rounded-full border font-semibold whitespace-nowrap cursor-pointer transition-opacity ${getStatusChipColor(
                              status
                            )} ${
                              currentStatus === status
                                ? "opacity-100 shadow-[0_0_0_2px_rgba(37,99,235,0.25)] font-bold"
                                : "opacity-55"
                            }`}
                            onClick={() => onStatusClick(task.id, status)}
                          >
                            {status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[220px] w-[220px] whitespace-nowrap">
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {assigneeOptions.map((assignee) => (
                          <span
                            key={assignee}
                            className={`text-[11px] px-2 py-1 rounded-full border font-semibold whitespace-nowrap cursor-pointer transition-opacity ${
                              assignee.startsWith("Assigned") ||
                              assignee === "Physician"
                                ? "border-blue-200 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-gray-50 text-gray-900"
                            } ${
                              currentAssignee === assignee
                                ? "opacity-100 shadow-[0_0_0_2px_rgba(37,99,235,0.25)] font-bold"
                                : "opacity-55"
                            }`}
                            onClick={() => onAssigneeClick(task.id, assignee)}
                          >
                            {assignee}
                          </span>
                        ))}
                      </div>
                    </td>
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
