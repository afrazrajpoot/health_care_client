"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dashboardData = {
  title: "🧭 Kebilo Staff Dashboard — Mission Control v4",
  staffActivity: [
    {
      name: "Marc (RFA)",
      open: 6,
      overdue: 1,
      completed: 4,
      load: "🟡 Moderate",
    },
    {
      name: "Monica (Manager)",
      open: 4,
      overdue: 0,
      completed: 5,
      load: "🟢 Normal",
    },
    { name: "Maria (MA)", open: 7, overdue: 3, completed: 3, load: "🔴 High" },
    {
      name: "Dr. Calhoun",
      open: 2,
      overdue: 0,
      completed: 3,
      load: "🟢 Light",
    },
  ],
  heatmap: ["low", "low", "med", "high", "med", "low", "low"],
  recentActivities: [
    "✅ IMR appeal submitted by Marc",
    "📠 Written P2P request logged — forwarded to physician",
    "📎 FCE report uploaded — physician review task created",
    "📄 MRI authorization approved — scheduling task created for Maria",
  ],
  kpis: [
    { label: "New Patients (Month)", value: "22" },
    { label: "New Attorneys Added (Week)", value: "3" },
    { label: "Verified Attorneys (Total)", value: "48" },
    { label: "Active RFAs Monitored", value: "7" },
    { label: "FCEs Completed (7d)", value: "5" },
    { label: "Outside Consults Pending", value: "4" },
  ],
  filters: [
    "All",
    "Assigned to me",
    "Scheduling",
    "RFA/IMR",
    "P2P (Written)",
    "Physician Reviews",
    "Compliance",
  ],
  tasks: [
    {
      task: "Chart Prep & Insurance Verification (New Patient)",
      assigned: "MA",
      status: "Pending",
      due: "Today",
      patient: "Garcia, A",
      trigger: "New intake submitted",
      notes: "Confirm coverage & prep chart for DFR",
    },
    {
      task: "Verify & Add New Attorney Contact",
      assigned: "Monica",
      status: "Pending",
      due: "Oct 10",
      patient: "—",
      trigger: "Detected: Smith Law Group",
      notes: "Validate firm & add to verified list",
    },
    {
      task: "Monitor 5‑Day Rule — PT Lumbar",
      assigned: "Marc",
      status: "Pending",
      due: "Oct 11",
      patient: "Lopez, M",
      trigger: "RFA sent Oct 6",
      notes: "Escalate to IMR if no UR by Day 5",
    },
    {
      task: "Schedule MRI (Authorization)",
      assigned: "Maria",
      status: "Pending",
      due: "Oct 12",
      patient: "Reed, T",
      trigger: "Auth approved Oct 8",
      notes: "Patient prefers mornings; Open MRI Fresno",
    },
    {
      task: "Prepare IMR Packet (UR Denial: Massage)",
      assigned: "Marc",
      status: "Overdue",
      due: "Oct 7",
      patient: "Patel, K",
      trigger: "UR denial Sep 30",
      notes: "Include ADL evidence + prior PT response",
    },
    {
      task: "Verify & Forward P2P Written Request",
      assigned: "Marc",
      status: "Pending",
      due: "Oct 10",
      patient: "Lopez, M",
      trigger: "UR written clarification received",
      notes: "Forward to physician; attach request",
    },
    {
      task: "Physician Draft Written P2P Response",
      assigned: "Physician",
      status: "Awaiting MD",
      due: "Oct 11",
      patient: "Lopez, M",
      trigger: "Staff forwarded written questions",
      notes: "Respond in writing (CCR §9792.9.1)",
    },
    {
      task: "Confirm Submission of P2P Response",
      assigned: "Monica",
      status: "Pending",
      due: "Oct 12",
      patient: "Lopez, M",
      trigger: "Physician response prepared",
      notes: "Upload fax/email confirmation",
    },
    {
      task: "Track Missing Ortho Consult Report",
      assigned: "Maria",
      status: "Overdue",
      due: "Oct 9",
      patient: "Patel, K",
      trigger: "Consult >14 days; no report",
      notes: "Call Ortho office; request upload",
    },
    {
      task: "Physician Review — MRI Lumbar",
      assigned: "Physician",
      status: "Pending",
      due: "—",
      patient: "Reed, T",
      trigger: "Imaging uploaded Oct 12",
      notes: "Add findings to next visit summary",
    },
  ],
  inbox: [
    {
      icon: "📄",
      title: "Authorization: MRI Lumbar approved for",
      patient: "Reed, T",
      action: "Task created: Schedule MRI (Maria)",
    },
    {
      icon: "🧾",
      title: "UR Denial: Massage therapy for",
      patient: "Patel, K",
      action: "Task created: Prepare IMR Packet (Marc)",
    },
    {
      icon: "📠",
      title: "Written P2P Clarification for",
      patient: "Lopez, M",
      action:
        "Tasks created: Verify/Forward (Marc), Draft Response (Physician), Confirm Submission (Monica)",
    },
    {
      icon: "🧑‍⚕️",
      title: "New Patient Intake submitted for",
      patient: "Garcia, A",
      action: "Task created: Chart prep & insurance verification (MA)",
    },
    {
      icon: "⚖️",
      title: "New Attorney detected:",
      patient: "Smith Law Group",
      action: "Task created: Verify & add to attorney list (Monica)",
    },
    {
      icon: "📑",
      title: "Ortho Consult uploaded for",
      patient: "Johnson, P",
      action: "Task created: Physician Review",
    },
  ],
  metrics: [
    { label: "New Patients (Month)", value: "22" },
    { label: "RFAs Under 5‑Day Monitor", value: "7" },
    { label: "IMR Appeals In Flight", value: "3" },
    { label: "Outside Consults Pending", value: "4" },
    { label: "FCEs Completed (7d)", value: "5" },
    { label: "Attorneys Added (Week)", value: "3" },
  ],
};

