// app/dashboard/components/TaskRows.tsx
import { Task } from "./types";

interface StandardRowProps {
  task: Task;
  showDept?: boolean;
  showUrDenial?: boolean;
  getPresets: (dept: string) => { type: string[]; more: string[] };
  onSaveNote: (e: React.MouseEvent, id: string) => void;
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
}

export function StandardRow({
  task,
  showDept = false,
  showUrDenial = false,
  getPresets,
  onSaveNote,
  onClaim,
  onComplete,
}: StandardRowProps) {
  const presets = getPresets(task.dept);
  const handleSave = (e: React.MouseEvent) => onSaveNote(e, task.id);
  const isClaimed = task.actions?.includes("Claimed") || false;

  // Get UR denial reason from task or nested document
  const urDenialReason =
    task.ur_denial_reason || task.document?.ur_denial_reason;

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

      {/* UR Denial Reason Column */}
      {showUrDenial && (
        <td className="ur-reason-cell">
          {urDenialReason ? (
            <span title={urDenialReason}>{urDenialReason}</span>
          ) : (
            <span>—</span>
          )}
        </td>
      )}

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
          <button
            className="bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-[0.5vw] px-[0.5vw] rounded-md"
            onClick={handleSave}
          >
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
      <td>
        <button
          className="btn light w-full max-w-[10vw]"
          onClick={() => onClaim(task.id)}
        >
          {isClaimed ? "Unclaim" : "Claim"}
        </button>{" "}
        <button
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-[0.5vw] px-[0.5vw] rounded-md mt-[1vw] w-full max-w-[10vw]"
          onClick={() => onComplete(task.id)}
        >
          Done
        </button>
      </td>
    </tr>
  );
}

interface OverdueRowProps {
  task: Task;
  onClaim: (id: string) => void;
  showUrDenial?: boolean;
}

export function OverdueRow({
  task,
  onClaim,
  showUrDenial = false,
}: OverdueRowProps) {
  const isClaimed = task.actions?.includes("Claimed") || false;

  // Get UR denial reason from task or nested document
  const urDenialReason =
    task.ur_denial_reason || task.document?.ur_denial_reason;

  return (
    <tr data-dept={task.dept} data-overdue="true">
      <td>{task.task}</td>
      <td>
        <span className="pill waiting">{task.dept}</span>
      </td>
      <td>{task.due}</td>

      {/* UR Denial Reason Column for Overdue */}
      {showUrDenial && (
        <td className="ur-reason-cell">
          {urDenialReason ? (
            <span title={urDenialReason}>{urDenialReason}</span>
          ) : (
            <span>—</span>
          )}
        </td>
      )}

      <td>
        <button className="btn primary" onClick={() => onClaim(task.id)}>
          {isClaimed ? "Unclaim" : "Claim"}
        </button>
      </td>
    </tr>
  );
}
