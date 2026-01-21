import React from "react";

interface RecentPatientsPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  recentPatients: any[];
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: any[];
  searchLoading: boolean;
  onPatientSelect: (patient: any, index?: number) => void;
  onClose: () => void;
  highlightedPatientIndex?: number | null;
  selectedPatient?: any | null;
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
  highlightedPatientIndex,
  selectedPatient,
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
  const getDocType = (patient: any): string => {
    if (patient.documentType) {
      return patient.documentType;
    }
    if (patient.documentCount && patient.documentCount > 0) {
      return `${patient.documentCount} document(s)`;
    }
    return "";
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

  const handleSearchResultSelect = (patient: any, index: number) => {
    onPatientSelect(patient, index);
    onClose();
  };

  const handleRecentPatientSelect = (patient: any, index: number) => {
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
    }, index);
    onClose();
  };

  const isPatientSelected = (patient: any) => {
    if (!selectedPatient) return false;

    const pName = (patient.patientName || patient.name || "").toLowerCase().trim();
    const sName = (selectedPatient.patientName || selectedPatient.name || "").toLowerCase().trim();

    const pClaim = (patient.claimNumber || "").trim();
    const sClaim = (selectedPatient.claimNumber || "").trim();

    // Match by name and claim if possible, otherwise just name
    if (pClaim && sClaim) {
      return pName === sName && pClaim === sClaim;
    }
    return pName === sName;
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse-highlight {
          0% { background-color: rgba(59, 130, 246, 0.1); }
          50% { background-color: rgba(59, 130, 246, 0.2); }
          100% { background-color: rgba(59, 130, 246, 0.1); }
        }
        .highlighted-patient {
          animation: pulse-highlight 2s ease-in-out infinite;
          border-left: 4px solid #3b82f6 !important;
        }
        .selected-patient {
          background-color: rgba(59, 130, 246, 0.08) !important;
          border-left: 4px solid #3f51b5 !important;
          font-weight: 600;
        }
      `}</style>

      {/* Recent Patients Toggle */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-[#3f51b5] text-white p-[10px_12px] rounded-l-[12px] shadow-[0_8px_18px_rgba(0,0,0,0.18)] cursor-pointer z-[9998] font-extrabold text-[13px] flex items-center gap-2 ${isVisible ? "checked" : ""
          }`}
        onClick={onToggle}
      >
        <span className="[writing-mode:vertical-rl] rotate-180 tracking-[0.02em]">
          Recent Patients
        </span>
        <div
          className={`[writing-mode:horizontal-tb] text-[16px] leading-[1] ${isVisible ? "rotate-180" : ""
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
            <div className="p-[12px_14px] border-b border-[#e5e7eb]">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={onSearchChange}
                className="w-full p-2 border border-[#e5e7eb] rounded-lg text-sm outline-none focus:border-[#3f51b5] transition-colors"
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
                      <div className="p-[8px_14px] text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                        Search Results
                      </div>
                      {searchResults.map((patient, index) => {
                        const isSelected = isPatientSelected(patient);
                        const isHighlighted = highlightedPatientIndex === index;

                        return (
                          <div
                            key={patient.id || index}
                            className={`p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${isSelected ? "selected-patient" : ""
                              } ${isHighlighted ? "highlighted-patient" : ""}`}
                            onClick={() => handleSearchResultSelect(patient, index)}
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
                        );
                      })}
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
                    filteredRecentPatients.map((patient, index) => {
                      const isSelected = isPatientSelected(patient);
                      const isHighlighted = highlightedPatientIndex === index;

                      return (
                        <div
                          key={index}
                          className={`p-[10px_14px] text-[13px] border-t border-[#e5e7eb] first:border-t-0 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${isSelected ? "selected-patient" : ""
                            } ${isHighlighted ? "highlighted-patient" : ""}`}
                          onClick={() => handleRecentPatientSelect(patient, index)}
                        >
                          {patient.patientName} — {getDocType(patient)} •{" "}
                          {formatShortDate(patient.reportDate || patient.createdAt)}
                        </div>
                      );
                    })
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