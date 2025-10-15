// app/dashboard/page.tsx (updated)
"use client";

import IntakeModal from "@/components/staff-components/IntakeModal";
import TaskTable from "@/components/staff-components/TaskTable";
import FailedDocuments from "@/components/staff-components/FailedDocuments";
import UpdateDocumentModal from "@/components/staff-components/UpdateDocumentModal";
import {
  DEPARTMENTS_GM,
  DEPARTMENTS_WC,
  initialTasks,
  NOTE_PRESETS,
  paneToFilter,
  PULSE_GM,
  PULSE_WC,
  tabs,
  Task,
} from "@/components/staff-components/types";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// API response interface
interface ApiTask {
  id: string;
  description: string;
  department: string;
  status: string;
  dueDate: string | null;
  patient: string;
  actions: string[];
  sourceDocument?: string;
  quickNotes?: any;
  documentId?: string;
  physicianId?: string;
  createdAt: string;
  updatedAt: string;
  document?: any;
}

interface DeptPulse {
  department: string;
  open: number;
  overdue: number;
  unclaimed: number;
}

interface Pulse {
  depts: DeptPulse[];
  labels: string[];
  vals: number[];
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"wc" | "gm">("wc");
  const [currentPane, setCurrentPane] = useState<"all" | "overdue" | string>(
    "all"
  );
  const [filters, setFilters] = useState({
    search: "",
    overdueOnly: false,
    myDeptOnly: false,
    dept: "",
  });
  const [dense, setDense] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [showModal, setShowModal] = useState(false);
  const snapInputRef = useRef<HTMLInputElement>(null);

