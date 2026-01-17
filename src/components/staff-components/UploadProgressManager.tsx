// components/staff-components/UploadProgressManager.tsx
import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { useFileUpload } from "../../app/custom-hooks/staff-hooks/useFileUpload";
import { useRouter } from "next/navigation";


interface UploadProgressManagerProps {
  selectedPatient: any | null;
  patientSearchQuery: string;
  taskPage: number;
  taskPageSize: number;
  showDocumentSuccessPopup: boolean;
  setShowDocumentSuccessPopup: (open: boolean) => void;
  onRefreshData: () => void;
}

export default function UploadProgressManager({
  selectedPatient,
  patientSearchQuery,
  taskPage,
  taskPageSize,
  showDocumentSuccessPopup,
  setShowDocumentSuccessPopup,
  onRefreshData,
}: UploadProgressManagerProps) {
  const { progressData, queueProgressData, isProcessing, currentPhase } =
    useSocket();
  const { paymentError, ignoredFiles, clearPaymentError } = useFileUpload("wc");
  const router = useRouter();


  const progressPopupShownRef = useRef(false);
  const progressCompleteHandledRef = useRef(false);

  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);

  const handleProgressComplete = useCallback(() => {
    onRefreshData();
    setShowDocumentSuccessPopup(true);
  }, [onRefreshData, setShowDocumentSuccessPopup]);

  // Effect for showing progress popup when extract API succeeds
  useEffect(() => {
    if (!selectedPatient) return;

    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      return;
    }

    if (currentPhase === "processing" && !progressPopupShownRef.current) {
      progressPopupShownRef.current = true;
    }

    if (!isProcessing) {
      progressPopupShownRef.current = false;
    }
  }, [currentPhase, isProcessing, selectedPatient, paymentError, ignoredFiles]);

  // Effect for instant 100% progress detection
  useEffect(() => {
    if (!selectedPatient) return;

    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      return;
    }

    if (!isProcessing || (!progressData && !queueProgressData)) {
      progressCompleteHandledRef.current = false;
      return;
    }

    const progressComplete =
      (progressData?.progress === 100 &&
        progressData?.status === "completed") ||
      queueProgressData?.status === "completed";

    const allFilesProcessed = progressData
      ? progressData.processed_count >= progressData.total_files
      : true;

    if (
      progressComplete &&
      allFilesProcessed &&
      !progressCompleteHandledRef.current
    ) {

      progressCompleteHandledRef.current = true;
      handleProgressComplete();
    }
  }, [
    progressData?.progress,
    progressData?.status,
    progressData?.processed_count,
    progressData?.total_files,
    queueProgressData?.status,
    isProcessing,
    selectedPatient,
    handleProgressComplete,
    progressData,
    queueProgressData,
    paymentError,
    ignoredFiles,
  ]);

  // Effect to clear success popup on payment error
  useEffect(() => {
    if (paymentError || (ignoredFiles && ignoredFiles.length > 0)) {
      setShowDocumentSuccessPopup(false);
      progressCompleteHandledRef.current = false;
    }
  }, [paymentError, ignoredFiles, setShowDocumentSuccessPopup]);

  return null; // This component doesn't render UI, only manages effects
}