const getPillClass = (status: string) => {
  if (status === "Pending") return "pending";
  if (status === "Overdue") return "alert";
  if (status === "Awaiting MD") return "waiting";
  return "";
};

const getHeatClass = (level: string) => level; // since classes are .low, .med, .high

const css = `
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
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
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
  }
  .header h1 {
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
  .grid {
    display: grid;
    gap: 16px;
  }
  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 6px rgba(0,0,0,.05);
  }
  h2 {
    margin: 0 0 10px;
    font-size: 18px;
  }
  h3 {
    margin: 12px 0 6px;
    font-size: 15px;
    color: var(--muted);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border-bottom: 1px solid var(--border);
    padding: 8px;
    text-align: left;
    font-size: 14px;
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
  .pill.alert {
    background: #fee2e2;
    color: #991b1b;
  }
  .list {
    max-height: 240px;
    overflow: auto;
  }
  .notice {
    background: #eff6ff;
    border-left: 4px solid var(--accent);
    padding: 10px;
    border-radius: 8px;
    color: #1e3a8a;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .kpi {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 8px;
  }
  .tile {
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px;
  }
  .tile h4 {
    margin: 0 0 4px;
    font-size: 13px;
    color: #475569;
  }
  .tile .val {
    font-size: 20px;
    font-weight: 800;
  }
  .filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 8px 0;
  }
  .filter {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: #fff;
    cursor: pointer;
    font-size: 12px;
  }
  .pulse-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
    align-items: start;
    margin-bottom: 8px;
  }
  .mini-table th, .mini-table td {
    padding: 6px 8px;
    font-size: 13px;
  }
  .heatmap {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }
  .heat {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }
  .low {
    background: #bbf7d0;
  }
  .med {
    background: #fde68a;
  }
  .high {
    background: #fca5a5;
  }
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
    box-shadow: 0 6px 16px rgba(37,99,235,0.3);
    cursor: pointer;
    transition: all .25s ease;
    z-index: 1000;
  }
  .snaplink-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(37,99,235,0.4);
  }
  .snaplink-btn::before {
    content: '⚡ ';
  }
  .snap-toast {
    position: fixed;
    top: 90px;
    left: 24px;
    background: #111827;
    color: #fff;
    padding: 10px 14px;
    border-radius: 10px;
    box-shadow: 0 6px 16px rgba(0,0,0,.35);
    font-size: 13px;
    z-index: 1001;
  }
  .snap-toast.hidden {
    display: none;
  }
  .file-panel {
    position: fixed;
    top: 200px;
    left: 24px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 1002;
    min-width: 300px;
    max-height: 300px;
    overflow-y: auto;
  }
  .file-panel h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: var(--text);
  }
  .file-list {
    list-style: none;
    padding: 0;
    margin: 0 0 8px 0;
  }
  .file-item {
    font-size: 13px;
    color: var(--text);
    padding: 2px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .submit-btn {
    background: var(--accent);
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    margin-right: 4px;
  }
  .submit-btn:hover {
    background: #1d4ed8;
  }
  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  .cancel-btn {
    background: transparent;
    color: var(--muted);
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }
  .cancel-btn:hover {
    background: #f3f4f6;
  }
  .failed-row {
    cursor: pointer;
  }
  .failed-row:hover {
    background-color: #f3f4f6;
  }
`;

