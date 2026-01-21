"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  User,
  UserPlus,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Tag,
  MoreVertical,
  Download,
  Filter,
  Search,
  ChevronDown,
  AlertTriangle,
  FileWarning,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  Users,
  Settings,
  ExternalLink,
  BarChart3,
  Shield,
  HardDrive,
  FolderOpen,
  FilePlus,
  Sparkles,
  RotateCw,
  Bell,
  Star,
  Target,
  TrendingUp,
  Grid,
  List,
  EyeOff,
  Copy,
  Share,
  Archive,
  BookOpen,
  MessageSquare,
  Paperclip,
  Link,
  FolderInput,
  FolderTree,
  Layers,
  FileX,
  FileCheck,
  FileQuestion,
  FileSearch,
  FileClock,
  FileSpreadsheet,
  FileBarChart,
  FileImage,
  FileArchive,
  FileCode,
  FileDiff,
  FileJson,
  FileVideo,
  FileAudio,
  FilePieChart,
  FileSignature,
  FileDigit,
  FileMinus,
  FileUp,
  FileDown,
  FileAxis3d,
  FileOutput,
  FileInput,
  FileSliders,
  FileTerminal,
  FileType,
  FileKey,
  FileLock,
  FileHeart,
  FileMusic,
  FilePenLine,
  FileStack,
  FileSymlink,
  FileUser,
  FileVolume2,
  FileWarning as FileWarningIcon,
  File,
  Folder,
  FolderPlus,
  FolderMinus,
  FolderSearch,
  FolderOutput,
  FolderInput as FolderInputIcon,
  FolderTree as FolderTreeIcon,
  FolderOpenDot,
  FolderKanban,
  FolderSync,
  FolderCheck,
  FolderX,
  FolderClock,
  FolderKey,
  FolderLock,
  FolderGit2,
  FolderGit,
  FolderRoot,
  FolderUp,
  FolderDown,
  FolderDot
} from "lucide-react";
import QuickNoteModal from "@/components/staff-components/QuickNoteModal";
import AssignTaskModal from "@/components/staff-components/AssignTaskModal";

import { Task, FailedDocument } from "@/utils/staffDashboardUtils";

interface TasksTableProps {
  tasks: Task[];
  taskStatuses: { [taskId: string]: string };
  taskAssignees: { [taskId: string]: string };
  onStatusClick: (taskId: string, status: string) => Promise<void>;
  onAssigneeClick: (taskId: string, assignee: string) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onSaveQuickNote?: (taskId: string, quickNotes: any, status?: string) => Promise<void>;
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
  onSearch?: (query: string) => void;
}

import { useDeleteFailedDocumentMutation } from "@/redux/staffApi";
import { useLazyGetDocumentPreviewQuery, useSplitAndProcessDocumentMutation, useUpdateFailedDocumentMutation } from "@/redux/pythonApi";

