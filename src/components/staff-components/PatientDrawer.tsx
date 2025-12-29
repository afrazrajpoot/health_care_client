"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";

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
  onSearchChange?: (searchQuery: string) => void;
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
  onSearchChange,
}: PatientDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    if (onSearchChange) {
      onSearchChange("");
    }
  }, [onSearchChange]);

  return (
    <aside
      className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
      style={{
        width: collapsed ? "48px" : "280px",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      <h3 className="flex justify-between items-center cursor-pointer select-none m-0 px-3.5 py-3 text-base font-bold border-b border-gray-200" onClick={onToggle}>
        {!collapsed && <span>Recent Patients</span>}
        <span>{collapsed ? "▸" : "◂"}</span>
      </h3>
      {!collapsed && (
        <>
          {/* Search Input */}
          <div className="px-3 py-2.5 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Patients List */}
          <div className="h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#a8a8a8]">
            {loading ? (
              <p className="p-5 text-center text-gray-500 text-sm m-0">Loading...</p>
            ) : patients.length === 0 ? (
              <p className="p-5 text-center text-gray-500 text-sm m-0">
                {searchQuery ? "No patients found matching your search" : "No patients found"}
              </p>
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
                  <div className="font-bold text-sm">{patient.patientName}</div>
                  <p className="text-xs text-gray-500 m-0">
                    DOB: {formatDOB(patient.dob)} ·{" "}
                    {patient.claimNumber !== "Not specified"
                      ? formatClaimNumber(patient.claimNumber)
                      : "No Claim"}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
}

