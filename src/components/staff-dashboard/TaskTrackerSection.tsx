// components/dashboard/TaskTrackerSection.tsx
import TaskTable from "@/components/staff-components/TaskTable";
import {
  NOTE_PRESETS,
  paneToFilter,
  tabs,
  Task,
} from "@/components/staff-components/types";

interface TaskTrackerSectionProps {
  filteredTabs: typeof tabs;
  currentPane: string;
  onPaneChange: (pane: string) => void;
  filters: {
    search: string;
    overdueOnly: boolean;
    myDeptOnly: boolean;
    dept: string;
  };
  onFiltersChange: (filters: any) => void;
  isFiltersCollapsed: boolean;
  onToggleFiltersCollapse: () => void;
  tasks: Task[];
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
  onSaveNote: (e: React.MouseEvent, taskId: string) => void;
  getPresets: (dept: string) => any;
  departments: string[];
  mode: "wc" | "gm";
}

export default function TaskTrackerSection({
  filteredTabs,
  currentPane,
  onPaneChange,
  filters,
  onFiltersChange,
  isFiltersCollapsed,
  onToggleFiltersCollapse,
  tasks,
  onClaim,
  onComplete,
  onSaveNote,
  getPresets,
  departments,
  mode,
}: any) {
  const handleOverdueToggle = () => {
    onFiltersChange({
      ...filters,
      overdueOnly: !filters.overdueOnly,
    });
  };

  const handleMyDeptToggle = () => {
    onFiltersChange({
      ...filters,
      myDeptOnly: !filters.myDeptOnly,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      overdueOnly: false,
      myDeptOnly: false,
      dept: "",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value,
    });
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      dept: e.target.value,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-2">
      <h2 className="m-0 mb-2 text-base flex items-center justify-between">
        🧩 Task & Workflow Tracker
        <button
          className="px-2.5 py-1.5 border-none rounded-lg font-semibold cursor-pointer text-xs bg-blue-50 text-blue-900 border border-blue-200"
          onClick={onToggleFiltersCollapse}
          style={{
            fontSize: "12px",
            padding: "4px 8px",
            minHeight: "auto",
          }}
        >
          {isFiltersCollapsed ? "▼ Show Filters" : "▲ Hide Filters"}
        </button>
      </h2>
      <div className="text-gray-500 text-xs mb-2">
        Tabs keep this compact. Use Overdue to triage. Search filters by
        task/patient. Quick Notes allow multiple timestamped entries per task.
      </div>
      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
        <div className="flex gap-2 flex-wrap">
          {filteredTabs.map((tab) => (
            <button
              key={tab.pane}
              className={`px-2.5 py-1.5 border border-gray-200 rounded-full bg-white cursor-pointer text-xs ${
                currentPane === tab.pane ? "bg-blue-600 text-white" : ""
              }`}
              onClick={() => onPaneChange(tab.pane)}
            >
              {tab.text}
            </button>
          ))}
        </div>
        {!isFiltersCollapsed && (
          <div className="flex gap-2 items-center flex-wrap">
            <input
              placeholder="Search tasks/patients…"
              value={filters.search}
              onChange={handleSearchChange}
              className="p-1.5 px-2.5 border border-gray-200 rounded-full text-xs min-w-[220px]"
            />
            <button
              className="px-2.5 py-1.5 border border-gray-200 rounded-full bg-white cursor-pointer text-xs"
              onClick={handleOverdueToggle}
            >
              {filters.overdueOnly ? "Showing Overdue" : "Show Overdue Only"}
            </button>
            <span className="text-gray-500">Dept:</span>
            <select
              value={filters.dept}
              onChange={handleDeptChange}
              className="p-1.5 px-2 border border-gray-200 rounded-full text-xs"
            >
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              className="px-2.5 py-1.5 border border-gray-200 rounded-full bg-white cursor-pointer text-xs"
              aria-pressed={filters.myDeptOnly ? "true" : "false"}
              onClick={handleMyDeptToggle}
            >
              {filters.myDeptOnly ? "Only My Dept ✓" : "Only My Dept"}
            </button>
            <button
              className="px-2.5 py-1.5 border border-gray-200 rounded-full bg-white cursor-pointer text-xs"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      {tasks.length === 0 ? (
        <div className="text-center p-5 text-gray-500 italic">
          No tasks available
        </div>
      ) : (
        <TaskTable
          currentPane={currentPane}
          tasks={tasks}
          filters={filters}
          mode={mode}
          onClaim={onClaim}
          onComplete={onComplete}
          onSaveNote={onSaveNote}
          getPresets={getPresets}
        />
      )}
    </div>
  );
}
