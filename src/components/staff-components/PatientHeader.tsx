"use client";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
}

interface PatientHeaderProps {
  patient: RecentPatient;
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
  completedTasks?: number;
}

export default function PatientHeader({
  patient,
  formatDOB,
  formatClaimNumber,
  completedTasks = 0,
}: PatientHeaderProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] flex justify-between px-3.5 py-3">
      <div>
        <h2 className="m-0 text-lg font-bold">{patient.patientName}</h2>
        <p className="text-sm text-gray-500 m-0">
          DOB: {formatDOB(patient.dob)} · {formatClaimNumber(patient.claimNumber)} · Visit Today
        </p>
      </div>
      <div className="flex items-center gap-3">
        {completedTasks > 0 && (
          <span className="text-xs px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 font-semibold whitespace-nowrap">
            ✓ {completedTasks} Completed
          </span>
        )}
        <p className="text-xs text-gray-500 m-0">EMR‑managed chart</p>
      </div>
    </section>
  );
}

