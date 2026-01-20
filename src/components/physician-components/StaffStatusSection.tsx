import React from "react";

interface QuickNoteSnapshot {
  details: string;
  timestamp: string;
  one_line_note: string;
  status_update: string;
}

interface StaffStatusSectionProps {
  documentQuickNotes: QuickNoteSnapshot[];
  taskQuickNotes: QuickNoteSnapshot[];
}

export const StaffStatusSection: React.FC<StaffStatusSectionProps> = ({
  documentQuickNotes,
  taskQuickNotes,
}) => {
  // Determine status color based on content
  const getStatusColor = (note: QuickNoteSnapshot): string => {
    const fullContent = `${note.status_update || ""} ${
      note.one_line_note || ""
    } ${note.details || ""}`.toLowerCase();

    if (
      fullContent.includes("urgent") ||
      fullContent.includes("critical") ||
      fullContent.includes("time-sensitive") ||
      fullContent.includes("emergency") ||
      fullContent.includes("denied") ||
      fullContent.includes("unable") ||
      fullContent.includes("no response") ||
      fullContent.includes("cancelled") ||
      fullContent.includes("no-show")
    ) {
      return "red";
    }
    if (
      fullContent.includes("schedule") ||
      fullContent.includes("pending") ||
      fullContent.includes("waiting") ||
      fullContent.includes("follow-up") ||
      fullContent.includes("follow up") ||
      fullContent.includes("sent") ||
      fullContent.includes("outreach") ||
      fullContent.includes("contacted") ||
      fullContent.includes("notified")
    ) {
      return "amber";
    }
    if (
      fullContent.includes("completed") ||
      fullContent.includes("done") ||
      fullContent.includes("approved") ||
      fullContent.includes("resolved") ||
      fullContent.includes("received") ||
      fullContent.includes("verified") ||
      fullContent.includes("spoke with") ||
      fullContent.includes("reached")
    ) {
      return "green";
    }
    if (
      fullContent.includes("review") ||
      fullContent.includes("clarify") ||
      fullContent.includes("authorization") ||
      fullContent.includes("decision") ||
      fullContent.includes("mri") ||
      fullContent.includes("findings") ||
      fullContent.includes("categorized") ||
      fullContent.includes("linked")
    ) {
      return "blue";
    }
    return "gray";
  };

  // Build display text for note
  const getDisplayText = (note: QuickNoteSnapshot): string => {
    // If it's a chip-based note, status_update is the category
    if (note.status_update && note.one_line_note && note.status_update !== "Task Update") {
      // For very common categories, just show the label
      if (note.status_update.includes("Status") || note.status_update.includes("Flag")) {
        return note.one_line_note;
      }
      return `${note.status_update}: ${note.one_line_note}`;
    }
    return note.one_line_note || note.status_update || note.details?.substring(0, 50) || "Quick Note";
  };

  // Filter and limit document notes
  const filteredDocNotes = documentQuickNotes
    .filter((note) => {
      const hasContent =
        (note.status_update && note.status_update.trim()) ||
        (note.one_line_note && note.one_line_note.trim()) ||
        (note.details && note.details.trim());
      return hasContent;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA; // Most recent first
    })
    .slice(0, 3);

  const hasNotes = filteredDocNotes.length > 0 || taskQuickNotes.length > 0;

  return (
    <div className="panel" style={{ marginBottom: "14px" }}>
      <div className="panel-h">
        <div>
          <div className="title">Staff Status</div>
          <div className="meta">Patient-specific • Read-only</div>
        </div>
      </div>
      <div className="panel-body">
        {hasNotes ? (
          <div className="status-wrap">
            {/* Document Quick Notes */}
            {filteredDocNotes.map((note, index) => {
              const statusColor = getStatusColor(note);
              return (
                <div key={`doc-note-${index}`} className="s-chip small">
                  <span className={`s-dot ${statusColor}`}></span>
                  {getDisplayText(note)}
                </div>
              );
            })}
            {/* Task Quick Notes */}
            {taskQuickNotes.map((note, index) => {
              const statusColor = getStatusColor(note);
              return (
                <div key={`task-note-${index}`} className="s-chip small">
                  <span className={`s-dot ${statusColor}`}></span>
                  {getDisplayText(note)}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No staff status updates available
          </div>
        )}
      </div>
    </div>
  );
};
