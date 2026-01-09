"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

const THERAPIES = [
  "Physical Therapy",
  "Chiropractic Therapy",
  "Massage Therapy",
  "Acupuncture",
  "PENS Therapy",
  "Occupational Therapy",
  "Aquatic Therapy",
];

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
    q4: "Are you receiving any therapies?",
    q4hint: "If yes, check all that apply and rate their effect",
    q5: "Review",
    submitHint:
      "After you submit, your care team will review this with your doctor.",
    auth_title: "Patient Authentication",
    auth_name: "Full Name",
    auth_dob: "Date of Birth",
    auth_submit: "Authenticate",
    auth_error: "Invalid date of birth. Please enter correct date.",
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
    q4: "¿Está recibiendo alguna terapia?",
    q4hint: "Si es así, marque todas las que apliquen y califique su efecto",
    q5: "Revisión",
    submitHint: "Después de enviar, su equipo revisará esto con su médico.",
    auth_title: "Autenticación del Paciente",
    auth_name: "Nombre Completo",
    auth_dob: "Fecha de Nacimiento",
    auth_submit: "Autenticar",
    auth_error:
      "Fecha de nacimiento inválida. Por favor, ingrese la fecha correcta.",
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
    <Suspense fallback={<Loader />}>
      <PatientIntakeContent />
    </Suspense>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
          <h1 className="text-xl font-semibold text-gray-900">
            Loading Patient Intake
          </h1>
          <p className="text-gray-500 text-sm">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

function PatientIntakeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Helper function to parse YYYY-MM-DD string to Date (for DatePicker display only)
  // Creates date at noon to avoid timezone rollover issues
  const stringToDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Authentication state
  const [showAuth, setShowAuth] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authDob, setAuthDob] = useState("");
  const [authError, setAuthError] = useState("");
  const [expectedPatientData, setExpectedPatientData] =
    useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Patient data
  const [patient, setPatient] = useState("John Doe");
  const [visit, setVisit] = useState("Follow-up");
  const [bodyAreas, setBodyAreas] = useState("Back, Neck");

  // Form state
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [showAppointments, setShowAppointments] = useState(false);
  const [showRefill, setShowRefill] = useState(false);
  const [showADL, setShowADL] = useState(false);
  const [showTherapySection, setShowTherapySection] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refillData, setRefillData] = useState({ before: 0, after: 0 });
  const [adlData, setAdlData] = useState({
    state: "same",
    list: [] as string[],
  });
  const [therapyRatings, setTherapyRatings] = useState<TherapyRating[]>([]);
  const [receivingTherapies, setReceivingTherapies] = useState(
    new Set<string>()
  );
  const [summary, setSummary] = useState("—");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      if (!token) {
        console.log("No token provided - using demo data");
        setIsLoading(false);
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
        } else {
          // Pre-fill patient name for display, only DOB verification needed
          setAuthName(patientData.patientName);
          setLanguage((patientData.language as "en" | "es") || "en");
          setShowAuth(true);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setSubmitMessage("Failed to load patient data. Please check the URL.");
        setShowAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [token]);

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

    console.log("Auth comparison:", {
      authDob,
      expectedDob,
    });

    // Only verify DOB - patient name is already shown from token
    if (authDob === expectedDob) {
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

  const toggleTherapy = (therapy: string) => {
    const newSet = new Set(receivingTherapies);
    const wasReceiving = newSet.has(therapy);
    if (wasReceiving) {
      newSet.delete(therapy);
      setTherapyRatings((prev) => prev.filter((t) => t.therapy !== therapy));
    } else {
      newSet.add(therapy);
      if (!therapyRatings.some((t) => t.therapy === therapy)) {
        setTherapyRatings((prev) => [
          ...prev,
          { therapy, effect: "No Change" },
        ]);
      }
    }
    setReceivingTherapies(newSet);
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
    setIsSubmitting(true);
    setSubmitMessage("");

    const formData: FormData = {
      newAppointments: showAppointments ? appointments : [],
      refill: {
        needed: showRefill,
        before: String(refillData.before),
        after: String(refillData.after),
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
        setShowSuccessPopup(true);
        // Auto-close popup after 3 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        setSubmitMessage("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitMessage("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

    setSummary(buildSummary());
  };

  // Show loader while initializing
  if (isLoading) {
    return <Loader />;
  }

  // Show authentication form
  if (showAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl w-full text-center font-semibold text-gray-900">
            {t.auth_title}
          </h1>
          <div className=" mt-[1vw] items-center mb-6">
            <div className="flex justify-between items-center gap-2">
              <label className="text-xs font-medium text-gray-500">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "es")}
                className="min-w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth_name}
              </label>
              <input
                type="text"
                value={authName}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.auth_dob}
              </label>
              <DatePicker
                selected={stringToDate(authDob)}
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setAuthDob(`${year}-${month}-${day}`);
                  } else {
                    setAuthDob("");
                  }
                }}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholderText="Select date of birth"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                required
              />
            </div>

            {authError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={!authName || !authDob}
              className="w-full py-3 px-4 bg-[#53d1df] hover:bg-[#33c7d8] text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              {t.auth_submit}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show main intake form
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-600 mt-1">{t.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "es")}
              className="min-w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="flex flex-wrap gap-3 mb-6">
          <span className="inline-flex items-center px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full border border-teal-200">
            Patient: {patient}
          </span>
          <span className="inline-flex items-center px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full border border-teal-200">
            Visit: {visit}
          </span>
          <span className="inline-flex items-center px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full border border-teal-200">
            Areas: {bodyAreas}
          </span>
        </div>

        {/* Section 1: New appointments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.q1}
          </label>
          <select
            value={showAppointments ? "yes" : "no"}
            onChange={(e) => {
              const value = e.target.value === "yes";
              setShowAppointments(value);
              if (value && appointments.length === 0) {
                addAppointment();
              }
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {showAppointments && (
            <div className="mt-4 space-y-4">
              <div className="space-y-3">
                {appointments.map((appt, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.q1a}
                      </label>
                      <select
                        value={appt.type}
                        onChange={(e) =>
                          updateAppointment(index, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        {SPECIALISTS.map((specialist) => (
                          <option key={specialist} value={specialist}>
                            {specialist}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.q1b}
                      </label>
                      <DatePicker
                        selected={stringToDate(appt.date)}
                        onChange={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            updateAppointment(
                              index,
                              "date",
                              `${year}-${month}-${day}`
                            );
                          } else {
                            updateAppointment(index, "date", "");
                          }
                        }}
                        dateFormat="yyyy-MM-dd"
                        className="w-[17vw] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholderText="Select appointment date (YYYY-MM-DD)"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                      />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        className="md:col-span-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium text-sm"
                        onClick={() => removeAppointment(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium rounded-lg transition-colors duration-200"
                onClick={addAppointment}
              >
                + Add appointment
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Medications */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.q2}
          </label>
          <select
            value={showRefill ? "yes" : "no"}
            onChange={(e) => setShowRefill(e.target.value === "yes")}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {showRefill && (
            <div className="mt-6 space-y-6">
              {/* Pain before medication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t.q2a}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={refillData.before}
                    onChange={(e) =>
                      setRefillData((prev) => ({
                        ...prev,
                        before: Number(e.target.value),
                      }))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex items-center justify-center min-w-[3rem] h-10 px-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <span className="text-lg font-bold text-teal-700">
                      {refillData.before}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>No Pain</span>
                  <span>Worst Pain</span>
                </div>
              </div>

              {/* Pain after medication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t.q2b}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={refillData.after}
                    onChange={(e) =>
                      setRefillData((prev) => ({
                        ...prev,
                        after: Number(e.target.value),
                      }))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex items-center justify-center min-w-[3rem] h-10 px-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <span className="text-lg font-bold text-teal-700">
                      {refillData.after}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>😊 No Pain</span>
                  <span>😢 Worst Pain</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: ADL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.q3}
          </label>
          <select
            value={adlData.state}
            onChange={(e) => {
              const value = e.target.value;
              setAdlData((prev) => ({ ...prev, state: value }));
              const show = value !== "same";
              setShowADL(show);
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="same">Same</option>
            <option value="better">Better</option>
            <option value="worse">Worse</option>
          </select>

          {showADL && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-3">{t.q3hint}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ADLS.map((activity) => (
                  <label
                    key={activity}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={activity}
                      checked={adlData.list.includes(activity)}
                      onChange={() => toggleAdlItem(activity)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {activity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Therapies */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.q4}
          </label>
          <select
            value={showTherapySection ? "yes" : "no"}
            onChange={(e) => {
              const value = e.target.value === "yes";
              setShowTherapySection(value);
              if (value && receivingTherapies.size === 0) {
                // Optionally initialize if needed, but not necessary
              } else if (!value) {
                setReceivingTherapies(new Set());
                setTherapyRatings([]);
              }
            }}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {showTherapySection && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-3">{t.q4hint}</p>
              {/* Therapy selection checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {THERAPIES.map((therapy) => (
                  <label
                    key={therapy}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={receivingTherapies.has(therapy)}
                      onChange={(e) => toggleTherapy(therapy)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {therapy}
                    </span>
                  </label>
                ))}
              </div>

              {/* Therapy Ratings */}
              {Array.from(receivingTherapies).map((therapy) => (
                <div
                  key={therapy}
                  className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg"
                >
                  <div className="font-medium text-gray-900 mb-3">
                    {therapy}
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How effective has it been?
                  </label>
                  <select
                    value={
                      therapyRatings.find((t) => t.therapy === therapy)
                        ?.effect || "No Change"
                    }
                    onChange={(e) => {
                      const index = therapyRatings.findIndex(
                        (t) => t.therapy === therapy
                      );
                      if (index >= 0) {
                        updateTherapyRating(index, e.target.value);
                      } else {
                        setTherapyRatings((prev) => [
                          ...prev,
                          { therapy, effect: e.target.value },
                        ]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
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
          )}
        </div>

        {/* Review & Submit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.q5}
          </label>
          <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg whitespace-pre-line text-sm text-gray-700">
            {summary}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-lg transition-colors duration-200"
            onClick={handlePreview}
          >
            Preview Summary
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 min-w-32"
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          {submitMessage || t.submitHint}
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Successfully Submitted!
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Your intake form has been submitted successfully. Your care team
              will review this with your doctor.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
