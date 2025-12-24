"use client";

import styles from "./TaskSummary.module.css";
import sharedStyles from "./shared.module.css";

interface TaskSummaryProps {
  open: number;
  urgent: number;
  dueToday: number;
  completed: number;
}

export default function TaskSummary({
  open,
  urgent,
  dueToday,
  completed,
}: TaskSummaryProps) {
  return (
    <section className={sharedStyles.card}>
      <h3>Task Summary</h3>
      <div className={sharedStyles.chips}>
        <span className={`${sharedStyles.chip} ${sharedStyles.chipBlue}`}>
          Open: {open}
        </span>
        <span className={`${sharedStyles.chip} ${sharedStyles.chipRed}`}>
          Urgent: {urgent}
        </span>
        <span className={`${sharedStyles.chip} ${sharedStyles.chipAmber}`}>
          Due Today: {dueToday}
        </span>
        <span className={`${sharedStyles.chip} ${sharedStyles.chipGreen}`}>
          Completed: {completed}
        </span>
      </div>
    </section>
  );
}

