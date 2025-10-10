"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const IntakePage: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [patientName, setPatientName] = useState("Unknown");
  const [dob, setDob] = useState("Unknown");
  const [doi, setDoi] = useState("Unknown");
  const [patientParts, setPatientParts] = useState<string[]>([
    "Right shoulder",
    "Lumbar",
  ]);

  const [showAuth, setShowAuth] = useState(true);
  const [authName, setAuthName] = useState("");
  const [authDob, setAuthDob] = useState("");
  const [authDoi, setAuthDoi] = useState("");
  const [authError, setAuthError] = useState("");
  const [expectedPatientData, setExpectedPatientData] = useState<any>(null);

  const i18n = {
    en: {
      title: "Kebilo — Check‑In",
      language: "Language",
      yes: "Yes",
      no: "No",
      s1_h: "Any new appointments since your last visit?",
      s1_hint: "If yes, choose the specialist and date.",
      s1_spec: "Specialist",
      s1_date: "Date",
      s2_h: "Do you need a refill?",
      s2_hint: "If yes, pick the medicine and your pain before/after.",
      med: "Medication",
      pre: "Pain before (0–10)",
      post: "Pain after (0–10)",
      s3_h: "Daily activities since last visit?",
      s3_hint: "Pick the change. If better/worse, choose which activities.",
      better: "Better",
      worse: "Worse",
      same: "No change",
      adl_list: "Activities affected",
      multi_hint: "(Tap all that apply.)",
      preview: "Preview",
      clear: "Clear",
      submit: "Submit",
      auth_title: "Patient Authentication",
      auth_name: "Full Name",
      auth_dob: "Date of Birth",
      auth_doi: "Date of Injury",
      auth_submit: "Authenticate",
      auth_error: "Invalid name, DOB, or DOI. Please try again.",
    },
    es: {
      title: "Kebilo — Chequeo rápido",
      language: "Idioma",
      yes: "Sí",
      no: "No",
      s1_h: "¿Nuevas citas desde su última visita?",
      s1_hint: "Si responde Sí, elija el especialista y la fecha.",
      s1_spec: "Especialista",
      s1_date: "Fecha",
      s2_h: "¿Necesita reposición (refill)?",
      s2_hint: "Si responde Sí, elija el medicamento y su dolor antes/después.",
      med: "Medicamento",
      pre: "Dolor antes (0–10)",
      post: "Dolor después (0–10)",
      s3_h: "¿Actividades diarias desde la última visita?",
      s3_hint: "Elija el cambio. Si mejor/peor, seleccione cuáles actividades.",
      better: "Mejor",
      worse: "Peor",
      same: "Sin cambios",
      adl_list: "Actividades afectadas",
      multi_hint: "(Toque todas las que apliquen.)",
      preview: "Vista previa",
      clear: "Limpiar",
      submit: "Enviar",
      auth_title: "Autenticación del Paciente",
      auth_name: "Nombre Completo",
      auth_dob: "Fecha de Nacimiento",
      auth_doi: "Fecha de Lesión",
      auth_submit: "Autenticar",
      auth_error:
        "Nombre, fecha de nacimiento o fecha de lesión inválidos. Intente de nuevo.",
    },
  };

  const [language, setLanguage] = useState<"en" | "es">("en");
  const [translations, setTranslations] = useState(i18n.en);

  const [showS1Detail, setShowS1Detail] = useState(false);
  const [spec, setSpec] = useState("");
  const [specDate, setSpecDate] = useState("");
  const [specDateOptions, setSpecDateOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [showS2Detail, setShowS2Detail] = useState(false);
  const [med, setMed] = useState("");
  const [prePain, setPrePain] = useState(0);
  const [postPain, setPostPain] = useState(0);

  const [adlTrend, setAdlTrend] = useState("");
  const [selectedADLs, setSelectedADLs] = useState<string[]>([]);
  const adlOptions = [
    "Dressing",
    "Driving",
    "Lifting",
    "Sleeping",
    "Standing",
    "Walking",
    "Overhead reach",
  ];

  const [previewText, setPreviewText] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [signalChips, setSignalChips] = useState<string[]>([]);
  const [rfaTextContent, setRfaTextContent] = useState("");

  useEffect(() => {
    // Fill last 30 days for specDate
    const today = new Date();
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      options.push({
        value: d.toISOString().slice(0, 10),
        label,
      });
    }
    setSpecDateOptions(options);
  }, []);

  useEffect(() => {
    setTranslations(language === "es" ? i18n.es : i18n.en);
  }, [language]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      if (!token) {
        setLoading(false);
        setShowAuth(false);
        return;
      }

      try {
        // Decrypt token to get expected patient details
        const decryptResponse = await fetch(
          "http://127.0.0.1:8000/api/proxy-decrypt",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );

        if (!decryptResponse.ok) {
          throw new Error("Decryption failed");
        }

        const decryptData = await decryptResponse.json();
        if (!decryptData.success) {
          throw new Error("Invalid token");
        }

        // Set expected patient details
        setExpectedPatientData(decryptData.data);
      } catch (error) {
        console.error("Initialization error:", error);
        setSubmitMessage("Failed to load patient data. Please check the URL.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [token]);

  useEffect(() => {
    const loadQuiz = async () => {
      if (showAuth || patientName === "Unknown") return;
      setLoading(true);
      try {
        // Load existing quiz data using patient details
        const loadResponse = await fetch(
          `/api/submit-quiz?patientName=${patientName}&dob=${dob}&doi=${doi}`
        );

        if (loadResponse.ok) {
          const quizData = await loadResponse.json();
          setLanguage(quizData.lang as "en" | "es");

          // Fix: Use consistent data structure matching collect()
          const loadedShowS1 = !!quizData.newAppt;
          setShowS1Detail(loadedShowS1);
          setSpec(quizData.newAppt?.specialist || "");
          setSpecDate(quizData.newAppt?.date || "");

          const loadedShowS2 = !!quizData.refill;
          setShowS2Detail(loadedShowS2);
          setMed(quizData.refill?.med || "");
          setPrePain(quizData.refill?.pain?.pre || 0);
          setPostPain(quizData.refill?.pain?.post || 0);

          const loadedAdlTrend = quizData.adl?.trend || "";
          setAdlTrend(loadedAdlTrend);
          const loadedSelectedADLs = quizData.adl?.activities || [];
          setSelectedADLs(loadedSelectedADLs);

          setHasExistingData(true);

          // Compute using loaded data to avoid setState async issues
          const chips: string[] = [];
          if (
            loadedShowS1 &&
            (quizData.newAppt?.specialist || quizData.newAppt?.date)
          )
            chips.push("apptYes");
          if (loadedShowS2) chips.push("refill");

          if (loadedAdlTrend === "worse" || loadedSelectedADLs.length > 3) {
            chips.push("fce");
          }

          let adlSignal: string;
          if (loadedAdlTrend === "worse") {
            adlSignal = "tpd_tight";
          } else {
            adlSignal = "cont";
          }
          chips.push(adlSignal);

          setSignalChips(chips);

          let text = "";
          if (loadedAdlTrend && loadedSelectedADLs.length > 0) {
            const adls = loadedSelectedADLs.join(", ");
            text = `Ongoing limitations in ${adls} ${
              loadedAdlTrend === "worse" ? "worsening" : ""
            }. FCE is recommended to quantify safe capacity.`;
          }
          setRfaTextContent(text);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Load quiz error:", error);
        setSubmitMessage(
          "Failed to load patient data. Please check your details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [showAuth, patientName, dob, doi]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!expectedPatientData) {
      setAuthError("No patient data available.");
      return;
    }

    const expected = expectedPatientData;
    const expectedDob = expected.dob.split("T")[0];
    const expectedDoi = expected.doi.split("T")[0];

    if (
      authName.trim().toLowerCase() ===
        expected.patientName.trim().toLowerCase() &&
      authDob === expectedDob &&
      authDoi === expectedDoi
    ) {
      // Match successful
      setPatientName(expected.patientName);
      setDob(authDob);
      setDoi(authDoi);
      setPatientParts(expected.parts || ["Right shoulder", "Lumbar"]);
      setShowAuth(false);
      setAuthName("");
      setAuthDob("");
      setAuthDoi("");
    } else {
      setAuthError(getText("auth_error"));
    }
  };

  const toggleS1Detail = (show: boolean) => {
    setShowS1Detail(show);
    if (!show) {
      setSpec("");
      setSpecDate("");
    }
  };

  const toggleS2Detail = (show: boolean) => {
    setShowS2Detail(show);
    if (!show) {
      setMed("");
      setPrePain(0);
      setPostPain(0);
    }
  };

  const handleAdlTrendChange = (value: string) => {
    setAdlTrend(value);
    if (value !== "better" && value !== "worse") {
      setSelectedADLs([]);
    }
  };

  const toggleAdl = (adl: string) => {
    setSelectedADLs((prev) =>
      prev.includes(adl) ? prev.filter((a) => a !== adl) : [...prev, adl]
    );
  };

  const collect = () => {
    const data = {
      patient: { name: patientName, parts: patientParts },
      newAppt: showS1Detail
        ? { specialist: spec || null, date: specDate || null }
        : null,
      refill: showS2Detail
        ? {
            med: med || null,
            pain: { pre: prePain, post: postPain, delta: prePain - postPain },
          }
        : null,
      adl: { trend: adlTrend || null, activities: selectedADLs },
    };
    return data;
  };

  const computeResults = () => {
    const chips: string[] = [];
    if (showS1Detail && (spec || specDate)) chips.push("apptYes");
    if (showS2Detail) chips.push("refill");

    if (adlTrend === "worse" || selectedADLs.length > 3) {
      chips.push("fce");
    }

    let adlSignal: string;
    if (adlTrend === "worse") {
      adlSignal = "tpd_tight";
    } else {
      adlSignal = "cont";
    }
    chips.push(adlSignal);

    setSignalChips(chips);

    let text = "";
    if (adlTrend && selectedADLs.length > 0) {
      const adls = selectedADLs.join(", ");
      text = `Ongoing limitations in ${adls} ${
        adlTrend === "worse" ? "worsening" : ""
      }. FCE is recommended to quantify safe capacity.`;
    }
    setRfaTextContent(text);
    setShowResults(true);
  };

  const showPreview = () => {
    const v = collect();
    const lines: string[] = [];
    if (v.newAppt && (v.newAppt.specialist || v.newAppt.date)) {
      lines.push(
        `New appointment: ${v.newAppt.specialist || ""} ${
          v.newAppt.date || ""
        }`.trim()
      );
    }
    if (v.refill && v.refill.med) {
      lines.push(
        `Refill: ${v.refill.med}; pain ${v.refill.pain.pre}→${v.refill.pain.post} (Δ ${v.refill.pain.delta})`
      );
    }
    if (v.adl.trend) {
      lines.push(
        `ADLs: ${v.adl.trend}${
          v.adl.activities.length ? ` — ${v.adl.activities.join(", ")}` : ""
        }`
      );
    }
    setPreviewText(lines.join("\n") || "(No changes reported)");
  };

  const clearAll = () => {
    toggleS1Detail(false);
    toggleS2Detail(false);
    setAdlTrend("");
    setSelectedADLs([]);
    setPreviewText("");
    setShowResults(false);
    setSignalChips([]);
    setRfaTextContent("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage("");

    const formData = {
      patientName,
      dob,
      doi,
      lang: language,
      ...collect(),
    };

    console.log("Submitted data:", formData);

    let url = "/api/submit-quiz";
    let method = "POST";

    // If existing data, use PUT to update latest
    if (hasExistingData) {
      url += `?patientName=${patientName}&dob=${dob}&doi=${doi}`;
      method = "PUT";
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage("Submission saved successfully!");
        setHasExistingData(true);
        computeResults();
      } else {
        const error = await response.json();
        setSubmitMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitMessage("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getText = (key: string) =>
    translations[key as keyof typeof translations] || key;

  const getPillClass = (chip: string): "good" | "warn" | "bad" => {
    if (chip === "ttd") return "bad";
    if (chip === "tpd_tight" || chip === "fce") return "warn";
    return "good";
  };

  if (showAuth) {
    return (
      <>
        <style jsx global>{`
          :root {
            --bg: #f7fbff;
            --panel: #ffffff;
            --text: #0b1220;
            --muted: #475569;
            --border: #d8e5f5;
            --accent: #2563eb;
            --good: #10b981;
            --warn: #f59e0b;
            --bad: #ef4444;
            --chip: #f3f4f6;
            --radius: 16px;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto,
              Helvetica, Arial;
          }
          .wrap {
            max-width: 720px;
            margin: 0 auto;
            padding: 16px;
          }
          .wrap.auth-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .auth-card {
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            width: 100%;
            max-width: 400px;
          }
          .auth-header {
            padding: 24px 32px;
            text-align: center;
            background: #f2f7ff;
            border-bottom: 1px solid var(--border);
          }
          .auth-title {
            font-size: 20px;
            font-weight: 800;
            margin: 0 0 12px 0;
          }
          .auth-lang {
            display: flex;
            gap: 8px;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
          }
          select {
            appearance: none;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 8px 10px;
            font-weight: 600;
            background: #fff;
            color: var(--text);
          }
          .auth-section {
            padding: 32px;
          }
          .field {
            display: grid;
            gap: 6px;
            margin: 16px 0;
          }
          label {
            font-size: 14px;
            color: var(--muted);
            font-weight: 600;
          }
          input {
            appearance: none;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 16px;
            background: #fff;
            color: var(--text);
          }
          input[type="date"] {
            padding: 12px;
          }
          input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
          button {
            appearance: none;
            border: none;
            border-radius: 12px;
            padding: 12px 24px;
            font-weight: 600;
            background: var(--accent);
            color: #fff;
            cursor: pointer;
            width: 100%;
            margin-top: 8px;
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .error {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 12px;
            border-radius: 8px;
            margin: 12px 0;
            font-size: 14px;
          }
          .hint {
            font-size: 12px;
            color: #64748b;
          }
        `}</style>
        <div className="wrap auth-wrap">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">{getText("auth_title")}</h1>
              <div className="auth-lang">
                <label className="hint">{getText("language")}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "es")}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            <div className="auth-section">
              <form onSubmit={handleAuthSubmit}>
                <div className="field">
                  <label htmlFor="authName">{getText("auth_name")}</label>
                  <input
                    id="authName"
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="authDob">{getText("auth_dob")}</label>
                  <input
                    id="authDob"
                    type="date"
                    value={authDob}
                    onChange={(e) => setAuthDob(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="authDoi">{getText("auth_doi")}</label>
                  <input
                    id="authDoi"
                    type="date"
                    value={authDoi}
                    onChange={(e) => setAuthDoi(e.target.value)}
                    required
                  />
                </div>
                {authError && <div className="error">{authError}</div>}
                <button
                  type="submit"
                  disabled={!authName || !authDob || !authDoi}
                >
                  {getText("auth_submit")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style jsx global>{`
          :root {
            --bg: #f7fbff;
            --panel: #ffffff;
            --text: #0b1220;
            --muted: #475569;
            --border: #d8e5f5;
            --accent: #2563eb;
            --good: #10b981;
            --warn: #f59e0b;
            --bad: #ef4444;
            --chip: #f3f4f6;
            --radius: 16px;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto,
              Helvetica, Arial;
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
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
            overflow: hidden;
          }
          .title {
            font-weight: 800;
          }
        `}</style>
        <div className="wrap">
          <div className="card">
            <div className="title">Loading patient data...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #f7fbff;
          --panel: #ffffff;
          --text: #0b1220;
          --muted: #475569;
          --border: #d8e5f5;
          --accent: #2563eb;
          --good: #10b981;
          --warn: #f59e0b;
          --bad: #ef4444;
          --chip: #f3f4f6;
          --radius: 16px;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial;
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
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          background: #f2f7ff;
          border-bottom: 1px solid var(--border);
        }
        .title {
          font-weight: 800;
        }
        .lang {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        select,
        button {
          appearance: none;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 8px 10px;
          font-weight: 600;
          background: #fff;
          color: var(--text);
        }
        button.primary {
          background: var(--accent);
          color: #fff;
          border-color: #1d4ed8;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .section {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        .section:last-child {
          border-bottom: none;
        }
        .section h3 {
          margin: 0 0 10px;
          font-size: 16px;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
        }
        .field {
          display: grid;
          gap: 6px;
          margin: 8px 0;
        }
        label {
          font-size: 14px;
          color: var(--muted);
        }
        .pill {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eef2ff;
          border: 1px solid var(--border);
          font-weight: 700;
          margin-right: 6px;
        }
        .hint {
          font-size: 12px;
          color: #64748b;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 16px;
          background: #fafcff;
          border-top: 1px solid var(--border);
        }
        .summary {
          white-space: pre-wrap;
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px;
          margin: 12px 16px;
        }
        .results {
          margin-top: 18px;
          padding: 14px;
          border-radius: 14px;
          background: #f9fafb;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .results .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 800;
        }
        .results .pill.good {
          background: rgba(16, 185, 129, 0.15);
          color: #059669;
        }
        .results .pill.warn {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }
        .results .pill.bad {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }
        .hidden {
          display: none;
        }
        .slider-wrap {
          display: grid;
          gap: 6px;
        }
        input[type="range"] {
          width: 100%;
        }
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }
        .kv {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .multi-select {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
          user-select: none;
        }
        .chip.active {
          background: #e0f2fe;
          border-color: #93c5fd;
        }
        @media (max-width: 640px) {
          .row {
            grid-template-columns: 1fr;
          }
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        button.ghost {
          background: transparent;
          color: var(--text);
        }
        .message {
          padding: 10px;
          border-radius: 8px;
          margin: 10px 0;
          font-size: 14px;
        }
        .message.success {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
      `}</style>
      <div className="wrap">
        <div
          className="card"
          role="form"
          aria-label="Kebilo Patient Mini Intake"
        >
          <div className="header">
            {/* <div className="title">
              {getText("title")} ({patientName}, DOB: {dob}, DOI: {doi})
            </div> */}
            <div>
              <span className="pill">Patient: {patientName}</span>
              {/* <span className="pill">
                Body parts: {patientParts.join(", ")}
              </span> */}
            </div>
            <div className="lang">
              <label htmlFor="langSel" className="hint">
                {getText("language")}
              </label>
              <select
                id="langSel"
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "es")}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          {/* Step 1: New appointments */}
          <div className="section" id="s1">
            <h3>{getText("s1_h")}</h3>
            <div className="row">
              <div className="kv">
                <button type="button" onClick={() => toggleS1Detail(true)}>
                  {getText("yes")}
                </button>
                <button type="button" onClick={() => toggleS1Detail(false)}>
                  {getText("no")}
                </button>
              </div>
              <div className="hint">{getText("s1_hint")}</div>
            </div>
            {showS1Detail && (
              <div id="s1_detail">
                <div className="field">
                  <label>{getText("s1_spec")}</label>
                  <select
                    id="spec"
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                  >
                    <option value="">—</option>
                    <option>Orthopedic</option>
                    <option>Pain Management</option>
                    <option>Psychiatry</option>
                    <option>Neurosurgeon</option>
                    <option>Physical Therapy</option>
                    <option>Acupuncture</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label>{getText("s1_date")}</label>
                  <select
                    id="specDate"
                    value={specDate}
                    onChange={(e) => setSpecDate(e.target.value)}
                  >
                    <option value="">—</option>
                    {specDateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Med refill + pain sliders */}
          <div className="section" id="s2">
            <h3>{getText("s2_h")}</h3>
            <div className="row">
              <div className="kv">
                <button type="button" onClick={() => toggleS2Detail(true)}>
                  {getText("yes")}
                </button>
                <button type="button" onClick={() => toggleS2Detail(false)}>
                  {getText("no")}
                </button>
              </div>
              <div className="hint">{getText("s2_hint")}</div>
            </div>
            {showS2Detail && (
              <div id="s2_detail">
                <div className="field">
                  <label>{getText("med")}</label>
                  <select
                    id="medSel"
                    value={med}
                    onChange={(e) => setMed(e.target.value)}
                  >
                    <option value="">—</option>
                    <option>Ibuprofen</option>
                    <option>Naproxen</option>
                    <option>Acetaminophen</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid">
                  <div className="field slider-wrap">
                    <label>{getText("pre")}</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={prePain}
                      onInput={(e) =>
                        setPrePain(Number((e.target as HTMLInputElement).value))
                      }
                    />
                    <div className="slider-labels">
                      <span>0</span>
                      <span>{prePain}</span>
                      <span>10</span>
                    </div>
                  </div>
                  <div className="field slider-wrap">
                    <label>{getText("post")}</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={postPain}
                      onInput={(e) =>
                        setPostPain(
                          Number((e.target as HTMLInputElement).value)
                        )
                      }
                    />
                    <div className="slider-labels">
                      <span>0</span>
                      <span>{postPain}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: ADLs minimal */}
          <div className="section" id="s3">
            <h3>{getText("s3_h")}</h3>
            <div className="row">
              <select
                id="adlTrend"
                value={adlTrend}
                onChange={(e) => handleAdlTrendChange(e.target.value)}
              >
                <option value="">—</option>
                <option value="better">{getText("better")}</option>
                <option value="worse">{getText("worse")}</option>
                <option value="same">{getText("same")}</option>
              </select>
              <div className="hint">{getText("s3_hint")}</div>
            </div>
            {(adlTrend === "better" || adlTrend === "worse") && (
              <div id="s3_detail">
                <div className="field">
                  <label>{getText("adl_list")}</label>
                  <div id="adlMulti" className="multi-select">
                    {adlOptions.map((adl) => (
                      <div
                        key={adl}
                        className={`chip ${
                          selectedADLs.includes(adl) ? "active" : ""
                        }`}
                        onClick={() => toggleAdl(adl)}
                      >
                        {adl}
                      </div>
                    ))}
                  </div>
                  <div className="hint">{getText("multi_hint")}</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <button type="button" className="ghost" onClick={showPreview}>
              {getText("preview")}
            </button>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="ghost" onClick={clearAll}>
                {getText("clear")}
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : getText("submit")}
              </button>
            </div>
          </div>
        </div>

        {previewText && <div className="summary">{previewText}</div>}

        {submitMessage && (
          <div
            className={`message ${
              submitMessage.includes("Error") ||
              submitMessage.includes("Failed")
                ? "error"
                : "success"
            }`}
          >
            {submitMessage}
          </div>
        )}

        {showResults && (
          <div className="results">
            <h3>Summary</h3>
            <div className="chips">
              {signalChips.map((chip) => (
                <span key={chip} className={`pill ${getPillClass(chip)}`}>
                  {chip === "apptYes"
                    ? "New appt reported"
                    : chip === "refill"
                    ? "Refill requested"
                    : chip === "fce"
                    ? "FCE Recommended"
                    : chip === "tpd_tight"
                    ? "Tighten restrictions"
                    : "Continue"}
                </span>
              ))}
            </div>
            {rfaTextContent && <div className="hint">{rfaTextContent}</div>}
          </div>
        )}
      </div>
    </>
  );
};

export default IntakePage;
