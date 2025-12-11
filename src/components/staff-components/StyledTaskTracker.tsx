import React from "react";

interface Task {
  id: string;
  task: string;
  dept: string;
  statusText: string;
  statusClass: string;
  due: string;
  overdue: boolean;
  patientName?: string;
  patient?: { name: string };
  priority?: string;
  ur_denial_reason?: string;
  document?: any;
}

interface StyledTaskTrackerProps {
  tasks: Task[];
  loading: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  isFiltersCollapsed: boolean;
  setIsFiltersCollapsed: (collapsed: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalCount: number;
  departments: string[];
  onTaskView?: (task: Task) => void;
}

const StyledTaskTracker: React.FC<StyledTaskTrackerProps> = ({
  tasks,
  loading,
  filters,
  setFilters,
  isFiltersCollapsed,
  setIsFiltersCollapsed,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalCount,
  departments,
  onTaskView,
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("completed") || statusLower.includes("complete")) {
      return "bg-green-50 text-green-700 border-green-200";
    }
    if (statusLower.includes("progress") || statusLower.includes("open")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (statusLower.includes("overdue") || statusLower.includes("urgent")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getPatientName = (task: Task) => {
    return task.patientName || task.patient?.name || "N/A";
  };

  const getPatientInitials = (name: string) => {
    if (name === "N/A") return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full">
      <style>{`
        /* Custom Scrollbar Styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #718096;
        }

        /* Firefox Scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f8f9fa;
        }

        /* Table Hover Effect */
        .table-row {
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background: linear-gradient(90deg, #f8fafc 0%, #ffffff 100%);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        /* Filter Button Animations */
        .filter-btn {
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        /* Badge Styling */
        .badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          display: inline-block;
          border: 1px solid;
          letter-spacing: 0.3px;
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-lg p-2 mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Task & Workflow Tracker
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage and monitor all clinical tasks
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm border border-gray-200"
            >
              <svg
                className="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {isFiltersCollapsed ? "Show Filters" : "Hide Filters"}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {!isFiltersCollapsed && (
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white shadow-sm filter-btn">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  placeholder="Search tasks/patients…"
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="border-0 bg-transparent outline-none text-sm min-w-[200px]"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm filter-btn">
                <span className="text-gray-600 font-medium text-xs">Dept:</span>
                <select
                  value={filters.dept || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dept: e.target.value })
                  }
                  className="border-0 bg-transparent outline-none text-xs cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">All</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm filter-btn">
                <span className="text-gray-600 font-medium text-xs">
                  Status:
                </span>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="border-0 bg-transparent outline-none text-xs cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm filter-btn">
                <span className="text-gray-600 font-medium text-xs">
                  Priority:
                </span>
                <select
                  value={filters.priority || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                  className="border-0 bg-transparent outline-none text-xs cursor-pointer text-gray-700 font-medium"
                >
                  <option value="">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm filter-btn">
                <span className="text-gray-600 font-medium text-xs">Sort:</span>
                <select
                  value={filters.sortBy || "dueDate"}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className="border-0 bg-transparent outline-none text-xs cursor-pointer text-gray-700 font-medium"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="createdAt">Created</option>
                </select>
              </div>

              {/* Clear Button */}
              <button
                className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium shadow-sm filter-btn"
                onClick={() =>
                  setFilters({
                    search: "",
                    dept: "",
                    status: "",
                    priority: "",
                    dueDate: "",
                    sortBy: "dueDate",
                    sortOrder: "desc",
                    overdueOnly: false,
                  })
                }
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        ) : (
          <>
            {/* Table Container */}
            <div
              className="overflow-x-auto custom-scrollbar"
              style={{ maxHeight: "500px" }}
            >
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No tasks found. Try adjusting your filters.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      return (
                        <tr key={task.id} className="table-row">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {task.dept || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p
                              className="text-sm text-gray-800 font-medium max-w-xs truncate"
                              title={task.task}
                            >
                              {task.task || "No description"}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`badge ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority?.toUpperCase() || "MEDIUM"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`badge ${getStatusColor(
                                task.statusText
                              )}`}
                            >
                              {task.statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {task.due || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => onTaskView?.(task)}
                              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {tasks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </span>{" "}
                -
                <span className="font-semibold text-gray-800">
                  {" "}
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{" "}
                of
                <span className="font-semibold text-gray-800">
                  {" "}
                  {totalCount}
                </span>{" "}
                tasks
              </div>
              <div className="flex gap-2 items-center">
                <button
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-3">
                  Page{" "}
                  <span className="font-semibold text-gray-800">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {Math.ceil(totalCount / pageSize) || 1}
                  </span>
                </span>
                <button
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                >
                  Next
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StyledTaskTracker;
