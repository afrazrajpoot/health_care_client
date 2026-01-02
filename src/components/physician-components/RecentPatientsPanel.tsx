import React, { useCallback, useState } from "react";

interface Patient {
  id?: string | number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface RecentPatient {
  patientName: string;
  dob: string | Date | null | undefined;
  claimNumber?: string;
  documentType?: string;
  documentCount?: number;
  createdAt: string | Date;
}

interface RecentPatientsPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  recentPatients: RecentPatient[];
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: Patient[];
  searchLoading: boolean;
  onPatientSelect: (patient: Patient) => void;
  onClose: () => void;
}

export const RecentPatientsPanel: React.FC<RecentPatientsPanelProps> = ({
  isVisible,
  onToggle,
  recentPatients,
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  onPatientSelect,
  onClose,
}) => {
  // Format date for recent patients popup (MM/DD/YYYY)
  const formatShortDate = (
    dateString: string | Date | null | undefined
  ): string => {
    if (!dateString) return "";
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch {
      return "";
    }
  };

  // Get document type for recent patients popup
  const getDocType = (patient: RecentPatient): string => {
    if (patient.documentType) {
      return patient.documentType;
    }
    if (patient.documentCount && patient.documentCount > 0) {
      return `${patient.documentCount} document(s)`;
    }
    return "Unknown";
  };

  // Filter recent patients based on search query
  const filteredRecentPatients = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return recentPatients;
    }
    const query = searchQuery.toLowerCase();
    return recentPatients.filter(
      (patient) =>
        patient.patientName?.toLowerCase().includes(query) ||
        patient.claimNumber?.toLowerCase().includes(query) ||
        (typeof patient.dob === "string" &&
          patient.dob.toLowerCase().includes(query))
    );
  }, [recentPatients, searchQuery]);

  const handleSearchResultSelect = (patient: Patient) => {
    onPatientSelect(patient);
    onClose();
  };

  const handleRecentPatientSelect = (patient: RecentPatient) => {
    // Format dob to string if it's a Date object
    let dobString = "";
    if (patient.dob) {
      if (patient.dob instanceof Date) {
        dobString = patient.dob.toISOString().split("T")[0];
      } else {
        dobString = String(patient.dob);
      }
    }

    onPatientSelect({
      patientName: patient.patientName,
      dob: dobString,
      claimNumber: patient.claimNumber || "",
      doi: "", // DOI will be fetched when document data is loaded
    });
    onClose();
  };

  return (
    <>
      {/* Recent Patients Toggle */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-[#3f51b5] text-white p-[10px_12px] rounded-l-[12px] shadow-[0_8px_18px_rgba(0,0,0,0.18)] cursor-pointer z-[9998] font-extrabold text-[13px] flex items-center gap-2 ${
          isVisible ? "checked" : ""
        }`}
        onClick={onToggle}
      >
        <span className="[writing-mode:vertical-rl] rotate-180 tracking-[0.02em]">
          Recent Patients
        </span>
        <div
          className={`[writing-mode:horizontal-tb] text-[16px] leading-[1] ${
            isVisible ? "rotate-180" : ""
          }`}
        >
          ◀
        </div>
      </div>

      {/* Recent Patients Panel - Fixed Position next to toggle */}
      {isVisible && (
        <div className="fixed right-[60px] top-1/2 -translate-y-1/2 z-[9997]">
          <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] overflow-hidden w-[320px]">
            <div className="flex items-center justify-between p-[12px_14px] border-b border-[#e5e7eb]">
              <div className="font-extrabold">Recent Patients</div>
              <div className="text-[12px] text-[#6b7280]">Quick jump list</div>
            </div>

            {/* Search Input */}
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={onSearchChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                }}
              />
            </div>

            <div className="p-0 max-h-[400px] overflow-y-auto">
              {/* Search Results */}
              {searchQuery.trim() && (
                <>
                  {searchLoading ? (
                    <div className="p-[10px_14px] text-[13px] text-center text-[#6b7280]">
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div
                        style={{
                          padding: "8px 14px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Search Results
                      </div>
                      {searchResults.map((patient, index) => (
                        <div
                          key={patient.id || index}
                          className="p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSearchResultSelect(patient)}
                        >
                          {patient.patientName}
                          {patient.claimNumber &&
                            patient.claimNumber !== "Not specified" && (
                              <> • Claim: {patient.claimNumber}</>
                            )}
                          {patient.dob && (
                            <> • DOB: {formatShortDate(patient.dob)}</>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-[10px_14px] text-[13px] text-center text-[#6b7280]">
                      No patients found
                    </div>
                  )}
                </>
              )}

              {/* Recent Patients List - Only show when no search query */}
              {!searchQuery.trim() && (
                <>
                  {recentPatients.length === 0 ? (
                    <div className="p-[10px_14px] text-[13px] text-center text-[#6b7280]">
                      No patients found
                    </div>
                  ) : (
                    filteredRecentPatients.map((patient, index) => (
                      <div
                        key={index}
                        className="p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRecentPatientSelect(patient)}
                      >
                        {patient.patientName} — {getDocType(patient)} •{" "}
                        {formatShortDate(patient.createdAt)}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

