import React from "react";

interface Patient {
  id?: string | number;
  patientName: string;
  name?: string;
  dob: string;
  doi: string;
  claimNumber: string;
}

interface PatientHeaderProps {
  patient: Patient | null;
  visitCount: number;
  formatDate: (dateString: string | undefined) => string;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  visitCount,
  formatDate,
}) => {
  if (!patient) return null;

  return (
    <div className="topbar">
      <div className="patient-header">
        <div className="patient-name">{patient.patientName}</div>
        <div className="tag">DOB: {formatDate(patient.dob)}</div>
        <div className="tag">Claim: {patient.claimNumber}</div>
        <div className="tag">DOI: {formatDate(patient.doi)}</div>
        {visitCount > 0 && (
          <div className="tag good">
            {visitCount} {visitCount === 1 ? "Visit" : "Visits"}
          </div>
        )}
      </div>
    </div>
  );
};

