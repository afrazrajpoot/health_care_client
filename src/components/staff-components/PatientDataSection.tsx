import React from "react";
import PatientHeader from "@/components/staff-components/PatientHeader";
import TaskSummary from "@/components/staff-components/TaskSummary";
import QuestionnaireSummary from "@/components/staff-components/QuestionnaireSummary";
import {
  RecentPatient,
  PatientQuiz,
  TaskStats,
} from "@/components/staff-components/types";

interface PatientDataSectionProps {
  selectedPatient: RecentPatient;
  loadingPatientData: boolean;
  taskStats: TaskStats;
  patientQuiz: PatientQuiz | null;
  patientIntakeUpdate: any;
}

const PatientDataSection: React.FC<PatientDataSectionProps> = ({
  selectedPatient,
  loadingPatientData,
  taskStats,
  patientQuiz,
  patientIntakeUpdate,
}) => {
  const formatDOB = (dob: string) => {
    if (!dob) return "";
    try {
      const date = new Date(dob);
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const year = date.getUTCFullYear();
      return `${month}-${day}-${year}`;
    } catch {
      return dob;
    }
  };

  const formatClaimNumber = (claim: string) => {
    if (!claim || claim === "Not specified") return "";
    return `Claim #${claim}`;
  };

  const getQuestionnaireChips = () => {
    const chips: Array<{
      text: string;
      type: "blue" | "amber" | "red" | "green";
    }> = [];

    // Use AI-generated points from PatientIntakeUpdate if available
    if (patientIntakeUpdate) {
      // Add ADL effect points
      if (
        patientIntakeUpdate.adlEffectPoints &&
        Array.isArray(patientIntakeUpdate.adlEffectPoints)
      ) {
        patientIntakeUpdate.adlEffectPoints.forEach((point: string) => {
          if (point && point.trim()) {
            const lowerPoint = point.toLowerCase();
            let type: "blue" | "amber" | "red" | "green" = "blue";
            if (
              lowerPoint.includes("worse") ||
              lowerPoint.includes("decreased") ||
              lowerPoint.includes("limited") ||
              lowerPoint.includes("difficulty")
            ) {
              type = "red";
            } else if (
              lowerPoint.includes("improved") ||
              lowerPoint.includes("better") ||
              lowerPoint.includes("increased")
            ) {
              type = "green";
            } else if (
              lowerPoint.includes("unchanged") ||
              lowerPoint.includes("same")
            ) {
              type = "green";
            } else {
              type = "amber";
            }
            chips.push({ text: point.trim(), type });
          }
        });
      }

      // Add intake patient points
      if (
        patientIntakeUpdate.intakePatientPoints &&
        Array.isArray(patientIntakeUpdate.intakePatientPoints)
      ) {
        patientIntakeUpdate.intakePatientPoints.forEach((point: string) => {
          if (point && point.trim()) {
            const lowerPoint = point.toLowerCase();
            let type: "blue" | "amber" | "red" | "green" = "blue";
            if (
              lowerPoint.includes("refill") ||
              lowerPoint.includes("medication")
            ) {
              type = "blue";
            } else if (
              lowerPoint.includes("appointment") ||
              lowerPoint.includes("consult")
            ) {
              type = "blue";
            } else if (
              lowerPoint.includes("improved") ||
              lowerPoint.includes("better")
            ) {
              type = "green";
            } else if (
              lowerPoint.includes("worse") ||
              lowerPoint.includes("pain")
            ) {
              type = "red";
            } else {
              type = "amber";
            }
            chips.push({ text: point.trim(), type });
          }
        });
      }
    }

    // Fallback to patient quiz parsing if no AI-generated points available
    if (chips.length === 0 && patientQuiz) {
      try {
        if (patientQuiz.refill) {
          const refill =
            typeof patientQuiz.refill === "string"
              ? JSON.parse(patientQuiz.refill)
              : patientQuiz.refill;
          if (
            refill &&
            (refill.requested ||
              refill.needed ||
              Object.keys(refill).length > 0)
          ) {
            chips.push({ text: "Medication refill requested", type: "blue" });
          }
        }

        if (patientQuiz.therapies) {
          const therapies =
            typeof patientQuiz.therapies === "string"
              ? JSON.parse(patientQuiz.therapies)
              : patientQuiz.therapies;
          const therapyArray = Array.isArray(therapies)
            ? therapies
            : typeof therapies === "object"
              ? Object.values(therapies)
              : [];
          if (
            therapyArray.some(
              (t: any) =>
                t?.missed ||
                t?.status === "missed" ||
                (typeof t === "string" && t.toLowerCase().includes("missed")),
            )
          ) {
            chips.push({ text: "Missed PT session", type: "amber" });
          }
        }

        if (patientQuiz.newAppointments) {
          const newApps =
            typeof patientQuiz.newAppointments === "string"
              ? JSON.parse(patientQuiz.newAppointments)
              : patientQuiz.newAppointments;
          const appsArray = Array.isArray(newApps)
            ? newApps
            : typeof newApps === "object"
              ? Object.values(newApps)
              : [];
          if (appsArray.length > 0) {
            chips.push({ text: "New appointment scheduled", type: "blue" });
          }
        }

        if (patientQuiz.adl) {
          const adls = Array.isArray(patientQuiz.adl)
            ? patientQuiz.adl
            : typeof patientQuiz.adl === "string"
              ? JSON.parse(patientQuiz.adl)
              : typeof patientQuiz.adl === "object"
                ? Object.values(patientQuiz.adl)
                : [];

          if (
            adls.length === 0 ||
            (Array.isArray(adls) &&
              adls.every(
                (a: any) =>
                  !a ||
                  a === "unchanged" ||
                  (typeof a === "string" &&
                    a.toLowerCase().includes("unchanged")),
              ))
          ) {
            chips.push({ text: "ADLs unchanged", type: "green" });
          } else {
            chips.push({ text: "ADLs changed", type: "amber" });
          }
        } else {
          chips.push({ text: "ADLs unchanged", type: "green" });
        }

        chips.push({ text: "No ER visits", type: "green" });
      } catch (error) {
        console.error("Error parsing patient quiz data:", error);
        chips.push({ text: "ADLs unchanged", type: "green" });
        chips.push({ text: "No ER visits", type: "green" });
      }
    }

    return chips;
  };

  if (loadingPatientData) {
    return (
      <section className="bg-white border border-gray-200 rounded-[14px] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-5 text-center">
        <p className="text-sm text-gray-500 m-0">Loading patient data...</p>
      </section>
    );
  }

  const questionnaireChips = getQuestionnaireChips();

  return (
    <>
      <PatientHeader
        patient={selectedPatient}
        formatDOB={formatDOB}
        formatClaimNumber={formatClaimNumber}
        completedTasks={taskStats.completed}
      />

      {/* <TaskSummary
        open={taskStats.open}
        urgent={taskStats.urgent}
        dueToday={taskStats.dueToday}
        completed={taskStats.completed}
      /> */}

      <QuestionnaireSummary chips={questionnaireChips} />
    </>
  );
};

export default PatientDataSection;
