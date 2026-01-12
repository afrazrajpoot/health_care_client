"use client";

import { useState, useEffect, useRef } from "react";

interface ChipData {
  label: string;
  description: string;
  category: string; // Add category here
}

interface Task {
  id: string;
  description: string;
  quickNotes?: {
    options?: ChipData[];
    timestamp?: string;
  };
}

interface QuickNoteModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave?: (
    taskId: string,
    quickNotes: {
      options: ChipData[];
    }
  ) => Promise<void>;
}

// Custom status chips organized by category
const STATUS_CHIPS = {
  "General Task Status": [
    { emoji: "🟡", label: "New", description: "Task auto-generated, no action yet" },
    { emoji: "🔵", label: "In Progress", description: "Staff actively working" },
    { emoji: "⏸", label: "Waiting", description: "Blocked by external party" },
    { emoji: "✅", label: "Completed", description: "Task finished" },
    { emoji: "🚫", label: "Unable to Complete", description: "Action attempted but not possible" },
    { emoji: "🔁", label: "Reopened", description: "Task returned after closure" },
  ],
  "Contact & Outreach Status": [
    { emoji: "📞", label: "Called – No Answer", description: "Attempted phone call" },
    { emoji: "📩", label: "Left Voicemail", description: "Voicemail left" },
    { emoji: "✉️", label: "Email Sent", description: "Email delivered" },
    { emoji: "📠", label: "Fax Sent", description: "Fax transmitted" },
    { emoji: "📲", label: "Text Sent", description: "SMS sent" },
    { emoji: "🤝", label: "Spoke With Party", description: "Live communication occurred" },
    { emoji: "📆", label: "Callback Scheduled", description: "Future follow-up set" },
  ],
  "Scheduling Status": [
    { emoji: "🗓", label: "Scheduled", description: "Appointment booked" },
    { emoji: "⏳", label: "Pending Availability", description: "Waiting for slot" },
    { emoji: "🔄", label: "Rescheduled", description: "Date/time changed" },
    { emoji: "❌", label: "Cancelled", description: "Appointment cancelled" },
    { emoji: "🚷", label: "Patient No-Show", description: "Patient did not attend" },
    { emoji: "🏥", label: "Facility Confirmed", description: "Facility accepted referral" },
  ],
  "Authorization / RFA Status": [
    { emoji: "📤", label: "RFA Sent", description: "Submitted" },
    { emoji: "📥", label: "Auth Received", description: "Approval received" },
    { emoji: "🏷", label: "Auth Name Update Needed", description: "Authorization issued but provider/facility name must be added or corrected by adjuster before scheduling" },
    { emoji: "❌", label: "Denied", description: "Denial received" },
    { emoji: "🟠", label: "Partial Approval", description: "Some items approved" },
    { emoji: "⏳", label: "Pending UR", description: "Awaiting decision" },
    { emoji: "🧾", label: "Clarification Requested", description: "Payer requested more info" },
    { emoji: "⚠️", label: "Appeal Needed", description: "Triggers physician review" },
  ],
  "Document Handling Status": [
    { emoji: "📄", label: "Received", description: "Document uploaded" },
    { emoji: "👀", label: "Reviewed", description: "Staff review completed" },
    { emoji: "🏷", label: "Categorized", description: "Tagged correctly" },
    { emoji: "📌", label: "Action Required", description: "Task generated" },
    { emoji: "🔗", label: "Linked to Case", description: "Associated with patient" },
    { emoji: "🗄", label: "Filed / Archived", description: "No further action" },
  ],
  "Patient Response Status": [
    { emoji: "🙋", label: "Patient Reached", description: "Direct contact" },
    { emoji: "⏰", label: "Awaiting Patient", description: "Waiting on response" },
    { emoji: "📋", label: "Forms Sent", description: "Intake/forms delivered" },
    { emoji: "🖊", label: "Forms Completed", description: "Patient completed" },
    { emoji: "🚫", label: "Declined", description: "Patient declined service" },
    { emoji: "🔁", label: "Needs Follow-Up", description: "Additional contact required" },
  ],
  "External Party Status": [
    { emoji: "⚖️", label: "Attorney Notified", description: "Attorney contacted" },
    { emoji: "🧑‍💼", label: "Adjuster Contacted", description: "Adjuster outreach" },
    { emoji: "🩺", label: "NCM Contacted", description: "Nurse case manager" },
    { emoji: "🏥", label: "Facility Contacted", description: "Imaging/therapy facility" },
    { emoji: "📨", label: "Response Received", description: "Reply logged" },
    { emoji: "⛔", label: "No Response", description: "No reply after attempts" },
  ],
  "Physician-Dependent Status": [
    { emoji: "🩺", label: "Physician Review Needed", description: "Escalation" },
    { emoji: "✍️", label: "Signature Required", description: "Awaiting MD" },
    { emoji: "📑", label: "Addendum Requested", description: "MD input needed" },
    { emoji: "🔍", label: "Clinical Decision Pending", description: "Blocks workflow" },
    { emoji: "✅", label: "Physician Verified", description: "MD completed" },
  ],
  "Exception & Priority Flags": [
    { emoji: "⚠️", label: "Time-Sensitive", description: "Deadline approaching" },
    { emoji: "⏰", label: "Overdue", description: "SLA missed" },
    { emoji: "🔥", label: "High Priority", description: "Escalated" },
    { emoji: "🧯", label: "Resolved After Escalation", description: "Closed post-issue" },
  ],
};