export default function Dashboard() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: session } = useSession();
  const [failedDocuments, setFailedDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    claimNumber: "",
    dob: null as Date | null,
  });

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
      setToastMessage("❌ Error fetching failed documents");
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleRowClick = (doc: any) => {
    setSelectedDoc(doc);
    setFormData({
      patientName: doc.patientName || "",
      claimNumber: doc.claimNumber || "",
      dob: doc.dob ? new Date(doc.dob) : null,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "dob") {
      const dateValue = e.target.value;
      setFormData({ ...formData, dob: dateValue ? new Date(dateValue) : null });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedDoc) return;

    try {
      const updateData = { ...formData };
      if (formData.dob) {
        updateData.dob = formData.dob.toISOString();
      }

      const response = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Update failed");

      setToastMessage("✅ Document updated successfully");
      setIsModalOpen(false);
      fetchFailedDocuments(); // Refetch to update list
    } catch (error) {
      console.error("Update error:", error);
      setToastMessage("❌ Error updating document");
    }
    setTimeout(() => setToastMessage(null), 2500);
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
      } else {
        setToastMessage(
          "❌ No valid files selected. Please check file types and size (max 40MB)."
        );
        setTimeout(() => setToastMessage(null), 2500);
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
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/extract-documents?physicianId=${session?.user?.physicianId || ""
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
      setToastMessage(
        `✅ Queued ${data.task_ids?.length || 0} task(s) for processing`
      );
    } catch (error) {
      console.error("Upload error:", error);
      setToastMessage("❌ Error uploading documents");
    } finally {
      setUploading(false);
      setSelectedFiles([]);
      (document.getElementById("snapInput") as HTMLInputElement).value = "";
    }

    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    (document.getElementById("snapInput") as HTMLInputElement).value = "";
  };

  return (
    <>
      <style jsx global>
        {css}
      </style>
      <div className="wrap">
        {/* Header */}
        <div className="header">
          <h1>{dashboardData.title}</h1>
          <button className="btn primary">+ Add Manual Task</button>
        </div>

        {/* Smart Activity Window */}
        <div className="card">
          <h2>📊 Smart Activity Window — Office Pulse</h2>
          <div className="pulse-grid">
            <div>
              <table className="mini-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Open</th>
                    <th>Overdue</th>
                    <th>Completed (7d)</th>
                    <th>Load</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.staffActivity.map((staff, index) => (
                    <tr key={index}>
                      <td>{staff.name}</td>
                      <td>{staff.open}</td>
                      <td>{staff.overdue}</td>
                      <td>{staff.completed}</td>
                      <td>{staff.load}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="heatmap" title="Office workload by day (Mon–Sun)">
                {dashboardData.heatmap.map((level, index) => (
                  <div
                    key={index}
                    className={`heat ${getHeatClass(level)}`}
                  ></div>
                ))}
              </div>
            </div>
            <div
              className="list"
              style={{
                fontSize: "13px",
                color: "#1e3a8a",
                background: "#eff6ff",
                padding: "8px",
                borderRadius: "8px",
                height: "120px",
              }}
            >
              {dashboardData.recentActivities.map((activity, index) => (
                <div key={index}>
                  {activity}
                  <br />
                </div>
              ))}
            </div>
          </div>
          <div className="kpi">
            {dashboardData.kpis.map((kpi, index) => (
              <div key={index} className="tile">
                <h4>{kpi.label}</h4>
                <div className="val">{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Task & Workflow Tracker */}
        <div className="card" style={{ paddingBottom: "8px" }}>
          <h2>🧩 Task & Workflow Tracker (Action‑Required Only)</h2>
          <div className="filters">
            {dashboardData.filters.map((filter, index) => (
              <div key={index} className="filter">
                {filter}
              </div>
            ))}
          </div>
          <table>
            <thead>
              <tr>
                <th>Task (Action)</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Due</th>
                <th>Patient</th>
                <th>Trigger Event</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.tasks.map((task, index) => (
                <tr key={index}>
                  <td>{task.task}</td>
                  <td>{task.assigned}</td>
                  <td>
                    <span className={`pill ${getPillClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{task.due}</td>
                  <td>{task.patient}</td>
                  <td>{task.trigger}</td>
                  <td>{task.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Trigger Inbox */}
        <div className="card">
          <h2>📂 Document Trigger Inbox (Event Log)</h2>
          <div className="list">
            {dashboardData.inbox.map((item, index) => (
              <div key={index} className="notice">
                {item.icon} {item.title} <b>{item.patient}</b> —{" "}
                <i>{item.action}</i>
              </div>
            ))}
          </div>
        </div>

        {/* Failed & Unspecified Documents */}
        <div className="card">
          <h2>Un-proccesed Documents & Action needed</h2>
          {failedDocuments.length === 0 ? (
            <p>No failed or unspecified documents found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient Name</th>
                  <th>Claim Number</th>
                  <th>File Name</th>
                  <th>Created At</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {failedDocuments.map((doc: any, index: number) => (
                  <tr
                    key={doc.id || index}
                    className="failed-row"
                    onClick={() => handleRowClick(doc)}
                  >
                    <td>{doc.id}</td>
                    <td>{doc.patientName || "Unspecified"}</td>
                    <td>{doc.claimNumber || "UNSPECIFIED"}</td>
                    <td>{doc.fileName}</td>
                    <td>
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button>Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Operational Metrics */}
        <div className="card">
          <h2>📈 Operational Metrics</h2>
          <div className="kpi">
            {dashboardData.metrics.map((metric, index) => (
              <div key={index} className="tile">
                <h4>{metric.label}</h4>
                <div className="val">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating SnapLink Button */}
      <button
        className="snaplink-btn"
        onClick={() => document.getElementById("snapInput")?.click()}
      >
        Create SnapLink
      </button>
      <input
        type="file"
        id="snapInput"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {toastMessage && <div className="snap-toast">{toastMessage}</div>}
      {selectedFiles.length > 0 && (
        <div className="file-panel">
          <h4>Selected Files ({selectedFiles.length})</h4>
          <ul className="file-list">
            {selectedFiles.map((file, index) => (
              <li key={index} className="file-item">
                {file.name} ({formatSize(file.size)})
              </li>
            ))}
          </ul>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Submit"}
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}

      {/* Update Document Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Missing Document Info</DialogTitle>
            <DialogDescription>
              Fill in the missing details for document {selectedDoc?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patientName" className="text-right">
                Patient Name
              </Label>
              <Input
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="claimNumber" className="text-right">
                Claim Number
              </Label>
              <Input
                id="claimNumber"
                name="claimNumber"
                value={formData.claimNumber}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dob" className="text-right">
                DOB
              </Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={
                  formData.dob ? formData.dob.toISOString().split("T")[0] : ""
                }
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateSubmit}>
              Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
