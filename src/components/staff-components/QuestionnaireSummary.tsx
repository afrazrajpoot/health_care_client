"use client";

import styles from "./QuestionnaireSummary.module.css";
import sharedStyles from "./shared.module.css";

interface Chip {
  text: string;
  type: "blue" | "amber" | "red" | "green";
}

interface QuestionnaireSummaryProps {
  chips: Chip[];
}

export default function QuestionnaireSummary({
  chips,
}: QuestionnaireSummaryProps) {
  if (chips.length === 0) return null;

  return (
    <section
      className={`${sharedStyles.card} ${styles.questionnaire}`}
      style={{ borderLeft: "4px solid #2563eb" }}
    >
      <h3>Pre‑Visit Questionnaire Summary</h3>
      <div className={sharedStyles.chips}>
        {chips.map((chip, idx) => {
          const chipTypeClass = 
            chip.type === "blue" ? sharedStyles.chipBlue :
            chip.type === "amber" ? sharedStyles.chipAmber :
            chip.type === "red" ? sharedStyles.chipRed :
            sharedStyles.chipGreen;
          return (
            <span key={idx} className={`${sharedStyles.chip} ${chipTypeClass}`}>
              {chip.text}
            </span>
          );
        })}
      </div>
    </section>
  );
}

