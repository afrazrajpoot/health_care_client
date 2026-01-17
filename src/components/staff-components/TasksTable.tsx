"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Eye,
  Trash2,
  Scissors,
  X,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import QuickNoteModal from "@/components/staff-components/QuickNoteModal";

import { Task, FailedDocument } from "@/utils/staffDashboardUtils";

interface TasksTableProps {
  tasks: Task[];
  taskStatuses: { [taskId: string]: string };
  taskAssignees: { [taskId: string]: string };
  onStatusClick: (taskId: string, status: string) => Promise<void>;
  onAssigneeClick: (taskId: string, assignee: string) => void;
  onTaskClick: (task: Task) => void;
  onSaveQuickNote?: (taskId: string, quickNotes: any) => Promise<void>;
  getStatusOptions: (task: Task) => string[];
  getAssigneeOptions: (task: Task) => string[];
  // New props for failed documents
  failedDocuments?: FailedDocument[];
  onFailedDocumentDeleted?: (docId: string) => void;
  onFailedDocumentRowClick?: (doc: FailedDocument) => void;
  mode?: "wc" | "gm";
  physicianId?: string;
  selectedTaskIds?: string[];
  onToggleTaskSelection?: (taskIds: string[], selected: boolean) => void;
}

import { User } from "lucide-react";
import { useDeleteFailedDocumentMutation } from "@/redux/staffApi";
import { useLazyGetDocumentPreviewQuery, useSplitAndProcessDocumentMutation } from "@/redux/pythonApi";

