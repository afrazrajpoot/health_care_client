"use client";

import styles from "./PatientDrawer.module.css";
import sharedStyles from "./shared.module.css";

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
}: PatientDrawerProps) {
  return (
    <aside
      className={`${sharedStyles.card} ${styles.drawer}`}
      style={{
        width: collapsed ? "48px" : "280px",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}
    >
      <h3 className={styles.drawerToggle} onClick={onToggle}>
        {!collapsed && <span>Recent Patients</span>}
        <span>{collapsed ? "▸" : "◂"}</span>
      </h3>
      {!collapsed && (
        <div className={styles.patientList}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : patients.length === 0 ? (
            <div className={styles.empty}>No patients found</div>
          ) : (
            patients.map((patient, idx) => (
              <div
                key={idx}
                className={`${styles.patient} ${
                  selectedPatient?.patientName === patient.patientName &&
                  selectedPatient?.dob === patient.dob
                    ? styles.active
                    : ""
                }`}
                onClick={() => onSelectPatient(patient)}
              >
                <div className={styles.patientName}>{patient.patientName}</div>
                <div className={sharedStyles.meta}>
                  DOB: {formatDOB(patient.dob)} ·{" "}
                  {patient.claimNumber !== "Not specified"
                    ? formatClaimNumber(patient.claimNumber)
                    : "No Claim"}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}

