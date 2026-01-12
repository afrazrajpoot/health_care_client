"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SearchBar from "@/components/SearchBar"; // Adjust path as needed
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

// Define TypeScript interfaces for data structures
interface Patient {
  id?: number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface SummarySnapshot {
  id: string;
  dx: string;
  keyConcern: string;
  nextStep: string;
  documentId: string;
}

interface WhatsNew {
  [key: string]: string;
}

interface ADL {
  adls_affected: string;
  work_restrictions: string;
}

interface DocumentSummaryEntry {
  date: string;
  summary: string;
}

interface DocumentSummary {
  [key: string]: DocumentSummaryEntry[];
}

interface BriefSummary {
  [key: string]: string[];
}

interface DocumentData {
  document_id: string;
  patient_name: string;
  dob: string;
  doi: string;
  claim_number: string;
  status: string;
  created_at: string;
  summary_snapshots?: SummarySnapshot[];
  whats_new?: WhatsNew;
  adl?: ADL;
  document_summary?: DocumentSummary;
  brief_summary?: BriefSummary;
}

const AttorneyCardPage = () => {
  const { data: session } = useSession();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);

  const currentDate = new Date("2025-10-07");
  const physicianId = session?.user?.physicianId || null;
  const getPhysicianId = (): string | null => {
    if (!session?.user) return null;
    return session.user.role === "Physician" ? session.user.id : physicianId;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const calculateDays = (dateStr: string) => {
    if (!dateStr) return 0;
    const alertDate = new Date(dateStr);
    return Math.floor(
      (currentDate.getTime() - alertDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const physicianId = getPhysicianId();
      const params = new URLSearchParams({
        patient_name: patient.patientName || patient.name || "",
        dob: patient.dob,
        doi: patient.doi,
        claim_number: patient.claimNumber,
      });
      if (physicianId) {
        params.append("physicianId", physicianId);
      }
      const apiUrl = `${process.env.NEXT_PUBLIC_PYTHON_API_URL}/api/documents?${params}`;
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${session?.user?.fastapi_token}`,
        },
      });
      if (res.ok) {
        const response = await res.json();
        setDocuments(response.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error(err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const doc: DocumentData | null = documents[0] || null;
  const patientName = doc?.patient_name || selectedPatient?.patientName || "";
  const dobFormatted = formatDate(doc?.dob || selectedPatient?.dob || "");
  const doiFormatted = formatDate(doc?.doi || selectedPatient?.doi || "");
  const workStatus = doc?.adl?.work_restrictions || "TTD";
  const latestSnapshot = doc?.summary_snapshots?.[0];
  const nextKeyAction =
    latestSnapshot?.nextStep ||
    "Awaiting neurosurgery referral + overdue Pain Mgmt report";

  // What's New items from whats_new object
  const whatsNewItems = Object.values(doc?.whats_new || {}).slice(0, 3);

  // Consultant Report Status - adapt from document_summary
  const documentSummaries = doc?.document_summary;
  const consultantAlerts = Object.entries(documentSummaries || {}).map(
    ([type, entries]) => ({
      id: type,
      title: type,
      date: entries[0]?.date || "",
      isResolved: false, // Assuming not resolved for demo
    })
  );
  const dynamicConsultantLis = consultantAlerts.map((a: any) => {
    const alertDate = formatDate(a.date);
    const days = calculateDays(a.date);
    const statusText = days > 90 ? "Overdue" : "Pending";
    const colorClass = days > 90 ? "red" : "yellow";
    const shadowColor = colorClass === "yellow" ? "245,158,11" : "239,68,68";
    const daysDisplay = days > 90 ? "90+" : days;
    return (
      <li key={a.id} className="flex items-center gap-1.5">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full bg-${colorClass}-500 shadow-[0_0_0_2px_rgba(${shadowColor},0.2)]`}
        ></span>
        {a.title} performed {alertDate} —{" "}
        <strong className="font-medium text-slate-700">{statusText}</strong> (
        {daysDisplay} days)
      </li>
    );
  });

  // Pending items from document_summary (unresolved)
  const pendingAlerts = consultantAlerts.filter((a: any) => true); // All pending for demo
  const pendingItems = pendingAlerts.map((a: any) => {
    const days = calculateDays(a.date);
    const age = days > 90 ? "90+ days" : `${days} days`;
    const name = `${a.title} — Report ${days > 60 ? "overdue" : "pending"}`;
    return { name, age };
  });

