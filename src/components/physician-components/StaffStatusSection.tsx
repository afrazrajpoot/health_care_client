import React from "react";

interface QuickNoteSnapshot {
  details: string;
  timestamp: string;
  one_line_note: string;
  status_update: string;
  taskDescription?: string;
  taskType?: string;
}

interface StaffStatusSectionProps {
  documentQuickNotes: QuickNoteSnapshot[];
  taskQuickNotes: QuickNoteSnapshot[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const StaffStatusSection: React.FC<StaffStatusSectionProps> = ({
  documentQuickNotes,
  taskQuickNotes,
  isCollapsed = true,
  onToggle,
}) => {
  // Determine status color based on content
  const getStatusColor = (note: QuickNoteSnapshot): string => {
    const fullContent = `${note.status_update || ""} ${note.one_line_note || ""} ${note.details || ""}`.toLowerCase();

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
    // 1. Chip-based options with categories
    if (
      note.status_update &&
      note.one_line_note &&
      note.status_update !== "Task Update" &&
      note.status_update !== "Staff Note"
    ) {
      if (note.status_update.includes("Status") || note.status_update.includes("Flag")) {
        return note.one_line_note;
      }
      return `${note.status_update}: ${note.one_line_note}`;
    }

    // 2. Primary one_line_note (the concise title)
    if (note.one_line_note && note.one_line_note.trim()) {
      return note.one_line_note;
    }

    // 3. Fallback to status update label if no note text
    if (note.status_update && note.status_update.trim()) {
      return note.status_update;
    }

    return note.details?.substring(0, 50) || "Quick Note";
  };

  // Filter and limit document notes
  const filteredDocNotes = documentQuickNotes
    .filter((note) => {
      const text = getDisplayText(note);
      return text && text.trim().length > 0;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA; // Most recent first
    })
    .slice(0, 3);

  const totalTasks = taskQuickNotes.length;
  const hasNotes = filteredDocNotes.length > 0 || taskQuickNotes.length > 0;

  if (!hasNotes) {
    return null;
  }

  // Add CSS for styling
  const styles = `
    .staff-status-section {
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      width: 100%;
    }
    
    .staff-status-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: opacity 0.2s ease;
    }

    .staff-status-header:hover {
      opacity: 0.95;
    }
    
    .staff-status-title {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .staff-status-title svg {
      width: 20px;
      height: 20px;
    }
    
    .total-badge {
      background: #4f46e5;
      color: white;
      font-size: 11px;
      padding: 2px 10px;
      border-radius: 20px;
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(79, 70, 229, 0.2);
    }

    .staff-status-subtitle {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 4px;
    }
    
    .staff-status-body {
      padding: 20px;
    }
    
    .notes-timeline {
      display: flex;
      flex-direction: row; /* ALL TASKS IN HORIZONTAL */
      gap: 24px;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 12px;
      scrollbar-width: thin;
      scrollbar-color: #e5e7eb transparent;
    }

    .notes-timeline::-webkit-scrollbar {
      height: 6px;
    }

    .notes-timeline::-webkit-scrollbar-track {
      background: transparent;
    }

    .notes-timeline::-webkit-scrollbar-thumb {
      background-color: #e5e7eb;
      border-radius: 20px;
    }

    .task-group {
      display: flex;
      flex-direction: column; /* DESCRIPTION AND CHIPS IN COLUMN */
      align-items: flex-start;
      gap: 12px;
      min-width: 320px; /* Width for each horizontal task group */
      flex-shrink: 0;
      padding-right: 24px;
      border-right: 1px solid #f3f4f6;
    }
    
    .task-group:last-child {
      border-right: none;
      padding-right: 0;
    }
    
    .task-group-title {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      overflow: hidden;
      margin-bottom: 4px;
    }
    
    .task-group-title svg {
      width: 16px;
      height: 16px;
      color: #4f46e5;
      opacity: 0.8;
    }

    .chips-container {
      display: flex;
      flex-direction: row; /* CHIPS IN HORIZONTAL */
      flex-wrap: wrap; 
      gap: 8px;
    }
    
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;
      cursor: default;
      white-space: nowrap;
    }
    
    .status-chip:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .status-dot.red { background: #ef4444; }
    .status-dot.amber { background: #f59e0b; }
    .status-dot.green { background: #10b981; }
    .status-dot.blue { background: #3b82f6; }
    .status-dot.gray { background: #9ca3af; }
    
    .note-time {
      font-size: 11px;
      color: #6b7280;
      margin-left: 4px;
      font-weight: 400;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
    }
    
    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.3;
      color: #4f46e5;
    }
  `;

  // Filter and group task notes
  const grouped: Record<string, QuickNoteSnapshot[]> = {};
  taskQuickNotes.forEach(note => {
    const desc = (note.taskDescription || "General Update").trim();
    if (!grouped[desc]) grouped[desc] = [];
    grouped[desc].push(note);
  });

  const groups = Object.entries(grouped);

  return (
    <>
      <style>{styles}</style>
      <div className="staff-status-section mb-[1vw]">
        <div className="staff-status-header" onClick={onToggle}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="staff-status-title">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Staff Status
              {totalTasks > 0 && (
                <span className="total-badge">
                  {totalTasks} Total Tasks
                </span>
              )}
            </div>
            <div className="staff-status-subtitle">
              Patient-specific updates • Read-only view
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
              {isCollapsed ? 'Click to expand' : 'Click to collapse'}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{
                width: '20px',
                height: '20px',
                transition: 'transform 0.3s ease',
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
              }}
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {!isCollapsed && (
          <div className="staff-status-body">
            <div className="notes-timeline">
              {/* Document Quick Notes Section */}
              {filteredDocNotes.length > 0 && (
                <div className="task-group">
                  <div className="task-group-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span>Document Notes ({filteredDocNotes.length})</span>
                  </div>
                  <div className="chips-container">
                    {filteredDocNotes.map((note, index) => {
                      const statusColor = getStatusColor(note);
                      const displayText = getDisplayText(note);
                      return (
                        <div key={`doc-note-${index}`} className="status-chip">
                          <span className={`status-dot ${statusColor}`}></span>
                          <span>{displayText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task Quick Notes Section */}
              {groups.map(([description, notes], groupIndex) => (
                <div key={`task-group-${groupIndex}`} className="task-group">
                  <div className="task-group-title" title={description}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {description} ({notes.length})
                    </span>
                  </div>
                  <div className="chips-container">
                    {notes.map((note, noteIndex) => {
                      const statusColor = getStatusColor(note);
                      const displayText = getDisplayText(note);
                      const time = note.timestamp ? new Date(note.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '';

                      return (
                        <div key={`task-note-${groupIndex}-${noteIndex}`} className="status-chip">
                          <span className={`status-dot ${statusColor}`}></span>
                          <span>{displayText}</span>
                          {time && <span className="note-time">{time}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredDocNotes.length === 0 && groups.length === 0 && (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                  No status updates available
                </div>
                <div style={{ fontSize: '12px' }}>
                  Staff notes and task updates will appear here
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};