export default function QuickNoteModal({
  isOpen,
  task,
  onClose,
  onSave,
}: QuickNoteModalProps) {
  const [selectedChips, setSelectedChips] = useState<ChipData[]>([]);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens with new task
  useEffect(() => {
    if (task && isOpen) {
      // Get existing options if available
      if (task.quickNotes?.options && Array.isArray(task.quickNotes.options)) {
        setSelectedChips(task.quickNotes.options);
      } else {
        setSelectedChips([]);
      }
    }
  }, [task, isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const handleChipToggle = (chipLabel: string, chipCategory: string) => {
    // Find the chip data from STATUS_CHIPS
    let chipData: ChipData | null = null;
    
    const chips = STATUS_CHIPS[chipCategory as keyof typeof STATUS_CHIPS];
    const chip = chips?.find(c => c.label === chipLabel);
    
    if (chip) {
      chipData = { 
        label: chip.label, 
        description: chip.description,
        category: chipCategory // Include category
      };
    }

    if (!chipData) return;

    setSelectedChips((prev) => {
      const exists = prev.find(chip => 
        chip.label === chipLabel && chip.category === chipCategory
      );
      if (exists) {
        return prev.filter(chip => 
          !(chip.label === chipLabel && chip.category === chipCategory)
        );
      } else {
        return [...prev, chipData!];
      }
    });
  };

  const saveQuickNote = async (taskId: string, options: ChipData[]) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options }), // Only send options array
      });

      if (!response.ok) {
        throw new Error(`Failed to save task: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving quick note:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!task) return;

    setSaving(true);
    try {
      // Prepare quickNotes object with only options (array of objects)
      const quickNotes = {
        options: selectedChips // Array of objects with label, description, and category
      };

      // Use the API directly if onSave is not provided
      if (onSave) {
        await onSave(task.id, quickNotes);
      } else {
        await saveQuickNote(task.id, selectedChips);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving quick note:", error);
      alert("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedChips.length > 0;

  // Check if a chip is selected
  const isChipSelected = (chipLabel: string, chipCategory: string) => {
    return selectedChips.some(chip => 
      chip.label === chipLabel && chip.category === chipCategory
    );
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 z-[1000] w-[450px] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col max-h-[60vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
        <h3 className="m-0 text-sm font-bold text-slate-800">
          Quick Note
        </h3>
        <button
          className="bg-transparent border-none text-xl cursor-pointer p-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-slate-900"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {/* Selected Chips Preview */}
        {selectedChips.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-xs font-medium text-slate-700 mb-1">
              Selected Status Updates ({selectedChips.length}):
            </div>
            <div className="space-y-1">
              {selectedChips.map((chip, index) => {
                // Find emoji for the chip
                let emoji = "";
                const chips = STATUS_CHIPS[chip.category as keyof typeof STATUS_CHIPS];
                const chipData = chips?.find(c => c.label === chip.label);
                if (chipData) {
                  emoji = chipData.emoji;
                }
                
                return (
                  <div
                    key={index}
                    className="flex items-start justify-between p-2 bg-white border border-blue-200 rounded text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5">{emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-slate-800">
                              {chip.label}
                            </div>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {chip.category}
                            </span>
                          </div>
                          <div className="text-gray-500 mt-1">
                            {chip.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleChipToggle(chip.label, chip.category)}
                      className="ml-2 text-gray-500 hover:text-red-500 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Categories and Chips */}
        <div className="mb-3">
          <div className="space-y-3">
            {Object.entries(STATUS_CHIPS).map(([category, chips]) => (
              <div key={category} className="border border-gray-100 rounded-md p-2 bg-white">
                <h4 className="text-xs font-bold text-slate-700 mb-2 pb-1 border-b border-gray-100">
                  {category}
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {chips.map((chip, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-2 p-1.5 rounded transition-colors cursor-pointer hover:bg-gray-50 border ${
                        isChipSelected(chip.label, category)
                          ? 'bg-blue-50 border-blue-200'
                          : 'border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChipSelected(chip.label, category)}
                        onChange={() => handleChipToggle(chip.label, category)}
                        className="cursor-pointer w-3.5 h-3.5"
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm">{chip.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {chip.label}
                            </div>
                            <span className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded truncate max-w-[100px]">
                              {category}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {chip.description}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 flex gap-2 justify-end bg-gray-50 flex-shrink-0">
        <button
          onClick={onClose}
          disabled={saving}
          className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          className="bg-blue-600 text-white border border-blue-600 rounded px-3 py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving || !canSave}
        >
          {saving ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  );
}