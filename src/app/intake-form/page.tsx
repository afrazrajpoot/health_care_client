"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const SPECIALISTS = [
  "Orthopedics",
  "Pain Management",
  "Psychology",
  "Neurosurgery",
  "Physical Therapy",
  "Chiropractic",
  "Acupuncture",
  "Neurology",
  "Rheumatology",
  "Diagnostics (MRI/CT/X-ray/Labs)",
  "Other",
];

const ADLS = [
  "Dressing",
  "Bathing",
  "Standing",
  "Walking",
  "Reaching",
  "Lifting",
  "Driving",
  "Housework",
  "Sleeping",
  "Typing/Computer",
];

const RATINGS = ["Much Better", "Slightly Better", "No Change"];

const TRANSLATIONS = {
  en: {
    title: "Patient Intake",
    sub: "Please complete before your visit. 1–2 minutes.",
    q1: "Any new appointments since your last visit?",
    q1a: "Select specialist",
    q1b: "Appointment date",
    q2: "Do you need a medication refill?",
    q2a: "Pain before medication (0–10)",
    q2b: "Pain after medication (0–10)",
    q3: "Since last visit, daily activities are:",
    q3hint: "Select all that apply",
    q4: "Therapies you are receiving (tap to rate effect)",
    q5: "Review",
    submitHint:
      "After you submit, your care team will review this with your doctor.",
    auth_title: "Patient Authentication",
    auth_name: "Full Name",
    auth_dob: "Date of Birth",
    auth_submit: "Authenticate",
    auth_error: "Invalid name or DOB. Please try again.",
  },
  es: {
    title: "Ingreso del Paciente",
    sub: "Complete antes de su cita. 1–2 minutos.",
    q1: "¿Tuvo citas nuevas desde su última visita?",
    q1a: "Seleccione especialista",
    q1b: "Fecha de la cita",
    q2: "¿Necesita renovar algún medicamento?",
    q2a: "Dolor antes del medicamento (0–10)",
    q2b: "Dolor después del medicamento (0–10)",
    q3: "Desde la última visita, sus actividades diarias están:",
    q3hint: "Seleccione todas las que correspondan",
    q4: "Terapias que recibe (toque para calificar el efecto)",
    q5: "Revisión",
    submitHint: "Después de enviar, su equipo revisará esto con su médico.",
    auth_title: "Autenticación del Paciente",
    auth_name: "Nombre Completo",
    auth_dob: "Fecha de Nacimiento",
    auth_submit: "Autenticar",
    auth_error: "Nombre o fecha de nacimiento inválidos. Intente de nuevo.",
  },
};

interface Appointment {
  type: string;
  date: string;
}

interface TherapyRating {
  therapy: string;
  effect: string;
}

interface FormData {
  newAppointments: Appointment[];
  refill: {
    needed: boolean;
    before: string;
    after: string;
  };
  adl: {
    state: string;
    list: string[];
  };
  therapies: TherapyRating[];
}

interface PatientData {
  patientName: string;
  dateOfBirth: string;
  bodyParts: string;
  language: string;
  requireAuth: string;
}

export default function PatientIntake() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientIntakeContent />
    </Suspense>
  );
}

function PatientIntakeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Authentication state
  const [showAuth, setShowAuth] = useState(true);
  const [authName, setAuthName] = useState("");
  const [authDob, setAuthDob] = useState("");
  const [authError, setAuthError] = useState("");
  const [expectedPatientData, setExpectedPatientData] =
    useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);

  // Patient data
  const [patient, setPatient] = useState("John Doe");
  const [visit, setVisit] = useState("Follow-up");
  const [bodyAreas, setBodyAreas] = useState("Back, Neck");
  const [therapies, setTherapies] = useState(["Physical Therapy", "Massage"]);

  // Form state
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [showAppointments, setShowAppointments] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [showADL, setShowADL] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refillData, setRefillData] = useState({ before: "0", after: "0" });
  const [adlData, setAdlData] = useState({
    state: "same",
    list: [] as string[],
  });
  const [therapyRatings, setTherapyRatings] = useState<TherapyRating[]>([]);
  const [summary, setSummary] = useState("—");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      if (!token) {
        console.log("No token provided - using demo data");
        setLoading(false);
        setShowAuth(false);
        return;
      }

      try {
        const decryptResponse = await fetch("/api/decrypt-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!decryptResponse.ok) {
          throw new Error(`Decryption failed: ${decryptResponse.status}`);
        }

        const decryptData = await decryptResponse.json();

        if (!decryptData.valid) {
          throw new Error(decryptData.error || "Invalid token");
        }

        const patientData = decryptData.patientData;
        setExpectedPatientData(patientData);

        console.log("Decrypted patient data:", patientData);

        if (patientData.requireAuth === "no") {
          setPatient(patientData.patientName);
          setBodyAreas(patientData.bodyParts || "Back, Neck");
          setLanguage((patientData.language as "en" | "es") || "en");
          setShowAuth(false);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setSubmitMessage("Failed to load patient data. Please check the URL.");
        setShowAuth(false);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [token]);

  useEffect(() => {
    // Initialize therapies ratings
    setTherapyRatings(
      therapies.map((therapy) => ({ therapy, effect: "No Change" }))
    );
  }, [therapies]);

  const t = TRANSLATIONS[language];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!expectedPatientData) {
      setAuthError("No patient data available for verification.");
      return;
    }

    const expected = expectedPatientData;
    const expectedDob = expected.dateOfBirth.split("T")[0];

    const normalizedAuthName = authName.trim().toLowerCase();
    const normalizedExpectedName = expected.patientName.trim().toLowerCase();

    console.log("Auth comparison:", {
      authName: normalizedAuthName,
      expectedName: normalizedExpectedName,
      authDob,
      expectedDob,
    });

    if (
      normalizedAuthName === normalizedExpectedName &&
      authDob === expectedDob
    ) {
      setPatient(expected.patientName);
      setBodyAreas(expected.bodyParts || "Back, Neck");
      setLanguage((expected.language as "en" | "es") || "en");
      setShowAuth(false);
      setAuthName("");
      setAuthDob("");
      setAuthError("");
    } else {
      setAuthError(t.auth_error);
    }
  };

  const addAppointment = () => {
    setAppointments((prev) => [...prev, { type: SPECIALISTS[0], date: "" }]);
  };

  const removeAppointment = (index: number) => {
    setAppointments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAppointment = (
    index: number,
    field: keyof Appointment,
    value: string
  ) => {
    setAppointments((prev) =>
      prev.map((appt, i) => (i === index ? { ...appt, [field]: value } : appt))
    );
  };

  const updateTherapyRating = (index: number, effect: string) => {
    setTherapyRatings((prev) =>
      prev.map((therapy, i) => (i === index ? { ...therapy, effect } : therapy))
    );
  };

  const toggleAdlItem = (item: string) => {
    setAdlData((prev) => ({
      ...prev,
      list: prev.list.includes(item)
        ? prev.list.filter((i) => i !== item)
        : [...prev.list, item],
    }));
  };

  const buildSummary = () => {
    const lines = [];
    lines.push(`Patient: ${patient}`);
    lines.push(`Visit: ${visit}`);
    lines.push(`Areas: ${bodyAreas}`);

    if (showAppointments && appointments.length > 0) {
      appointments.forEach((appt, i) => {
        lines.push(`Appointment ${i + 1}: ${appt.type} on ${appt.date || "—"}`);
      });
    }

    lines.push(`Refill needed: ${showRefill ? "Yes" : "No"}`);
    if (showRefill) {
      lines.push(
        `Pain 0–10: before ${refillData.before}, after ${refillData.after}`
      );
    }

    lines.push(`ADLs are: ${adlData.state}`);
    if (adlData.state !== "same") {
      lines.push(`ADLs impacted: ${adlData.list.join(", ") || "—"}`);
    }

    if (therapyRatings.length > 0) {
      lines.push(
        `Therapies: ${therapyRatings
          .map((x) => `${x.therapy} → ${x.effect}`)
          .join("; ")}`
      );
    }

    return lines.join("\n");
  };

  const handlePreview = () => {
    setSummary(buildSummary());
  };

  const handleSubmit = async () => {
    const formData: FormData = {
      newAppointments: showAppointments ? appointments : [],
      refill: {
        needed: showRefill,
        before: refillData.before,
        after: refillData.after,
      },
      adl: adlData,
      therapies: therapyRatings,
    };

    console.log("Intake submitted:", formData);

    try {
      const response = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientName: patient,
          dob: expectedPatientData?.dateOfBirth || undefined,
          claimNumber: (expectedPatientData as any)?.claimNumber || undefined,
          bodyAreas,
          language,
          ...formData,
        }),
      });

      if (response.ok) {
        setSubmitMessage("Submitted. Thank you!");
      } else {
        setSubmitMessage("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitMessage("Submission failed. Please try again.");
    }

    setSummary(buildSummary());
  };

  if (showAuth) {
    return (
      <div className="wrap auth-wrap">
        <div className="card auth-card">
          <div className="auth-header">
            <h1>{t.auth_title}</h1>
            <div className="inline">
              <label className="muted language-label">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "es")}
                className="language-select"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div className="section">
            <form onSubmit={handleAuthSubmit}>
              <div className="field">
                <label>{t.auth_name}</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="field">
                <label>{t.auth_dob}</label>
                <input
                  type="date"
                  value={authDob}
                  onChange={(e) => setAuthDob(e.target.value)}
                  required
                />
              </div>
              {authError && <div className="error-message">{authError}</div>}
              <button
                type="submit"
                className="btn primary"
                disabled={!authName || !authDob}
              >
                {t.auth_submit}
              </button>
            </form>
          </div>
        </div>

        <style jsx>{`
          .auth-wrap{
            display:flex;
            align-items:center;
            justify-content:center;
            min-height:70vh;
            padding:16px;
          }

          .auth-card {
            max-width: 420px;
            margin: 0;
            padding: 24px;
          }

          .auth-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .inline {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .muted {
            color: var(--muted);
            font-size: 12px;
          }

          .language-label {
            font-weight: 600;
            margin: 0;
          }

          .language-select {
            min-width: 120px;
            padding: 6px 10px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 14px;
          }

          .section {
            margin: 16px 0 0;
          }

          .field {
            margin-bottom: 20px;
          }

          .field label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
          }

          .field input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 10px;
            font-size: 14px;
            box-sizing: border-box;
          }

          .error-message {
            color: #dc2626;
            font-size: 14px;
            margin: 10px 0;
            padding: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
          }

          .btn.primary {
            width: 100%;
            padding: 12px;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            margin-top: 8px;
            transition: background-color 0.12s ease;
          }

          /* make sure primary color is visible without hover */
          .btn.primary:not(:disabled) {
            background: var(--accent);
            color: #fff;
          }

          .btn.primary:hover:not(:disabled) {
            filter: brightness(0.95);
          }

          .btn.primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wrap">
        <div className="card loading-card">
          <div className="section center">
            <div className="spinner" aria-hidden="true"></div>
            <h1 style={{ marginTop: 12 }}>{t.title}</h1>
            <div className="muted">Loading patient data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="card">
        <div className="inline header">
          <div>
            <h1>{t.title}</h1>
            <div className="">{t.sub}</div>
          </div>
          <div className="inline">
            <label className="muted language-label">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "es")}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <hr className="divider" />

        <div className="inline pills">
          <span className="pill">Patient: {patient}</span>
          <span className="pill">Visit: {visit}</span>
          <span className="pill">Areas: {bodyAreas}</span>
        </div>

        {/* Section 1: New appointments */}
        <div className="section">
          <label>{t.q1}</label>
          <select
            value={showAppointments ? "yes" : "no"}
            onChange={(e) => {
              const value = e.target.value === "yes";
              setShowAppointments(value);
              if (value && appointments.length === 0) {
                addAppointment();
              }
            }}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          {showAppointments && (
            <div className="appointments-detail">
              <div className="appointments-wrap">
                {appointments.map((appt, index) => (
                  <div key={index} className="appointment-row">
                    <div className="appointment-field">
                      <label>{t.q1a}</label>
                      <select
                        value={appt.type}
                        onChange={(e) =>
                          updateAppointment(index, "type", e.target.value)
                        }
                      >
                        {SPECIALISTS.map((specialist) => (
                          <option key={specialist} value={specialist}>
                            {specialist}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="appointment-field">
                      <label>{t.q1b}</label>
                      <input
                        type="date"
                        value={appt.date}
                        onChange={(e) =>
                          updateAppointment(index, "date", e.target.value)
                        }
                      />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        className="btn light remove-btn"
                        onClick={() => removeAppointment(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="inline">
                <button
                  type="button"
                  className="btn light"
                  onClick={addAppointment}
                >
                  + Add appointment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Medications */}
        <div className="section">
          <label>{t.q2}</label>
          <select
            value={showRefill ? "yes" : "no"}
            onChange={(e) => setShowRefill(e.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          {showRefill && (
            <div className="refill-detail">
              <div className="row">
                <div>
                  <label>{t.q2a}</label>
                  <select
                    value={refillData.before}
                    onChange={(e) =>
                      setRefillData((prev) => ({
                        ...prev,
                        before: e.target.value,
                      }))
                    }
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{t.q2b}</label>
                  <select
                    value={refillData.after}
                    onChange={(e) =>
                      setRefillData((prev) => ({
                        ...prev,
                        after: e.target.value,
                      }))
                    }
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: ADL */}
        <div className="section">
          <label>{t.q3}</label>
          <select
            value={adlData.state}
            onChange={(e) => {
              const value = e.target.value;
              setAdlData((prev) => ({ ...prev, state: value }));
              setShowADL(value !== "same");
            }}
          >
            <option value="same">Same</option>
            <option value="better">Better</option>
            <option value="worse">Worse</option>
          </select>
          {showADL && (
            <div className="adl-detail">
              <div className="muted">{t.q3hint}</div>
              <div className="chkgrid">
                {ADLS.map((activity) => (
                  <label key={activity} className="inline checkbox-label">
                    <input
                      type="checkbox"
                      value={activity}
                      checked={adlData.list.includes(activity)}
                      onChange={() => toggleAdlItem(activity)}
                    />
                    <span>{activity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Therapies */}
        {therapies.length > 0 && (
          <div className="section">
            <label>{t.q4}</label>
            <div className="chkgrid">
              {therapyRatings.map((therapy, index) => (
                <div key={therapy.therapy} className="therapy-item">
                  <div className="therapy-name">{therapy.therapy}</div>
                  <select
                    value={therapy.effect}
                    onChange={(e) => updateTherapyRating(index, e.target.value)}
                  >
                    {RATINGS.map((rating) => (
                      <option key={rating} value={rating}>
                        {rating}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review & Submit */}
        <div className="section">
          <label>{t.q5}</label>
          <div className="summary">{summary}</div>
        </div>

        <div className="inline actions">
          <button type="button" className="btn light" onClick={handlePreview}>
            Preview Summary
          </button>
          <button
            type="button"
            className="bg-blue-800 text-white p-2 rounded-2xl submit-btn"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

        <div className="muted submit-hint">{submitMessage || t.submitHint}</div>
      </div>

      <style jsx>{`
        :root {
          --bg: #f7f7fb;
          --panel: #ffffff;
          --border: #e6e6ef;
          --text: #111827;
          --muted: #6b7280;
          --accent: #2563eb;
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
          max-width: 720px;
          margin: 0 auto;
          padding: 16px;
        }

        .card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .loading-card {
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:220px;
        }

        h1 {
          font-size: 20px;
          margin: 0 0 6px;
        }

        .muted {
          color: var(--muted);
          font-size: 12px;
        }

        label {
          display: block;
          margin: 10px 0 6px;
          font-weight: 600;
        }

        select,
        input[type="text"],
        input[type="date"],
        input[type="number"] {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
        }

        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .btn.primary {
          background: var(--accent);
          color: #fff;
        }

        .btn.primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn.primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn.light {
          background: #eef2ff;
          color: #1e3a8a;
          border: 1px solid #c7d2fe;
        }

        .btn.light:hover {
          background: #e0e7ff;
        }

        .submit-btn {
          min-width: 100px;
          flex: 1;
          max-width: 200px;
        }

        .pill {
          display: inline-block;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          color: #1e3a8a;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 12px;
        }

        .section {
          margin: 16px 0 0;
        }

        .inline {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .header {
          justify-content: space-between;
        }

        .language-label {
          font-weight: 600;
          margin: 0;
        }

        .language-select {
          min-width: 120px;
        }

        .divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 12px 0;
        }

        .pills {
          gap: 12px;
        }

        .appointment-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 10px;
          align-items: end;
          margin-top: 8px;
        }

        .appointment-field {
          display: flex;
          flex-direction: column;
        }

        .remove-btn {
          margin-bottom: 6px;
        }

        .chkgrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .checkbox-label {
          gap: 8px;
        }

        .therapy-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .therapy-name {
          font-weight: 600;
        }

        .summary {
          background: #f9fafb;
          border: 1px dashed var(--border);
          border-radius: 12px;
          padding: 12px;
          white-space: pre-line;
        }

        /* Simple spinner */
        .spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 4px solid rgba(0,0,0,0.08);
          border-top-color: var(--accent);
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .actions {
          justify-content: space-between;
          margin-top: 12px;
        }

        .submit-hint {
          margin-top: 8px;
        }

        .appointments-detail {
          margin-top: 8px;
        }

        .refill-detail {
          margin-top: 8px;
        }

        .adl-detail {
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
