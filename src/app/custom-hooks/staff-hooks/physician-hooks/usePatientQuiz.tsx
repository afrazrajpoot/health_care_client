// hooks/usePatientQuiz.ts
import { useState, useEffect, useRef, useCallback } from "react";

interface Appt {
  date: string;
  type: string;
  other: string;
}

interface PatientQuiz {
  id: string;
  patientName: string;
  dob: string;
  doi: string;
  lang: string;
  newAppt: string;
  appts: Appt[];
  pain: number;
  workDiff: string;
  trend: string;
  workAbility: string;
  barrier: string;
  adl: string[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentData {
  patient_quiz?: PatientQuiz | null;
  // Other properties omitted for brevity
}

export const usePatientQuiz = (documentData: DocumentData | null) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const accordionBodyRef = useRef<HTMLDivElement>(null);

  const quiz = documentData?.patient_quiz;

  useEffect(() => {
    const bodyEl = accordionBodyRef.current;
    if (bodyEl) {
      bodyEl.style.maxHeight = isAccordionOpen
        ? `${bodyEl.scrollHeight}px`
        : "0px";
    }
  }, [isAccordionOpen, quiz]);

  useEffect(() => {
    const handleResize = () => {
      if (isAccordionOpen && accordionBodyRef.current) {
        accordionBodyRef.current.style.maxHeight = `${accordionBodyRef.current.scrollHeight}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAccordionOpen]);

  const toggleAccordion = useCallback(() => {
    setIsAccordionOpen((prev) => !prev);
  }, []);

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch {
      return dateString;
    }
  }, []);

  const sectionId = "section-patient-quiz";

  return {
    isAccordionOpen,
    accordionBodyRef,
    toggleAccordion,
    formatDate,
    quiz,
    sectionId,
  };
};
