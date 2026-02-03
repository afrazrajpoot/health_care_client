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
  const { paymentError, ignoredFiles, clearPaymentError, uploadError } = useFileUpload("wc");
  const router = useRouter();

  const wasProcessingRef = useRef(false);

  const handleUpgrade = useCallback(() => {
    clearPaymentError();
    router.push("/packages");
  }, [clearPaymentError, router]);

  const handleProgressComplete = useCallback(() => {
    onRefreshData();
    setShowDocumentSuccessPopup(true);
  }, [onRefreshData, setShowDocumentSuccessPopup]);

  // Reliable batch completion detection
  useEffect(() => {
    // If we have errors, don't show success logic/popup
    if (paymentError || uploadError || (ignoredFiles && ignoredFiles.length > 0)) {
      setShowDocumentSuccessPopup(false);
      wasProcessingRef.current = false;
      return;
    }

    if (isProcessing) {
      wasProcessingRef.current = true;
    } else {
      // isProcessing went from true -> false (Trailing Edge)
      if (wasProcessingRef.current) {
        wasProcessingRef.current = false; // Reset

        // This confirms a cycle of processing just finished successfully (no errors)
        handleProgressComplete();
      }
    }
  }, [
    isProcessing,
    paymentError,
    uploadError,
    ignoredFiles,
    handleProgressComplete,
    setShowDocumentSuccessPopup
  ]);

  return null; // This component doesn't render UI, only manages effects
}
