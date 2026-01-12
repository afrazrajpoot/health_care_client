// components/SearchBar.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Define TypeScript interfaces for data structures
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
    patientNames?: string[];
    allMatchingDocuments?: Array<{
      id: string;
      patientName: string;
      claimNumber: string | null;
      dob: Date | string | null;
      doi: Date | string | null;
    }>;
    totalCount?: number;
  };
}

const SearchBar = ({
  physicianId,
  mode,
  onPatientSelect,
}: {
  physicianId: string | null;
  onPatientSelect: (patient: Patient) => void;
  mode: "wc" | "gm";
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Patient[]>([]);
  const [showRecommendations, setShowRecommendations] =
    useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // Helper to format date to YYYY-MM-DD string
  const formatDateToString = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Fetch recommendations from your patients API
  const fetchRecommendations = async (query: string) => {
    if (!query.trim()) {
      setRecommendations([]);
      setShowRecommendations(false);
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
        throw new Error("Failed to fetch recommendations");
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
        setRecommendations(patients);
      } else {
        setRecommendations([]);
      }
      setShowRecommendations(true);
    } catch (err: unknown) {
      console.error("Error fetching recommendations:", err);
      setRecommendations([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchRecommendations(query);
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
      setRecommendations([]);
      setShowRecommendations(false);
    }
  };

  // Handle patient selection from recommendations
  const handlePatientSelectInternal = (patient: Patient) => {
    setSearchQuery(patient.patientName || patient.name || "");
    setShowRecommendations(false);
    onPatientSelect(patient);
  };

  // Format date from YYYY-MM-DD string to MM-DD-YYYY
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch {
      return dateString;
    }
  };

  // Close recommendations when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowRecommendations(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="mb-6" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search patient by name..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery && setShowRecommendations(true)}
          className="w-full p-4 border border-blue-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Recommendations Dropdown */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-2xl shadow-lg mt-2 max-h-80 overflow-y-auto z-50">
            {recommendations.map((patient, index) => (
              <div
                key={patient.id || index}
                onClick={() => handlePatientSelectInternal(patient)}
                className="p-4 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-150"
              >
                <div className="font-semibold text-gray-900">
                  {patient.patientName || patient.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="inline-block mr-4">
                    <strong>DOB:</strong> {formatDate(patient.dob)}
                  </span>
                  <span className="inline-block mr-4">
                    <strong>DOI:</strong> {formatDate(patient.doi)}
                  </span>
                  <span className="inline-block">
                    <strong>Claim:</strong> {patient.claimNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showRecommendations &&
          searchQuery &&
          recommendations.length === 0 &&
          !searchLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-2xl shadow-lg mt-2 p-4 text-gray-500 text-center">
              No patients found
            </div>
          )}
      </div>
    </div>
  );
};

export default SearchBar;
