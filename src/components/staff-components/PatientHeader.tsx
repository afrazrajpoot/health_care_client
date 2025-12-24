"use client";

import styles from "./PatientHeader.module.css";
import sharedStyles from "./shared.module.css";

interface RecentPatient {
  patientName: string;
  dob: string;
  claimNumber: string;
}

interface PatientHeaderProps {
  patient: RecentPatient;
  formatDOB: (dob: string) => string;
  formatClaimNumber: (claim: string) => string;
  completedTasks?: number;
}

export default function PatientHeader({
  patient,
  formatDOB,
  formatClaimNumber,
  completedTasks = 0,
}: PatientHeaderProps) {
  return (
    <section className={`${sharedStyles.card} ${styles.patientHeader}`}>
      <div>
        <h2>{patient.patientName}</h2>
        <div className={sharedStyles.meta}>
          DOB: {formatDOB(patient.dob)} · {formatClaimNumber(patient.claimNumber)} · Visit Today
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {completedTasks > 0 && (
          <span
            className={sharedStyles.chip}
            style={{
              background: "#f0fdf4",
              borderColor: "#bbf7d0",
              color: "#166534",
              fontSize: "11px",
              padding: "4px 8px",
            }}
          >
            ✓ {completedTasks} Completed
          </span>
        )}
        <span className={sharedStyles.meta}>EMR‑managed chart</span>
      </div>
    </section>
  );
}

