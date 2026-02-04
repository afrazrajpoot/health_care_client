// components/RecentPatientsSidebar.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";

interface RecentPatient {
  patientName: string;
  dob: string | null;
  claimNumber: string | null;
  createdAt: string;
  reportDate: string;
  documentCount: number;
  documentIds: string[];
  documentType: string | null;
}

interface Patient {
  id?: string;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface RecommendationsResponse {
  success: boolean;
  data: {
    allMatchingDocuments: Array<{
      id: string;
      patientName: string;
      dob: Date | string | null;
      doi: Date | string | null;
      claimNumber: string | null;
    }>;
    totalCount?: number;
  };
}

interface Props {
  onPatientSelect: (patient: any) => void;
  mode: "wc" | "gm";
  physicianId: string | null;
  autoSelectFirst?: boolean;
  hasSelectedPatient?: boolean;
}

export default function RecentPatientsSidebar({
  onPatientSelect,
  mode,
  physicianId,
  autoSelectFirst = true,
  hasSelectedPatient = false,
}: Props) {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const hasAutoSelectedRef = React.useRef(false);

  const handleSelect = useCallback(
    (patient: RecentPatient) => {
      onPatientSelect({
        patientName: patient.patientName,
        dob: patient.dob,
        claimNumber: patient.claimNumber,
        documentType: patient.documentType,
        documentIds: patient.documentIds,
      });
    },
    [onPatientSelect]
  );

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        setLoading(true);
        const url = `/api/get-recent-patients?mode=${mode}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const data: RecentPatient[] = await response.json();
        setRecentPatients(data);

        // Auto-select first patient if available, auto-select is enabled, no patient is selected, and we haven't auto-selected yet
        if (
          autoSelectFirst &&
          !hasSelectedPatient &&
          !hasAutoSelectedRef.current &&
          data.length > 0
        ) {
          const firstPatient = data[0];
          hasAutoSelectedRef.current = true;
          // Select immediately
          handleSelect(firstPatient);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPatients();
  }, [mode, autoSelectFirst, hasSelectedPatient, handleSelect]);

  // Reset auto-select flag when mode changes
  useEffect(() => {
    hasAutoSelectedRef.current = false;
  }, [mode]);

  // Helper to format date to YYYY-MM-DD string
  const formatDateToString = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Fetch search results from API
  const fetchSearchResults = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `/api/dashboard/recommendation?patientName=${encodeURIComponent(
          query
        )}&claimNumber=${encodeURIComponent(query)}&dob=${encodeURIComponent(
          query
        )}&physicianId=${encodeURIComponent(
          physicianId || ""
        )}&mode=${encodeURIComponent(mode)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data: RecommendationsResponse = await response.json();

      if (data.success && data.data.allMatchingDocuments) {
        const patients: Patient[] = data.data.allMatchingDocuments.map(
          (doc) => ({
            id: doc.id,
            patientName: doc.patientName,
            dob: formatDateToString(doc.dob),
            doi: formatDateToString(doc.doi),
            claimNumber: doc.claimNumber || "Not specified",
          })
        );
        setSearchResults(patients);
      } else {
        setSearchResults([]);
      }
    } catch (err: unknown) {
      console.error("Error fetching search results:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce function
  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce((query: string) => {
      fetchSearchResults(query);
    }, 300),
    [physicianId, mode]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
    }
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
        patient.dob?.toLowerCase().includes(query)
    );
  }, [recentPatients, searchQuery]);

  // Handle selecting a search result patient
  const handleSearchResultSelect = useCallback(
    (patient: Patient) => {
      onPatientSelect({
        patientName: patient.patientName,
        dob: patient.dob,
        claimNumber: patient.claimNumber,
        doi: patient.doi,
      });
      setSearchQuery("");
      setSearchResults([]);
    },
    [onPatientSelect]
  );

  // Format date like "12/4/2025" (no leading zeros)
  const formatShortDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
    } catch {
      return "";
    }
  };

  // Show exact document type from API data
  const getDocType = (patient: RecentPatient): string => {
    // Return the exact documentType from API if it exists
    if (patient.documentType) {
      return patient.documentType;
    }

    // Fallback: if no documentType but has documentCount
    if (patient.documentCount > 0) {
      return `${patient.documentCount} document(s)`;
    }

    return "Unknown document type";
  };

  return (
    <>
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
          onChange={handleSearchChange}
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

      {/* Search Results */}
      {searchQuery.trim() && (
        <>
          {searchLoading ? (
            <div
              className="recent-item"
              style={{
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "12px",
              }}
            >
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
                  className="recent-item"
                  onClick={() => handleSearchResultSelect(patient)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {patient.patientName}
                  {patient.claimNumber &&
                    patient.claimNumber !== "Not specified" && (
                      <> • Claim: {patient.claimNumber}</>
                    )}
                  {patient.dob && <> • DOB: {formatShortDate(patient.dob)}</>}
                </div>
              ))}
            </>
          ) : (
            <div
              className="recent-item"
              style={{
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "12px",
              }}
            >
              No patients found
            </div>
          )}
        </>
      )}

      {/* Recent Patients List */}
      {!searchQuery.trim() && (
        <>
          {loading ? (
            <div
              className="recent-item"
              style={{ textAlign: "center", color: "var(--muted)" }}
            >
              Loading...
            </div>
          ) : filteredRecentPatients.length === 0 ? (
            <div
              className="recent-item"
              style={{ textAlign: "center", color: "var(--muted)" }}
            >
              No patients found
            </div>
          ) : (
            filteredRecentPatients.map((patient, index) => (
              <div
                key={index}
                className="recent-item"
                onClick={() => handleSelect(patient)}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {patient.patientName} — {getDocType(patient)} •{" "}
                {formatShortDate(patient.reportDate || patient.createdAt)}
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