export default function TasksTable({
  tasks = [],
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
  onSearch,
}: TasksTableProps) {
  const { data: session } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openQuickNoteId, setOpenQuickNoteId] = useState<string | null>(null);
  const [openAssignTaskId, setOpenAssignTaskId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(
    new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  // Dynamic Filter Options
  const availableStatuses = ["all", ...Array.from(new Set(tasks.map(t => t.status || "Pending")))];
  const availableTypes = ["all", ...Array.from(new Set(tasks.map(t => t.department || "General")))];
  const availableAssignees = ["all", ...Array.from(new Set(tasks.map(t => taskAssignees[t.id] || t.assignee || "Unclaimed")))];

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
  const [updateFailedDocument] = useUpdateFailedDocumentMutation();

  const isHardFail = (doc: FailedDocument) => {
    return !doc.patientName && !doc.claimNumber && !doc.doi && !doc.db;
  };

  const handleBulkUpdateFailedDocs = async () => {
    const selectedFailedDocs = failedDocuments.filter(doc => 
      selectedTaskIds?.includes(`doc-${doc.id}`) && !isHardFail(doc)
    );

    if (selectedFailedDocs.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updates = selectedFailedDocs.map(doc => ({
        fail_doc_id: doc.id,
        patient_name: doc.patientName || "Unknown Patient",
        claim_number: doc.claimNumber || "Not specified",
        doi: doc.doi || "Not specified",
        db: doc.db || "Not specified",
        author: (doc as any).author || "Unknown Author",
        document_text: doc.documentText || "",
        user_id: session?.user?.id,
      }));

      await updateFailedDocument(updates).unwrap();
      
      toast.success(`Successfully processed ${selectedFailedDocs.length} documents`);
      
      // Clear selection for these documents
      const idsToRemove = selectedFailedDocs.map(doc => `doc-${doc.id}`);
      onToggleTaskSelection?.(idsToRemove, false);
    } catch (error: any) {
      console.error("Error bulk updating documents:", error);
      toast.error(error.data?.error || "Failed to process documents");
    } finally {
      setIsBulkUpdating(false);
    }
  };

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

  // Filter tasks based on role (Staff sees only assigned tasks)
  const filteredTasks = useMemo(() => {
    if (session?.user?.role?.toLowerCase() !== "staff") {
      return tasks;
    }

    return tasks.filter(task => {
       const currentAssignee = taskAssignees[task.id] || task.assignee;
       
       if (!currentAssignee) return false;
       
       const assigneeLower = currentAssignee.toLowerCase();
       const userNameLower = session?.user?.name?.toLowerCase() || "";
       const userEmailLower = session?.user?.email?.toLowerCase() || "";
       
       return (
         assigneeLower === userNameLower ||
         (userNameLower && userNameLower.includes(assigneeLower)) ||
         (assigneeLower && assigneeLower.includes(userNameLower)) ||
         assigneeLower === userEmailLower
       );
    });
  }, [tasks, taskAssignees, session?.user?.role, session?.user?.name, session?.user?.email]);

  // Combine tasks and failed documents into unified rows
  type UnifiedRow =
    | { type: "task"; data: Task }
    | { type: "failedDoc"; data: FailedDocument };

  const unifiedRows: UnifiedRow[] = [
    ...filteredTasks.map((task) => ({ type: "task" as const, data: task })),
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
    const selectableRows = unifiedRows.filter(row => {
      if (row.type === "failedDoc") {
        return !isHardFail(row.data);
      }
      return false;
    });
    if (selectableRows.length === 0) return false;
    return selectableRows.every(row => isRowSelected(row));
  };

  // Filter rows based on search and filters
  const filteredRows = unifiedRows.filter(row => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (row.type === "failedDoc") {
        // Always client-side filter failed docs
        return (
          row.data.fileName?.toLowerCase().includes(searchLower) ||
          row.data.reason?.toLowerCase().includes(searchLower) ||
          row.data.patientName?.toLowerCase().includes(searchLower) ||
          row.data.claimNumber?.toLowerCase().includes(searchLower)
        );
      } else if (!onSearch) {
        // Only client-side filter tasks if server search is not enabled
        return (
          row.data.description?.toLowerCase().includes(searchLower) ||
          row.data.patient?.toLowerCase().includes(searchLower) ||
          row.data.status?.toLowerCase().includes(searchLower) ||
          row.data.department?.toLowerCase().includes(searchLower)
        );
      }
    }
    
    if (statusFilter !== "all") {
      if (row.type === "task") {
        return row.data.status?.toLowerCase() === statusFilter.toLowerCase();
      } else {
        return statusFilter === "failed";
      }
    }
    
    if (typeFilter !== "all") {
      if (row.type === "task") {
        return row.data.department?.toLowerCase() === typeFilter.toLowerCase();
      } else {
        return typeFilter === "failed";
      }
    }

    if (assigneeFilter !== "all") {
      if (row.type === "task") {
        const currentAssignee = taskAssignees[row.data.id] || row.data.assignee || "Unclaimed";
        return currentAssignee === assigneeFilter;
      } else {
        return false;
      }
    }
    
    return true;
  });

  if (unifiedRows.length === 0) {
    return (
      <section className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <FileX className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Create new tasks or upload documents to get started with task management
          </p>
        </div>
      </section>
    );
  }

  const getStatusChipColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("signature") || s.includes("physician"))
      return "border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-800 shadow-sm shadow-red-100";
    if (s.includes("progress"))
      return "border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 shadow-sm shadow-amber-100";
    if (s.includes("pending"))
      return "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 shadow-sm shadow-orange-100";
    if (s.includes("waiting") || s.includes("callback"))
      return "border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 shadow-sm shadow-purple-100";
    if (s.includes("scheduling"))
      return "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-sm shadow-blue-100";
    if (s.includes("completed") || s.includes("done"))
      return "border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 shadow-sm shadow-emerald-100";
    if (s.includes("unclaimed"))
      return "border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 shadow-sm shadow-gray-100";
    if (s.includes("urgent") || s.includes("high"))
      return "border-rose-300 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-800 shadow-sm shadow-rose-100 animate-pulse";
    return "border-indigo-300 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 shadow-sm shadow-indigo-100";
  };

  const getAssigneeChipColor = (assignee: string) => {
    const a = assignee.toLowerCase();
    if (a.includes("unclaimed"))
      return "border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800";
    if (a.includes("physician"))
      return "border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-800";
    if (a.includes("admin"))
      return "border-indigo-300 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800";
    if (a.includes("scheduler"))
      return "border-teal-300 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800";
    if (a.includes("ma")) 
      return "border-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-800";
    return "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800";
  };

  const getTaskIcon = (department: string) => {
    if (!department) return <FileText className="w-5 h-5" />;
    
    const dept = department.toLowerCase();
    if (dept.includes("clinical") || dept.includes("medical")) 
      return <FileHeart className="w-5 h-5" />;
    if (dept.includes("admin")) 
      return <FileUser className="w-5 h-5" />;
    if (dept.includes("scheduling")) 
      return <Calendar className="w-5 h-5" />;
    if (dept.includes("billing") || dept.includes("finance")) 
      return <FileBarChart className="w-5 h-5" />;
    if (dept.includes("document")) 
      return <FolderTree className="w-5 h-5" />;
    if (dept.includes("review")) 
      return <FileSearch className="w-5 h-5" />;
    if (dept.includes("legal")) 
      return <FileSignature className="w-5 h-5" />;
    if (dept.includes("imaging")) 
      return <FileImage className="w-5 h-5" />;
    
    return <File className="w-5 h-5" />;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Tag className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden mt-[1vw]">
      {/* Header with Controls */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <FileStack className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Task Management
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Manage and track tasks and documents across all workflows
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>

            {selectedTaskIds && selectedTaskIds.some(id => id.startsWith('doc-')) && (
              <button
                onClick={handleBulkUpdateFailedDocs}
                disabled={isBulkUpdating}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Process Selected ({selectedTaskIds.filter(id => id.startsWith('doc-')).length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, documents, patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all capitalize"
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </option>
              ))}
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all capitalize"
            >
              {availableTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </option>
              ))}
            </select>

            {session?.user?.role !== "Staff" && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all capitalize"
              >
                {availableAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>
                    {assignee === "all" ? "All Assignees" : assignee}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTasks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTasks.filter(t => t.quickNotes?.options && t.quickNotes.options.length > 0).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileWarning className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed Docs</p>
                <p className="text-2xl font-bold text-gray-900">{failedDocuments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.status === "completed").length / filteredTasks.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const selectableRows = unifiedRows.filter(row => {
                      if (row.type === "failedDoc") {
                        return !isHardFail(row.data);
                      }
                      return false;
                    });
                    const ids = selectableRows.map(row => `doc-${row.data.id}`);
                    onToggleTaskSelection?.(ids, checked);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Task / Document
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Status
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  Type / Department
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </div>
              </th>
              {session?.user?.role !== "Staff" && (
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assignee
                  </div>
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Actions
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.map((row) => {
              if (row.type === "task") {
                const task = row.data;
                const currentStatus = taskStatuses[task.id] || task.status || "Pending";
                const currentAssignee = taskAssignees[task.id] || task.assignee || "Unclaimed";
                const statusOptions = getStatusOptions(task);
                const isSelected = isRowSelected(row);
                const priorityIcon = getPriorityIcon(task.priority || '');
                const taskIcon = getTaskIcon(task.department || '');

                return (
                  <tr 
                    key={`task-${task.id}`} 
                    className={`hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-white transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-blue-50 to-blue-25' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center h-full">
                        {/* Checkbox for selection */}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
                          {taskIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{task.description}</h4>
                            {task.priority && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs">
                                {priorityIcon}
                                <span>{task.priority}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {task.patient}
                            </span>
                            {task.assignee && task.assignee !== 'Unclaimed' && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-200">
                                <UserPlus className="w-3 h-3" />
                                {task.assignee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusChipColor(currentStatus)}`}>
                        <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                        {currentStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50">
                          {taskIcon}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{task.department}</span>
                          <div className="text-xs text-gray-500 mt-1">{task.type || 'General Task'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`font-medium ${new Date(task.dueDate || '') < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : "—"}
                        </span>
                        {task.dueDate && new Date(task.dueDate) < new Date() && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    {session?.user?.role !== "Staff" && (
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAssignTaskId(task.id);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 rounded-lg transition-all border border-blue-200 shadow-sm"
                          title="Assign Task"
                        >
                          <UserPlus className="w-4 h-4" />
                          {currentAssignee === "Unclaimed" ? "Assign" : "Reassign"}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {task.document?.blobPath && (
                          <button
                            onClick={(e) => handleTaskDocumentPreview(e, task)}
                            disabled={loadingTaskPreview === task.id}
                            className="p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all border border-gray-200"
                            title="Preview Document"
                          >
                            {loadingTaskPreview === task.id ? (
                              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        )}
                        
                        <button
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
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-sm shadow-blue-200"
                        >
                          {task.department?.toLowerCase().includes("clinical") ||
                          task.department?.toLowerCase().includes("medical")
                            ? <><FileSearch className="w-4 h-4" /> Review</>
                            : <><Eye className="w-4 h-4" /> View</>}
                        </button>
                        
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              } else {
                // Failed document row
                const doc = row.data;
                const isSelected = isRowSelected(row);
                const isHardFailDoc = isHardFail(doc);

                return (
                  <tr
                    key={`doc-${doc.id}`}
                    className={`hover:bg-gradient-to-r hover:from-red-50/30 hover:to-white transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-red-50 to-red-25' : ''} ${isHardFailDoc ? 'opacity-75' : ''}`}
                    onClick={() => isHardFailDoc && onFailedDocumentRowClick?.(doc)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center h-full">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isHardFailDoc}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowSelection(row, e.target.checked);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isHardFailDoc ? 'bg-gradient-to-br from-gray-100 to-gray-50' : 'bg-gradient-to-br from-red-100 to-red-50'} border ${isHardFailDoc ? 'border-gray-300' : 'border-red-200'}`}>
                          {isHardFailDoc ? <FileX className="w-5 h-5 text-gray-600" /> : <FileWarning className="w-5 h-5 text-red-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{doc.reason}</h4>
                            {isHardFailDoc && (
                              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                Hard Fail
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{doc.fileName}</p>
                          {doc.patientName && (
                            <div className="flex items-center gap-2 mt-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{doc.patientName}</span>
                              {doc.claimNumber && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-sm text-gray-700">Claim: {doc.claimNumber}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-800 shadow-sm shadow-red-100">
                        <AlertTriangle className="w-4 h-4" />
                        Action Required
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isHardFailDoc ? 'bg-gray-100' : 'bg-red-100'}`}>
                          {isHardFailDoc ? <FileQuestion className="w-5 h-5" /> : <FileClock className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Failed Document</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {isHardFailDoc ? 'Missing critical data' : 'Needs processing'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400">—</span>
                    </td>
                    {session?.user?.role !== "Staff" && (
                      <td className="px-6 py-4">
                        <span className="text-gray-400">—</span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {doc.blobPath && (
                          <button
                            onClick={(e) => handlePreviewFile(e, doc)}
                            disabled={loadingPreview === doc.id}
                            className="p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all border border-gray-200"
                            title="Preview File"
                          >
                            {loadingPreview === doc.id ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => handleViewSummary(e, doc)}
                          className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition-all border border-blue-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        
                        <button
                          onClick={(e) => handleDeleteClick(e, doc)}
                          className="p-2 rounded-lg bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-150 transition-all border border-red-200"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
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

      {/* Summary/Details Modal for Failed Documents */}
      {summaryModalOpen && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/20 transition-opacity"
              onClick={() => setSummaryModalOpen(false)}
            />
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 pb-4 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-50 border border-red-200">
                      <FileWarning className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Document Details
                      </h3>
                      <p className="text-sm text-gray-600">
                        Review document information and take action
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSummaryModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <File className="w-4 h-4" />
                      File Name
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {selectedDocument.fileName}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200">
                    <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Issue Detected
                    </p>
                    <p className="text-sm text-red-600">
                      {selectedDocument.reason}
                    </p>
                  </div>

                  {selectedDocument.patientName && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200">
                        <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient Name
                        </p>
                        <p className="text-sm text-gray-800">
                          {selectedDocument.patientName}
                        </p>
                      </div>

                      {selectedDocument.claimNumber && (
                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200">
                          <p className="text-sm font-medium text-indigo-700 mb-2 flex items-center gap-2">
                            <FileDigit className="w-4 h-4" />
                            Claim Number
                          </p>
                          <p className="text-sm text-gray-800">
                            {selectedDocument.claimNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedDocument.summary ||
                    selectedDocument.documentText) && (
                    <div className="p-4 bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-200">
                      <p className="text-sm font-medium text-cyan-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Document Content
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedDocument.documentText ||
                          selectedDocument.documentText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                {selectedDocument.gcsFileLink && (
                  <button
                    type="button"
                    onClick={(e) => handlePreviewFile(e, selectedDocument)}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <FileText className="w-4 h-4" />
                    Preview Document
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSummaryModalOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
                >
                  <X className="w-4 h-4" />
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
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-gradient-to-br from-red-50 to-white px-6 pb-4 pt-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-50 sm:mx-0 sm:h-14 sm:w-14">
                    <Trash2 className="h-7 w-7 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-bold leading-6 text-gray-900">
                      Delete Document
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This action cannot be undone. The document will be permanently removed.
                      </p>
                      <div className="mt-3 p-3 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900">
                          {documentToDelete.fileName}
                        </p>
                        {documentToDelete.patientName && (
                          <p className="text-sm text-gray-500 mt-1">
                            Patient: {documentToDelete.patientName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={openAssignTaskId !== null}
        task={tasks.find(t => t.id === openAssignTaskId) || null}
        onClose={() => setOpenAssignTaskId(null)}
        onAssign={async (taskId: string, assignee: string) => {
          await onAssigneeClick(taskId, assignee);
          setOpenAssignTaskId(null);
        }}
      />

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={openQuickNoteId !== null}
        task={tasks.find(t => t.id === openQuickNoteId) || null}
        onClose={() => setOpenQuickNoteId(null)}
        onSave={onSaveQuickNote ? async (taskId: string, quickNotes: any, status?: string) => {
          await onSaveQuickNote(taskId, quickNotes, status);
          setOpenQuickNoteId(null);
        } : undefined}
        onAssignTask={async (taskId: string, assignee: string) => {
          await onAssigneeClick(taskId, assignee);
        }}
      />
    </section>
  );
}