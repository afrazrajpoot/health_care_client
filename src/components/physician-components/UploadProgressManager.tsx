// components/physician-components/UploadProgressManager.tsx
import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/SocketProvider";

interface UploadProgressManagerProps {
  onRefreshData: any;
  onShowSuccessPopup: any;
}

export default function UploadProgressManager({
  onRefreshData,
  onShowSuccessPopup,
}: UploadProgressManagerProps) {
  const { progressData, queueProgressData, clearProgress } = useSocket();

  const progressCompleteHandledRef = useRef(false);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Return early if not on physician dashboard
  if (pathname.includes('/staff-dashboard')) {
    return null;
  }

  const handleProgressComplete = useCallback(async () => {
    // Small delay to ensure backend has finished processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Refresh data first
      await onRefreshData();

      // Show success popup modal
      onShowSuccessPopup();
    } catch (error) {
      console.error("Error refreshing data:", error);
      // Still show popup even if refresh fails
      onShowSuccessPopup();
    } finally {
      // Clear progress to close the modal
      console.log("🧹 Clearing progress after completion");
      clearProgress();
    }
  }, [onRefreshData, onShowSuccessPopup, clearProgress]);

  // Effect for instant 100% progress detection
  useEffect(() => {
    // Log current state for debugging
    console.log("📊 UploadProgressManager effect triggered:", {
      hasProgressData: !!progressData,
      hasQueueProgressData: !!queueProgressData,
      progressDataProgress: progressData?.progress,
      progressDataStatus: progressData?.status,
      queueOverallProgress: queueProgressData?.overall_progress,
      queueStatus: queueProgressData?.status,
      alreadyHandled: progressCompleteHandledRef.current,
    });

    // Only reset the ref when there's truly no data at all
    if (!progressData && !queueProgressData) {
      progressCompleteHandledRef.current = false;
      return;
    }

    // Check task progress completion - use 'progress' field (not progress_percentage)
    // because mapToProgressData maps progress_percentage to 'progress'
    const taskProgressComplete =
      progressData?.progress === 100 && progressData?.status === "completed";

    // Check queue progress completion
    const queueProgressComplete =
      queueProgressData?.overall_progress === 100 &&
      queueProgressData?.status === "completed";

    const progressComplete = taskProgressComplete || queueProgressComplete;

    console.log("📊 Progress completion check:", {
      taskProgressComplete,
      queueProgressComplete,
      progressComplete,
      alreadyHandled: progressCompleteHandledRef.current,
    });

    if (progressComplete && !progressCompleteHandledRef.current) {
      console.log("🚀 Progress reached 100% - triggering refresh and reload");
      console.log("📊 Full progress data:", {
        progressData,
        queueProgressData,
      });
      progressCompleteHandledRef.current = true;
      handleProgressComplete();
    }
  }, [progressData, queueProgressData, handleProgressComplete]);

  return null; // This component doesn't render UI, only manages effects
}
