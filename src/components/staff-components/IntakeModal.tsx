// app/dashboard/components/IntakeModal.tsx
"use client";

import { useState } from "react";

interface ModalField {
  id: string;
  label: string;
  type: "input" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  value: string;
  fullWidth?: boolean;
}

const modalFields: ModalField[] = [
  {
    id: "lkPatient",
    label: "Patient Name",
    type: "input",
    placeholder: "e.g., Lopez, Maria",
    value: "",
    fullWidth: false,
  },
  {
    id: "lkDob",
    label: "Date of Birth",
    type: "input",
    placeholder: "e.g., 1990-01-01",
    value: "",
    fullWidth: false,
  },
  {
    id: "lkVisit",
    label: "Visit Type",
    type: "select",
    options: [
      { value: "Follow-up", label: "Follow-up" },
      { value: "New Patient", label: "New Patient" },
    ],
    value: "Follow-up",
    fullWidth: false,
  },
  {
    id: "lkLang",
    label: "Language",
    type: "select",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Español" },
    ],
    value: "en",
    fullWidth: false,
  },
  {
    id: "lkMode",
    label: "Mode",
    type: "select",
    options: [
      { value: "tele", label: "Telemedicine" },
      { value: "office", label: "In-Office" },
    ],
    value: "tele",
    fullWidth: false,
  },
  {
    id: "lkBody",
    label: "Body Parts (comma‑separated)",
    type: "input",
    placeholder: "Right shoulder, Low back",
    value: "",
    fullWidth: true,
  },
  {
    id: "lkExpire",
    label: "Expires (days)",
    type: "select",
    options: [
      { value: "3", label: "3" },
      { value: "7", label: "7" },
      { value: "14", label: "14" },
    ],
    value: "7",
    fullWidth: false,
  },
  {
    id: "lkAuth",
    label: "Require DOB Verify",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
    value: "yes",
    fullWidth: false,
  },
];

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntakeModal({ isOpen, onClose }: IntakeModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    modalFields.forEach((field) => (initial[field.id] = field.value));
    return initial;
  });
  const [outputLink, setOutputLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const generateLink = async () => {
    setIsGenerating(true);
    try {
      const metadata = {
        patient: formData.lkPatient || "",
        dob: formData.lkDob || "",
        visit: formData.lkVisit || "",
        lang: formData.lkLang || "en",
        mode: formData.lkMode || "tele",
        body: formData.lkBody || "",
        exp: formData.lkExpire || "7",
        auth: formData.lkAuth || "yes",
      };

      const response = await fetch("/api/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Failed to generate token");
      }

      const { token } = await response.json();
      //   const link = `https://intake.kebilo.app/form?token=${encodeURIComponent(
      //     token
      //   )}`;
      const link = `http://localhost:3000/intake-form?token=${encodeURIComponent(
        token
      )}`;
      setOutputLink(link);
      navigator.clipboard.writeText(link).then(() => {
        // toast here if needed
      });
    } catch (error) {
      console.error("Token generation error:", error);
      // toast error if needed
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = () => {
    const link = outputLink || ""; // Fallback to empty if no link
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        // toast
      });
    }
  };

  const emailLink = () => {
    const link = outputLink || "";
    if (!link) return;
    const exp = formData.lkExpire || "7";
    const subject = encodeURIComponent("Patient Intake Link");
    const bodyText = encodeURIComponent(`Hello,

Please complete your 1–2 minute intake before your visit:
${link}

This link is personalized, supports English/Español, and expires in ${exp} days.

Thank you.`);
    window.location.href = `mailto:?subject=${subject}&body=${bodyText}`;
  };

  const previewLink = () => {
    const link = outputLink || "";
    if (link) {
      window.open(link, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "1200",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          maxWidth: "720px",
          width: "96%",
          padding: "16px",
          boxShadow: "0 12px 30px rgba(0,0,0,.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px" }}>
            Create Patient Intake Link
          </h3>
          <button className="btn light" onClick={onClose}>
            Close
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          {modalFields.map((field) => (
            <label
              key={field.id}
              className="muted"
              style={field.fullWidth ? { gridColumn: "1 / -1" } : {}}
            >
              {field.label}
              {field.type === "input" ? (
                <input
                  id={field.id}
                  type={field.id === "lkDob" ? "date" : "text"}
                  value={formData[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <select
                  id={field.id}
                  value={formData[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: "6px",
          }}
        >
          <button
            className="btn primary"
            onClick={generateLink}
            disabled={isGenerating || !formData.lkPatient || !formData.lkDob}
          >
            {isGenerating ? "Generating..." : "Generate Link"}
          </button>
          <input
            id="lkOutput"
            readOnly
            value={outputLink}
            placeholder="Generated link will appear here"
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          />
          <button
            className="btn light"
            onClick={copyLink}
            disabled={!outputLink}
          >
            Copy
          </button>
          <button
            className="btn light"
            onClick={emailLink}
            disabled={!outputLink}
          >
            Email
          </button>
          <button
            className="btn light"
            onClick={previewLink}
            disabled={!outputLink}
          >
            Preview
          </button>
        </div>
        <div className="muted" style={{ marginTop: "6px" }}>
          Link embeds encrypted token with patient + DOB + body parts +
          language. Patient sees bilingual, 1–2 minute intake (appointments,
          meds/refill pain 0–10, ADLs multi‑select, therapy feedback).
        </div>
      </div>
    </div>
  );
}
