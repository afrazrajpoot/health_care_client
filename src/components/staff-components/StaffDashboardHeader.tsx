"use client";

import styles from "./StaffDashboardHeader.module.css";

interface StaffDashboardHeaderProps {
  onCreateIntakeLink: () => void;
  onAddTask: () => void;
}

export default function StaffDashboardHeader({
  onCreateIntakeLink,
  onAddTask,
}: StaffDashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span>DL</span> DocLatch — Staff Dashboard
      </div>
      <div className={styles.headerActions}>
        <button className={styles.primary} onClick={onCreateIntakeLink}>
          Create Intake Link
        </button>
        <button onClick={onAddTask}>Add Task</button>
      </div>
    </header>
  );
}

