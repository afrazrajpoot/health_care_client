"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Base props shared by all onboarding modals */
interface BaseOnboardingModalProps {
  isOpen: boolean;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  buttonText: string;
  onNext: () => void;
}

/* ---------------------- Generic Reusable Modal ---------------------- */
function OnboardingModal({
  isOpen,
  step,
  totalSteps,
  title,
  description,
  buttonText,
  onNext,
}: BaseOnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-sm p-6 shadow-xl border rounded-2xl bg-white">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <p className="text-xs text-gray-500">{`Step ${step} of ${totalSteps}`}</p>
          <DialogDescription className="text-gray-700 text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mt-6">
          <Button
            onClick={onNext}
            className="bg-black text-white hover:bg-gray-800"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- Step 1: Welcome Modal ---------------------- */
interface WelcomeModalProps {
  isOpen: boolean;
  onNext: () => void;
}

export function WelcomeModal({ isOpen, onNext }: WelcomeModalProps) {
  return (
    <OnboardingModal
      isOpen={isOpen}
      step={1}
      totalSteps={3}
      title="Welcome to Physician Dashboard!"
      description="This is the Physician Dashboard where you can review patient documents, summaries, quizzes, and verify medical records efficiently."
      buttonText="Next: Learn about Search Bar"
      onNext={onNext}
    />
  );
}

/* ---------------------- Step 2: Search Bar Modal ---------------------- */
interface SearchBarModalProps {
  isOpen: boolean;
  onNext: () => void;
}

export function SearchBarModal({ isOpen, onNext }: SearchBarModalProps) {
  return (
    <OnboardingModal
      isOpen={isOpen}
      step={2}
      totalSteps={3}
      title="Search Bar"
      description="Use the search bar to find patients by name, DOB, DOI, or claim number. Matching patients will appear as quick suggestions."
      buttonText="Next: Staff Dashboard"
      onNext={onNext}
    />
  );
}

/* ---------------------- Step 3: Staff Dashboard Modal ---------------------- */
interface StaffDashboardModalProps {
  isOpen: boolean;
  onDone: () => void;
}

export function StaffDashboardModal({
  isOpen,
  onDone,
}: StaffDashboardModalProps) {
  return (
    <OnboardingModal
      isOpen={isOpen}
      step={3}
      totalSteps={3}
      title="Staff Dashboard"
      description='Click the "Staff Dashboard" button in the header to access administrative tools for managing users, uploads, and team hierarchy.'
      buttonText="Finish"
      onNext={onDone}
    />
  );
}
