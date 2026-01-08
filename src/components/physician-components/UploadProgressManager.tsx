// components/physician-components/UploadProgressManager.tsx
import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";

interface UploadProgressManagerProps {
  selectedPatient: any | null;
  onRefreshData: () => Promise<void>;
  onShowSuccessPopup: () => void;
}

export default function UploadProgressManager({
  selectedPatient,
  onRefreshData,
  onShowSuccessPopup,
}: UploadProgressManagerProps) {
  const { progressData, queueProgressData, isProcessing, currentPhase } =
    useSocket();

  const progressCompleteHandledRef = useRef(false);

  const handleProgressComplete = useCallback(async () => {
    console.log(
      "🔄 Progress complete - refreshing patient data and showing success popup..."
    );

    // Small delay to ensure backend has finished processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Refresh data first
      await onRefreshData();

      console.log("✅ Data refreshed - showing success popup");

      // Show success popup modal
      onShowSuccessPopup();
    } catch (error) {
      console.error("Error refreshing data:", error);
      // Still show popup even if refresh fails
      onShowSuccessPopup();
    }
  }, [onRefreshData, onShowSuccessPopup]);

  // Effect for instant 100% progress detection
  useEffect(() => {
    if (!isProcessing || (!progressData && !queueProgressData)) {
      progressCompleteHandledRef.current = false;
      return;
    }

    // Check task progress completion
    const taskProgressComplete =
      progressData?.progress_percentage === 100 &&
      progressData?.status === "completed";

    // Check queue progress completion
    const queueProgressComplete =
      queueProgressData?.overall_progress === 100 &&
      queueProgressData?.status === "completed";

    const progressComplete = taskProgressComplete || queueProgressComplete;

    if (progressComplete && !progressCompleteHandledRef.current) {
      console.log("🚀 Progress reached 100% - triggering refresh and reload");
      progressCompleteHandledRef.current = true;
      handleProgressComplete();
    }
  }, [
    progressData?.progress_percentage,
    progressData?.status,
    queueProgressData?.overall_progress,
    queueProgressData?.status,
    isProcessing,
    handleProgressComplete,
    progressData,
    queueProgressData,
  ]);

  return null; // This component doesn't render UI, only manages effects
}
