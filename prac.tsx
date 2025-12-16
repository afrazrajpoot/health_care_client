// app/dashboard/components/IntakeModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

interface RecommendationsResponse {
  success: boolean;
  data: {
    patientNames?: string[];
    allMatchingDocuments?: Array<{
      id: string;
      patientName: string;
      claimNumber: string | null;
      dob: Date | string | null;
      doi: Date | string | null;
    }>;
    totalCount?: number;
  };
}

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntakeModal({ isOpen, onClose }: IntakeModalProps) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    modalFields.forEach((field) => (initial[field.id] = field.value));
    return initial;
  });
  const [outputLink, setOutputLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const patientInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Trigger patient search when typing in patient name field
    if (id === "lkPatient") {
      debouncedFetchPatients(value);
    }
  };

  // Debounce function to avoid too many API calls
  const debounce = <T extends (...args: never[]) => void>(
    func: T,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch patient recommendations from API
  const fetchPatientRecommendations = async (query: string) => {
    if (!query.trim()) {
      setPatientSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const response = await fetch(
        `/api/dashboard/recommendation?patientName=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch patient recommendations");
      }

      const data: RecommendationsResponse = await response.json();

      if (data.success && data.data.allMatchingDocuments) {
        const patients: Patient[] = data.data.allMatchingDocuments.map(
          (doc) => ({
            id: doc.id,
            patientName: doc.patientName,
            dob: formatDateForInput(doc.dob),
            claimNumber: doc.claimNumber || "Not specified",
          })
        );
        setPatientSuggestions(patients);
        setShowSuggestions(true);
      } else {
        setPatientSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err: unknown) {
      console.error("Error fetching patient recommendations:", err);
      setPatientSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Debounced version of fetchPatientRecommendations
  const debouncedFetchPatients = useCallback(
    debounce((query: string) => {
      fetchPatientRecommendations(query);
    }, 300),
    []
  );

  // Handle patient selection from suggestions
  const handlePatientSelect = (patient: Patient) => {
    setFormData((prev) => ({
      ...prev,
      lkPatient: patient.patientName,
      lkDob: patient.dob,
      lkClaimNumber: (patient as any).claimNumber || prev.lkClaimNumber || "",
    }));
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        patientInputRef.current &&
        !patientInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Populate form fields from URL parameters when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const patientName = searchParams.get("patient_name");
    const dob = searchParams.get("dob");
    const claim = searchParams.get("claim");

    if (patientName || dob || claim) {
      setFormData((prev) => {
        const updated = { ...prev };

        if (patientName) {
          updated.lkPatient = decodeURIComponent(patientName);
        }

        if (dob) {
          try {
            // Extract date part and validate format
            const dateStr = dob.split("T")[0];
            // Optional: validate it's a proper YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              updated.lkDob = dateStr;
            }
          } catch (e) {
            console.error("Error parsing date from URL:", e);
          }
        }

        if (claim && claim !== "Not specified" && claim !== "Not+specified") {
          updated.lkClaimNumber = decodeURIComponent(claim);
        }

        return updated;
      });
    }
  }, [isOpen, searchParams]);

  // Close modal when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset suggestions and copy status when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setPatientSuggestions([]);
      setShowSuggestions(false);
      setCopyStatus("idle");
    }
  }, [isOpen]);

  // Convert YYYY-MM-DD string to Date object (for DatePicker only)
  const stringToDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return null;
    // Create date at noon local time to avoid timezone rollover issues
    // This ensures the date displays correctly in all timezones
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const generateLink = async () => {
    console.log("Generating link...");

    setIsGenerating(true);
    try {
      const metadata = {
        patient: formData.lkPatient || "",
        dob: formData.lkDob || "",
        claim_number: formData.lkClaimNumber || "",
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
      const form_url = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
      const link = `${form_url}/intake-form?token=${encodeURIComponent(token)}`;
      setOutputLink(link);
      setCopyStatus("idle"); // Reset copy status when new link is generated

      // Auto-copy the link when generated
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(link);
          setCopyStatus("copied");
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = link;
          textArea.style.position = "absolute";
          textArea.style.left = "-999999px";
          document.body.prepend(textArea);
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
          setCopyStatus("copied");
        }
        setTimeout(() => setCopyStatus("idle"), 2000);
      } catch (clipboardError) {
        console.log(
          "Auto-copy failed, user can copy manually:",
          clipboardError
        );
      }
    } catch (error) {
      console.error("Token generation error:", error);
      // toast error if needed
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    const link = outputLink || ""; // Fallback to empty if no link
    if (!link) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        setCopyStatus("copied");
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        setCopyStatus("copied");
      }

      // Reset copy status after 2 seconds
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
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
                          // Use local time methods since DatePicker works in local time
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          handleChange(field.id, `${year}-${month}-${day}`);
                        } else {
                          handleChange(field.id, "");
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      placeholderText={field.placeholder}
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      maxDate={new Date()}
                      className="w-full"
                      wrapperClassName="w-full"
                      customInput={
                        <input
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                      }
                    />
                  ) : (
                    <input
                      ref={
                        field.id === "lkPatient" ? patientInputRef : undefined
                      }
                      id={field.id}
                      type="text"
                      value={formData[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      onFocus={() => {
                        if (
                          field.id === "lkPatient" &&
                          formData[field.id] &&
                          patientSuggestions.length > 0
                        ) {
                          setShowSuggestions(true);
                        }
                      }}
                      placeholder={field.placeholder}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                  {/* Patient suggestions dropdown */}
                  {field.id === "lkPatient" && showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        right: "0",
                        background: "#fff",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: "1000",
                        marginTop: "4px",
                      }}
                    >
                      {isLoadingSuggestions ? (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          Loading...
                        </div>
                      ) : patientSuggestions.length > 0 ? (
                        patientSuggestions.map((patient, index) => (
                          <div
                            key={patient.id || index}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePatientSelect(patient);
                            }}
                            style={{
                              padding: "12px",
                              cursor: "pointer",
                              borderBottom:
                                index < patientSuggestions.length - 1
                                  ? "1px solid #eee"
                                  : "none",
                              fontSize: "14px",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.backgroundColor = "#f5f5f5";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.backgroundColor = "transparent";
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "500",
                                marginBottom: "4px",
                                pointerEvents: "none",
                              }}
                            >
                              {patient.patientName}
                            </div>
                            <div
                              style={{
                                color: "#666",
                                fontSize: "12px",
                                pointerEvents: "none",
                              }}
                            >
                              DOB: {patient.dob || "Not specified"} | Claim:{" "}
                              {patient.claimNumber}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          No patients found
                        </div>
                      )}
                    </div>
                  )}
                </>
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
            className="btn bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700"
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
            style={{
              backgroundColor:
                copyStatus === "copied"
                  ? "#22c55e"
                  : copyStatus === "error"
                  ? "#ef4444"
                  : "",
              color:
                copyStatus === "copied" || copyStatus === "error"
                  ? "white"
                  : "",
              transition: "all 0.2s ease",
            }}
          >
            {copyStatus === "copied"
              ? "Copied!"
              : copyStatus === "error"
              ? "Error"
              : "Copy"}
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
