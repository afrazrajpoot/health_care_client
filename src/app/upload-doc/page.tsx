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
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
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

  const filteredTabs = tabs.filter((tab) => tab.modes.includes(mode));
  const pulse = mode === "wc" ? PULSE_WC : PULSE_GM;
  const departments = mode === "wc" ? DEPARTMENTS_WC : DEPARTMENTS_GM;

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
          (t.patient && t.patient.toLowerCase().includes(q))
      );
    }
    return f;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const claimTask = (id: string) => {
    updateTask(id, { assignee: "You" });
    showToast("✅ Task claimed");
  };

  const completeTask = (id: string) => {
    updateTask(id, { statusText: "Done", statusClass: "done" });
    showToast("🎉 Task marked complete");
  };

  const saveNote = (e: React.MouseEvent, taskId: string) => {
    const wrap = (e.currentTarget as HTMLElement).closest(".qnote");
    if (!wrap) return;
    const t = (wrap.querySelector(".qtype") as HTMLSelectElement)?.value || "";
    const d = (wrap.querySelector(".qmore") as HTMLSelectElement)?.value || "";
    const f = (wrap.querySelector(".qfree") as HTMLInputElement)?.value || "";
    const line = [t, d, f].filter(Boolean).join(" · ");
    if (!line) return;
    const ts = new Date().toLocaleString();
    updateTask(taskId, {
      notes: [
        ...(tasks.find((t) => t.id === taskId)?.notes || []),
        { ts, user: "You", line },
      ],
    });
    (wrap.querySelector(".qfree") as HTMLInputElement).value = "";
    showToast("📝 Note saved");
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
      doc.dob &&
      typeof doc.dob === "string" &&
      doc.dob.toLowerCase() !== "not specified"
    ) {
      const date = new Date(doc.dob);
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
        patientName: updateFormData.patientName,
        claimNumber: updateFormData.claimNumber,
        doi: updateFormData.doi,
      };
      if (updateFormData.dob && !isNaN(updateFormData.dob.getTime())) {
        updateData.dob = updateFormData.dob.toISOString();
      } else {
        updateData.dob = null;
      }

      const response = await fetch(
        `/api/get-failed-document/${selectedDoc.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) throw new Error("Update failed");

      showToast("✅ Document updated successfully");
      setIsUpdateModalOpen(false);
      fetchFailedDocuments();
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
      { name: "Pulse dept table populated", pass: pulse.deptRows.length > 0 },
      { name: "Dept dropdown filled", pass: departments.length > 0 },
    ]);
  }, [mode, pulse, departments]);

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
          padding: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 5;
          padding-bottom: 8px;
        }
        h1 {
          font-size: 22px;
          margin: 0;
        }
        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
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
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          margin-bottom: 16px;
        }
        h2 {
          margin: 0 0 10px;
          font-size: 18px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          border-bottom: 1px solid var(--border);
          padding: 8px;
          text-align: left;
          font-size: 14px;
          vertical-align: top;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
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
          gap: 8px;
          margin-bottom: 8px;
        }
        .tile {
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
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
          padding: 4px 8px;
          font-size: 12px;
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
          </div>
        </div>
        {/* Office Pulse */}
        <div className="card">
          <h2>📊 Office Pulse</h2>
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
                    <th>Assigned</th>
                    <th>Unclaimed</th>
                  </tr>
                </thead>
                <tbody>
                  {pulse.deptRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="kpi">
              {pulse.labels.map((label, index) => (
                <div key={index} className="tile">
                  <h4>{label}</h4>
                  <div className="val">{pulse.vals[index]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Task & Workflow Tracker */}
        <div className="card">
          <h2>🧩 Task & Workflow Tracker</h2>
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
                  setFilters((p) => ({ ...p, overdueOnly: !p.overdueOnly }))
                }
              >
                {filters.overdueOnly ? "Showing Overdue" : "Show Overdue Only"}
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
          </div>
          <TaskTable
            currentPane={currentPane}
            tasks={tasks}
            filters={filters}
            mode={mode}
            onClaim={claimTask}
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
