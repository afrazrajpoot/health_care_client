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
  onSave: (taskId: string, quickNotes: {
    status_update: string;
    details: string;
    one_line_note: string;
  }) => Promise<void>;
}

export default function QuickNoteModal({
  isOpen,
  task,
  onClose,
  onSave,
}: QuickNoteModalProps) {
  const [statusUpdate, setStatusUpdate] = useState(
    task?.quickNotes?.status_update || ""
  );
  const [details, setDetails] = useState(
    task?.quickNotes?.details || ""
  );
  const [oneLineNote, setOneLineNote] = useState(
    task?.quickNotes?.one_line_note || ""
  );
  const [saving, setSaving] = useState(false);

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setStatusUpdate(task.quickNotes?.status_update || "");
      setDetails(task.quickNotes?.details || "");
      setOneLineNote(task.quickNotes?.one_line_note || "");
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (!task) return;
    
    setSaving(true);
    try {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] max-w-[600px] w-[90%] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h3 className="m-0 text-base font-bold">Quick Note: {task.description}</h3>
          <button className="bg-transparent border-none text-2xl cursor-pointer p-0 w-6 h-6 flex items-center justify-center text-gray-500 transition-colors hover:text-slate-900" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold text-slate-900">Status Update</label>
            <input
              type="text"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              placeholder="e.g., Waiting for callback, Scheduled for 12/20"
              className="w-full p-2 border border-gray-200 rounded-md text-sm font-[inherit] resize-y focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold text-slate-900">One Line Note</label>
            <input
              type="text"
              value={oneLineNote}
              onChange={(e) => setOneLineNote(e.target.value)}
              placeholder="Brief summary (auto-generated if left empty)"
              className="w-full p-2 border border-gray-200 rounded-md text-sm font-[inherit] resize-y focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold text-slate-900">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detailed notes about this task..."
              rows={6}
              className="w-full p-2 border border-gray-200 rounded-md text-sm font-[inherit] resize-y min-h-[100px] focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
            />
          </div>
          
          {task.quickNotes?.timestamp && (
            <p className="text-xs text-gray-500 mt-2 italic m-0">
              Last updated: {new Date(task.quickNotes.timestamp).toLocaleString()}
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
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

