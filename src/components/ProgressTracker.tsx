// components/ProgressTracker.tsx
import { useSocket } from "@/providers/SocketProvider";
import React, { useEffect, useState } from "react";
import { Check, X, Minimize2, Maximize2 } from "lucide-react";
import DocLatchAnimation from "./DocLatchAnimation";
import { toast } from "sonner";

interface ProgressTrackerProps {
  onComplete?: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  onComplete,
}) => {
  const {
    progressData,
    queueProgressData,
    isProcessing,
    clearProgress,
    activeTaskId,
    activeQueueId,
    checkProgress,
    checkQueueProgress,
    currentPhase,
    combinedProgress,
  } = useSocket();

  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayQueueProgress, setDisplayQueueProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState(Date.now());
  const [viewMode, setViewMode] = useState<"task" | "queue">("task");
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Check localStorage on mount for persisted visibility and minimized state
  useEffect(() => {
    // Only show if there's actual active processing, not just because localStorage says so
    const hasActiveProgress =
      isProcessing && (progressData || queueProgressData);

    // Check if it was minimized before
    const wasMinimized =
      localStorage.getItem("progressTrackerMinimized") === "true";

    console.log("🔍 Mount check:", {
      hasActiveProgress,
      isProcessing,
      progressData,
      queueProgressData,
      wasMinimized,
    });

    // ONLY show if there's ACTIVE processing with data
    if (hasActiveProgress) {
      console.log("👁️ Setting visible on mount - active processing detected");
      setIsVisible(true);
      setIsMinimized(wasMinimized);
      localStorage.setItem("progressTrackerOpen", "true");
    } else {
      // Clear stale localStorage on mount if no active processing
      console.log("🧹 Clearing stale localStorage - no active processing");
      localStorage.removeItem("progressTrackerOpen");
      localStorage.removeItem("progressTrackerMinimized");
      setIsVisible(false);
      setIsMinimized(false);
    }

    // Auto-detect view mode: prefer queue if available
    if (queueProgressData) {
      setViewMode("queue");
    }
  }, []); // Run only once on mount

  // Show modal only when processing starts (not on every state change)
  useEffect(() => {
    // Only show if isProcessing becomes true AND we have data
    if (isProcessing && (progressData || queueProgressData)) {
      console.log("👁️ Showing modal - processing started with data");
      setIsVisible(true);
      localStorage.setItem("progressTrackerOpen", "true");

      // Dismiss any existing toast notifications when progress modal opens
      toast.dismiss();
    }
    // Don't hide automatically - let completion logic or manual close handle that
  }, [isProcessing, progressData, queueProgressData]);

  // Auto-switch to queue view when queue data is available
  useEffect(() => {
    if (queueProgressData && viewMode === "task") {
      setViewMode("queue");
    }
  }, [queueProgressData, viewMode]);

  // Robust manual polling
  useEffect(() => {
    if ((activeTaskId || activeQueueId) && isProcessing) {
      console.log("⏰ Starting tracker polling for:", {
        activeTaskId,
        activeQueueId,
      });
      const interval = setInterval(async () => {
        setPollCount((prev) => {
          const newCount = prev + 1;
          console.log(
            `⏱️ Tracker poll #${newCount} at ${new Date().toLocaleTimeString()}`
          );
          return newCount;
        });

        try {
          if (activeTaskId && checkProgress) {
            const result = await checkProgress(activeTaskId);
            console.log(
              "✅ Task poll success:",
              result ? "data received" : "null"
            );
          }

          if (activeQueueId && checkQueueProgress) {
            const result = await checkQueueProgress(activeQueueId);
            console.log(
              "✅ Queue poll success:",
              result ? "data received" : "null"
            );
          }

          setLastPollTime(Date.now());
        } catch (error) {
          console.error("❌ Tracker poll error:", error);
        }
      }, 1000);

      return () => {
        console.log("🛑 Clearing tracker interval");
        clearInterval(interval);
      };
    }
  }, [
    activeTaskId,
    activeQueueId,
    isProcessing,
    checkProgress,
    checkQueueProgress,
  ]);

  // Handle completion and auto-close
  useEffect(() => {
    // CRITICAL: Don't auto-close if we're still in a phase (upload or processing)
    const inTwoPhaseMode = currentPhase !== null;

    // Backend now guarantees: status='completed' AND progress=100 when done
    const progressComplete = progressData?.progress === 100;
    const statusCompleted = progressData?.status === "completed";
    const allFilesProcessed = progressData
      ? progressData.processed_count >= progressData.total_files
      : false;

    const isCompleted =
      (!inTwoPhaseMode &&
        statusCompleted &&
        progressComplete &&
        allFilesProcessed) ||
      queueProgressData?.status === "completed";

    console.log("🔍 Auto-close check:", {
      inTwoPhaseMode,
      currentPhase,
      statusCompleted,
      progressComplete,
      allFilesProcessed,
      progressStatus: progressData?.status,
      progressValue: progressData?.progress,
      processed: progressData?.processed_count,
      total: progressData?.total_files,
      isCompleted,
    });

    if (isCompleted) {
      console.log(
        "✅ All completion conditions met - status=completed, progress=100%, all files done"
      );

      // Call the onComplete callback first
      if (onComplete) {
        onComplete();
      }

      // Set progress to 100%
      setDisplayProgress(100);
      setDisplayQueueProgress(100);

      // Auto-close after brief delay (SocketProvider already showed success for 3s)
      console.log("⏰ Setting auto-close timer (500ms)");
      const timer = setTimeout(() => {
        console.log("🕒 Auto-closing progress tracker");
        handleClose();
      }, 500); // Short delay since success was already shown

      setAutoCloseTimer(timer);
    }

    // Cleanup timer on unmount or when completion status changes
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [
    progressData?.status,
    progressData?.progress,
    currentPhase,
    queueProgressData?.status,
    onComplete,
  ]);

  // Smooth progress animation for task
  useEffect(() => {
    if (progressData && isProcessing && viewMode === "task") {
      console.log(
        "🎬 Starting task animation for progress:",
        progressData.progress
      );
      const targetProgress = progressData.progress || 0;
      animateProgress(targetProgress, setDisplayProgress);
    }
  }, [progressData?.progress, isProcessing, viewMode]);

  // Smooth progress animation for queue
  useEffect(() => {
    if (queueProgressData && isProcessing && viewMode === "queue") {
      console.log(
        "🎬 Starting queue animation for progress:",
        queueProgressData.overall_progress
      );
      const targetProgress = queueProgressData.overall_progress || 0;
      animateProgress(targetProgress, setDisplayQueueProgress);
    }
  }, [queueProgressData?.overall_progress, isProcessing, viewMode]);

  // Helper function for smooth progress animation
  const animateProgress = (
    targetProgress: number,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const duration = 500;
    const steps = 20;
    const stepTime = duration / steps;
    const currentProgress =
      setter === setDisplayProgress ? displayProgress : displayQueueProgress;
    const increment = (targetProgress - currentProgress) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setter((prev: number) => {
        const newProgress = prev + increment;
        if (currentStep >= steps) {
          clearInterval(timer);
          return targetProgress;
        }
        return newProgress;
      });
    }, stepTime);

    return () => clearInterval(timer);
  };

  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh for:", { activeTaskId, activeQueueId });
    if (activeTaskId && checkProgress) {
      checkProgress(activeTaskId);
    }
    if (activeQueueId && checkQueueProgress) {
      checkQueueProgress(activeQueueId);
    }
  };

  const handleClose = () => {
    console.log("✕ Closing progress tracker");
    setIsVisible(false);
    setIsMinimized(false);
    localStorage.removeItem("progressTrackerOpen");
    localStorage.removeItem("progressTrackerMinimized");

    // Clear any pending auto-close timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }

    // Clear progress data immediately to prevent re-showing
    clearProgress();
  };

  const handleMinimize = () => {
    console.log("➖ Minimizing progress tracker");
    setIsMinimized(true);
    localStorage.setItem("progressTrackerMinimized", "true");
  };

  const handleMaximize = () => {
    console.log("➕ Maximizing progress tracker");
    setIsMinimized(false);
    localStorage.removeItem("progressTrackerMinimized");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "task" ? "queue" : "task");
  };

  // Don't render if not visible OR if there's no active processing
  if (!isVisible || (!isProcessing && !progressData && !queueProgressData)) {
    return null;
  }

  // Get current progress for animation
  const currentProgress = currentPhase
    ? combinedProgress // Use combined progress when two-phase tracking is active
    : viewMode === "queue"
    ? displayQueueProgress
    : displayProgress;

  // Get progress counts for display
  const processedCount =
    viewMode === "queue"
      ? queueProgressData?.completed_tasks || 0
      : progressData?.processed_count || 0;
  const totalCount =
    viewMode === "queue"
      ? queueProgressData?.total_tasks || 0
      : progressData?.total_files || 0;

  // Minimized floating view - shows in top-right corner
  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 duration-300">
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[220px] cursor-pointer hover:shadow-xl transition-shadow"
          onClick={handleMaximize}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 flex-1">
              {/* Animated spinner/progress circle */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${currentProgress * 0.975} 100`}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient
                      id="progressGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {Math.round(currentProgress)}%
                </span>
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {isProcessing ? "Processing..." : "Complete"}
                </div>
                <div className="text-[10px] text-gray-500">
                  {processedCount}/{totalCount} files
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMaximize();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title="Expand"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Pulsing indicator when processing */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div
                className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading state if processing but no progress data yet
  if (!progressData && !queueProgressData && isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Background Gradient Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-teal-500/20 rounded-full blur-3xl -z-0" />

          {/* Minimize Button */}
          <button
            onClick={handleMinimize}
            className="absolute top-4 right-4 z-20 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="relative z-10 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {currentPhase === "upload"
                ? "Uploading Documents"
                : currentPhase === "processing"
                ? "Processing Documents"
                : "Uploading Documents"}
            </h3>
            <p className="text-sm text-gray-500">
              {currentPhase === "upload"
                ? "Validating and saving files..."
                : currentPhase === "processing"
                ? "Extracting data with AI..."
                : "DocLatch processing your documents..."}
            </p>
          </div>

          {/* DocLatch Animation */}
          <div className="flex items-center justify-center">
            <DocLatchAnimation
              text={
                currentPhase === "upload"
                  ? "Validating & Uploading Files..."
                  : currentPhase === "processing"
                  ? "Extracting Data → Updating Dashboard…"
                  : "Processing Documents…"
              }
              width={170}
              height={150}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render animated modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
      {/* Popup Container */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Background Gradient Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-teal-500/20 rounded-full blur-3xl -z-0" />

        {/* Action Buttons - Minimize & Close */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {viewMode === "queue" ? "Processing Queue" : "Uploading Documents"}
          </h3>
          <p className="text-sm text-gray-500">
            {isProcessing
              ? "DocLatch is processing your documents..."
              : "Processing completed!"}
          </p>
        </div>

        {/* Animation Area */}
        <div className="relative mb-6">
          <DocLatchAnimation
            text={
              isProcessing
                ? currentPhase === "upload"
                  ? "Validating & Uploading Files..."
                  : currentPhase === "processing"
                  ? "Extracting Data → Updating Dashboard…"
                  : "Processing Documents…"
                : "Processing Complete ✓"
            }
            width={200}
            height={180}
          />
        </div>

        {/* Progress Info */}
        <div className="relative z-10 space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {isProcessing
                ? "Extracting documents..."
                : "Extraction completed!"}
            </span>
            {isProcessing && (
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all duration-1000"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Progress Details */}
          <div className="text-xs text-gray-600 text-center">
            {viewMode === "queue" ? (
              <>
                {queueProgressData?.completed_tasks || 0} of{" "}
                {queueProgressData?.total_tasks || 0} tasks completed
                {queueProgressData?.failed_tasks
                  ? ` (${queueProgressData.failed_tasks} failed)`
                  : ""}
              </>
            ) : (
              <>
                {progressData?.processed_count || 0} of{" "}
                {progressData?.total_files || 0} files processed
                {progressData?.failed_files?.length
                  ? ` (${progressData.failed_files.length} failed)`
                  : ""}
              </>
            )}
          </div>

          {/* Phase Indicator - Show only when two-phase tracking is active */}
          {currentPhase && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentPhase === "upload"
                    ? "bg-cyan-500 animate-pulse"
                    : "bg-green-500"
                }`}
              />
              <span className="text-xs text-gray-500">Upload</span>

              <div className="w-8 h-px bg-gray-300" />

              <div
                className={`w-2 h-2 rounded-full ${
                  currentPhase === "processing"
                    ? "bg-cyan-500 animate-pulse"
                    : currentPhase === "upload"
                    ? "bg-gray-300"
                    : "bg-green-500"
                }`}
              />
              <span className="text-xs text-gray-500">Processing</span>
            </div>
          )}
        </div>

        {/* Processed Items */}
        <div className="relative z-10 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold text-gray-700">
              Processed Data
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {["Lab Results", "Vitals", "Diagnoses", "Medications"].map(
              (item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs text-gray-600 opacity-0"
                  style={{
                    animation: `fadeInSlide 0.5s ease-out ${
                      0.5 + index * 0.15
                    }s forwards`,
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="relative z-10 mt-6 flex justify-between items-center">
          {/* View Toggle */}
          {progressData && queueProgressData && (
            <button
              onClick={toggleViewMode}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              {viewMode === "queue"
                ? "View Task Details"
                : "View Queue Progress"}
            </button>
          )}

          {/* Manual Refresh */}
          {isProcessing && (
            <button
              onClick={handleManualRefresh}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
