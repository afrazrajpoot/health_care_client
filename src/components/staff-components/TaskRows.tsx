// app/dashboard/components/TaskRows.tsx
import { useState } from "react";
import { Task } from "./types";

// Quick note options structure
const quickNoteOptions = {
  "Scheduling-Related": {
    "Outbound Scheduling": [
      "Called patient – left voicemail.",
      "Called patient – scheduled appointment.",
      "Called patient – patient declined appointment.",
      "Unable to reach patient – no voicemail available.",
      "Text message sent – awaiting response.",
      "Email sent – awaiting response.",
      "Patient reports appointment already scheduled elsewhere.",
      "Specialist office contacted – awaiting available dates.",
      "Specialist office contacted – appointment confirmed.",
      "Specialist office requested updated referral/authorization.",
      "Specialist office does not accept patient's insurance.",
    ],
    "Inbound Scheduling": [
      "Outside office sent appointment date – updated in system.",
      "Outside office cancelled/rescheduled appointment.",
      "Specialist requested additional documentation before scheduling.",
    ],
  },
  "Lab / Imaging Follow-Up": {
    "Lab Results": [
      "Lab results received – forwarded to provider.",
      "Critical lab flagged – provider notified.",
    ],
    "Imaging Follow-Up": [
      "Imaging report received – provider notified.",
      "Imaging center requesting updated order.",
      "Imaging center unable to proceed – insurance issue.",
      "Patient instructed to schedule imaging.",
      "Patient completed imaging – awaiting report.",
    ],
  },
  "Pharmacy / Medication": {
    "Pharmacy Requests": [
      "Pharmacy requested clarification – forwarded to provider.",
      "Pharmacy refill request received – sent to provider.",
      "Medication not covered – pharmacy requested alternative.",
    ],
    "Prior Authorization": [
      "Prior authorization required – beginning process.",
      "Prior authorization submitted.",
      "Prior authorization approved.",
      "Prior authorization denied – provider notified.",
    ],
  },
  "Insurance / Care Coordination": {
    "Insurance Issues": [
      "Insurance requested additional documentation.",
      "Insurance denied request – report uploaded for provider.",
      "Insurance authorization received – ready to schedule.",
      "Patient's insurance inactive – requested updated information.",
    ],
    "Authorization & Forms": [
      "Insurance form completed and faxed.",
      "Insurance form incomplete – need missing details.",
    ],
  },
  "Hospital / ER Records": {
    "Hospital Reports": [
      "Hospital discharge summary received – forwarded to provider.",
      "ED visit report received – provider notified.",
      "Hospital requested follow-up appointment.",
    ],
    "Care Transition": [
      "Care transition call made – left voicemail.",
      "Care transition call completed – appointment scheduled.",
    ],
  },
  "Specialist Reports": {
    "Consult Reports": [
      "Consult report received – provider notified.",
      "Consult report recommends follow-up – scheduling patient.",
      "Consult report recommends new medication – awaiting provider decision.",
    ],
    "Specialist Requests": [
      "Specialist requested updated labs/imaging.",
      "Specialist requested new referral.",
    ],
  },
  "Administrative Documents": {
    "Forms Processing": [
      "Form received – routed to provider.",
      "Form completed – faxed/emailed.",
      "Form incomplete – need missing patient information.",
    ],
    "Form Status": [
      "Employer requested additional information.",
      "Patient notified form is ready for pick-up.",
    ],
  },
  "Attempt / Outcome": {
    "Completion Status": [
      "Completed as requested.",
      "Unable to complete – missing documentation.",
      "Unable to complete – requires provider review.",
      "Task resolved – no further action needed.",
    ],
    "Pending Status": [
      "Pending patient response.",
      "Pending outside office response.",
      "Pending insurance response.",
    ],
  },
  "Patient Communication": {
    "Notification Methods": [
      "Patient notified via phone.",
      "Patient notified via text.",
      "Patient notified via patient portal.",
      "Patient notified via email.",
    ],
    "Patient Response": [
      "Patient acknowledged and understands.",
      "Patient needs clarification – routed to provider.",
    ],
  },
  Escalation: {
    "Escalation Types": [
      "Escalated to provider.",
      "Escalated to supervisor.",
      "Requires clinical decision – provider notified.",
      "Requires insurance specialist – forwarded.",
      "Requires follow-up from management.",
    ],
  },
};

interface StandardRowProps {
  task: Task;
  showDept?: boolean;
  showUrDenial?: boolean;
  getPresets: (dept: string) => { type: string[]; more: string[] };
  onSaveNote: (e: React.MouseEvent, id: string, note: string) => void;
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [customNote, setCustomNote] = useState("");

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory("");
    setSelectedNote("");
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubcategory(e.target.value);
    setSelectedNote("");
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNote(e.target.value);
  };

  const handleCustomNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomNote(e.target.value);
  };

  const handleSave = (e: React.MouseEvent) => {
    const finalNote = selectedNote || customNote;
    if (finalNote.trim()) {
      onSaveNote(e, task.id, finalNote);
      // Reset form after save
      setSelectedCategory("");
      setSelectedSubcategory("");
      setSelectedNote("");
      setCustomNote("");
    }
  };

  const isClaimed = task.statusText === "in progress";
  const urDenialReason =
    task.ur_denial_reason || task.document?.ur_denial_reason;

  // Get available subcategories based on selected category
  const availableSubcategories = selectedCategory
    ? Object.keys(
        quickNoteOptions[selectedCategory as keyof typeof quickNoteOptions] ||
          {}
      )
    : [];

  // Get available notes based on selected subcategory
  const availableNotes =
    selectedCategory && selectedSubcategory
      ? quickNoteOptions[selectedCategory as keyof typeof quickNoteOptions]?.[
          selectedSubcategory
        ] || []
      : [];

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
          {/* Main Category Dropdown */}
          <select
            className="qtype"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            <option value="">Select Category</option>
            {Object.keys(quickNoteOptions).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Subcategory Dropdown */}
          {availableSubcategories.length > 0 && (
            <select
              className="qmore"
              value={selectedSubcategory}
              onChange={handleSubcategoryChange}
            >
              <option value="">Select Subcategory</option>
              {availableSubcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          )}

          {/* Quick Notes Dropdown */}
          {availableNotes.length > 0 && (
            <select
              className="qnotes"
              value={selectedNote}
              onChange={handleNoteChange}
            >
              <option value="">Select Quick Note</option>
              {availableNotes.map((note, index) => (
                <option key={index} value={note}>
                  {note}
                </option>
              ))}
            </select>
          )}

          {/* Custom Note Input */}
          <input
            className="qfree"
            placeholder="Custom note (optional)"
            value={customNote}
            onChange={handleCustomNoteChange}
          />

          {/* Save Button */}
          <button
            className="bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-[0.5vw] px-[0.5vw] rounded-md"
            onClick={handleSave}
            disabled={!selectedNote && !customNote.trim()}
          >
            Save
          </button>

          {/* Notes History */}
          <div className="muted" data-log>
            {task.notes.map((note, i) => (
              <span key={i} className="notechip">
                {note.ts} — {note.user}: {note.line}
              </span>
            ))}
          </div>
        </div>
      </td>

      {/* Preview Cell */}
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

      {/* Actions Cell */}
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

      {/* Preview Cell */}
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

      {/* Action Cell */}
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
