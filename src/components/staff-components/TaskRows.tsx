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

  // PREVIEW PROPS
  index: number;
  onPreview: (e: React.MouseEvent, doc: any, index: number) => void;
  previewLoading: boolean;
  session?: any;
}

interface OverdueRowProps {
  task: Task;
  onClaim: (id: string) => void;
  showUrDenial?: boolean;
  index: number;
  onPreview: (e: React.MouseEvent, doc: any, index: number) => void;
  previewLoading: boolean;
  session?: any;
}

/**
 * Returns the patient name to display.
 * 1. If task.patient exists and is **not** "Not specified" → use it.
 * 2. Otherwise fall back to document.patientName.
 * 3. Finally return "—".
 */
const getPatientName = (task: Task): string => {
  const taskName = task.patient?.trim();
  const docName = task.document?.patientName?.trim();

  if (taskName && taskName !== "Not specified") {
    return taskName;
  }
  if (docName) {
    return docName;
  }
  return "—";
};

export function StandardRow({
  task,
  showDept = false,
  showUrDenial = false,
  getPresets,
  onSaveNote,
  onClaim,
  onComplete,
  index,
  onPreview,
  previewLoading,
  session,
}: StandardRowProps) {
  const presets = getPresets(task.dept);
  const handleSave = (e: React.MouseEvent) => onSaveNote(e, task.id);
  const isClaimed = task.statusText === "in progress";
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

      {/* Patient – with fallback */}
      <td>{getPatientName(task)}</td>

      {showUrDenial && (
        <td className="ur-reason-cell">
          {urDenialReason ? (
            <span title={urDenialReason}>{urDenialReason}</span>
          ) : (
            "—"
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
          <input className="qfree" placeholder="1-line" />
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

      {/* ----- PREVIEW ----- */}
      <td className="preview-cell">
        {task.document?.blobPath ? (
          previewLoading ? (
            <span className="preview-loading">Loading…</span>
          ) : (
            <a
              href="#"
              className="preview-link"
              onClick={(e) => onPreview(e, task.document, index)}
            >
              Preview
            </a>
          )
        ) : (
          "—"
        )}
      </td>

      {/* ----- ACTIONS ----- */}
      <td>
        <button
          className="btn light w-full max-w-[10vw]"
          onClick={() => onClaim(task.id)}
        >
          {isClaimed ? "Unclaim" : "Claim"}
        </button>{" "}
        <button
          className="bg-gradient-to-r bg-teal-600 hover:bg-[#33c7d8] text-white font-bold py-[0.5vw] px-[0.5vw] rounded-md mt-[1vw] w-full max-w-[10vw]"
          onClick={() => onComplete(task.id)}
        >
          Done
        </button>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------- */

export function OverdueRow({
  task,
  onClaim,
  showUrDenial = false,
  index,
  onPreview,
  previewLoading,
  session,
}: OverdueRowProps) {
  const isClaimed = task.statusText === "in progress";
  const urDenialReason =
    task.ur_denial_reason || task.document?.ur_denial_reason;

  return (
    <tr data-dept={task.dept} data-overdue="true">
      <td>{task.task}</td>

      <td>
        <span className="pill waiting">{task.dept}</span>
      </td>

      <td>{task.due}</td>

      {/* Patient – with fallback (same logic as StandardRow) */}
      <td>{getPatientName(task)}</td>

      {showUrDenial && (
        <td className="ur-reason-cell">
          {urDenialReason ? (
            <span title={urDenialReason}>{urDenialReason}</span>
          ) : (
            "—"
          )}
        </td>
      )}

      {/* ----- PREVIEW ----- */}
      <td className="preview-cell">
        {task.document?.blobPath ? (
          previewLoading ? (
            <span className="preview-loading">Loading…</span>
          ) : (
            <a
              href="#"
              className="preview-link"
              onClick={(e) => onPreview(e, task.document, index)}
            >
              Preview
            </a>
          )
        ) : (
          "—"
        )}
      </td>

      {/* ----- ACTION ----- */}
      <td>
        <button
          className="btn primary w-full max-w-[10vw]"
          onClick={() => onClaim(task.id)}
        >
          {isClaimed ? "Unclaim" : "Claim"}
        </button>
      </td>
    </tr>
  );
}
