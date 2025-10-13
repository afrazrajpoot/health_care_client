// app/dashboard/components/TaskTable.tsx
// import { StandardRow, OverdueRow } from "./TaskRows";

import { OverdueRow, StandardRow } from "./TaskRows";
import { Task } from "./types";

interface TaskTableProps {
  currentPane: string;
  tasks: Task[];
  filters: any;
  mode: "wc" | "gm";
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
  onSaveNote: (e: React.MouseEvent, id: string) => void;
  getPresets: (dept: string) => { type: string[]; more: string[] };
}

export default function TaskTable({
  currentPane,
  tasks,
  filters,
  mode,
  onClaim,
  onComplete,
  onSaveNote,
  getPresets,
}: TaskTableProps) {
  const getBaseTasks = () =>
    tasks.filter((t) => {
      if (mode === "wc" && t.mode === "gm") return false;
      if (mode === "gm" && t.mode === "wc") return false;
      return true;
    });

  const getFilteredTasks = (pane: string) => {
    const base = getBaseTasks();
    // Assume paneToFilter imported or passed
    // For simplicity, use a placeholder filter
    return base.filter(() => true); // Replace with actual filter logic
  };

  const getDisplayedTasks = (pane: string) => {
    let f = getFilteredTasks(pane);
    // Apply filters...
    return f;
  };

  const displayedTasks = getDisplayedTasks(currentPane);

  if (currentPane === "all") {
    if (displayedTasks.length === 0) {
      return (
        <div id="aggScroll">
          <table>
            <thead>
              <tr>
                <th>Task (Action)</th>
                <th>Dept</th>
                <th>Status</th>
                <th>Due</th>
                <th>Patient</th>
                <th>Quick Note</th>
                <th>Assignee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr id="aggEmpty">
                <td colSpan={8}>
                  No tasks yet. SnapLink a document or switch tabs to create
                  tasks, then return to All.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div id="aggScroll">
        <table>
          <thead>
            <tr>
              <th>Task (Action)</th>
              <th>Dept</th>
              <th>Status</th>
              <th>Due</th>
              <th>Patient</th>
              <th>Quick Note</th>
              <th>Assignee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.map((task) => (
              <StandardRow
                key={task.id}
                task={task}
                showDept
                getPresets={getPresets}
                onSaveNote={onSaveNote}
                onClaim={onClaim}
                onComplete={onComplete}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (currentPane === "overdue") {
    return (
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Dept</th>
            <th>Due</th>
            <th>Assignee</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {displayedTasks.map((task) => (
            <OverdueRow key={task.id} task={task} onClaim={onClaim} />
          ))}
        </tbody>
      </table>
    );
  }

  // Standard panes
  return (
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Status</th>
          <th>Due</th>
          <th>Patient</th>
          <th>Quick Note</th>
          <th>Assignee</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {displayedTasks.map((task) => (
          <StandardRow
            key={task.id}
            task={task}
            getPresets={getPresets}
            onSaveNote={onSaveNote}
            onClaim={onClaim}
            onComplete={onComplete}
          />
        ))}
      </tbody>
    </table>
  );
}
