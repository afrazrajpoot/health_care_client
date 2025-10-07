"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STR = {
  en: {
    title: "Kebilo – Hybrid Patient Card",
    secA: "A) Appointments & Pain for Refill",
    newAppt: "Any new appointments or tests since last visit?",
    apNo: "No",
    apYes: "Yes",
    apptDetails: "Add appointment/test details (type & date)",
    apptHint: "Up to 3 entries",
    apptType: "Type",
    apptDate: "Date",
    apptOther: "Other (short)",
    apptRemove: "Remove",
    apptAdd: "+ Add another",
    painRefill: "Pain level today (for medication decisions)",
    painHint: "0 = none, 10 = worst",
    secB: "B) Quick Work Status",
    workDiff: "Any difficulty working or with modified duty?",
    wdNo: "No difficulty",
    wdYes: "Yes, difficulty",
    trend: "Since last visit",
    better: "Better",
    same: "Same",
    worse: "Worse",
    workAbility: "Work ability",
    w_ok: "Can do light/moderate duties",
    w_trouble: "Tried modified, had difficulty",
    w_cannot: "Cannot work, even modified",
    barrier: "Main barrier",
    b_pain: "Pain",
    b_fatigue: "Fatigue",
    b_dizzy: "Dizziness/balance",
    b_weak: "Weakness/numbness",
    adl: "Top 2 daily activities limited",
    a_walk: "Walking",
    a_stand: "Standing",
    a_sit: "Sitting",
    a_lift: "Lifting/carrying",
    a_reach: "Reaching/overhead",
    a_conc: "Concentration",
    adlHint: "Choose up to two",
    submit: "Submit",
    reset: "Reset",
    summary: "Summary",
    chips: {
      ttd: "Suggested: TTD",
      tpd_tight: "Suggested: Tighten restrictions",
      cont: "Suggested: Continue/Loosen",
      fce: "FCE RFA Recommended",
      refill: "Pain level captured for refill workflow",
      apptYes: "New appt/test reported",
    },
    rfaLead: "Ongoing limitations in",
    rfaMid: "with",
    rfaEnd:
      "FCE is recommended to quantify safe work capacity and guide restriction options consistent with MTUS.",
  },
  es: {
    title: "Kebilo – Tarjeta Híbrida del Paciente",
    secA: "A) Citas y dolor para resurtido",
    newAppt: "¿Nuevas citas o estudios desde la última visita?",
    apNo: "No",
    apYes: "Sí",
    apptDetails: "Agregue detalles (tipo y fecha)",
    apptHint: "Hasta 3 entradas",
    apptType: "Tipo",
    apptDate: "Fecha",
    apptOther: "Otro (corto)",
    apptRemove: "Quitar",
    apptAdd: "+ Agregar otra",
    painRefill: "Nivel de dolor hoy (para decisiones de medicamentos)",
    painHint: "0 = nada, 10 = peor",
    secB: "B) Estado laboral rápido",
    workDiff: "¿Dificultad para trabajar o con trabajo modificado?",
    wdNo: "Sin dificultad",
    wdYes: "Sí, dificultad",
    trend: "Desde la última visita",
    better: "Mejor",
    same: "Igual",
    worse: "Peor",
    workAbility: "Capacidad de trabajo",
    w_ok: "Puede labores ligeras/moderadas",
    w_trouble: "Intentó modificado, tuvo dificultad",
    w_cannot: "No puede trabajar, ni modificado",
    barrier: "Obstáculo principal",
    b_pain: "Dolor",
    b_fatigue: "Fatiga",
    b_dizzy: "Mareos/equilibrio",
    b_weak: "Debilidad/entumecimiento",
    adl: "2 actividades diarias más limitadas",
    a_walk: "Caminar",
    a_stand: "De pie",
    a_sit: "Sentarse",
    a_lift: "Levantar/cargar",
    a_reach: "Alcanzar/sobre la cabeza",
    a_conc: "Concentración",
    adlHint: "Elija hasta dos",
    submit: "Enviar",
    reset: "Restablecer",
    summary: "Resumen",
    chips: {
      ttd: "Sugerido: TTD",
      tpd_tight: "Sugerido: Ajustar restricciones",
      cont: "Sugerido: Continuar/Aflojarlas",
      fce: "RFA para FCE Recomendada",
      refill: "Nivel de dolor capturado para receta",
      apptYes: "Nueva cita/estudio reportado",
    },
    rfaLead: "Limitaciones continuas en",
    rfaMid: "con",
    rfaEnd:
      "Se recomienda FCE para medir la capacidad laboral segura y orientar opciones de restricción según MTUS.",
  },
};

