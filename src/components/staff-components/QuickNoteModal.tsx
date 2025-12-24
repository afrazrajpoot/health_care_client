"use client";

import { useState, useEffect } from "react";
import styles from "./QuickNoteModal.module.css";
import sharedStyles from "./shared.module.css";

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${sharedStyles.card} ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Quick Note: {task.description}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.field}>
            <label>Status Update</label>
            <input
              type="text"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              placeholder="e.g., Waiting for callback, Scheduled for 12/20"
            />
          </div>
          
          <div className={styles.field}>
            <label>One Line Note</label>
            <input
              type="text"
              value={oneLineNote}
              onChange={(e) => setOneLineNote(e.target.value)}
              placeholder="Brief summary (auto-generated if left empty)"
            />
          </div>
          
          <div className={styles.field}>
            <label>Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detailed notes about this task..."
              rows={6}
            />
          </div>
          
          {task.quickNotes?.timestamp && (
            <div className={styles.timestamp}>
              Last updated: {new Date(task.quickNotes.timestamp).toLocaleString()}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <button onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className={styles.primaryButton}
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

