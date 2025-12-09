// components/RecentPatientsSidebar.tsx
"use client";

import { useState, useEffect } from "react";

interface RecentPatient {
  patientName: string;
  dob: string | null;
  claimNumber: string | null;
  createdAt: string;
  documentCount: number;
  documentIds: string[];
  documentType: string | null;
}

interface Props {
  onPatientSelect: (patient: any) => void;
  mode: "wc" | "gm";
}

export default function RecentPatientsSidebar({
  onPatientSelect,
  mode,
}: Props) {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        setLoading(true);
        const url = `/api/get-recent-patients?mode=${mode}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const data: RecentPatient[] = await response.json();
        setRecentPatients(data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPatients();
  }, [mode]);

  const handleSelect = (patient: RecentPatient) => {
    onPatientSelect({
      patientName: patient.patientName,
      dob: patient.dob,
      claimNumber: patient.claimNumber,
      documentType: patient.documentType,
      documentIds: patient.documentIds,
    });
  };

  // Format date like "12/4/2025" (no leading zeros)
  const formatShortDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch {
      return "";
    }
  };

  // Get display type like in screenshot
  const getDocType = (patient: RecentPatient): string => {
    if (patient.documentType) {
      const type = patient.documentType.split('(')[0].trim();
      
      // Map to screenshot-like types
      if (type === "UR") return "UR";
      if (type.includes("PR") || patient.documentCount > 1) {
        return `PR-${patient.documentCount}`;
      }
      if (type.includes("QME")) return "QME";
      if (type.includes("Follow")) return "Follow-Up";
      return "New Patient";
    }
    
    return patient.documentCount > 1 ? `PR-${patient.documentCount}` : "New Patient";
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 text-center">
          Recent Patients
        </h2>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="text-center py-3 text-gray-500 text-sm">Loading...</div>
        ) : recentPatients.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">No patients found</div>
        ) : (
          <div className="space-y-2">
            {recentPatients.map((patient, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleSelect(patient)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">{patient.patientName}</span>
                    <span className="mx-2 text-gray-400">—</span>
                    <span className="text-gray-600">
                      {getDocType(patient)} • {formatShortDate(patient.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}