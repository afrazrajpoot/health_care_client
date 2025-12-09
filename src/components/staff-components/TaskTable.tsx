// app/dashboard/components/TaskTable.tsx
import { useState } from "react";
import { OverdueRow, StandardRow } from "./TaskRows";
import { Task } from "./types";
import { useSession } from "next-auth/react";

interface TaskTableProps {
  currentPane: string;
  tasks: Task[];
  filters: any;
  mode: "wc" | "gm";
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
  onSaveNote: (e: React.MouseEvent, id: string, note: string) => void;
  getPresets: (dept: string) => { type: string[]; more: string[] };
  session?: any;
}

export default function TaskTable({
  currentPane,
  tasks,
  filters,
  mode,
  onClaim,
  onComplete,
  onSaveNote,
  getPresets,
}: TaskTableProps) {
  // LOCAL STATE FOR PREVIEW LOADING
  const [loadingIndexes, setLoadingIndexes] = useState<Set<number>>(new Set());
  const { data: session } = useSession();

  // PREVIEW HANDLER
  const handlePreviewClick = async (
    e: React.MouseEvent,
    doc: any,
    index: number
  ) => {
    e.stopPropagation();

    if (!doc?.blobPath) {
      console.error("Blob path not found for preview");
      return;
    }

    setLoadingIndexes((prev) => new Set([...prev, index]));
    try {
      const response = await fetch(
        `https://api.kebilo.com/api/documents/preview/${encodeURIComponent(
          doc.blobPath
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.fastapi_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch preview: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error fetching preview:", error);
    } finally {
      setLoadingIndexes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  console.log("Rendering TaskTable with tasks:", tasks);

  const getBaseTasks = () =>
    tasks.filter((t) => {
      if (mode === "wc" && t.mode === "gm") return false;
      if (mode === "gm" && t.mode === "wc") return false;
      return true;
    });

  const getFilteredTasks = () => getBaseTasks();

  const displayedTasks = getFilteredTasks();
  console.log("Displayed tasks:", displayedTasks);

  // ==================== ALL PANE ====================
  if (currentPane === "all") {
    if (displayedTasks.length === 0) {
      return (
        <div id="aggScroll">
          <table>
            <thead>
              <tr>
                <th>Task (Action)</th>
                <th>Dept</th>
                <th>Status</th>
                <th>Due</th>
                <th>Patient</th>
                <th>Reason</th>
                <th>Quick Note</th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr id="aggEmpty">
                <td colSpan={9}>
                  No tasks yet. SnapLink a document or switch tabs to create
                  tasks, then return to All.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div>
        <table>
          <thead>
            <tr>
              <th>Task (Action)</th>
              <th>Dept</th>
              <th>Status</th>
              <th>Due</th>
              <th>Patient</th>
              <th>Reason</th>
              <th>Quick Note</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.map((task, idx) => (
              <StandardRow
                key={task.id}
                task={task}
                index={idx}
                showDept
                showUrDenial={true}
                getPresets={getPresets}
                onSaveNote={onSaveNote}
                onClaim={onClaim}
                onComplete={onComplete}
                onPreview={handlePreviewClick}
                previewLoading={loadingIndexes.has(idx)}
                session={session}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ==================== OVERDUE PANE ====================
  if (currentPane === "overdue") {
    return (
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Dept</th>
            <th>Due</th>
            <th>Reason</th>
            <th>Action</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {displayedTasks.map((task, idx) => (
            <OverdueRow
              key={task.id}
              task={task}
              index={idx}
              onClaim={onClaim}
              showUrDenial={true}
              onPreview={handlePreviewClick}
              previewLoading={loadingIndexes.has(idx)}
              session={session}
            />
          ))}
        </tbody>
      </table>
    );
  }

  // ==================== DEFAULT PANES ====================
  return (
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Status</th>
          <th>Due</th>
          <th>Patient</th>
          <th>Reason</th>
          <th>Quick Note</th>
          <th>Actions</th>
          <th>Preview</th>
        </tr>
      </thead>
      <tbody>
        {displayedTasks.map((task, idx) => (
          <StandardRow
            key={task.id}
            task={task}
            index={idx}
            showUrDenial={true}
            getPresets={getPresets}
            onSaveNote={onSaveNote}
            onClaim={onClaim}
            onComplete={onComplete}
            onPreview={handlePreviewClick}
            previewLoading={loadingIndexes.has(idx)}
            session={session}
          />
        ))}
      </tbody>
    </table>
  );
}