  // Next Steps from summary_snapshots
  const nextStepsItems =
    doc?.summary_snapshots
      ?.slice(0, 2)
      .map((snapshot: SummarySnapshot) => snapshot.nextStep)
      .filter(Boolean) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white px-6 py-10 pb-20 text-slate-900 font-sans antialiased leading-relaxed md:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white px-6 py-10 pb-20 text-slate-900 font-sans antialiased leading-relaxed md:px-6">
        <div className="mx-auto max-w-[900px]">
          <SearchBar
            physicianId={getPhysicianId()}
            onPatientSelect={handlePatientSelect}
          />
          <div className="space-y-7">
            {!selectedPatient ? (
              <div className="bg-white border border-slate-200 rounded-[18px] shadow-xl p-8 text-center">
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  Get Started
                </h3>
                <p className="text-slate-600">
                  Search for a patient to view the Attorney Card
                </p>
              </div>
            ) : (
              <article className="overflow-hidden rounded-[18px] bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-100/50 via-blue-50/30 to-transparent px-4.5 py-3.5">
                  <h2 className="m-0 text-base font-medium uppercase tracking-wide text-slate-600">
                    Attorney Card — Essentials
                  </h2>
                  <span className="text-xs font-medium text-slate-500">
                    Lean • With Snapshot Overview
                  </span>
                </div>

                <section className="px-4.5 py-4">
                  <h3 className="mb-2 text-base font-medium text-slate-700">
                    Snapshot Overview
                  </h3>
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                      <strong>Patient:</strong> {patientName}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                      <strong>DOB:</strong> {dobFormatted}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                      <strong>DOI:</strong> {doiFormatted}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                      <strong>Work Status:</strong> {workStatus}
                    </div>
                    {latestSnapshot && (
                      <>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                          <strong>Diagnosis:</strong> {latestSnapshot.dx}
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                          <strong>Key Concern:</strong>{" "}
                          {latestSnapshot.keyConcern}
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-2.5 py-1.5 text-xs text-slate-700">
                          <strong>Next Key Action:</strong> {nextKeyAction}
                        </div>
                      </>
                    )}
                  </div>
                </section>

                <section className="border-t border-dashed border-slate-200 px-4.5 py-4">
                  <h3 className="mb-2 text-base font-medium text-slate-700">
                    What’s New Since Last Visit (Top 3)
                  </h3>
                  <ul className="m-0 list-disc pl-4.5 space-y-0.5 text-sm text-slate-600">
                    {whatsNewItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="border-t border-dashed border-slate-200 px-4.5 py-4">
                  <h3 className="mb-2 text-base font-medium text-slate-700">
                    Consultant Report Status
                  </h3>
                  <div className="flex items-center gap-3.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]"></span>
                      Received
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]"></span>
                      Pending
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"></span>
                      Overdue
                    </span>
                  </div>
                  <ul className="m-0 mt-2 list-disc pl-4.5 space-y-0.5 text-sm text-slate-600">
                    {dynamicConsultantLis}
                  </ul>
                </section>

                <section className="border-t border-dashed border-slate-200 px-4.5 py-4">
                  <h3 className="mb-2 text-base font-medium text-slate-700">
                    Pending Reports (Inform Counsel)
                  </h3>
                  <div className="space-y-2.5">
                    {pendingItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[1.2fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-3 py-2.5 text-sm"
                      >
                        <div className="font-semibold text-slate-800">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-600">{item.age}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border-t border-dashed border-slate-200 px-4.5 py-4">
                  <h3 className="mb-2 text-base font-medium text-slate-700">
                    Next Steps
                  </h3>
                  <ul className="m-0 list-disc pl-4.5 space-y-0.5 text-sm text-slate-600">
                    {nextStepsItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>

                <div className="mt-3 border-t border-slate-200 bg-white/50 px-4.5 py-3 text-xs text-slate-600">
                  <strong className="font-medium text-slate-700">
                    Disclaimer:
                  </strong>{" "}
                  This summary is for coordination only and not a legal filing
                  or medical‑legal record. Do not use in deposition, hearing, or
                  trial. Attorneys should verify status directly with consultant
                  offices as needed.
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default AttorneyCardPage;
