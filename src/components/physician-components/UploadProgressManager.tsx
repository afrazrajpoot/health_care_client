// components/physician-components/UploadProgressManager.tsx
import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { useRouter } from "next/navigation";

interface UploadProgressManagerProps {
  selectedPatient: any | null;
  showDocumentSuccessPopup: boolean;
  setShowDocumentSuccessPopup: (open: boolean) => void;
  onRefreshData: () => Promise<void>;
}

export default function UploadProgressManager({
  selectedPatient,
  showDocumentSuccessPopup,
  setShowDocumentSuccessPopup,
  onRefreshData,
}: UploadProgressManagerProps) {
  const { progressData, queueProgressData, isProcessing, currentPhase } = useSocket();
  const router = useRouter();

  const progressPopupShownRef = useRef(false);
  const progressCompleteHandledRef = useRef(false);

  const handleProgressComplete = useCallback(async () => {
    console.log("🔄 Progress complete - fetching updated data...");
    await onRefreshData();
    setShowDocumentSuccessPopup(true);
  }, [onRefreshData, setShowDocumentSuccessPopup]);

  // Handle progress completion
  useEffect(() => {
    if (
      progressData &&
      progressData.progress >= 100 &&
      !progressCompleteHandledRef.current
    ) {
      progressCompleteHandledRef.current = true;
      console.log("✅ Upload progress complete!");
      handleProgressComplete();
    }
  }, [progressData, handleProgressComplete]);

  // Reset refs when starting new upload
  useEffect(() => {
    if (isProcessing && !progressPopupShownRef.current) {
      progressPopupShownRef.current = true;
      progressCompleteHandledRef.current = false;
    }
  }, [isProcessing]);

  // Reset when processing stops
  useEffect(() => {
    if (!isProcessing) {
      progressPopupShownRef.current = false;
    }
  }, [isProcessing]);

  return null; // This component manages state but doesn't render UI
}
