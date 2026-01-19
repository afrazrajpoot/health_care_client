"use client";
import React, { useState, useEffect } from "react";
import { useGetPatientIntakeUpdateQuery } from "@/redux/staffApi";

interface PatientIntakeUpdateProps {
  documentData?: {
    patient_name?: string;
    dob?: string;
    claim_number?: string;
  } | null;
}

interface IntakeUpdateData {
  id: string;
  patientName: string;
  dob: string | null;
  claimNumber: string | null;
  keyPatientReportedChanges: string | null;
  systemInterpretation: string | null;
  keyFindings: string | null;
  medRefillsRequested: string | null;
  newAppointments: string | null;
  adlChanges: string | null;
  createdAt: string;
}

const PatientIntakeUpdate: React.FC<PatientIntakeUpdateProps> = ({
  documentData,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [intakeUpdate, setIntakeUpdate] = useState<IntakeUpdateData | null>(
    null
  );

  const { data: intakeData, isFetching: loading } = useGetPatientIntakeUpdateQuery(
    {
      patientName: documentData?.patient_name || "",
      dob: documentData?.dob || "",
      claimNumber: documentData?.claim_number || "",
    },
    {
      skip: !documentData?.patient_name,
    }
  );

  useEffect(() => {
    if (intakeData?.success && intakeData?.data) {
      setIntakeUpdate(intakeData.data);
    } else if (intakeData && !intakeData.success) {
      setIntakeUpdate(null);
    }
  }, [intakeData]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Format date for display (MM-DD-YYYY)
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch {
      return "";
    }
  };

  // Don't render if no data and not loading
  if (!loading && !intakeUpdate) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3">
      {/* Summary Section */}
      <div
        className={`px-3 py-2.5 cursor-pointer flex gap-2.5 items-start transition-colors ${
          isExpanded ? "bg-gray-50" : ""
        }`}
        onClick={toggleExpand}
      >
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">🧾</span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">
                Patient Intake Update
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {loading
                  ? "Loading..."
                  : intakeUpdate
                  ? `Completed ${formatDate(
                      intakeUpdate.createdAt
                    )} • Since last visit`
                  : "No intake update available"}
              </div>
            </div>
          </div>

          {/* Tags/Pills */}
          {!loading && intakeUpdate && (
            <div className="flex gap-2 items-center flex-wrap mt-1.5">
              {intakeUpdate.medRefillsRequested && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold">
                  Med refills requested: {intakeUpdate.medRefillsRequested}
                </span>
              )}
              {intakeUpdate.newAppointments && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                  New appointments: {intakeUpdate.newAppointments}
                </span>
              )}
              {intakeUpdate.adlChanges && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                  ADL change: {intakeUpdate.adlChanges}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="flex-shrink-0">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && !loading && intakeUpdate && (
        <div className="border-t border-gray-200 px-3 py-2.5 bg-gray-50">
          <div className="space-y-2">
            {/* Key Findings - Narrative format from intake data */}
            {intakeUpdate.keyFindings && (
              <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Key Findings
                </div>
                <div className="text-sm text-gray-900 leading-relaxed">
                  {intakeUpdate.keyFindings}
                </div>
              </div>
            )}

            {/* Key Patient-Reported Changes - Narrative format */}
            {intakeUpdate.keyPatientReportedChanges && (
              <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Key Patient-Reported Changes
                </div>
                <div className="text-sm text-gray-900 leading-relaxed">
                  {intakeUpdate.keyPatientReportedChanges}
                </div>
              </div>
            )}

            {/* System Interpretation - 2 clear sentences */}
            {intakeUpdate.systemInterpretation && (
              <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  System Interpretation
                </div>
                <div className="text-sm text-gray-900 leading-relaxed">
                  {intakeUpdate.systemInterpretation
                    .split(".")
                    .filter((s) => s.trim())
                    .map((sentence, idx, arr) => (
                      <div
                        key={idx}
                        className={idx < arr.length - 1 ? "mb-1.5" : ""}
                      >
                        {sentence.trim()}
                        {idx < arr.length - 1 ? "." : ""}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientIntakeUpdate;