export default function TasksTable({
  tasks,
  taskStatuses,
  taskAssignees,
  onStatusClick,
  onAssigneeClick,
  onTaskClick,
  onSaveQuickNote,
  getStatusOptions,
  getAssigneeOptions,
  failedDocuments = [],
  onFailedDocumentDeleted,
  onFailedDocumentRowClick,
  mode = "wc",
  physicianId,
  selectedTaskIds = [],
  onToggleTaskSelection,
}: TasksTableProps) {
  const { data: session } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openQuickNoteId, setOpenQuickNoteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(
    new Set()
  );

  // Document preview states
  const [loadingTaskPreview, setLoadingTaskPreview] = useState<string | null>(
    null
  );
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<FailedDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<FailedDocument | null>(null);

  const [documentToSplit, setDocumentToSplit] = useState<FailedDocument | null>(
    null
  );
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResults, setSplitResults] = useState<any>(null);
  const [pageRanges, setPageRanges] = useState<
    Array<{ start_page: number; end_page: number; report_title: string }>
  >([{ start_page: 1, end_page: 1, report_title: "" }]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [triggerGetDocumentPreview] = useLazyGetDocumentPreviewQuery();

  // Task document preview handler (using physician dashboard approach)
  const handleTaskDocumentPreview = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();

    if (!task.document?.blobPath) {
      console.error("Blob path not found for task document preview");
      toast.error("Document preview not available");
      return;
    }

    const taskId = task.id;
    if (!taskId || loadingTaskPreview === taskId) return;

    setLoadingTaskPreview(taskId);

    try {
      const blob = await triggerGetDocumentPreview(task.document.blobPath).unwrap();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error fetching task document preview:", error);
      toast.error("Failed to preview document");
    } finally {
      setLoadingTaskPreview(null);
    }
  };

  // Failed document preview handler (updated to use backend API like physician dashboard)
  const handlePreviewFile = async (
    e: React.MouseEvent,
    doc: FailedDocument
  ) => {
    e.stopPropagation();

    if (!doc.blobPath) {
      console.error("Blob path not found for failed document preview");
      toast.error("Document preview not available");
      return;
    }

    if (loadingPreview === doc.id) return;

    setLoadingPreview(doc.id);

    try {
      const blob = await triggerGetDocumentPreview(doc.blobPath).unwrap();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error fetching failed document preview:", error);
      toast.error("Failed to preview document");
    } finally {
      setLoadingPreview(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: FailedDocument) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const [deleteFailedDocument] = useDeleteFailedDocumentMutation();
  const [splitAndProcessDocument] = useSplitAndProcessDocumentMutation();

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFailedDocument(documentToDelete.id).unwrap();
      if (onFailedDocumentDeleted) {
        onFailedDocumentDeleted(documentToDelete.id);
      }
 
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
      toast.success("Document deleted successfully");
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error(
        error.data?.error || error.message || "Failed to delete document"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewSummary = (e: React.MouseEvent, doc: FailedDocument) => {
    e.stopPropagation();
    setSelectedDocument(doc);
    setSummaryModalOpen(true);
  };

  const handleAddPageRange = () => {
    setPageRanges([
      ...pageRanges,
      { start_page: 1, end_page: 1, report_title: "" },
    ]);
  };

  const handleRemovePageRange = (index: number) => {
    if (pageRanges.length > 1) {
      setPageRanges(pageRanges.filter((_, i) => i !== index));
    }
  };

  const handlePageRangeChange = (
    index: number,
    field: "start_page" | "end_page" | "report_title",
    value: string | number
  ) => {
    const updated = [...pageRanges];
    updated[index] = { ...updated[index], [field]: value };
    setPageRanges(updated);
  };

  const handleSplitAndProcess = async () => {
    if (!documentToSplit || !documentToSplit.blobPath || !physicianId) {
      toast.error("Missing required information for splitting");
      return;
    }
    const validRanges = pageRanges.filter(
      (range) =>
        range.start_page > 0 &&
        range.end_page >= range.start_page &&
        range.report_title.trim() !== ""
    );
    if (validRanges.length === 0) {
      toast.error(
        "Please add at least one valid page range with a report title"
      );
      return;
    }
    setIsSplitting(true);
    setSplitResults(null);
    try {
      const data = await splitAndProcessDocument({
        mode: mode,
        physician_id: physicianId,
        original_filename: documentToSplit.fileName || "split_document",
        fail_doc_id: documentToSplit.id,
        blob_path: documentToSplit.blobPath,
        page_ranges: validRanges,
      }).unwrap();

      setSplitResults(data);
      if (data.saved_documents && data.saved_documents > 0) {
        toast.success(
          `Successfully split and saved ${data.saved_documents} document(s)!`
        );
        if (onFailedDocumentDeleted && documentToSplit.id) {
          setTimeout(() => onFailedDocumentDeleted(documentToSplit.id), 1000);
        }
      } else {
        toast.warning("Documents processed but not all were saved");
      }
    } catch (error: any) {
      console.error("Error splitting document:", error);
      toast.error(
        error.data?.detail || error.message || "Failed to split and process document"
      );
    } finally {
      setIsSplitting(false);
    }
  };

  // Combine tasks and failed documents into unified rows
  type UnifiedRow =
    | { type: "task"; data: Task }
    | { type: "failedDoc"; data: FailedDocument };

  const unifiedRows: UnifiedRow[] = [
    ...tasks.map((task) => ({ type: "task" as const, data: task })),
    ...failedDocuments.map((doc) => ({
      type: "failedDoc" as const,
      data: doc,
    })),
  ];

  // Helper function to get ID for any row type
  const getRowId = (row: UnifiedRow) => {
    if (row.type === "task") {
      return `task-${row.data.id}`;
    } else {
      return `doc-${row.data.id}`;
    }
  };

  // Handle checkbox selection for any row type
  const handleRowSelection = (row: UnifiedRow, checked: boolean) => {
    if (row.type === "task") {
      onToggleTaskSelection?.([row.data.id], checked);
    } else {
      // For failed documents, we can either handle them separately or include them
      // For now, we'll include them in the selection if needed
      onToggleTaskSelection?.([`doc-${row.data.id}`], checked);
    }
  };

  // Check if a row is selected
  const isRowSelected = (row: UnifiedRow) => {
    if (row.type === "task") {
      return selectedTaskIds?.includes(row.data.id) || false;
    } else {
      return selectedTaskIds?.includes(`doc-${row.data.id}`) || false;
    }
  };

  // Check if all rows are selected
  const isAllSelected = () => {
    if (unifiedRows.length === 0) return false;
    return unifiedRows.every(row => isRowSelected(row));
  };

  if (unifiedRows.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
        <div className="p-10 text-center text-gray-500">
          <p className="text-sm m-0">No tasks found</p>
        </div>
      </section>
    );
  }

  const getStatusChipColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("signature") || s.includes("physician"))
      return "border-red-400 bg-red-100 text-red-700";
    if (s.includes("progress"))
      return "border-amber-400 bg-amber-100 text-amber-700";
    if (s.includes("pending"))
      return "border-orange-400 bg-orange-100 text-orange-700";
    if (s.includes("waiting") || s.includes("callback"))
      return "border-purple-400 bg-purple-100 text-purple-700";
    if (s.includes("scheduling"))
      return "border-blue-400 bg-blue-100 text-blue-700";
    if (s.includes("completed") || s.includes("done"))
      return "border-green-400 bg-green-100 text-green-700";
    if (s.includes("unclaimed"))
      return "border-gray-400 bg-gray-100 text-gray-700";
    return "border-blue-400 bg-blue-100 text-blue-700";
  };

  const getAssigneeChipColor = (assignee: string) => {
    const a = assignee.toLowerCase();
    if (a.includes("unclaimed"))
      return "border-gray-400 bg-gray-100 text-gray-700";
    if (a.includes("physician"))
      return "border-red-400 bg-red-100 text-red-700";
    if (a.includes("admin"))
      return "border-indigo-400 bg-indigo-100 text-indigo-700";
    if (a.includes("scheduler"))
      return "border-teal-400 bg-teal-100 text-teal-700";
    if (a.includes("ma")) return "border-cyan-400 bg-cyan-100 text-cyan-700";
    return "border-blue-400 bg-blue-100 text-blue-700";
  };

  return (
    <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] flex flex-col min-h-0 flex-1 overflow-hidden">
      <h3 className="m-0 px-3.5 py-3 text-base font-bold border-b border-gray-200">
        Open Tasks & Required Actions
      </h3>
      <div className="min-h-0 max-h-full overflow-y-auto overflow-x-hidden flex-1 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:min-w-5 [&::-webkit-scrollbar-thumb]:min-h-5 [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
        <div className="overflow-x-auto overflow-y-visible pb-[8vw] w-full [-webkit-overflow-scrolling:touch] relative [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:min-w-5 [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
          <table className="w-max min-w-full border-collapse table-auto text-base visible table box-border">
            <thead>
              <tr>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 w-[40px]">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                        const allIds = unifiedRows.map(row => 
                          row.type === 'task' ? row.data.id : `doc-${row.data.id}`
                        );
                        if (e.target.checked) {
                            // Select all rows
                            onToggleTaskSelection?.(allIds, true);
                        } else {
                            // Deselect all
                            onToggleTaskSelection?.([], false);
                        }
                    }}
                    checked={isAllSelected()}
                  />
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[250px] w-[250px] whitespace-normal">
                  Item
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[50px] w-[50px] whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[150px] w-[150px] whitespace-nowrap">
                  Type
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[100px] w-[100px] whitespace-nowrap">
                  Preview
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[100px] w-[100px] whitespace-nowrap">
                  Due
                </th>
                <th className="px-3 py-2.5 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 sticky top-0 bg-white z-10 min-w-[150px] w-[150px] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {unifiedRows.map((row) => {
                if (row.type === "task") {
                  const task = row.data;
                  const currentStatus =
                    taskStatuses[task.id] || task.status || "Pending";
                  const currentAssignee =
                    taskAssignees[task.id] || task.assignee || "Unclaimed";
                  const statusOptions = getStatusOptions(task);
                  const isSelected = isRowSelected(row);

                  return (
                    <tr key={`task-${task.id}`} className={isSelected ? "bg-blue-50/50" : ""}>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left w-[40px]">
                        <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isSelected}
                            onChange={(e) => {
                                handleRowSelection(row, e.target.checked);
                            }}
                        />
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[250px] w-[250px] whitespace-normal">
                        {task.description}
                        {task.assignee && task.assignee !== 'Unclaimed' && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Assigned to: {task.assignee}
                            </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[50px] w-[50px] whitespace-nowrap relative">
                        <div
                          className="relative"
                          ref={openDropdown === task.id ? dropdownRef : null}
                        >
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${getStatusChipColor(
                              currentStatus
                            )}`}
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === task.id ? null : task.id
                              )
                            }
                          >
                            {updatingStatuses.has(task.id) ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                {currentStatus}
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </>
                            )}
                          </span>
                          {openDropdown === task.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[10000] min-w-[140px] max-h-[300px] overflow-y-auto">
                              {statusOptions.map((status) => (
                                <div
                                  key={status}
                                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                    currentStatus === status
                                      ? "bg-blue-50 font-semibold"
                                      : ""
                                  }`}
                                  onClick={async () => {
                                    setUpdatingStatuses((prev) =>
                                      new Set(prev).add(task.id)
                                    );
                                    setOpenDropdown(null);
                                    try {
                                      await onStatusClick(task.id, status);
                                      toast.success(
                                        `Status updated to "${status}"`
                                      );
                                    } catch (error) {
                                      toast.error("Failed to update status");
                                    } finally {
                                      setUpdatingStatuses((prev) => {
                                        const newSet = new Set(prev);
                                        newSet.delete(task.id);
                                        return newSet;
                                      });
                                    }
                                  }}
                                >
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                      status.toLowerCase().includes("completed")
                                        ? "bg-green-500"
                                        : status
                                            .toLowerCase()
                                            .includes("progress")
                                        ? "bg-amber-500"
                                        : status
                                            .toLowerCase()
                                            .includes("pending")
                                        ? "bg-orange-500"
                                        : status
                                            .toLowerCase()
                                            .includes("waiting")
                                        ? "bg-purple-500"
                                        : "bg-blue-500"
                                    }`}
                                  ></span>
                                  {status}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[150px] w-[150px] whitespace-nowrap">
                        {task.department}
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[100px] w-[100px] whitespace-nowrap">
                        {task.document?.blobPath ? (
                          <button
                            onClick={(e) => handleTaskDocumentPreview(e, task)}
                            disabled={loadingTaskPreview === task.id}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                            title="Preview Document"
                          >
                            {loadingTaskPreview === task.id ? (
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[100px] w-[100px] whitespace-nowrap">
                        {task.dueDate
                          ? (() => {
                              const d = new Date(task.dueDate);
                              const month = String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              );
                              const day = String(d.getDate()).padStart(2, "0");
                              const year = d.getFullYear();
                              return `${month}-${day}-${year}`;
                            })()
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[150px] w-[150px] whitespace-nowrap relative">
                        <div className="relative">
                          <span
                            className="text-blue-600 font-semibold cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSaveQuickNote) {
                                setOpenQuickNoteId(
                                  openQuickNoteId === task.id ? null : task.id
                                );
                              } else {
                                onTaskClick(task);
                              }
                            }}
                          >
                            {task.department
                              ?.toLowerCase()
                              .includes("clinical") ||
                            task.department?.toLowerCase().includes("medical")
                              ? "Review"
                              : "View"}
                          </span>

                          {openQuickNoteId === task.id && onSaveQuickNote && (
                            <QuickNoteModal
                              isOpen={true}
                              task={task}
                              onClose={() => setOpenQuickNoteId(null)}
                              onSave={onSaveQuickNote}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  // Failed document row
                  const doc = row.data;
                  const isSelected = isRowSelected(row);

                  return (
                    <tr
                      key={`doc-${doc.id}`}
                      className={`${isSelected ? "bg-blue-50/50" : "bg-red-50/30"} hover:bg-red-50 transition-colors`}
                      onClick={() => onFailedDocumentRowClick?.(doc)}
                    >
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left w-[40px]">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowSelection(row, e.target.checked);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[250px] w-[250px] whitespace-normal">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {doc.reason}
                            </p>
                            {doc.fileName && (
                              <p className="text-xs text-gray-500 mt-1">
                                File: {doc.fileName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[50px] w-[50px] whitespace-nowrap">
                        <span className="text-xs px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap border-red-400 bg-red-100 text-red-700">
                          Action Required
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[150px] w-[150px] whitespace-nowrap">
                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
                          Failed Document
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[100px] w-[100px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* Preview File - ONLY ONE PREVIEW BUTTON HERE */}
                          {doc.blobPath && (
                            <button
                              onClick={(e) => handlePreviewFile(e, doc)}
                              disabled={loadingPreview === doc.id}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                              title="Preview File"
                            >
                              {loadingPreview === doc.id ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[100px] w-[100px] whitespace-nowrap text-gray-400">
                        —
                      </td>
                      <td className="px-3 py-2.5 border-b border-gray-200 text-left min-w-[150px] w-[150px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* View Summary */}
                          <button
                            onClick={(e) => handleViewSummary(e, doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Preview File - REMOVED DUPLICATE PREVIEW BUTTON FROM HERE */}
                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteClick(e, doc)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary/Details Modal for Failed Documents */}
      {summaryModalOpen && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/20 transition-opacity"
              onClick={() => setSummaryModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Document Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setSummaryModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700">
                      File Name
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedDocument.fileName}
                    </p>
                  </div>

                  <div className="p-3 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-700">Reason</p>
                    <p className="text-sm text-red-600">
                      {selectedDocument.reason}
                    </p>
                  </div>

                  {selectedDocument.patientName && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">
                        Patient Name
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedDocument.patientName}
                      </p>
                    </div>
                  )}

                  {selectedDocument.claimNumber && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700">
                        Claim Number
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedDocument.claimNumber}
                      </p>
                    </div>
                  )}

                  {(selectedDocument.summary ||
                    selectedDocument.documentText) && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-700 mb-2">
                        Summary / Document Text
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedDocument.documentText ||
                          selectedDocument.documentText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                {selectedDocument.gcsFileLink && (
                  <button
                    type="button"
                    onClick={(e) => handlePreviewFile(e, selectedDocument)}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto"
                  >
                    Preview File
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSummaryModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && documentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/20 transition-opacity"
              onClick={() => setDeleteModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Delete Document
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this document? This
                        action cannot be undone.
                      </p>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-700">
                          {documentToDelete.fileName}
                        </p>
                        {documentToDelete.patientName && (
                          <p className="text-gray-500">
                            Patient: {documentToDelete.patientName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}