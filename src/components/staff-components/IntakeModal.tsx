// app/dashboard/components/IntakeModal.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSession } from "next-auth/react";
import {
  useGenerateIntakeLinkMutation,
  useGetPatientRecommendationsQuery,
} from "@/redux/dashboardApi";

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
    placeholder: "e.g., 01-01-1990",
    value: "",
    fullWidth: false,
  },
  {
    id: "lkClaimNumber",
    label: "Claim Number",
    type: "input",
    placeholder: "e.g., 123456789",
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

interface Patient {
  id?: string;
  patientName: string;
  name?: string;
  dob: string;
  claimNumber: string;
}

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient?: {
    patientName: string;
    dob: string;
    claimNumber: string;
  } | null;
}

export default function IntakeModal({
  isOpen,
  onClose,
  selectedPatient,
}: IntakeModalProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    modalFields.forEach((field) => (initial[field.id] = field.value));
    return initial;
  });

  // Pre-fill form when selectedPatient changes
  useEffect(() => {
    if (selectedPatient && isOpen) {
      const dobDate = formatDateForInput(selectedPatient.dob);
      setFormData((prev) => ({
        ...prev,
        lkPatient: selectedPatient.patientName || prev.lkPatient,
        lkDob: dobDate || prev.lkDob,
        lkClaimNumber:
          selectedPatient.claimNumber &&
            selectedPatient.claimNumber !== "Not specified"
            ? selectedPatient.claimNumber
            : prev.lkClaimNumber,
      }));
    }
  }, [selectedPatient, isOpen]);

  const [outputLink, setOutputLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const patientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [manualEntry, setManualEntry] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const originalDataRef = useRef<Record<string, string> | null>(null);

  const [generateIntakeLinkMutation] = useGenerateIntakeLinkMutation();
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const { data: recommendationsData, isFetching: isLoadingSuggestions } =
    useGetPatientRecommendationsQuery(patientSearchQuery, {
      skip: manualEntry || !patientSearchQuery.trim(),
    });

  const patientSuggestions = React.useMemo(() => {
    if (
      recommendationsData?.success &&
      recommendationsData.data.allMatchingDocuments
    ) {
      return recommendationsData.data.allMatchingDocuments.map((doc: any) => ({
        id: doc.id,
        patientName: doc.patientName,
        dob: formatDateForInput(doc.dob),
        claimNumber: doc.claimNumber || "Not specified",
      }));
    }
    return [];
  }, [recommendationsData]);

  const showSuggestions =
    patientSearchQuery.trim().length > 0 &&
    (isLoadingSuggestions || patientSuggestions.length > 0);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Trigger patient search when typing in patient name field
    if (id === "lkPatient") {
      setPatientSearchQuery(value);
    }
  };

  // Helper function to format date for input field (MM-DD-YYYY)
  function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return "";
    if (typeof date === "string") {
      const dateOnly = date.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        const [year, month, day] = dateOnly.split("-");
        return `${month}-${day}-${year}`;
      }
    }
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${month}-${day}-${year}`;
  }

  const handlePatientSelect = (patient: Patient) => {
    setFormData((prev) => ({
      ...prev,
      lkPatient: patient.patientName,
      lkDob: patient.dob,
      lkClaimNumber: (patient as any).claimNumber || prev.lkClaimNumber || "",
    }));
    setPatientSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        patientInputRef.current &&
        !patientInputRef.current.contains(event.target as Node)
      ) {
        setPatientSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const patientName = searchParams.get("patient_name");
    const dob = searchParams.get("dob");
    const claim = searchParams.get("claim");
    const visit = searchParams.get("visit");

    if (patientName || dob || claim || visit) {
      if (visit === "New Patient") setIsNewPatient(true);

      setFormData((prev) => {
        const updated = { ...prev };
        if (patientName) updated.lkPatient = decodeURIComponent(patientName);
        if (dob) {
          const formattedDob = formatDateForInput(dob);
          if (formattedDob) updated.lkDob = formattedDob;
        }
        if (claim && claim !== "Not specified" && claim !== "Not+specified") {
          updated.lkClaimNumber = decodeURIComponent(claim);
        }
        if (visit) updated.lkVisit = visit;
        return updated;
      });
    }
  }, [isOpen, searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPatientSearchQuery("");
      setCopyStatus("idle");
    }
  }, [isOpen]);

  const stringToDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return null;
    const [month, day, year] = parts;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const generateLink = async (overrideVisit?: string) => {
    setIsGenerating(true);
    try {
      const metadata = {
        patient: formData.lkPatient || "",
        dob: formData.lkDob || "",
        claim_number: formData.lkClaimNumber || "",
        visit: overrideVisit || formData.lkVisit || "",
        lang: formData.lkLang || "en",
        mode: formData.lkMode || "tele",
        body: formData.lkBody || "",
        exp: formData.lkExpire || "7",
        auth: formData.lkAuth || "yes",
        physicianId: session?.user?.id,
      };

      const { token } = await generateIntakeLinkMutation(metadata).unwrap();
      const form_url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const link = `${form_url}/intake-form?token=${encodeURIComponent(token)}`;
      setOutputLink(link);
      setCopyStatus("idle");

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Token generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    const link = outputLink || "";
    if (!link) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const emailLink = () => {
    const link = outputLink || "";
    if (!link) return;
    const exp = formData.lkExpire || "7";
    const subject = encodeURIComponent("Patient Intake Link");
    const bodyText = encodeURIComponent(`Hello,\n\nPlease complete your 1–2 minute intake before your visit:\n${link}\n\nThis link is personalized and expires in ${exp} days.\n\nThank you.`);
    window.location.href = `mailto:?subject=${subject}&body=${bodyText}`;
  };

  const previewLink = () => {
    if (outputLink) window.open(outputLink, "_blank");
  };

  const resetForm = () => {
    const fresh: Record<string, string> = {};
    modalFields.forEach((field) => (fresh[field.id] = field.value));
    setFormData(fresh);
    setOutputLink("");
    setPatientSearchQuery("");
    setIsNewPatient(false);
  };

  const handleToggleNewPatient = () => {
    const nextVal = !isNewPatient;
    setIsNewPatient(nextVal);
    setManualEntry(nextVal);

    if (nextVal) {
      // Transitioning TO New Patient: Save current data and clear for fresh entry
      originalDataRef.current = { ...formData };
      const fresh: Record<string, string> = {};
      modalFields.forEach((field) => (fresh[field.id] = field.value));
      fresh.lkVisit = "New Patient";
      setFormData(fresh);
      setOutputLink("");
      setPatientSearchQuery("");
    } else {
      // Transitioning FROM New Patient: Restore saved data
      if (originalDataRef.current) {
        setFormData(originalDataRef.current);
      }
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
        ref={modalRef}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Create Patient Intake Link</h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  position: "relative",
                  width: "36px",
                  height: "20px",
                  backgroundColor: isNewPatient ? "#33c7d8" : "#ccc",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onClick={handleToggleNewPatient}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: isNewPatient ? "18px" : "2px",
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.2s"
                  }}
                />
              </div>
              <span style={{ fontSize: "14px", color: "#666", cursor: "pointer", userSelect: "none" }} onClick={handleToggleNewPatient}>
                New Patient (Manual Entry)
              </span>
            </div>
            <button className="btn light" onClick={resetForm} style={{ fontSize: "12px" }}>Clear</button>
            <button className="btn light" onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
          {modalFields.filter(f => f.id !== "lkVisit").map((field) => (
            <label
              key={field.id}
              className="muted"
              style={{
                ...(field.fullWidth ? { gridColumn: "1 / -1" } : {}),
                ...(field.id === "lkPatient" ? { position: "relative" } : {}),
              }}
            >
              {field.label}
              {field.type === "input" ? (
                <>
                  {field.id === "lkDob" ? (
                    <DatePicker
                      selected={stringToDate(formData[field.id])}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          handleChange(field.id, `${month}-${day}-${year}`);
                        } else {
                          handleChange(field.id, "");
                        }
                      }}
                      dateFormat="MM-dd-yyyy"
                      placeholderText={field.placeholder}
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      maxDate={new Date()}
                      className="w-full"
                      wrapperClassName="w-full"
                      customInput={<input style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "8px" }} />}
                    />
                  ) : (
                    <input
                      ref={field.id === "lkPatient" ? patientInputRef : undefined}
                      id={field.id}
                      type="text"
                      value={formData[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      onFocus={() => {
                        if (!manualEntry && field.id === "lkPatient" && formData[field.id] && patientSuggestions.length > 0) {
                          setPatientSearchQuery(formData[field.id]);
                        }
                      }}
                      placeholder={field.placeholder}
                      style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "8px" }}
                    />
                  )}
                  {field.id === "lkPatient" && !manualEntry && showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      style={{
                        position: "absolute", top: "100%", left: "0", right: "0", background: "#fff", border: "1px solid var(--border)",
                        borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: "200px", overflowY: "auto", zIndex: "1000", marginTop: "4px"
                      }}
                    >
                      {isLoadingSuggestions ? (
                        <div style={{ padding: "12px", textAlign: "center", color: "#666", fontSize: "14px" }}>Loading...</div>
                      ) : (
                        patientSuggestions.map((p: any, idx: number) => (
                          <div
                            key={p.id || idx}
                            onClick={() => handlePatientSelect(p)}
                            style={{ padding: "12px", cursor: "pointer", borderBottom: idx < patientSuggestions.length - 1 ? "1px solid #eee" : "none", fontSize: "14px" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <div style={{ fontWeight: "500", marginBottom: "4px" }}>{p.patientName}</div>
                            <div style={{ color: "#666", fontSize: "12px" }}>DOB: {p.dob} | Claim: {p.claimNumber}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                <select id={field.id} value={formData[field.id]} onChange={(e) => handleChange(field.id, e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  {field.options?.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              )}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "6px" }}>
          <button
            className="btn teal px-4 py-2"
            style={{ backgroundColor: "#0d9488", color: "#fff", fontWeight: "600", borderRadius: "8px", border: "none" }}
            onClick={() => generateLink()}
            disabled={isGenerating || !formData.lkPatient || !formData.lkDob}
          >
            {isGenerating ? "Generating..." : (isNewPatient ? "Generate New Patient Link" : "Generate Link")}
          </button>
          <input readOnly value={outputLink} placeholder="Generated link will appear here" style={{ flex: 1, padding: "8px", border: "1px solid var(--border)", borderRadius: "8px" }} />
          <button className="btn light" onClick={copyLink} disabled={!outputLink}>{copyStatus === "copied" ? "Copied!" : "Copy"}</button>
          <button className="btn light" onClick={emailLink} disabled={!outputLink}>Email</button>
          <button className="btn light" onClick={previewLink} disabled={!outputLink}>Preview</button>
        </div>
      </div>
    </div>
  );
}
