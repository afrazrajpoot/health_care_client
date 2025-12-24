"use client";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
  createdAt: string;
  documentType?: string;
  documentIds?: string[];
}

interface PatientDrawerProps {
  patients: RecentPatient[];
  selectedPatient: RecentPatient | null;
  loading: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onSelectPatient: (patient: RecentPatient) => void;
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
}

export default function PatientDrawer({
  patients,
  selectedPatient,
  loading,
  collapsed,
  onToggle,
  onSelectPatient,
  formatDOB,
  formatClaimNumber,
}: PatientDrawerProps) {
  return (
    <aside
      className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
      style={{
        width: collapsed ? "48px" : "280px",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      <h3 className="flex justify-between items-center cursor-pointer select-none m-0 px-3.5 py-3 text-[13px] font-bold border-b border-gray-200" onClick={onToggle}>
        {!collapsed && <span>Recent Patients</span>}
        <span>{collapsed ? "▸" : "◂"}</span>
      </h3>
      {!collapsed && (
        <div className="h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
          {loading ? (
            <div className="p-5 text-center text-gray-500">Loading...</div>
          ) : patients.length === 0 ? (
            <div className="p-5 text-center text-gray-500">No patients found</div>
          ) : (
            patients.map((patient, idx) => (
              <div
                key={idx}
                className={`px-3 py-2.5 border-b border-gray-200 cursor-pointer text-xs ${
                  selectedPatient?.patientName === patient.patientName &&
                  selectedPatient?.dob === patient.dob
                    ? "bg-indigo-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => onSelectPatient(patient)}
              >
                <div className="font-bold text-xs">{patient.patientName}</div>
                <div className="text-[11px] text-gray-500">
                  DOB: {formatDOB(patient.dob)} ·{" "}
                  {patient.claimNumber !== "Not specified"
                    ? formatClaimNumber(patient.claimNumber)
                    : "No Claim"}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}

