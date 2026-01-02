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
      fullContent.includes("emergency")
    ) {
      return "red";
    }
    if (
      fullContent.includes("schedule") ||
      fullContent.includes("pending") ||
      fullContent.includes("waiting") ||
      fullContent.includes("follow-up") ||
      fullContent.includes("follow up")
    ) {
      return "amber";
    }
    if (
      fullContent.includes("completed") ||
      fullContent.includes("done") ||
      fullContent.includes("approved") ||
      fullContent.includes("resolved")
    ) {
      return "green";
    }
    if (
      fullContent.includes("review") ||
      fullContent.includes("clarify") ||
      fullContent.includes("authorization") ||
      fullContent.includes("decision") ||
      fullContent.includes("mri") ||
      fullContent.includes("findings")
    ) {
      return "blue";
    }
    return "gray";
  };

  // Build display text for note
  const getDisplayText = (note: QuickNoteSnapshot): string => {
    let displayText = "";
    if (note.status_update) {
      displayText = note.status_update;
      // Append one_line_note if available and different
      if (note.one_line_note && note.one_line_note !== note.status_update) {
        displayText += ` — ${note.one_line_note}`;
      }
    } else if (note.one_line_note) {
      displayText = note.one_line_note;
    } else if (note.details) {
      // Truncate details if too long
      displayText =
        note.details.length > 50
          ? note.details.substring(0, 50) + "..."
          : note.details;
    } else {
      displayText = "Quick Note";
    }
    return displayText;
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
              const displayText = getDisplayText(note);

              return (
                <div
                  key={`doc-note-${index}`}
                  className="s-chip small"
                  title={note.details || displayText}
                >
                  <span className={`s-dot ${statusColor}`}></span>
                  {displayText}
                </div>
              );
            })}
            {/* Task Quick Notes */}
            {taskQuickNotes.map((note, index) => {
              const statusColor = getStatusColor(note);
              const displayText = getDisplayText(note);

              return (
                <div
                  key={`task-note-${index}`}
                  className="s-chip small"
                  title={note.details || displayText}
                >
                  <span className={`s-dot ${statusColor}`}></span>
                  {displayText}
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