const apptTypes = {
  en: [
    "Orthopedics",
    "Pain Management",
    "Physical Therapy",
    "Chiropractic",
    "Acupuncture",
    "Imaging – MRI",
    "Imaging – X-ray",
    "Imaging – EMG/NCS",
    "QME",
    "Primary Care",
    "ER/Urgent Care",
    "Other",
  ],
  es: [
    "Ortopedia",
    "Manejo del dolor",
    "Terapia física",
    "Quiropráctico",
    "Acupuntura",
    "Imágenes – IRM",
    "Imágenes – Rayos X",
    "Imágenes – EMG/NCS",
    "QME",
    "Atención primaria",
    "Emergencias/Urgencias",
    "Otro",
  ],
};

const adlMap = {
  walking: "walk",
  standing: "stand",
  sitting: "sit",
  lifting: "lift",
  reaching: "reach",
  concentration: "conc",
} as const;

export default function Page() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [patientName, setPatientName] = useState("Unknown");
  const [dob, setDob] = useState("Unknown");
  const [doi, setDoi] = useState("Unknown");

  const [lang, setLang] = useState<"en" | "es">("en");
  const [newAppt, setNewAppt] = useState("no");
  const [appts, setAppts] = useState<
    Array<{ type: string; date: string; other: string }>
  >([]);
  const [pain, setPain] = useState(5);
  const [workDiff, setWorkDiff] = useState("no");
  const [trend, setTrend] = useState("same");
  const [workAbility, setWorkAbility] = useState("trouble");
  const [barrier, setBarrier] = useState("pain");
  const [adl, setAdl] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [signalChips, setSignalChips] = useState<string[]>([]);
  const [rfaTextContent, setRfaTextContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    document.title = STR[lang].title;
  }, [lang]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Step 1: Decrypt token to get patient details
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

        // Set patient details from decrypted data
        setPatientName(decryptData.data.patientName);
        setDob(decryptData.data.dob); // Assuming ISO string, e.g., "2023-01-01"
        setDoi(decryptData.data.doi);

        // Step 2: Load existing quiz data using decrypted patient details
        const loadResponse = await fetch(
          `/api/submit-quiz?patientName=${decryptData.data.patientName}&dob=${decryptData.data.dob}&doi=${decryptData.data.doi}`
        );

        if (loadResponse.ok) {
          const quizData = await loadResponse.json();
          setLang(quizData.lang as "en" | "es");
          setNewAppt(quizData.newAppt);
          setAppts(quizData.appts || []);
          setPain(quizData.pain);
          setWorkDiff(quizData.workDiff);
          setTrend(quizData.trend);
          setWorkAbility(quizData.workAbility);
          setBarrier(quizData.barrier);
          setAdl(Array.isArray(quizData.adl) ? quizData.adl : []);
          setHasExistingData(true);
          // Compute results after loading
          computeResults();
        }
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
    if (newAppt === "yes" && appts.length === 0) {
      setAppts([{ type: apptTypes[lang][0], date: "", other: "" }]);
    } else if (newAppt === "no") {
      setAppts([]);
    }
  }, [newAppt, lang]);

  useEffect(() => {
    if (workDiff === "no") {
      setTrend("same");
      setWorkAbility("trouble");
      setBarrier("pain");
      setAdl([]);
    }
  }, [workDiff]);

  const computeResults = () => {
    const chips: string[] = [];
    if (newAppt === "yes") chips.push("apptYes");
    chips.push("refill");

    if (workDiff === "yes") {
      if (workAbility === "cannot") {
        chips.push("ttd");
      } else if (workAbility === "trouble") {
        chips.push("tpd_tight");
      } else {
        chips.push("cont");
      }
      if (trend === "worse") {
        chips.push("tpd_tight");
      }
      if (adl.length >= 2 || barrier === "dizzy" || barrier === "weak") {
        chips.push("fce");
      }
    } else {
      chips.push("cont");
    }

    setSignalChips(chips);

    let text = "";
    if (workDiff === "yes") {
      const adls = adl
        .map((v) => STR[lang][`a_${adlMap[v as keyof typeof adlMap]}`])
        .join(", ");
      let midPart = "";
      if (adl.length > 0) {
        midPart = `${adls} ${STR[lang].rfaMid} `;
      }
      text = `${STR[lang].rfaLead} ${midPart}${STR[lang][`b_${barrier}`]} ${
        STR[lang].rfaEnd
      }`;
    }
    setRfaTextContent(text);
    setShowResults(true);
  };

  const handleAdlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAdl((prev) => {
      if (prev.includes(val)) {
        return prev.filter((v) => v !== val);
      } else if (prev.length < 2) {
        return [...prev, val];
      }
      return prev;
    });
  };

  const addAppt = () => {
    if (appts.length < 3) {
      setAppts((prev) => [
        ...prev,
        { type: apptTypes[lang][0], date: "", other: "" },
      ]);
    }
  };

  const removeAppt = (index: number) => {
    setAppts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAppt = (
    index: number,
    field: "type" | "date" | "other",
    value: string
  ) => {
    setAppts((prev) =>
      prev.map((appt, i) => (i === index ? { ...appt, [field]: value } : appt))
    );
  };

  const toggleLang = (l: "en" | "es") => {
    setLang(l);
  };

  const getPillClass = (chip: string): "good" | "warn" | "bad" => {
    if (chip === "ttd") return "bad";
    if (chip === "tpd_tight" || chip === "fce") return "warn";
    return "good";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage("");

    const formData = {
      patientName,
      dob,
      doi,
      lang,
      newAppt,
      appts,
      pain,
      workDiff,
      trend,
      workAbility,
      barrier,
      adl,
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

  const handleReset = () => {
    setNewAppt("no");
    setAppts([]);
    setPain(5);
    setWorkDiff("no");
    setTrend("same");
    setWorkAbility("trouble");
    setBarrier("pain");
    setAdl([]);
    setShowResults(false);
    setSignalChips([]);
    setRfaTextContent("");
    setSubmitMessage("");
  };

  if (loading) {
    return (
      <div className="card">
        <div className="title">Loading patient data...</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #f8fafc;
          --card: #ffffff;
          --muted: #6b7280;
          --text: #111827;
          --accent: #3b82f6;
          --good: #10b981;
          --warn: #f59e0b;
          --bad: #ef4444;
          --chip: #f3f4f6;
          --radius: 16px;
        }

        .card {
          background: radial-gradient(
              1200px 600px at 10% -10%,
              rgba(59, 130, 246, 0.06),
              transparent
            ),
            var(--card);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: var(--radius);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 20px clamp(16px, 3vw, 28px);
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
        }
        .title {
          font-weight: 800;
          letter-spacing: 0.2px;
          font-size: clamp(18px, 2.6vw, 22px);
        }
        .lang {
          display: inline-flex;
          background: #f1f5f9;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .lang button {
          all: unset;
          padding: 8px 14px;
          cursor: pointer;
        }
        .lang button.active {
          background: var(--accent);
          color: #ffffff;
          font-weight: 800;
        }
        h2 {
          margin: 18px 0 8px;
          font-size: 15px;
          color: #374151;
        }
        .row {
          margin: 12px 0;
        }
        .label {
          display: block;
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
        }
        .section {
          padding: 14px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .options {
          display: grid;
          gap: 8px;
        }
        .opt {
          display: grid;
          grid-template-columns: 20px 1fr;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: #ffffff;
        }
        .opt.good {
          border-color: rgba(16, 185, 129, 0.35);
        }
        .opt.warn {
          border-color: rgba(245, 158, 11, 0.35);
        }
        .opt.bad {
          border-color: rgba(239, 68, 68, 0.4);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          background: #f9fafb;
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 13px;
        }
        input[type="range"] {
          width: 100%;
          accent-color: var(--accent);
        }
        .scale {
          display: grid;
          grid-template-columns: repeat(11, 1fr);
          gap: 0;
          margin-top: 6px;
          color: #6b7280;
          font-size: 12px;
          opacity: 0.9;
        }
        .scale span {
          text-align: center;
        }
        .valDisplay {
          margin-top: 4px;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          text-align: center;
        }
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .btn {
          all: unset;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 800;
          background: var(--accent);
          color: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn.secondary {
          background: #f1f5f9;
          color: var(--text);
        }
        .results {
          margin-top: 18px;
          padding: 14px;
          border-radius: 14px;
          background: #f9fafb;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 800;
        }
        .pill.good {
          background: rgba(16, 185, 129, 0.15);
          color: #059669;
        }
        .pill.warn {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }
        .pill.bad {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
        }
        .hint {
          color: var(--muted);
          font-size: 12px;
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
        [hidden] {
          display: none !important;
        }

        /* Appointment rows */
        .appt-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 10px;
          align-items: end;
          margin-bottom: 8px;
        }
        select,
        input[type="date"],
        input[type="text"] {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #ffffff;
          color: var(--text);
        }
        .btn.ghost {
          background: transparent;
          border: 1px dashed rgba(0, 0, 0, 0.25);
          color: var(--text);
        }
        @media (max-width: 820px) {
          .appt-row {
            grid-template-columns: 1fr 1fr 1fr auto;
          }
        }
        @media (max-width: 640px) {
          .appt-row {
            grid-template-columns: 1fr 1fr;
          }
          .appt-row .remove {
            grid-column: 1 / -1;
          }
        }
      `}</style>
      <div className="">
        <div className="card" role="form" aria-labelledby="title">
          <header>
            <div className="title" id="title">
              {/* {STR[lang].title} ({patientName}, DOB: {dob}, DOI: {doi}) */}
              ADL Form
            </div>
            <div className="lang" role="tablist" aria-label="Language">
              <button
                id="btn-en"
                className={lang === "en" ? "active" : ""}
                role="tab"
                aria-selected={lang === "en"}
                onClick={() => toggleLang("en")}
              >
                English
              </button>
              <button
                id="btn-es"
                className={lang === "es" ? "active" : ""}
                role="tab"
                aria-selected={lang === "es"}
                onClick={() => toggleLang("es")}
              >
                Español
              </button>
            </div>
          </header>

          {/* SECTION A: Appointments + Refill */}
          <h2 id="h-secA">{STR[lang].secA}</h2>
          <div className="section">
            <div className="row">
              <span className="label" id="lbl-newAppt">
                {STR[lang].newAppt}
              </span>
              <div
                className="options"
                role="radiogroup"
                aria-labelledby="lbl-newAppt"
              >
                <label className="opt">
                  <input
                    type="radio"
                    name="newAppt"
                    value="no"
                    checked={newAppt === "no"}
                    onChange={(e) => setNewAppt(e.target.value)}
                  />
                  <span id="ap-no">{STR[lang].apNo}</span>
                </label>
                <label className="opt">
                  <input
                    type="radio"
                    name="newAppt"
                    value="yes"
                    checked={newAppt === "yes"}
                    onChange={(e) => setNewAppt(e.target.value)}
                  />
                  <span id="ap-yes">{STR[lang].apYes}</span>
                </label>
              </div>
            </div>

            {/* Conditionally revealed details when Yes */}
            <div
              className={`row ${newAppt !== "yes" ? "hidden" : ""}`}
              id="apptDetails"
            >
              <div className="label" id="lbl-apptDetails">
                {STR[lang].apptDetails}
              </div>
              <div id="apptList">
                {appts.map((appt, index) => (
                  <div key={index} className="appt-row">
                    <div>
                      <label className="hint">{STR[lang].apptType}</label>
                      <select
                        className="apptType"
                        value={appt.type}
                        onChange={(e) =>
                          updateAppt(index, "type", e.target.value)
                        }
                      >
                        {apptTypes[lang].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="hint">{STR[lang].apptDate}</label>
                      <input
                        type="date"
                        className="apptDate"
                        value={appt.date}
                        onChange={(e) =>
                          updateAppt(index, "date", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="hint">{STR[lang].apptOther}</label>
                      <input
                        type="text"
                        className="apptOther"
                        maxLength={40}
                        value={appt.other}
                        onChange={(e) =>
                          updateAppt(index, "other", e.target.value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="btn secondary remove"
                      onClick={() => removeAppt(index)}
                    >
                      {STR[lang].apptRemove}
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn ghost" id="addApptBtn" onClick={addAppt}>
                {STR[lang].apptAdd}
              </button>
              <div className="hint" id="apptHint">
                {STR[lang].apptHint} • {appts.length}/3
              </div>
            </div>

            <div className="row">
              <label className="label" id="lbl-painRefill">
                {STR[lang].painRefill}
              </label>
              <input
                type="range"
                id="painRefill"
                min="0"
                max="10"
                step="1"
                value={pain}
                onChange={(e) => setPain(Number(e.target.value))}
                aria-label="Pain level 0 to 10"
              />
              <div className="scale" aria-hidden="true">
                {Array.from({ length: 11 }, (_, i) => (
                  <span key={i}>{i}</span>
                ))}
              </div>
              <div className="valDisplay" id="painVal">
                {pain}/10
              </div>
              <div className="hint" id="hint-painRefill">
                {STR[lang].painHint}
              </div>
            </div>
          </div>

          {/* SECTION B: Work Status (conditionally expanded) */}
          <h2 id="h-secB">{STR[lang].secB}</h2>
          <div className="section">
            <div className="row">
              <span className="label" id="lbl-workDiff">
                {STR[lang].workDiff}
              </span>
              <div
                className="options"
                role="radiogroup"
                aria-labelledby="lbl-workDiff"
              >
                <label className="opt good">
                  <input
                    type="radio"
                    name="workDiff"
                    value="no"
                    checked={workDiff === "no"}
                    onChange={(e) => setWorkDiff(e.target.value)}
                  />
                  <span id="wd-no">{STR[lang].wdNo}</span>
                </label>
                <label className="opt warn">
                  <input
                    type="radio"
                    name="workDiff"
                    value="yes"
                    checked={workDiff === "yes"}
                    onChange={(e) => setWorkDiff(e.target.value)}
                  />
                  <span id="wd-yes">{STR[lang].wdYes}</span>
                </label>
              </div>
            </div>

            <div id="workBlock" className={workDiff !== "yes" ? "hidden" : ""}>
              <div className="row">
                <span className="label" id="lbl-trend">
                  {STR[lang].trend}
                </span>
                <div
                  className="options"
                  role="radiogroup"
                  aria-labelledby="lbl-trend"
                >
                  <label className="opt good">
                    <input
                      type="radio"
                      name="trend"
                      value="better"
                      checked={trend === "better"}
                      onChange={(e) => setTrend(e.target.value)}
                    />
                    <span id="t-better">{STR[lang].better}</span>
                  </label>
                  <label className="opt">
                    <input
                      type="radio"
                      name="trend"
                      value="same"
                      checked={trend === "same"}
                      onChange={(e) => setTrend(e.target.value)}
                    />
                    <span id="t-same">{STR[lang].same}</span>
                  </label>
                  <label className="opt bad">
                    <input
                      type="radio"
                      name="trend"
                      value="worse"
                      checked={trend === "worse"}
                      onChange={(e) => setTrend(e.target.value)}
                    />
                    <span id="t-worse">{STR[lang].worse}</span>
                  </label>
                </div>
              </div>
              <div className="row">
                <span className="label" id="lbl-workAbility">
                  {STR[lang].workAbility}
                </span>
                <div
                  className="options"
                  role="radiogroup"
                  aria-labelledby="lbl-workAbility"
                >
                  <label className="opt good">
                    <input
                      type="radio"
                      name="workAbility"
                      value="ok"
                      checked={workAbility === "ok"}
                      onChange={(e) => setWorkAbility(e.target.value)}
                    />
                    <span id="w-ok">{STR[lang].w_ok}</span>
                  </label>
                  <label className="opt warn">
                    <input
                      type="radio"
                      name="workAbility"
                      value="trouble"
                      checked={workAbility === "trouble"}
                      onChange={(e) => setWorkAbility(e.target.value)}
                    />
                    <span id="w-trouble">{STR[lang].w_trouble}</span>
                  </label>
                  <label className="opt bad">
                    <input
                      type="radio"
                      name="workAbility"
                      value="cannot"
                      checked={workAbility === "cannot"}
                      onChange={(e) => setWorkAbility(e.target.value)}
                    />
                    <span id="w-cannot">{STR[lang].w_cannot}</span>
                  </label>
                </div>
              </div>
              <div className="row">
                <span className="label" id="lbl-barrier">
                  {STR[lang].barrier}
                </span>
                <div
                  className="options"
                  role="radiogroup"
                  aria-labelledby="lbl-barrier"
                >
                  <label className="opt">
                    <input
                      type="radio"
                      name="barrier"
                      value="pain"
                      checked={barrier === "pain"}
                      onChange={(e) => setBarrier(e.target.value)}
                    />
                    <span id="b-pain">{STR[lang].b_pain}</span>
                  </label>
                  <label className="opt">
                    <input
                      type="radio"
                      name="barrier"
                      value="fatigue"
                      checked={barrier === "fatigue"}
                      onChange={(e) => setBarrier(e.target.value)}
                    />
                    <span id="b-fatigue">{STR[lang].b_fatigue}</span>
                  </label>
                  <label className="opt">
                    <input
                      type="radio"
                      name="barrier"
                      value="dizzy"
                      checked={barrier === "dizzy"}
                      onChange={(e) => setBarrier(e.target.value)}
                    />
                    <span id="b-dizzy">{STR[lang].b_dizzy}</span>
                  </label>
                  <label className="opt">
                    <input
                      type="radio"
                      name="barrier"
                      value="weak"
                      checked={barrier === "weak"}
                      onChange={(e) => setBarrier(e.target.value)}
                    />
                    <span id="b-weak">{STR[lang].b_weak}</span>
                  </label>
                </div>
              </div>
              <div className="row">
                <span className="label" id="lbl-adl">
                  {STR[lang].adl}
                </span>
                <div className="chips" id="adlGroup">
                  {Object.entries(adlMap).map(([val, key]) => (
                    <label key={val} className="chip">
                      <input
                        type="checkbox"
                        value={val}
                        checked={adl.includes(val)}
                        onChange={handleAdlChange}
                      />
                      <span id={`a-${val}`}>{STR[lang][`a_${key}`]}</span>
                    </label>
                  ))}
                </div>
                <div className="hint" id="hint-adl">
                  {STR[lang].adlHint}
                </div>
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              className="btn"
              id="submitBtn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : STR[lang].submit}
            </button>
            <button
              className="btn secondary"
              id="resetBtn"
              onClick={handleReset}
            >
              {STR[lang].reset}
            </button>
          </div>

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
            <section className="results" id="results">
              <h2 id="h-summary">{STR[lang].summary}</h2>
              <div id="signalChips">
                {signalChips.map((chip) => (
                  <span key={chip} className={`pill ${getPillClass(chip)}`}>
                    {STR[lang].chips[chip as keyof typeof STR.en.chips]}
                  </span>
                ))}
              </div>
              <div id="rfaText" className="hint">
                {rfaTextContent}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
