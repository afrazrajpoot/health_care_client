"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  description: string;
  quickNotes?: {
    status_update?: string;
    details?: string;
    one_line_note?: string;
    timestamp?: string;
  };
}

interface QuickNoteModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (
    taskId: string,
    quickNotes: {
      status_update: string;
      details: string;
      one_line_note: string;
    }
  ) => Promise<void>;
}

// Quick note templates organized by category
const QUICK_NOTE_OPTIONS = {
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
    Imaging: [
      "Imaging report received – provider notified.",
      "Imaging center requesting updated order.",
      "Imaging center unable to proceed – insurance issue.",
      "Patient instructed to schedule imaging.",
      "Patient completed imaging – awaiting report.",
    ],
  },
  "Pharmacy / Medication": {
    "Pharmacy Communication": [
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
    "Insurance Requests": [
      "Insurance requested additional documentation.",
      "Insurance denied request – report uploaded for provider.",
      "Insurance authorization received – ready to schedule.",
      "Patient's insurance inactive – requested updated information.",
    ],
    "Insurance Forms": [
      "Insurance form completed and faxed.",
      "Insurance form incomplete – need missing details.",
    ],
  },
  "Hospital / ER / Urgent Care": {
    Records: [
      "Hospital discharge summary received – forwarded to provider.",
      "ED visit report received – provider notified.",
      "Hospital requested follow-up appointment.",
    ],
    "Care Transition": [
      "Care transition call made – left voicemail.",
      "Care transition call completed – appointment scheduled.",
    ],
  },
  "Specialist / Outside Provider": {
    Reports: [
      "Consult report received – provider notified.",
      "Consult report recommends follow-up – scheduling patient.",
      "Consult report recommends new medication – awaiting provider decision.",
      "Specialist requested updated labs/imaging.",
      "Specialist requested new referral.",
    ],
  },
  "Administrative Documents": {
    "Forms Processing": [
      "Form received – routed to provider.",
      "Form completed – faxed/emailed.",
      "Form incomplete – need missing patient information.",
      "Employer requested additional information.",
      "Patient notified form is ready for pick-up.",
    ],
  },
  "Task Status": {
    "Completion Status": [
      "Completed as requested.",
      "Unable to complete – missing documentation.",
      "Unable to complete – requires provider review.",
      "Pending patient response.",
      "Pending outside office response.",
      "Pending insurance response.",
      "Task resolved – no further action needed.",
    ],
  },
  "Patient Communication": {
    "Notification Method": [
      "Patient notified via phone.",
      "Patient notified via text.",
      "Patient notified via patient portal.",
      "Patient notified via email.",
      "Patient acknowledged and understands.",
      "Patient needs clarification – routed to provider.",
    ],
  },
  Escalation: {
    "Escalation Actions": [
      "Escalated to provider.",
      "Escalated to supervisor.",
      "Requires clinical decision – provider notified.",
      "Requires insurance specialist – forwarded.",
      "Requires follow-up from management.",
    ],
  },
};

export default function QuickNoteModal({
  isOpen,
  task,
  onClose,
  onSave,
}: QuickNoteModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens with new task
  useEffect(() => {
    if (task && isOpen) {
      setSelectedCategory("");
      setSelectedSubcategory("");
      setSelectedNotes([]);
      setAdditionalDetails(task.quickNotes?.details || "");
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const categories = Object.keys(QUICK_NOTE_OPTIONS);
  const subcategories = selectedCategory
    ? Object.keys(
        QUICK_NOTE_OPTIONS[selectedCategory as keyof typeof QUICK_NOTE_OPTIONS]
      )
    : [];
  const noteOptions =
    selectedCategory && selectedSubcategory
      ? QUICK_NOTE_OPTIONS[selectedCategory as keyof typeof QUICK_NOTE_OPTIONS][
          selectedSubcategory as any
        ]
      : [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("");
    setSelectedNotes([]);
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setSelectedNotes([]);
  };

  const handleNoteToggle = (note: string) => {
    setSelectedNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleSave = async () => {
    if (!task) return;

    setSaving(true);
    try {
      const statusUpdate =
        selectedCategory && selectedSubcategory
          ? `${selectedCategory} > ${selectedSubcategory}`
          : "";

      const oneLineNote = selectedNotes.length > 0 ? selectedNotes[0] : "";

      const details =
        selectedNotes.length > 0
          ? selectedNotes.join("\n") +
            (additionalDetails
              ? "\n\nAdditional Notes:\n" + additionalDetails
              : "")
          : additionalDetails;

      await onSave(task.id, {
        status_update: statusUpdate,
        details: details,
        one_line_note: oneLineNote,
      });
      onClose();
    } catch (error) {
      console.error("Error saving quick note:", error);
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    selectedNotes.length > 0 || additionalDetails.trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] max-w-[700px] w-[90%] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h3 className="m-0 text-base font-bold">
            Quick Note: {task.description}
          </h3>
          <button
            className="bg-transparent border-none text-2xl cursor-pointer p-0 w-6 h-6 flex items-center justify-center text-gray-500 transition-colors hover:text-slate-900"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* Category Selection */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold text-slate-900">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-md text-sm font-[inherit] focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)] bg-white"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          {selectedCategory && (
            <div className="mb-4">
              <label className="block mb-1.5 text-sm font-semibold text-slate-900">
                Type
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-md text-sm font-[inherit] focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)] bg-white"
              >
                <option value="">Select a type...</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note Options (Checkboxes) */}
          {selectedSubcategory && noteOptions.length > 0 && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold text-slate-900">
                Select Note(s)
              </label>
              <div className="border border-gray-200 rounded-md max-h-[250px] overflow-y-auto p-3 bg-gray-50">
                {noteOptions.map((note: string, index: number) => (
                  <label
                    key={index}
                    className="flex items-start gap-2 mb-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNotes.includes(note)}
                      onChange={() => handleNoteToggle(note)}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">{note}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5 italic">
                Select one or more options. Multiple selections will be combined
                in the details.
              </p>
            </div>
          )}

          {/* Additional Details */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold text-slate-900">
              Additional Details (Optional)
            </label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Add any additional context or notes here..."
              rows={4}
              className="w-full p-2 border border-gray-200 rounded-md text-sm font-[inherit] resize-y min-h-[80px] focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
            />
          </div>

          {/* Preview Selected Notes */}
          {selectedNotes.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs font-semibold text-blue-900 mb-1">
                Selected Notes:
              </p>
              <ul className="list-disc list-inside text-xs text-blue-800 space-y-0.5 m-0 pl-2">
                {selectedNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {task.quickNotes?.timestamp && (
            <p className="text-xs text-gray-500 mt-2 italic m-0">
              Last updated:{" "}
              {new Date(task.quickNotes.timestamp).toLocaleString()}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2.5 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="border border-gray-200 bg-white rounded-md px-4 py-2 font-semibold text-xs cursor-pointer transition-all duration-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            className="border border-blue-600 bg-blue-600 text-white rounded-md px-4 py-2 font-semibold text-xs cursor-pointer transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving || !canSave}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
