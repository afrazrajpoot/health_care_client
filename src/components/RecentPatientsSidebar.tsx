// components/RecentPatientsSidebar.tsx
"use client";

import { useState, useEffect } from "react";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
}

interface Props {
  onPatientSelect: (patient: any) => void;
}

export default function RecentPatientsSidebar({ onPatientSelect }: Props) {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/get-recent-patients");
        if (!response.ok) {
          throw new Error("Failed to fetch recent patients");
        }
        const data: RecentPatient[] = await response.json();
        setRecentPatients(data);
      } catch (err) {
        console.error("Error fetching recent patients:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPatients();
  }, []);

  const handleSelect = (patient: RecentPatient) => {
    const patientData: any = {
      patientName: patient.patientName,
      dob: patient.dob,
      doi: "",
      claimNumber: patient.claimNumber,
    };
    onPatientSelect(patientData);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Not specified";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Not specified";
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-center p-3 border-b border-gray-200 bg-gray-50 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900">Recent Patients</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 text-xs">
              Loading recent patients...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-600 text-sm">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-blue-500 hover:underline text-xs"
            >
              Retry
            </button>
          </div>
        ) : recentPatients.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <p>No recent patients found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPatients.map((patient, index) => (
              <div
                key={index}
                className="p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => handleSelect(patient)}
              >
                <div className="font-medium text-gray-900 text-sm">
                  {patient.patientName}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  DOB: {formatDate(patient.dob)}
                </div>
                <div className="text-xs text-gray-600">
                  Claim #: {patient.claimNumber}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
