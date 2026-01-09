"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useDashboard } from "./DashboardProvider";
import ManualTaskModal from "@/components/ManualTaskModal";
import PhysicianOnboardingTour from "@/components/physician-components/PhysicianOnboardingTour";
import { WelcomeModal } from "@/components/physician-components/WelcomeModal";

const DashboardModals: React.FC = () => {
  const { data: session } = useSession();
  const {
    documentData,
    selectedPatient,
    showManualTaskModal,
    setShowManualTaskModal,
    addToast,
  } = useDashboard();

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPositions, setStepPositions] = useState<any[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Onboarding steps configuration
  const onboardingSteps = [
    {
      title: "Staff Dashboard",
      content:
        "Switch to the Staff Dashboard to manage tasks, upload documents, and track workflow.",
      target: null, // This will be handled by the main component
    },
  ];

  const getCurrentPatientInfo = () => {
    if (documentData) {
      return {
        patientName: documentData.patient_name || "Not specified",
        dob: documentData.dob || "",
        doi: documentData.doi || "",
        claimNumber: documentData.claim_number || "Not specified",
      };
    }
    if (selectedPatient) {
      return {
        patientName:
          selectedPatient.patientName ||
          selectedPatient.name ||
          "Not specified",
        dob: selectedPatient.dob || "",
        doi: selectedPatient.doi || "",
        claimNumber: selectedPatient.claimNumber || "Not specified",
      };
    }
    return {
      patientName: "Select a patient",
      dob: "",
      doi: "",
      claimNumber: "Not specified",
    };
  };

  const currentPatient = getCurrentPatientInfo();
  const documentId =
    documentData?.documents?.[0]?.id ||
    documentData?.documents?.[0]?.document_id ||
    "";

  // Initialize onboarding on component mount
  React.useEffect(() => {
    const onboardingCompleted = localStorage.getItem(
      "physicianOnboardingCompleted"
    );
    const welcomeShown = localStorage.getItem("physicianWelcomeShown");

    if (!welcomeShown) {
      setShowWelcomeModal(true);
      localStorage.setItem("physicianWelcomeShown", "true");
    } else if (!onboardingCompleted) {
      setTimeout(() => {
        setShowOnboarding(true);
        setCurrentStep(0);
      }, 1000);
    }

    // Listen for start onboarding event
    const handleStartOnboarding = () => {
      setShowOnboarding(true);
      setCurrentStep(0);
    };
    window.addEventListener("start-onboarding", handleStartOnboarding);

    return () => {
      window.removeEventListener("start-onboarding", handleStartOnboarding);
    };
  }, []);

  return (
    <>
      {/* Onboarding Tour */}
      {/* <PhysicianOnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        currentStep={currentStep}
        onNext={() => {
          if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
          } else {
            setShowOnboarding(false);
            localStorage.setItem("physicianOnboardingCompleted", "true");
          }
        }}
        onPrevious={() => {
          if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
          }
        }}
        steps={onboardingSteps}
        stepPositions={stepPositions}
      /> */}

      {/* Welcome Modal */}
      {/* <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      /> */}

      {/* Manual Task Modal */}
      <ManualTaskModal
        open={showManualTaskModal}
        onOpenChange={setShowManualTaskModal}
        departments={[
          "Medical/Clinical",
          "Scheduling & Coordination",
          "Administrative / Compliance",
          "Authorizations & Denials",
        ]}
        defaultClaim={
          currentPatient.claimNumber !== "Not specified"
            ? currentPatient.claimNumber
            : undefined
        }
        defaultPatient={
          selectedPatient ? currentPatient.patientName : undefined
        }
        defaultDocumentId={documentId || undefined}
        onSubmit={async (data) => {
          try {
            const response = await fetch("/api/add-manual-task", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...data,
                physicianId:
                  session?.user?.role === "Physician"
                    ? (session.user.id as string) || null
                    : session?.user?.physicianId || null,
              }),
            });
            if (!response.ok) {
              throw new Error("Failed to create task");
            }
            addToast("Task created successfully", "success");
          } catch (error) {
            console.error("Error creating task:", error);
            addToast("Failed to create task", "error");
            throw error;
          }
        }}
      />
    </>
  );
};

export default DashboardModals;
