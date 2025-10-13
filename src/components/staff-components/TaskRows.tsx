// app/dashboard/components/TaskRows.tsx

import { Task } from "./types";

interface StandardRowProps {
  task: Task;
  showDept?: boolean;
  getPresets: (dept: string) => { type: string[]; more: string[] };
  onSaveNote: (e: React.MouseEvent, id: string) => void;
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
}

export function StandardRow({
  task,
  showDept = false,
  getPresets,
  onSaveNote,
  onClaim,
  onComplete,
}: StandardRowProps) {
  const presets = getPresets(task.dept);
  const handleSave = (e: React.MouseEvent) => onSaveNote(e, task.id);

  return (
    <tr data-taskid={task.id} data-dept={task.dept} data-overdue={task.overdue}>
      <td>{task.task}</td>
      {showDept && (
        <td>
          <span className="pill waiting">{task.dept}</span>
        </td>
      )}
      <td>
        <span className={`pill ${task.statusClass}`}>{task.statusText}</span>
      </td>
      <td>{task.due}</td>
      <td>{task.patient || "—"}</td>
      <td>
        <div className="qnote">
          <select className="qtype">
            {presets.type.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <select className="qmore">
            {presets.more.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <input className="qfree" placeholder="1‑line" />
          <button className="save" onClick={handleSave}>
            Save
          </button>
          <div className="muted" data-log>
            {task.notes.map((note, i) => (
              <span key={i} className="notechip">
                {note.ts} — {note.user}: {note.line}
              </span>
            ))}
          </div>
        </div>
      </td>
      <td data-assignee>{task.assignee || "—"}</td>
      <td>
        <button className="btn light" onClick={() => onClaim(task.id)}>
          Claim
        </button>{" "}
        <button className="btn primary" onClick={() => onComplete(task.id)}>
          Done
        </button>
      </td>
    </tr>
  );
}

interface OverdueRowProps {
  task: Task;
  onClaim: (id: string) => void;
}

export function OverdueRow({ task, onClaim }: OverdueRowProps) {
  return (
    <tr data-dept={task.dept} data-overdue="true">
      <td>{task.task}</td>
      <td>
        <span className="pill waiting">{task.dept}</span>
      </td>
      <td>{task.due}</td>
      <td>{task.assignee || "—"}</td>
      <td>
        <button className="btn primary" onClick={() => onClaim(task.id)}>
          Claim
        </button>
      </td>
    </tr>
  );
}