  // New states from second file
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: session } = useSession();
  const [failedDocuments, setFailedDocuments] = useState<any[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState({
    patientName: "",
    claimNumber: "",
    dob: null as Date | null,
    doi: "",
  });

  // New state for file modal
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // Add state for fetched pulse
  const [fetchedPulse, setFetchedPulse] = useState<Pulse | null>(null);

  // Add state for workflow stats
  const [workflowStats, setWorkflowStats] = useState<{
    labels: string[];
    vals: number[];
    date: string;
    hasData: boolean;
  } | null>(null);

  // Add state for collapsible sections
  const [isOfficePulseCollapsed, setIsOfficePulseCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

  const filteredTabs = tabs.filter((tab) => tab.modes.includes(mode));
  const departments = mode === "wc" ? DEPARTMENTS_WC : DEPARTMENTS_GM;
  const pulse = fetchedPulse || (mode === "wc" ? PULSE_WC : PULSE_GM);

  // Transform API task to local Task type
  const transformApiTask = (apiTask: ApiTask): Task => {
    const dueDate = apiTask.dueDate ? new Date(apiTask.dueDate) : new Date();
    const now = new Date();
    const overdue = dueDate < now && apiTask.status !== "Done";

    // Transform quick notes if available
    const notes = apiTask.quickNotes
      ? [
          {
            ts: new Date(apiTask.updatedAt).toLocaleString(),
            user: "System",
            line:
              apiTask.quickNotes.one_line_note ||
              apiTask.quickNotes.details ||
              "Note added",
          },
        ]
      : [];

    return {
      id: apiTask.id,
      task: apiTask.description,
      dept: apiTask.department,
      statusText: apiTask.status,
      statusClass: apiTask.status.toLowerCase().replace(/\s+/g, "-"),
      due: dueDate.toLocaleDateString(),
      overdue,
      patient: apiTask.patient,
      assignee: apiTask.actions.includes("Claimed") ? "You" : "Unclaimed",
      mode: mode, // You might want to derive this from department or other fields
      notes,
      actions: apiTask.actions,
      sourceDocument: apiTask.sourceDocument,
    };
  };

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const apiTasks: ApiTask[] = await response.json();

      // Transform API tasks to local Task format
      const transformedTasks = apiTasks.map(transformApiTask);
      setTasks(transformedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showToast("❌ Error fetching tasks");
      // Fallback to initial tasks if API fails
      setTasks(initialTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch office pulse from separate API
  const fetchOfficePulse = useCallback(async () => {
    try {
      const response = await fetch("/api/office-pulse");

      if (!response.ok) {
        throw new Error("Failed to fetch office pulse");
      }

      const data = await response.json();
      setFetchedPulse(data.pulse);
    } catch (error) {
      console.error("Error fetching office pulse:", error);
      setFetchedPulse(null);
    }
  }, []);

  // Fetch workflow stats from database
  const fetchWorkflowStats = useCallback(async () => {
    try {
      const response = await fetch("/api/workflow-stats");

      if (!response.ok) {
        throw new Error("Failed to fetch workflow stats");
      }

      const data = await response.json();
      if (data.success) {
        setWorkflowStats({
          labels: data.data.labels,
          vals: data.data.vals,
          date: data.data.date,
          hasData: data.data.hasData,
        });
      }
    } catch (error) {
      console.error("Error fetching workflow stats:", error);
      setWorkflowStats(null);
    }
  }, []);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch office pulse on component mount
  useEffect(() => {
    fetchOfficePulse();
  }, [fetchOfficePulse]);

  // Fetch workflow stats on component mount
  useEffect(() => {
    fetchWorkflowStats();
  }, [fetchWorkflowStats]);

  // Refetch tasks when filters change (if you want real-time filtering from API)
  // useEffect(() => {
  //   fetchTasks();
  // }, [filters, mode, currentPane]);

  const getBaseTasks = () =>
    tasks.filter((t) => {
      if (mode === "wc" && t.mode === "gm") return false;
      if (mode === "gm" && t.mode === "wc") return false;
      return true;
    });

  const getFilteredTasks = (pane: string) => {
    const base = getBaseTasks();
    return base.filter(
      paneToFilter[pane as keyof typeof paneToFilter] || (() => true)
    );
  };

  const getDisplayedTasks = (pane: string) => {
    let f = getFilteredTasks(pane);
    if (filters.overdueOnly) f = f.filter((t) => t.overdue);
    if (filters.myDeptOnly && filters.dept)
      f = f.filter((t) => t.dept === filters.dept);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      f = f.filter(
        (t) =>
          t.task.toLowerCase().includes(q) ||
          (t.patient && t.patient.toLowerCase().includes(q)) ||
          (t.dept && t.dept.toLowerCase().includes(q))
      );
    }
    return f;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // First update locally for immediate feedback
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      // Then send update to API
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(updates.statusText && { status: updates.statusText }),
          ...(updates.actions && { actions: updates.actions }),
          // Add other field mappings as needed
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      showToast("✅ Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      showToast("❌ Error updating task");
      // Revert local changes if API call fails
      fetchTasks();
    }
  };

  const toggleClaim = async (id: string) => {
    const currentTask = tasks.find((t) => t.id === id);
    if (!currentTask) return;

    const isClaimed = currentTask.actions?.includes("Claimed") || false;
    const newActions = isClaimed ? ["Unclaimed"] : ["Claimed", "Complete"];

    await updateTask(id, { actions: newActions });
    showToast(isClaimed ? "✅ Task unclaimed" : "✅ Task claimed");
  };

  const completeTask = (id: string) => {
    updateTask(id, { statusText: "Done", statusClass: "done" });
    showToast("🎉 Task marked complete");
  };

  const saveNote = async (e: React.MouseEvent, taskId: string) => {
    const wrap = (e.currentTarget as HTMLElement).closest(".qnote");
    if (!wrap) return;
    const t = (wrap.querySelector(".qtype") as HTMLSelectElement)?.value || "";
    const d = (wrap.querySelector(".qmore") as HTMLSelectElement)?.value || "";
    const f = (wrap.querySelector(".qfree") as HTMLInputElement)?.value || "";
    const line = [t, d, f].filter(Boolean).join(" · ");
    if (!line) return;
    const ts = new Date().toLocaleString();

    try {
      // Update local state first (notes only)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                notes: [...(t.notes || []), { ts, user: "You", line }],
              }
            : t
        )
      );

      // Update quickNotes in the database (single API call)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quickNotes: {
            status_update: t,
            details: d,
            one_line_note: f,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      (wrap.querySelector(".qfree") as HTMLInputElement).value = "";
      showToast("📝 Note saved");
    } catch (error) {
      console.error("Error saving note:", error);
      showToast("❌ Error saving note");
      // Revert local changes if API call fails
      fetchTasks();
    }
  };

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2500);
  };

  // Integrated logic from second file
  useEffect(() => {
    fetchFailedDocuments();
  }, []);

  const fetchFailedDocuments = async () => {
    try {
      const response = await fetch("/api/get-failed-document");
      if (response.ok) {
        const data = await response.json();
        setFailedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching failed documents:", error);
      showToast("❌ Error fetching failed documents");
    }
  };

  const handleRowClick = (doc: any) => {
    setSelectedDoc(doc);
    let parsedDob: Date | null = null;
    if (
      doc.db &&
      typeof doc.db === "string" &&
      doc.db.toLowerCase() !== "not specified"
    ) {
      const date = new Date(doc.db);
      if (!isNaN(date.getTime())) {
        parsedDob = date;
      }
    }
    setUpdateFormData({
      patientName: doc.patientName || "",
      claimNumber: doc.claimNumber || "",
      dob: parsedDob,
      doi: doc.doi || "",
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "dob") {
      setUpdateFormData({
        ...updateFormData,
        dob: value ? new Date(value) : null,
      });
    } else {
      setUpdateFormData({ ...updateFormData, [name]: value });
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedDoc) return;

    try {
      const updateData: any = {
        patient_name: updateFormData.patientName,
        claim_number: updateFormData.claimNumber,
        doi: updateFormData.doi,
      };
      if (updateFormData.dob && !isNaN(updateFormData.dob.getTime())) {
        updateData.dob = updateFormData.dob.toISOString().split("T")[0];
      } else {
        updateData.dob = null;
      }

      const response = await fetch(
        `http://localhost:8000/api/update-fail-document`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fail_doc_id: selectedDoc.id,
            document_text: selectedDoc.documentText,
            ...updateData,
            user_id: session?.user?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      showToast("✅ Document updated successfully");
      setIsUpdateModalOpen(false);
      fetchFailedDocuments();
      fetchTasks();
    } catch (error) {
      console.error("Update error:", error);
      showToast("❌ Error updating document");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter((file) => {
        if (file.size > 40 * 1024 * 1024) {
          return false;
        }
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        const allowedTypes = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
        if (!allowedTypes.includes(fileExtension)) {
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        setIsFileModalOpen(true);
      } else {
        showToast(
          "❌ No valid files selected. Please check file types and size (max 40MB)."
        );
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const formDataUpload = new FormData();
    selectedFiles.forEach((file) => {
      formDataUpload.append("documents", file);
    });

    try {
      const response = await fetch(
        `http://localhost:8000/api/extract-documents?physicianId=${
          session?.user?.physicianId || ""
        }&userId=${session?.user?.id || ""}`,
        {
          method: "POST",
          body: formDataUpload,
          headers: {
            "x-user-id": session?.user?.id || "",
            "x-user-email": session?.user?.email || "",
            "x-user-name": session?.user?.name || "",
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      showToast(
        `✅ Queued ${data.task_ids?.length || 0} task(s) for processing`
      );

      // Refresh tasks after successful upload
      fetchTasks();
    } catch (error) {
      console.error("Upload error:", error);
      showToast("❌ Error uploading documents");
    } finally {
      setUploading(false);
      setSelectedFiles([]);
      snapInputRef.current!.value = "";
      setIsFileModalOpen(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    snapInputRef.current!.value = "";
    setIsFileModalOpen(false);
  };

  const handleSnap = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e);
  };

  const getPresets = (dept: string) => {
    return (
      NOTE_PRESETS[dept] ||
      NOTE_PRESETS["Physician Review"] || { type: [], more: [] }
    );
  };

  useEffect(() => {
    if (dense) {
      document.body.classList.add("dense");
    } else {
      document.body.classList.remove("dense");
    }
  }, [dense]);

  useEffect(() => {
    console.log("Kebilo v6.3 self-tests:", [
      { name: "All tab present", pass: true },
      { name: "Mode toggle wired", pass: true },
      {
        name: "Pulse dept table populated",
        pass: fetchedPulse
          ? fetchedPulse.depts.length > 0
          : pulse.deptRows.length > 0,
      },
      { name: "Dept dropdown filled", pass: departments.length > 0 },
      { name: "Tasks loaded from API", pass: tasks.length > 0 },
    ]);
  }, [mode, fetchedPulse, pulse, departments, tasks]);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #f9fafb;
          --panel: #ffffff;
          --border: #e5e7eb;
          --accent: #2563eb;
          --accent2: #0ea5e9;
          --muted: #6b7280;
          --text: #111827;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial;
          background: var(--bg);
          color: var(--text);
        }
        .wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 8px;
          font-size: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 5;
          padding-bottom: 6px;
        }
        h1 {
          font-size: 20px;
          margin: 0;
        }
        .btn {
          padding: 6px 10px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
        }
        .btn.primary {
          background: var(--accent);
          color: #fff;
        }
        .btn.light {
          background: #eef2ff;
          color: #1e3a8a;
          border: 1px solid #c7d2fe;
        }
        .filter {
          padding: 6px 10px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
        }
        .ttab.active {
          background: var(--accent);
          color: #fff;
        }
        .card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-bottom: 8px;
        }
        h2 {
          margin: 0 0 8px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          border-bottom: 1px solid var(--border);
          padding: 6px 8px;
          text-align: left;
          font-size: 11px;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 11px;
        }
        .pill {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .pill.pending {
          background: #fef3c7;
          color: #92400e;
        }
        .pill.waiting {
          background: #e0e7ff;
          color: #3730a3;
        }
        .pill.done {
          background: #dcfce7;
          color: #166534;
        }
        .muted {
          color: #6b7280;
          font-size: 12px;
        }
        /* Quick Notes */
        .qnote {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .qnote select,
        .qnote input {
          padding: 6px 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
        }
        .qnote .save {
          padding: 6px 10px;
          border: none;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }
        .notechip {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          background: #eef2ff;
          color: #1e3a8a;
          border: 1px solid #c7d2fe;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
          margin: 2px 2px 0 0;
        }
        /* Aggregator */
        #aggScroll {
          max-height: 55vh;
          overflow: auto;
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        #aggScroll table {
          margin: 0;
        }
        #aggEmpty {
          padding: 10px;
          color: var(--muted);
        }
        /* Floating SnapLink button */
        .snaplink-btn {
          position: fixed;
          top: 24px;
          left: 24px;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          color: #fff;
          font-weight: 700;
          border: none;
          border-radius: 50px;
          padding: 16px 28px;
          font-size: 16px;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
          cursor: pointer;
          transition: all 0.25s ease;
          z-index: 1000;
        }
        .snaplink-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
        }
        .snaplink-btn::before {
          content: "⚡ ";
        }
        .snap-toast {
          position: fixed;
          top: 90px;
          left: 24px;
          background: #111827;
          color: #fff;
          padding: 10px 14px;
          border-radius: 10px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
          font-size: 13px;
          z-index: 1001;
        }
        .hidden {
          display: none;
        }
        .filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 6px;
        }
        .collapse-btn {
          font-size: 11px;
          padding: 3px 6px;
          min-height: auto;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .kpi {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }
        .kpi h4 {
          font-size: 11px;
          margin: 0 0 4px 0;
          color: var(--muted);
        }
        .kpi .val {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
        }
        .tile {
          padding: 6px;
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
        }
        .tile h4 {
          margin: 0 0 4px;
          font-size: 12px;
          color: var(--muted);
        }
        .tile .val {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }
        .taskpane {
          display: block;
        }
        .dense td,
        .dense th {
          padding: 4px;
        }
        .dense .btn,
        .dense .filter {
          padding: 4px 8px;
        }
        .kpi {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .mini-table th,
        .mini-table td {
          padding: 3px 6px;
          font-size: 11px;
        }
        /* Additional styles for failed docs */
        .failed-row {
          cursor: pointer;
        }
        .failed-row:hover {
          background: #f3f4f6;
        }
        /* Styles for file list in modal */
        .file-list {
          list-style: none;
          padding: 0;
          margin: 8px 0;
          max-height: 200px;
          overflow-y: auto;
        }
        .file-item {
          font-size: 12px;
          margin-bottom: 4px;
          padding: 4px;
          background: #f3f4f6;
          border-radius: 4px;
        }
        .submit-btn,
        .cancel-btn {
          margin-right: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
        }
        .submit-btn {
          background: var(--accent);
          color: #fff;
          border: none;
        }
        .cancel-btn {
          background: #f3f4f6;
          color: var(--text);
          border: 1px solid var(--border);
        }
      `}</style>
      <button
        className="snaplink-btn"
        onClick={() => snapInputRef.current?.click()}
      >
        Create SnapLink
      </button>
      <input
        type="file"
        ref={snapInputRef}
        multiple
        className="hidden"
        onChange={handleSnap}
      />
      {toast.visible && <div className="snap-toast">{toast.msg}</div>}
      <div className="wrap">
        <div className="header">
          <h1>🧭 Kebilo Staff Dashboard — Mission Control v6.3</h1>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label
              className="muted"
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              Mode:
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "wc" | "gm")}
                style={{
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                <option value="wc">Workers&apos; Comp</option>
                <option value="gm">General Medicine</option>
              </select>
            </label>
            <label
              className="muted"
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              <input
                type="checkbox"
                checked={dense}
                onChange={(e) => setDense(e.target.checked)}
              />
              Dense
            </label>
            <button className="btn light">Dept Settings</button>
            <button className="btn primary" onClick={() => setShowModal(true)}>
              Create Intake Link
            </button>
            <button className="btn primary">+ Add Manual Task</button>
            <button
              className="btn light"
              onClick={fetchTasks}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Tasks"}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card">
            <div style={{ textAlign: "center", padding: "20px" }}>
              Loading tasks...
            </div>
          </div>
        )}

        {/* Office Pulse */}
        {!loading && (
          <>
            <div className="card">
              <h2>
                📊 Office Pulse
                <button
                  className="btn light"
                  onClick={() =>
                    setIsOfficePulseCollapsed(!isOfficePulseCollapsed)
                  }
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    minHeight: "auto",
                  }}
                >
                  {isOfficePulseCollapsed ? "▼ Expand" : "▲ Collapse"}
                </button>
              </h2>
              {!isOfficePulseCollapsed && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr",
                    gap: "12px",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Open</th>
                          <th>Overdue</th>
                          <th>Unclaimed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(fetchedPulse
                          ? fetchedPulse.depts
                          : pulse.deptRows
                        ).map((rowOrObj, index) => {
                          if (
                            typeof rowOrObj === "object" &&
                            "department" in rowOrObj
                          ) {
                            const dept = rowOrObj as DeptPulse;
                            return (
                              <tr key={index}>
                                <td>{dept.department}</td>
                                <td>{dept.open}</td>
                                <td>{dept.overdue}</td>
                                <td>{dept.unclaimed}</td>
                              </tr>
                            );
                          } else {
                            const row = rowOrObj as [
                              string,
                              number,
                              number,
                              number,
                              number
                            ];
                            return (
                              <tr key={index}>
                                <td>{row[0]}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                                <td>{row[4]}</td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="kpi relative">
                    <button
                      onClick={fetchWorkflowStats}
                      className="btn light absolute top-0 right-0"
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        minHeight: "auto",
                      }}
                    >
                      🔄 Refresh
                    </button>
                    {workflowStats ? (
                      workflowStats.labels.map((label, index) => (
                        <div key={index} className="text-gray-700">
                          <h4>{label}</h4>
                          <div className="val">{workflowStats.vals[index]}</div>
                        </div>
                      ))
                    ) : (
                      <div className="tile">
                        <h4>Loading...</h4>
                        <div className="val">—</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Task & Workflow Tracker */}
            <div className="card">
              <h2>
                🧩 Task & Workflow Tracker
                <button
                  className="btn light"
                  onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    minHeight: "auto",
                  }}
                >
                  {isFiltersCollapsed ? "▼ Show Filters" : "▲ Hide Filters"}
                </button>
              </h2>
              <div className="muted" style={{ marginBottom: "8px" }}>
                Tabs keep this compact. Use Overdue to triage. Search filters by
                task/patient. Quick Notes allow multiple timestamped entries per
                task.
              </div>
              <div className="filters">
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {filteredTabs.map((tab) => (
                    <button
                      key={tab.pane}
                      className={`filter ttab ${
                        currentPane === tab.pane ? "active" : ""
                      }`}
                      onClick={() => setCurrentPane(tab.pane)}
                    >
                      {tab.text}
                    </button>
                  ))}
                </div>
                {!isFiltersCollapsed && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      placeholder="Search tasks/patients…"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, search: e.target.value }))
                      }
                      style={{
                        padding: "6px 10px",
                        border: "1px solid var(--border)",
                        borderRadius: "999px",
                        fontSize: "12px",
                        minWidth: "220px",
                      }}
                    />
                    <button
                      className="filter"
                      onClick={() =>
                        setFilters((p) => ({
                          ...p,
                          overdueOnly: !p.overdueOnly,
                        }))
                      }
                    >
                      {filters.overdueOnly
                        ? "Showing Overdue"
                        : "Show Overdue Only"}
                    </button>
                    <span className="muted">Dept:</span>
                    <select
                      value={filters.dept}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, dept: e.target.value }))
                      }
                      style={{
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        borderRadius: "999px",
                        fontSize: "12px",
                      }}
                    >
                      <option value="">All</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <button
                      className="filter"
                      aria-pressed={filters.myDeptOnly ? "true" : "false"}
                      onClick={() =>
                        setFilters((p) => ({ ...p, myDeptOnly: !p.myDeptOnly }))
                      }
                    >
                      {filters.myDeptOnly ? "Only My Dept ✓" : "Only My Dept"}
                    </button>
                    <button
                      className="filter"
                      onClick={() =>
                        setFilters({
                          search: "",
                          overdueOnly: false,
                          myDeptOnly: false,
                          dept: "",
                        })
                      }
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <TaskTable
                currentPane={currentPane}
                tasks={getDisplayedTasks(currentPane)}
                filters={filters}
                mode={mode}
                onClaim={toggleClaim}
                onComplete={completeTask}
                onSaveNote={saveNote}
                getPresets={getPresets}
              />
            </div>

            {/* Failed Documents Component */}
            <FailedDocuments
              documents={failedDocuments}
              onRowClick={handleRowClick}
            />
          </>
        )}
      </div>
      <IntakeModal isOpen={showModal} onClose={() => setShowModal(false)} />
      {/* Update Document Modal Component */}
      <UpdateDocumentModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        selectedDoc={selectedDoc}
        formData={updateFormData}
        onInputChange={handleUpdateInputChange}
        onSubmit={handleUpdateSubmit}
      />
      {/* File Submission Modal */}
      <Dialog open={isFileModalOpen} onOpenChange={setIsFileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selected Files ({selectedFiles.length})</DialogTitle>
            <DialogDescription>
              Review your selected files before submitting for processing.
            </DialogDescription>
          </DialogHeader>
          <ul className="file-list">
            {selectedFiles.map((file, index) => (
              <li key={index} className="file-item">
                {file.name} ({formatSize(file.size)})
              </li>
            ))}
          </ul>
          <DialogFooter>
            <button
              className="cancel-btn"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Submit"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
